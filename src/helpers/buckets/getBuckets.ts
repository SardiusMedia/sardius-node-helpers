import { Bucket } from '../../common/tsModels';

import getAWSSecrets from '../getAWSSecrets';
import validateBucket from './validateBucket';
import loadAccountBucketConfig from './loadAccountBucketConfig';

const acceptedInternalIds = [
  'bb_assets',
  'bb_assets-eu',
  'sj_assets',
  'default',
];

const INTERNAL_DEFAULT_BUCKETS = ['sj_assets', 'bb_assets', 'bb_assets-eu'];

interface Options {
  includeReadOnly?: boolean;
}

export default async (
  accountId: string,
  buckets: string[],
  options?: Options,
): Promise<Bucket[]> => {
  const secretExpiresInMinutes = 5;
  await getAWSSecrets('transcode', {
    expires: secretExpiresInMinutes * 60 * 1000,
  });

  const {
    externalProviders,
    buckets: accountBucketDefaults,
    primaryBucketId,
  } = await loadAccountBucketConfig(accountId);

  const results: Bucket[] = [];

  if (!buckets || !buckets.forEach) {
    throw Error('No buckets found');
  }

  let formattedBuckets: string[] = buckets;

  // `default` has always meant: use storage.buckets when configured, else globals.
  // Existing accounts with storage.buckets already rely on this.
  if (buckets.indexOf('default') > -1) {
    if (accountBucketDefaults.length > 0) {
      formattedBuckets = accountBucketDefaults
        .map(item => item.id)
        .filter(id => id !== 'lc_assets');
    } else {
      formattedBuckets = [...INTERNAL_DEFAULT_BUCKETS];
    }
  }

  // `all` historically ignored storage.buckets and always returned globals + every
  // externalProvider. Keep that for existing accounts. Only skip auto-injecting
  // globals when primaryBucketId is set (createBuckets / migrated accounts).
  if (buckets.indexOf('all') > -1) {
    if (primaryBucketId && accountBucketDefaults.length > 0) {
      formattedBuckets = accountBucketDefaults
        .map(item => item.id)
        .filter(id => id !== 'lc_assets');
    } else {
      formattedBuckets = [...INTERNAL_DEFAULT_BUCKETS];

      externalProviders.forEach(bucket => {
        formattedBuckets.push(bucket.id);
      });
    }
  }

  formattedBuckets = formattedBuckets.filter(id => id !== 'lc_assets');

  formattedBuckets.forEach(incomingBucketId => {
    let foundBucket: Bucket | undefined = undefined;

    let bucketId = incomingBucketId;

    // Just in case we get the bucket ID value for our
    // env vars, then we switch it out for the internal ID
    // so it can go through the same flow of building the bucket
    acceptedInternalIds.forEach(id => {
      if (process.env[`${id}_bucketId`] === bucketId) {
        bucketId = id;
      }
    });

    const externalBucket = externalProviders.find(
      bucket => bucket.id === bucketId,
    );

    // If the bucketID is a known id, then it should come from
    // AWS secrets. It means it is an internal storage bucket
    if (acceptedInternalIds.indexOf(bucketId) > -1) {
      if (bucketId.indexOf('bb_') > -1) {
        if (process.env[`${bucketId}_disabled`] !== 'true') {
          foundBucket = {
            type: 'backblaze',
            id: process.env[`${bucketId}_bucketId`] || '',
            key: process.env[`${bucketId}_keyId`] || '',
            secret: process.env[`${bucketId}_appKey`] || '',
            bucketName: process.env[`${bucketId}_bucketName`] || '',
            region: process.env[`${bucketId}_region`] || '',
            provider: 'backblaze',
            endpointUrl: process.env[`${bucketId}_endpoint`] || '',
            internalBucket: true,
          };
        }
      } else if (bucketId === 'sj_assets') {
        if (process.env[`${bucketId}_disabled`] !== 'true') {
          foundBucket = {
            type: 's3',
            id: process.env[`${bucketId}_bucketId`] || '',
            key: process.env[`${bucketId}_key`] || '',
            secret: process.env[`${bucketId}_secret`] || '',
            bucketName: process.env[`${bucketId}_bucketName`] || '',
            region: process.env[`${bucketId}_region`] || '',
            provider: 'storj',
            endpointUrl: process.env[`${bucketId}_endpoint`] || '',
            internalBucket: true,
          };
        }
      }
    } else if (externalBucket) {
      let canReturnBucket = true;

      if ((!options || !options.includeReadOnly) && externalBucket.readOnly) {
        canReturnBucket = false;
      } else if (externalBucket.disabled) {
        canReturnBucket = false;
      }

      if (canReturnBucket) {
        foundBucket = externalBucket;
      }
    } else {
      throw Error(`Unrecognized bucket: ${bucketId}`);
    }

    if (foundBucket) {
      validateBucket(foundBucket);

      results.push(foundBucket);
    }
  });

  if (results.length === 0) {
    throw Error('No valid buckets found');
  }

  return results;
};
