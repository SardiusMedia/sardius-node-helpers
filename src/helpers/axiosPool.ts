import axios, { AxiosError, AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import CacheableLookup from 'cacheable-lookup';
import http from 'http';
import https from 'https';

export interface AxiosPoolOptions {
  retries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  keepAlive?: boolean;
  keepAliveMsecs?: number;
  maxSockets?: number;
  maxFreeSockets?: number;
  dnsCache?: boolean;
  dnsCacheTtlSeconds?: number;
}

/**
 * Creates an axios instance with connection pooling and optional DNS caching.
 */
export default function axiosPool(
  options: AxiosPoolOptions = {},
): AxiosInstance {
  const {
    retries = 3,
    retryDelayMs = 2000,
    timeoutMs = 30000,
    keepAlive = true,
    keepAliveMsecs = 1000,
    maxSockets = 50,
    maxFreeSockets = 10,
    dnsCache = true,
    dnsCacheTtlSeconds = 30,
  } = options;

  const httpAgent = new http.Agent({
    keepAlive,
    keepAliveMsecs,
    maxSockets,
    maxFreeSockets,
  });

  const httpsAgent = new https.Agent({
    keepAlive,
    keepAliveMsecs,
    maxSockets,
    maxFreeSockets,
  });

  if (dnsCache) {
    const cacheableLookup = new CacheableLookup({
      maxTtl: dnsCacheTtlSeconds,
    });
    cacheableLookup.install(httpAgent);
    cacheableLookup.install(httpsAgent);
  }

  const client = axios.create({
    httpAgent,
    httpsAgent,
    timeout: timeoutMs,
  });

  axiosRetry(client, {
    retries,
    retryDelay: (retryCount: number) => retryCount * retryDelayMs,
    retryCondition: (error: AxiosError) =>
      error.response?.status ? error.response.status >= 500 : false,
  });

  return client;
}
