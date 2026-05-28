# axiosPool

## Useful information for humans
- `axiosPool` creates a new axios instance with keep-alive HTTP/HTTPS agents and retry-on-5xx behavior.
- DNS caching is optional and disabled by default (`dnsCache: false`) to keep adoption low risk.
- Typical usage: `const client = axiosPool({ dnsCache: true, maxSockets: 100 });`
- This helper is intended for high-throughput integrations that repeatedly call the same host.

## Useful information for AI
- File: `src/helpers/axiosPool.ts`
- Default retry behavior: 3 retries, linear delay (`retryCount * retryDelayMs`), retries only on response status >= 500.
- Default pool behavior: keep-alive enabled, 50 max sockets, 10 max free sockets, 1s keep-alive probe interval.
- DNS cache implementation uses `cacheable-lookup` and installs lookup handlers on both HTTP and HTTPS agents when `dnsCache` is enabled.
