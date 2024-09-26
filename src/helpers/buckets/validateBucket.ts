import { Bucket } from '../../common/tsModels';

const acceptedTypes = ['backblaze', 's3'];

export default (bucket: Bucket): boolean => {
  if (
    !bucket ||
    !bucket.id ||
    !bucket.key ||
    !bucket.secret ||
    !bucket.type ||
    !bucket.bucketName ||
    !bucket.provider
  ) {
    throw Error(
      'Missing a bucket required parameter: id, type, secret, key, bucketName, provider',
    );
  }

  if (acceptedTypes.indexOf(bucket.type) === -1) {
    throw Error('Invalid bucket type');
  }

  if (bucket.type === 's3' && (!bucket.endpointUrl || !bucket.region)) {
    throw Error('Missing required s3 parameters: endpointUrl, region');
  }

  return true;
};
