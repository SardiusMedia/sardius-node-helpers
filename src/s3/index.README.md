# S3Wrapper

## Useful information for humans

- Thin convenience wrapper around the AWS SDK v3 `S3Client`. Same constructor
  shape across most Sardius services.
- As of `1.0.56`, supports **opt-in connection pooling and DNS caching** via
  three new constructor fields:
  - `pool: true` — turn on the built-in pool with sensible defaults.
  - `poolOptions: { ... }` — override pool sizing or DNS cache behavior.
    Passing this implies `pool: true`.
  - `requestHandler: NodeHttpHandler` — bring your own handler (escape hatch
    for X-Ray instrumentation, custom timeouts, etc.). Wins over `pool`.
- Existing consumers that don't pass any of these continue to get the AWS
  SDK default handler — no behavior change.
- Pool defaults: 25 max sockets, 10 max free sockets, 1s keep-alive probes,
  5s connection timeout, 30s socket timeout, DNS cache on with 30s TTL.
- Multiple `S3Wrapper` instances built with the same `poolOptions` share a
  single underlying `NodeHttpHandler`/socket pool. This is the main way the
  wrapper helps avoid `EMFILE` (too many open files) under fan-out
  workloads such as iterating over many buckets in one Lambda.

## Useful information for AI

- File: `src/s3/index.ts`. Pool implementation lives in
  `src/s3/createPooledRequestHandler.ts`.
- The constructor only sets `S3ClientConfig.requestHandler` when one of
  `requestHandler`, `pool`, or `poolOptions` is provided. Without any of
  those, no `requestHandler` is attached and the SDK falls back to its
  default — preserving prior behavior for existing callers.
- Resolution order for the request handler:
  1. `requestHandler` passed directly → use it.
  2. Else if `pool` or `poolOptions` truthy → call
     `createPooledRequestHandler(poolOptions)`.
  3. Else → leave `requestHandler` unset.
- `createPooledRequestHandler` memoizes by `JSON.stringify(options)`, so two
  callers with the same options share one socket pool. Different options
  yield separate pools, which is desirable when isolation matters.
- Tests use `jest.spyOn(http, 'Agent')` / `jest.spyOn(https, 'Agent')` to
  assert the underlying agent options because Smithy's `NodeHttpHandler`
  (v2.4.x) does not expose its config synchronously after construction.
