import { NodeHttpHandler } from '@smithy/node-http-handler';
import CacheableLookup from 'cacheable-lookup';
import http from 'http';
import https from 'https';

export interface PoolOptions {
  maxSockets?: number;
  maxFreeSockets?: number;
  keepAliveMsecs?: number;
  connectionTimeoutMs?: number;
  socketTimeoutMs?: number;
  dnsCache?: boolean;
  dnsCacheTtlSeconds?: number;
}

interface NormalizedPoolOptions {
  maxSockets: number;
  maxFreeSockets: number;
  keepAliveMsecs: number;
  connectionTimeoutMs: number;
  socketTimeoutMs: number;
  dnsCache: boolean;
  dnsCacheTtlSeconds: number;
}

const DEFAULTS: NormalizedPoolOptions = {
  maxSockets: 25,
  maxFreeSockets: 10,
  keepAliveMsecs: 1000,
  connectionTimeoutMs: 5000,
  socketTimeoutMs: 30000,
  dnsCache: true,
  dnsCacheTtlSeconds: 30,
};

const normalize = (options?: PoolOptions): NormalizedPoolOptions => ({
  ...DEFAULTS,
  ...(options || {}),
});

// Multiple instances of `S3Wrapper` constructed with the same `poolOptions`
// share a single `NodeHttpHandler`, which means they share the same socket
// pool and DNS cache. This is what prevents `EMFILE` under fan-out workloads
// (e.g. listing many buckets concurrently inside a single Lambda).
const handlerCache = new Map<string, NodeHttpHandler>();

const cacheKey = (options: NormalizedPoolOptions): string =>
  JSON.stringify(options);

/**
 * Creates (or returns a cached) NodeHttpHandler with keep-alive HTTP/HTTPS
 * agents and optional DNS caching, suitable for use as the
 * `requestHandler` on an AWS SDK v3 `S3Client`.
 *
 * Handlers are memoized by their resolved options so that callers asking for
 * the same configuration always reuse the same socket pool.
 */
export default function createPooledRequestHandler(
  options?: PoolOptions,
): NodeHttpHandler {
  const resolved = normalize(options);
  const key = cacheKey(resolved);

  const cached = handlerCache.get(key);

  if (cached) {
    return cached;
  }

  const httpAgent = new http.Agent({
    keepAlive: true,
    keepAliveMsecs: resolved.keepAliveMsecs,
    maxSockets: resolved.maxSockets,
    maxFreeSockets: resolved.maxFreeSockets,
  });

  const httpsAgent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: resolved.keepAliveMsecs,
    maxSockets: resolved.maxSockets,
    maxFreeSockets: resolved.maxFreeSockets,
  });

  if (resolved.dnsCache) {
    const cacheableLookup = new CacheableLookup({
      maxTtl: resolved.dnsCacheTtlSeconds,
    });
    cacheableLookup.install(httpAgent);
    cacheableLookup.install(httpsAgent);
  }

  const handler = new NodeHttpHandler({
    httpAgent,
    httpsAgent,
    connectionTimeout: resolved.connectionTimeoutMs,
    socketTimeout: resolved.socketTimeoutMs,
  });

  handlerCache.set(key, handler);

  return handler;
}

// Exposed for tests so a fresh map can be obtained between cases.
export const __resetHandlerCacheForTests = (): void => {
  handlerCache.clear();
};
