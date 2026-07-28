import { Bucket } from '../../common/tsModels';

import getAWSSecrets from '../getAWSSecrets';
import getBuckets from './getBuckets';
import loadAccountBucketConfig from './loadAccountBucketConfig';

/**
 * Resolves the durable / storage primary bucket for an account.
 * Prefer `storage.primaryBucketId`; else fall back to global Storj (`sj_assets`).
 */
export default async (accountId: string): Promise<Bucket> => {
  const secretExpiresInMinutes = 5;
  await getAWSSecrets('transcode', {
    expires: secretExpiresInMinutes * 60 * 1000,
  });

  const config = await loadAccountBucketConfig(accountId);

  if (config.primaryBucketId) {
    const [primary] = await getBuckets(accountId, [config.primaryBucketId]);
    if (primary && !primary.disabled) {
      return primary;
    }
  }

  const [storj] = await getBuckets(accountId, ['sj_assets']);
  if (storj && storj.internalBucket && storj.provider === 'storj') {
    return storj;
  }

  throw Error(`No primary bucket found for account ${accountId}`);
};
