import invokeLambda, { resetSharedLambdaClientForTests } from './invokeLambda';
import { Lambda } from '@aws-sdk/client-lambda';

// Mock the Lambda client
jest.mock('@aws-sdk/client-lambda', () => ({
  Lambda: jest.fn().mockImplementation(() => ({
    invoke: jest.fn(),
    destroy: jest.fn(),
  })),
}));

describe('invokeLambda', () => {
  const mockLambdaConstructor = Lambda as unknown as jest.Mock;
  let mockInvoke: jest.Mock;
  let mockDestroy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    resetSharedLambdaClientForTests();
    process.env.cfstack = 'test-stack';
    process.env.stage = 'test';
    mockInvoke = jest.fn();
    mockDestroy = jest.fn();
    mockLambdaConstructor.mockImplementation(() => ({
      invoke: mockInvoke,
      destroy: mockDestroy,
    }));
  });

  describe('successful invocations', () => {
    it('should return parsed body on successful response', async () => {
      const responseBody = { data: 'test', id: 123 };
      mockInvoke.mockResolvedValue({
        Payload: Buffer.from(
          JSON.stringify({
            statusCode: 200,
            body: JSON.stringify(responseBody),
          }),
        ),
      });

      const result = await invokeLambda('assets', 'testFunction', {
        pathParameters: { accountId: '123' },
      });

      expect(result).toEqual(responseBody);
    });

    it('should return body on 202 status code', async () => {
      const responseBody = { message: 'accepted' };
      mockInvoke.mockResolvedValue({
        Payload: Buffer.from(
          JSON.stringify({
            statusCode: 202,
            body: JSON.stringify(responseBody),
          }),
        ),
      });

      const result = await invokeLambda('assets', 'testFunction', {
        pathParameters: {},
      });

      expect(result).toEqual(responseBody);
    });

    it('should handle non-JSON body gracefully', async () => {
      mockInvoke.mockResolvedValue({
        Payload: Buffer.from(
          JSON.stringify({
            statusCode: 200,
            body: 'plain text response',
          }),
        ),
      });

      const result = await invokeLambda('assets', 'testFunction', {
        pathParameters: {},
      });

      expect(result).toEqual('plain text response');
    });

    it('should reuse one shared Lambda client across default invokes', async () => {
      mockInvoke.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({ statusCode: 200, body: '{}' })),
      });

      await invokeLambda('assets', 'testFunction', { pathParameters: {} });
      await invokeLambda('accounts', 'getAccount', { pathParameters: {} });

      expect(mockLambdaConstructor).toHaveBeenCalledTimes(1);
      expect(mockInvoke).toHaveBeenCalledTimes(2);
      expect(mockDestroy).not.toHaveBeenCalled();
    });
  });

  describe('Lambda execution errors (FunctionError)', () => {
    it('should throw error with errorMessage when FunctionError is set', async () => {
      mockInvoke.mockResolvedValue({
        FunctionError: 'Unhandled',
        Payload: Buffer.from(
          JSON.stringify({
            errorMessage: 'Cannot read property of undefined',
            errorType: 'TypeError',
            stackTrace: ['at handler', 'at runtime'],
          }),
        ),
      });

      await expect(
        invokeLambda('assets', 'testFunction', { pathParameters: {} }),
      ).rejects.toThrow(
        'Invoke Lambda failed: Cannot read property of undefined',
      );
    });

    it('should throw error with message field when errorMessage not present', async () => {
      mockInvoke.mockResolvedValue({
        FunctionError: 'Handled',
        Payload: Buffer.from(
          JSON.stringify({
            message: 'Custom error message',
          }),
        ),
      });

      await expect(
        invokeLambda('assets', 'testFunction', { pathParameters: {} }),
      ).rejects.toThrow('Invoke Lambda failed: Custom error message');
    });

    it('should throw "Unknown error" when no error message available', async () => {
      mockInvoke.mockResolvedValue({
        FunctionError: 'Unhandled',
        Payload: Buffer.from(JSON.stringify({})),
      });

      await expect(
        invokeLambda('assets', 'testFunction', { pathParameters: {} }),
      ).rejects.toThrow('Invoke Lambda failed: Unknown error');
    });
  });

  describe('HTTP status code errors (backwards compatible)', () => {
    it('should throw error with body.message on non-200 status', async () => {
      mockInvoke.mockResolvedValue({
        Payload: Buffer.from(
          JSON.stringify({
            statusCode: 400,
            body: JSON.stringify({ message: 'Bad request error' }),
          }),
        ),
      });

      await expect(
        invokeLambda('assets', 'testFunction', { pathParameters: {} }),
      ).rejects.toThrow('Invoke Lambda failed: Bad request error');
    });

    it('should throw error with body.error on non-200 status', async () => {
      mockInvoke.mockResolvedValue({
        Payload: Buffer.from(
          JSON.stringify({
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' }),
          }),
        ),
      });

      await expect(
        invokeLambda('assets', 'testFunction', { pathParameters: {} }),
      ).rejects.toThrow('Invoke Lambda failed: Internal server error');
    });

    it('should throw error with parsedData.errorMessage on non-200 status', async () => {
      mockInvoke.mockResolvedValue({
        Payload: Buffer.from(
          JSON.stringify({
            statusCode: 404,
            errorMessage: 'Resource not found',
            body: '{}',
          }),
        ),
      });

      await expect(
        invokeLambda('assets', 'testFunction', { pathParameters: {} }),
      ).rejects.toThrow('Invoke Lambda failed: Resource not found');
    });

    it('should throw error with string body on non-200 status', async () => {
      mockInvoke.mockResolvedValue({
        Payload: Buffer.from(
          JSON.stringify({
            statusCode: 403,
            body: 'Access denied',
          }),
        ),
      });

      await expect(
        invokeLambda('assets', 'testFunction', { pathParameters: {} }),
      ).rejects.toThrow('Invoke Lambda failed: Access denied');
    });

    it('should throw error with status code when no error details available', async () => {
      mockInvoke.mockResolvedValue({
        Payload: Buffer.from(
          JSON.stringify({
            statusCode: 500,
            body: '',
          }),
        ),
      });

      await expect(
        invokeLambda('assets', 'testFunction', { pathParameters: {} }),
      ).rejects.toThrow('Invoke Lambda failed with status 500');
    });

    it('should stringify object body when no message/error fields', async () => {
      mockInvoke.mockResolvedValue({
        Payload: Buffer.from(
          JSON.stringify({
            statusCode: 400,
            body: JSON.stringify({ code: 'INVALID', details: 'test' }),
          }),
        ),
      });

      await expect(
        invokeLambda('assets', 'testFunction', { pathParameters: {} }),
      ).rejects.toThrow(
        'Invoke Lambda failed: {"code":"INVALID","details":"test"}',
      );
    });
  });

  describe('function name construction', () => {
    it('should construct correct function name from env vars', async () => {
      process.env.cfstack = 'my-stack';
      process.env.stage = 'prod';

      mockInvoke.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({ statusCode: 200, body: '{}' })),
      });

      await invokeLambda('accounts', 'getAccount', { pathParameters: {} });

      expect(mockInvoke).toHaveBeenCalledWith(
        expect.objectContaining({
          FunctionName: 'my-stack-accounts-prod-getAccount',
        }),
      );
    });
  });

  describe('invocation type', () => {
    it('should default to RequestResponse invocation type', async () => {
      mockInvoke.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({ statusCode: 200, body: '{}' })),
      });

      await invokeLambda('assets', 'test', { pathParameters: {} });

      expect(mockInvoke).toHaveBeenCalledWith(
        expect.objectContaining({
          InvocationType: 'RequestResponse',
        }),
      );
    });

    it('should use Event invocation type when specified', async () => {
      mockInvoke.mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({ statusCode: 200, body: '{}' })),
      });

      await invokeLambda('assets', 'test', { pathParameters: {} }, 'Event');

      expect(mockInvoke).toHaveBeenCalledWith(
        expect.objectContaining({
          InvocationType: 'Event',
        }),
      );
    });
  });

  describe('retry options and signature error handling', () => {
    it('should use caller-provided maxAttempts when retry options are passed', async () => {
      const customClientDestroy = jest.fn();
      const customClientInvoke = jest.fn().mockResolvedValue({
        Payload: Buffer.from(JSON.stringify({ statusCode: 200, body: '{}' })),
      });
      mockLambdaConstructor.mockImplementationOnce(() => ({
        invoke: customClientInvoke,
        destroy: customClientDestroy,
      }));

      await invokeLambda('assets', 'test', { pathParameters: {} }, undefined, {
        maxAttempts: 5,
      });

      expect(customClientInvoke).toHaveBeenCalledTimes(1);
      expect(mockLambdaConstructor).toHaveBeenLastCalledWith(
        expect.objectContaining({ maxAttempts: 5 }),
      );
      expect(customClientDestroy).toHaveBeenCalledTimes(1);
    });

    it('should retry on a one-off client and promote it as shared on signature expiry', async () => {
      const firstDestroy = jest.fn();
      const retryDestroy = jest.fn();
      const firstInvoke = jest.fn().mockRejectedValue(
        Object.assign(new Error('Signature expired'), {
          name: 'InvalidSignatureException',
        }),
      );
      const retryInvoke = jest.fn().mockResolvedValue({
        Payload: Buffer.from(
          JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({ ok: true }),
          }),
        ),
      });
      mockLambdaConstructor
        .mockImplementationOnce(() => ({
          invoke: firstInvoke,
          destroy: firstDestroy,
        }))
        .mockImplementationOnce(() => ({
          invoke: retryInvoke,
          destroy: retryDestroy,
        }));

      const result = await invokeLambda('assets', 'test', {
        pathParameters: {},
      });

      expect(result).toEqual({ ok: true });
      expect(firstInvoke).toHaveBeenCalledTimes(1);
      expect(retryInvoke).toHaveBeenCalledTimes(1);
      // Prior shared client must not be destroyed mid-flight (Promise.all-safe).
      expect(firstDestroy).not.toHaveBeenCalled();
      // Retry client was promoted to shared; do not destroy it.
      expect(retryDestroy).not.toHaveBeenCalled();
      expect(mockLambdaConstructor).toHaveBeenCalledTimes(2);

      // Subsequent default invoke reuses the promoted shared client.
      await invokeLambda('assets', 'test2', { pathParameters: {} });
      expect(mockLambdaConstructor).toHaveBeenCalledTimes(2);
      expect(retryInvoke).toHaveBeenCalledTimes(2);
    });
  });
});
