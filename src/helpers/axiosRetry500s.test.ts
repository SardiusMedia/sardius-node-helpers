import axiosRetry500s from './axiosRetry500s';
import axiosRetry from 'axios-retry';
import { AxiosError } from 'axios';

jest.mock('axios');
jest.mock('axios-retry');

describe('api/wrappers/axiosRetry500s', () => {
  it('Should exist', () => {
    expect(axiosRetry500s).toBeTruthy();
    expect(typeof axiosRetry500s).toEqual('function');
  });

  it('should configure axiosRetry with correct options', () => {
    expect(axiosRetry).toHaveBeenCalledWith(axiosRetry500s, {
      retries: 3,
      retryDelay: expect.any(Function),
      retryCondition: expect.any(Function),
    });
  });

  it('should retry only on 500+ status codes', () => {
    const retryCondition = (axiosRetry as unknown as jest.Mock).mock.calls[0][1]
      .retryCondition;

    const error500 = { response: { status: 500 } } as AxiosError;
    const error400 = { response: { status: 400 } } as AxiosError;

    expect(retryCondition(error500)).toBe(true);
    expect(retryCondition(error400)).toBe(false);
  });

  it('should have increasing retry delays', () => {
    const retryDelay = (axiosRetry as unknown as jest.Mock).mock.calls[0][1]
      .retryDelay;

    expect(retryDelay(1)).toBe(2000);
    expect(retryDelay(2)).toBe(4000);
    expect(retryDelay(3)).toBe(6000);
  });
});
