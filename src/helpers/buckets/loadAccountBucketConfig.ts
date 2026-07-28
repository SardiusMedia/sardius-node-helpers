import { Bucket } from '../../common/tsModels';

import getAccountPrivate from '../getAccountPrivate';

export interface AccountBucketRef {
  type: 'default' | 'external';
  id: string;
}

export interface AccountBucketConfig {
  externalProviders: Bucket[];
  buckets: AccountBucketRef[];
  primaryBucketId?: string;
  entrypointPrimaryBucketId?: string;
  entrypointBuckets?: AccountBucketRef[];
  limitRaceworkerBuckets?: boolean;
}

const emptyConfig = (): AccountBucketConfig => ({
  externalProviders: [],
  buckets: [],
});

/**
 * Loads account storage bucket config, with a short-lived process.env cache
 * shared by getBuckets / getPrimaryBucket.
 */
export default async (accountId: string): Promise<AccountBucketConfig> => {
  const foundExternalProviders =
    process.env[`externalProviders_${accountId}`] || '';
  const foundAccountBucketDefaults =
    process.env[`accountBucketDefaults_${accountId}`] || '';
  const foundPrimaryBucketId =
    process.env[`primaryBucketId_${accountId}`] || '';
  const foundCacheMarker = process.env[`bucketConfigCached_${accountId}`] || '';

  if (
    foundCacheMarker &&
    foundAccountBucketDefaults &&
    foundExternalProviders
  ) {
    return {
      externalProviders: JSON.parse(foundExternalProviders),
      buckets: JSON.parse(foundAccountBucketDefaults),
      primaryBucketId: foundPrimaryBucketId || undefined,
      entrypointPrimaryBucketId:
        process.env[`entrypointPrimaryBucketId_${accountId}`] || undefined,
      entrypointBuckets: process.env[`entrypointBuckets_${accountId}`]
        ? JSON.parse(process.env[`entrypointBuckets_${accountId}`] as string)
        : undefined,
      limitRaceworkerBuckets:
        process.env[`limitRaceworkerBuckets_${accountId}`] === 'true',
    };
  }

  if (accountId === 'sardiusAdmin') {
    return emptyConfig();
  }

  const account = (await getAccountPrivate(accountId)) as Awaited<
    ReturnType<typeof getAccountPrivate>
  > & {
    storage?: {
      externalProviders?: Bucket[];
      buckets?: AccountBucketRef[];
      primaryBucketId?: string;
      entrypointPrimaryBucketId?: string;
      entrypointBuckets?: AccountBucketRef[];
      limitRaceworkerBuckets?: boolean;
    };
  };

  const config: AccountBucketConfig = {
    externalProviders: account?.storage?.externalProviders || [],
    buckets: account?.storage?.buckets || [],
    primaryBucketId: account?.storage?.primaryBucketId,
    entrypointPrimaryBucketId: account?.storage?.entrypointPrimaryBucketId,
    entrypointBuckets: account?.storage?.entrypointBuckets,
    limitRaceworkerBuckets: account?.storage?.limitRaceworkerBuckets,
  };

  process.env[`externalProviders_${accountId}`] = JSON.stringify(
    config.externalProviders,
  );
  process.env[`accountBucketDefaults_${accountId}`] = JSON.stringify(
    config.buckets,
  );
  process.env[`primaryBucketId_${accountId}`] = config.primaryBucketId || '';
  process.env[`entrypointPrimaryBucketId_${accountId}`] =
    config.entrypointPrimaryBucketId || '';
  process.env[`entrypointBuckets_${accountId}`] = JSON.stringify(
    config.entrypointBuckets || [],
  );
  process.env[`limitRaceworkerBuckets_${accountId}`] =
    config.limitRaceworkerBuckets ? 'true' : 'false';
  process.env[`bucketConfigCached_${accountId}`] = 'true';

  return config;
};
