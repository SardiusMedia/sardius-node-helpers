jest.mock('cacheable-lookup', () =>
  jest.fn().mockImplementation(() => ({
    install: jest.fn((agent: any) => {
      agent.lookup = jest.fn();
    }),
  })),
);

const mockS3ClientCtor = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3');
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation((config: any) => {
      mockS3ClientCtor(config);
      return { send: jest.fn().mockResolvedValue({}) };
    }),
  };
});

import { NodeHttpHandler } from '@smithy/node-http-handler';

import S3Wrapper from './index';
import { __resetHandlerCacheForTests } from './createPooledRequestHandler';

describe('s3/S3Wrapper', () => {
  beforeEach(() => {
    __resetHandlerCacheForTests();
    mockS3ClientCtor.mockClear();
  });

  it('does not attach a requestHandler by default (backwards compatible)', () => {
    new S3Wrapper({
      accessKeyId: 'a',
      secretAccessKey: 'b',
      bucket: 'my-bucket',
    });

    const config = mockS3ClientCtor.mock.calls[0][0];
    expect(config.requestHandler).toBeUndefined();
  });

  it('attaches a pooled NodeHttpHandler when pool: true', () => {
    new S3Wrapper({
      accessKeyId: 'a',
      secretAccessKey: 'b',
      bucket: 'my-bucket',
      pool: true,
    });

    const config = mockS3ClientCtor.mock.calls[0][0];
    expect(config.requestHandler).toBeInstanceOf(NodeHttpHandler);
  });

  it('attaches a pooled handler when only poolOptions are provided', () => {
    new S3Wrapper({
      accessKeyId: 'a',
      secretAccessKey: 'b',
      bucket: 'my-bucket',
      poolOptions: { maxSockets: 100 },
    });

    const config = mockS3ClientCtor.mock.calls[0][0];
    expect(config.requestHandler).toBeInstanceOf(NodeHttpHandler);
  });

  it('reuses the same pooled handler across instances with the same options', () => {
    new S3Wrapper({
      accessKeyId: 'a',
      secretAccessKey: 'b',
      bucket: 'bucket-1',
      pool: true,
      poolOptions: { maxSockets: 50 },
    });

    new S3Wrapper({
      accessKeyId: 'a',
      secretAccessKey: 'b',
      bucket: 'bucket-2',
      pool: true,
      poolOptions: { maxSockets: 50 },
    });

    const handlerA = mockS3ClientCtor.mock.calls[0][0].requestHandler;
    const handlerB = mockS3ClientCtor.mock.calls[1][0].requestHandler;

    expect(handlerA).toBe(handlerB);
  });

  it('uses different pooled handlers for different poolOptions', () => {
    new S3Wrapper({
      accessKeyId: 'a',
      secretAccessKey: 'b',
      bucket: 'bucket-1',
      pool: true,
      poolOptions: { maxSockets: 25 },
    });

    new S3Wrapper({
      accessKeyId: 'a',
      secretAccessKey: 'b',
      bucket: 'bucket-2',
      pool: true,
      poolOptions: { maxSockets: 100 },
    });

    const handlerA = mockS3ClientCtor.mock.calls[0][0].requestHandler;
    const handlerB = mockS3ClientCtor.mock.calls[1][0].requestHandler;

    expect(handlerA).not.toBe(handlerB);
  });

  it('uses an explicitly provided requestHandler over the built-in pool', () => {
    const customHandler = new NodeHttpHandler({});

    new S3Wrapper({
      accessKeyId: 'a',
      secretAccessKey: 'b',
      bucket: 'my-bucket',
      pool: true,
      requestHandler: customHandler,
    });

    const config = mockS3ClientCtor.mock.calls[0][0];
    expect(config.requestHandler).toBe(customHandler);
  });

  it('still validates required credentials', () => {
    expect(() => new S3Wrapper({})).toThrow(
      /accessKeyId is required to use the s3 class/,
    );
  });
});
