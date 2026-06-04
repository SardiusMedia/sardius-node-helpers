jest.mock('cacheable-lookup', () =>
  jest.fn().mockImplementation(() => ({
    install: jest.fn((agent: any) => {
      agent.lookup = jest.fn();
    }),
  })),
);

import http from 'http';
import https from 'https';

import { NodeHttpHandler } from '@smithy/node-http-handler';

import createPooledRequestHandler, {
  __resetHandlerCacheForTests,
} from './createPooledRequestHandler';

// Capture the options each Agent was constructed with so we can assert
// directly on them — the handler's own internals don't expose agents.
const httpAgentSpy = jest.spyOn(http, 'Agent');
const httpsAgentSpy = jest.spyOn(https, 'Agent');

describe('s3/createPooledRequestHandler', () => {
  beforeEach(() => {
    __resetHandlerCacheForTests();
    httpAgentSpy.mockClear();
    httpsAgentSpy.mockClear();
  });

  it('returns a NodeHttpHandler', () => {
    const handler = createPooledRequestHandler();

    expect(handler).toBeInstanceOf(NodeHttpHandler);
  });

  it('builds keep-alive agents with default pool sizes', () => {
    createPooledRequestHandler();

    expect(httpAgentSpy).toHaveBeenCalledTimes(1);
    expect(httpsAgentSpy).toHaveBeenCalledTimes(1);

    const httpOptions = httpAgentSpy.mock.calls[0][0];
    const httpsOptions = httpsAgentSpy.mock.calls[0][0];

    expect(httpOptions).toMatchObject({
      keepAlive: true,
      keepAliveMsecs: 1000,
      maxSockets: 25,
      maxFreeSockets: 10,
    });
    expect(httpsOptions).toMatchObject({
      keepAlive: true,
      keepAliveMsecs: 1000,
      maxSockets: 25,
      maxFreeSockets: 10,
    });
  });

  it('honors custom pool options', () => {
    createPooledRequestHandler({
      maxSockets: 100,
      maxFreeSockets: 20,
      keepAliveMsecs: 2000,
    });

    expect(httpsAgentSpy.mock.calls[0][0]).toMatchObject({
      maxSockets: 100,
      maxFreeSockets: 20,
      keepAliveMsecs: 2000,
    });
  });

  it('returns the same handler instance for the same options', () => {
    const a = createPooledRequestHandler({ maxSockets: 50 });
    const b = createPooledRequestHandler({ maxSockets: 50 });

    expect(a).toBe(b);
    // Agents only constructed for the first call.
    expect(httpAgentSpy).toHaveBeenCalledTimes(1);
    expect(httpsAgentSpy).toHaveBeenCalledTimes(1);
  });

  it('returns different handler instances for different options', () => {
    const a = createPooledRequestHandler({ maxSockets: 50 });
    const b = createPooledRequestHandler({ maxSockets: 100 });

    expect(a).not.toBe(b);
    expect(httpAgentSpy).toHaveBeenCalledTimes(2);
    expect(httpsAgentSpy).toHaveBeenCalledTimes(2);
  });

  it('installs cacheable-lookup on agents when dnsCache is true (default)', () => {
    createPooledRequestHandler();

    const httpAgent = httpAgentSpy.mock.results[0].value as any;
    const httpsAgent = httpsAgentSpy.mock.results[0].value as any;

    expect(typeof httpAgent.lookup).toBe('function');
    expect(typeof httpsAgent.lookup).toBe('function');
  });

  it('does not install cacheable-lookup when dnsCache is false', () => {
    createPooledRequestHandler({ dnsCache: false });

    const httpAgent = httpAgentSpy.mock.results[0].value as any;
    const httpsAgent = httpsAgentSpy.mock.results[0].value as any;

    expect(httpAgent.lookup).toBeUndefined();
    expect(httpsAgent.lookup).toBeUndefined();
  });
});
