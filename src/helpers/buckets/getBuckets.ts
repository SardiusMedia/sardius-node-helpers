import { Bucket } from '../../common/tsModels';

import { getAWSSecrets, getAccount } from '../index';
import validateBucket from './validateBucket';

const acceptedInternalIds = [
  'bb_assets',
  'bb_assets-eu',
  'lc_assets',
  'sj_assets',
  'default',
];

interface AccountBuckets {
  type: 'default' | 'external';
  id: string;
}

export default async (
  accountId: string,
  buckets: string[],
): Promise<Bucket[]> => {
  await getAWSSecrets('transcode');

  let externalProviders: Bucket[] = [];
  let accountBucketDefaults: AccountBuckets[] = [];

  const foundExternalProviders =
    process.env[`externalProviders_${accountId}`] || '';
  const foundAccountBucketDefaults =
    process.env[`accountBucketDefaults_${accountId}`] || '';

  // Check env variables to see if we have a cached version we can use
  if (foundAccountBucketDefaults && foundExternalProviders) {
    externalProviders = JSON.parse(foundExternalProviders);
    accountBucketDefaults = JSON.parse(foundAccountBucketDefaults);
  } else if (accountId !== 'sardiusAdmin') {
    const account = (await getAccount(accountId)) as Awaited<
      ReturnType<typeof getAccount>
    > & {
      storage?: { externalProviders?: Bucket[]; buckets?: AccountBuckets[] };
    };

    if (account && account.storage && account.storage.externalProviders) {
      externalProviders = account.storage.externalProviders;
    }

    if (account && account.storage && account.storage.buckets) {
      accountBucketDefaults = account.storage.buckets;
    }

    process.env[`externalProviders_${accountId}`] =
      JSON.stringify(externalProviders);

    process.env[`accountBucketDefaults_${accountId}`] = JSON.stringify(
      accountBucketDefaults,
    );
  }

  const results: Bucket[] = [];

  if (!buckets || !buckets.forEach) {
    throw Error('No buckets found');
  }

  let formattedBuckets: string[] = buckets;

  if (buckets.indexOf('default') > -1) {
    if (accountBucketDefaults.length > 0) {
      formattedBuckets = accountBucketDefaults.map(item => item.id);
    } else {
      // System defaults
      formattedBuckets = [
        'sj_assets',
        'bb_assets',
        'bb_assets-eu',
        'lc_assets',
      ];
    }
  }

  if (buckets.indexOf('all') > -1) {
    formattedBuckets = ['sj_assets', 'bb_assets', 'bb_assets-eu', 'lc_assets'];

    externalProviders.forEach(bucket => formattedBuckets.push(bucket.id));
  }

  formattedBuckets.forEach(incomingBucketId => {
    let foundBucket: Bucket;

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
      } else {
        const provider = bucketId === 'lc_assets' ? 'lyvecloud' : 'storj';

        foundBucket = {
          type: 's3',
          id: process.env[`${bucketId}_bucketId`] || '',
          key: process.env[`${bucketId}_key`] || '',
          secret: process.env[`${bucketId}_secret`] || '',
          bucketName: process.env[`${bucketId}_bucketName`] || '',
          region: process.env[`${bucketId}_region`] || '',
          provider,
          endpointUrl: process.env[`${bucketId}_endpoint`] || '',
          internalBucket: true,
        };
      }
    } else if (externalBucket) {
      foundBucket = externalBucket;
    } else {
      throw Error(`Unrecognized bucket: ${bucketId}`);
    }

    validateBucket(foundBucket);

    results.push(foundBucket);
  });

  return results;
};
