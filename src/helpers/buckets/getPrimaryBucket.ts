import { Bucket } from '../../common/tsModels';

import getAWSSecrets from '../getAWSSecrets';
import getBuckets from './getBuckets';
import loadAccountBucketConfig from './loadAccountBucketConfig';

/**
 * Resolves the durable / storage primary bucket for an account.
 * Prefer `storage.primaryBucketId`; else fall back to global Storj (`sj_assets`).
 *
 * When `primaryBucketId` is set but cannot be resolved (missing / disabled),
 * throws instead of silently landing on shared Storj.
 */
export default async (accountId: string): Promise<Bucket> => {
  const secretExpiresInMinutes = 5;
  await getAWSSecrets('transcode', {
    expires: secretExpiresInMinutes * 60 * 1000,
  });

  const config = await loadAccountBucketConfig(accountId);

  if (config.primaryBucketId) {
    try {
      const [primary] = await getBuckets(accountId, [config.primaryBucketId]);
      if (primary && !primary.disabled) {
        return primary;
      }
    } catch (err: any) {
      throw Error(
        `primaryBucketId ${
          config.primaryBucketId
        } is set for account ${accountId} but could not be resolved (missing or disabled): ${
          err?.message || err
        }`,
      );
    }

    throw Error(
      `primaryBucketId ${config.primaryBucketId} is set for account ${accountId} but could not be resolved (missing or disabled)`,
    );
  }

  const [storj] = await getBuckets(accountId, ['sj_assets']);
  if (storj && storj.internalBucket && storj.provider === 'storj') {
    return storj;
  }

  throw Error(`No primary bucket found for account ${accountId}`);
};
