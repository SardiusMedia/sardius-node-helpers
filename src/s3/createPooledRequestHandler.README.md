# createPooledRequestHandler

## Useful information for humans

- Builds a Smithy `NodeHttpHandler` with keep-alive HTTP/HTTPS agents and
  optional DNS caching. Designed for use as the `requestHandler` on an AWS
  SDK v3 `S3Client`.
- Handlers are memoized by their resolved options so that multiple callers
  asking for the same configuration share a single socket pool. This is the
  main mitigation for `EMFILE` (`too many open files`) errors that show up
  under fan-out workloads such as iterating over many buckets in one Lambda.
- Defaults: 25 max sockets, 10 max free sockets, 1s keep-alive probes, 5s
  connection timeout, 30s socket timeout, DNS cache on with a 30s TTL.
- Typical usage:
  `new S3Wrapper({ ..., pool: true, poolOptions: { maxSockets: 50 } })`

## Useful information for AI

- File: `src/s3/createPooledRequestHandler.ts`
- Exports a default function that returns a `NodeHttpHandler` and a named
  `__resetHandlerCacheForTests` helper for tests that need to start from a
  clean cache.
- Cache key is `JSON.stringify(normalizedOptions)`. Two callers with the
  same shape of options receive the exact same handler instance.
- DNS caching is provided by `cacheable-lookup` and installed onto both the
  HTTP and HTTPS agents when `dnsCache` is true (default).
- Used by `src/s3/index.ts` (`S3Wrapper`) when `pool: true` is passed and
  no explicit `requestHandler` is provided.
