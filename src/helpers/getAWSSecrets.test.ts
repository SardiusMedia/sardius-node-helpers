import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import getAwsSecrets from './getAWSSecrets';

jest.mock('@aws-sdk/client-secrets-manager');

describe('getAwsSecrets', () => {
  const mockSend = jest.fn();
  const mockClient = {
    send: mockSend,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (SecretsManagerClient as jest.Mock).mockImplementation(() => mockClient);
  });

  it('should not refetch secret if already loaded and not expired', async () => {
    process.env['testSecret_loaded'] = Date.now().toString();

    await getAwsSecrets('testSecret');

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should refetch secret if already loaded but expired', async () => {
    process.env['testSecret_loaded'] = (Date.now() - 10000).toString();

    mockSend.mockResolvedValue({
      SecretString: JSON.stringify({ key: 'value' }),
    });

    await getAwsSecrets('testSecret', { expires: 5000 });

    expect(mockSend).toHaveBeenCalled();
    expect(process.env['key']).toBe('value');
  });

  it('should fetch secret if not loaded', async () => {
    delete process.env['testSecret_loaded'];

    mockSend.mockResolvedValue({
      SecretString: JSON.stringify({ key: 'value' }),
    });

    await getAwsSecrets('testSecret');

    expect(mockSend).toHaveBeenCalled();
    expect(process.env['key']).toBe('value');
  });

  it('should handle missing SecretString', async () => {
    delete process.env['testSecret_loaded'];

    mockSend.mockResolvedValue({});

    const result = await getAwsSecrets('testSecret');

    expect(result).toBeUndefined();
    expect(mockSend).toHaveBeenCalled();
  });

  it('should throw error for ResourceNotFoundException', async () => {
    delete process.env['testSecret_loaded'];

    mockSend.mockRejectedValue({
      code: 'ResourceNotFoundException',
      message: 'Secret not found',
    });

    await expect(getAwsSecrets('testSecret')).rejects.toThrow(
      'The requested secret undefined/testSecret was not found',
    );
  });

  it('should throw error for InvalidRequestException', async () => {
    delete process.env['testSecret_loaded'];

    mockSend.mockRejectedValue({
      code: 'InvalidRequestException',
      message: 'Invalid request',
    });

    await expect(getAwsSecrets('testSecret')).rejects.toThrow(
      'The request was invalid due to: Invalid request',
    );
  });

  it('should throw error for InvalidParameterException', async () => {
    delete process.env['testSecret_loaded'];

    mockSend.mockRejectedValue({
      code: 'InvalidParameterException',
      message: 'Invalid parameter',
    });

    await expect(getAwsSecrets('testSecret')).rejects.toThrow(
      'The request had invalid params: Invalid parameter',
    );
  });
});
