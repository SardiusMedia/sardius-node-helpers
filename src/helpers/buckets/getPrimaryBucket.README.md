# getPrimaryBucket

## For humans

Returns the account's durable storage primary bucket. Used by encode destinations, SCP, assetSync source-of-truth, and purge paths that previously hard-coded Storj (`sj_assets`).

## For AI

- Resolution order: `storage.primaryBucketId` → global `sj_assets` (internal Storj).
- Throws if neither resolves to a non-disabled bucket.
- Relies on `getBuckets` + `loadAccountBucketConfig` env cache.
