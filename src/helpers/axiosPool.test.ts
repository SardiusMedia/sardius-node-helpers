import axiosRetry from 'axios-retry';
import { AxiosError } from 'axios';

jest.mock('axios-retry');
jest.mock('cacheable-lookup', () =>
  jest.fn().mockImplementation(() => ({
    install: jest.fn((agent: any) => {
      // Simulate cacheable-lookup attaching a lookup handler.
      agent.lookup = jest.fn();
    }),
  })),
);

import axiosPool from './axiosPool';

describe('api/wrappers/axiosPool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an axios instance with keep-alive agents', () => {
    const client = axiosPool();

    expect(client).toBeTruthy();
    expect(client.defaults.httpAgent).toBeTruthy();
    expect(client.defaults.httpsAgent).toBeTruthy();
    expect((client.defaults.httpAgent as any).keepAlive).toBe(true);
    expect((client.defaults.httpsAgent as any).keepAlive).toBe(true);
  });

  it('should configure axiosRetry with expected defaults', () => {
    const client = axiosPool();

    expect(axiosRetry).toHaveBeenCalledWith(client, {
      retries: 3,
      retryDelay: expect.any(Function),
      retryCondition: expect.any(Function),
    });
  });

  it('should retry only on 500+ status codes', () => {
    axiosPool();
    const calls = (axiosRetry as unknown as jest.Mock).mock.calls;
    const retryConfig = calls[calls.length - 1][1];
    const retryCondition = retryConfig.retryCondition;

    const error500 = { response: { status: 500 } } as AxiosError;
    const error400 = { response: { status: 400 } } as AxiosError;

    expect(retryCondition(error500)).toBe(true);
    expect(retryCondition(error400)).toBe(false);
  });

  it('should configure retry delay from retryDelayMs', () => {
    axiosPool({ retryDelayMs: 500 });
    const calls = (axiosRetry as unknown as jest.Mock).mock.calls;
    const retryConfig = calls[calls.length - 1][1];
    const retryDelay = retryConfig.retryDelay;

    expect(retryDelay(1)).toBe(500);
    expect(retryDelay(2)).toBe(1000);
    expect(retryDelay(3)).toBe(1500);
  });

  it('should install DNS lookup when dnsCache is enabled', () => {
    const client = axiosPool({ dnsCache: true });

    expect(typeof (client.defaults.httpAgent as any).lookup).toBe('function');
    expect(typeof (client.defaults.httpsAgent as any).lookup).toBe('function');
  });
});
