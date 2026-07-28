# loadAccountBucketConfig

## For humans

Loads an account's `storage` bucket configuration (external providers, bucket lists, primary IDs) via `getAccountPrivate`, with a process.env cache so `getBuckets` / `getPrimaryBucket` can share one fetch per Lambda invocation.

## For AI

- Cache keys: `externalProviders_{accountId}`, `accountBucketDefaults_{accountId}`, `primaryBucketId_{accountId}`, `entrypointPrimaryBucketId_{accountId}`, `entrypointBuckets_{accountId}`, `limitRaceworkerBuckets_{accountId}`, `bucketConfigCached_{accountId}`.
- Clear those env keys in tests between cases (same pattern as existing getBuckets tests).
- Do not use for write paths that need a fresh read after mutation — clear cache or re-fetch account after `createBuckets`.
