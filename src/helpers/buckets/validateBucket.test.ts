import { Bucket } from '../../common/tsModels';

import validateBucket from './validateBucket';

describe('src/helpers/buckets/validateBucket', () => {
  it('should exist', () => {
    expect(validateBucket).toBeTruthy();
  });

  it('should work with s3 bucket', async () => {
    const bucket: Bucket = {
      type: 's3',
      bucketName: 'testBucket',
      endpointUrl: 'abc',
      region: 'us-west',
      id: '1234',
      key: 'key',
      provider: 'backblaze',
      secret: 'abc',
    };
    const results = validateBucket(bucket);
    expect(results).toEqual(true);
  });

  it('should work with backblaze bucket', async () => {
    const bucket: Bucket = {
      type: 'backblaze',
      bucketName: 'bucketName',
      id: '1234',
      key: 'key',
      provider: 'backblaze',
      secret: 'abc',
    };
    const results = validateBucket(bucket);
    expect(results).toEqual(true);
  });

  it('should fail if invalid type', async () => {
    try {
      validateBucket({
        // eslint-disable-next-line
        // @ts-ignore
        type: 'badType',
        key: 'key',
        secret: 'abc',
        id: '123',
        provider: 'backblaze',
        bucketName: 'bucketName1',
      });
      expect('should not').toEqual('get here');
    } catch (err) {
      expect(err.message).toEqual('Invalid bucket type');
    }
  });

  it('should fail if missing information', async () => {
    try {
      // eslint-disable-next-line
      // @ts-ignore
      validateBucket({
        type: 's3',
        key: 'key',
        secret: 'abc',
        provider: 'backblaze',
        bucketName: 'bucketName1',
      });
      expect('should not').toEqual('get here');
    } catch (err) {
      expect(err.message).toEqual(
        'Missing a bucket required parameter: id, type, secret, key, bucketName, provider',
      );
    }

    try {
      // eslint-disable-next-line
      // @ts-ignore
      validateBucket({
        type: 's3',
        id: 'key',
        secret: 'abc',
        provider: 'backblaze',
        bucketName: 'bucketName1',
      });
      expect('should not').toEqual('get here');
    } catch (err) {
      expect(err.message).toEqual(
        'Missing a bucket required parameter: id, type, secret, key, bucketName, provider',
      );
    }

    try {
      // eslint-disable-next-line
      // @ts-ignore
      validateBucket({
        type: 's3',
        key: 'key',
        id: 'abc',
        provider: 'backblaze',
        bucketName: 'bucketName1',
      });
      expect('should not').toEqual('get here');
    } catch (err) {
      expect(err.message).toEqual(
        'Missing a bucket required parameter: id, type, secret, key, bucketName, provider',
      );
    }

    try {
      // eslint-disable-next-line
      // @ts-ignore
      validateBucket({
        type: 's3',
        secret: 'secret',
        key: 'key',
        id: 'abc',
        bucketName: 'bucketName1',
      });
      expect('should not').toEqual('get here');
    } catch (err) {
      expect(err.message).toEqual(
        'Missing a bucket required parameter: id, type, secret, key, bucketName, provider',
      );
    }

    try {
      // eslint-disable-next-line
      // @ts-ignore
      validateBucket({
        secret: 'secret',
        key: 'key',
        id: 'abc',
        provider: 'backblaze',
        bucketName: 'bucketName1',
      });
      expect('should not').toEqual('get here');
    } catch (err) {
      expect(err.message).toEqual(
        'Missing a bucket required parameter: id, type, secret, key, bucketName, provider',
      );
    }

    try {
      validateBucket({
        secret: 'secret',
        key: 'key',
        id: 'abc',
        // eslint-disable-next-line
        // @ts-ignore
        provider: 'backblaze',
        // eslint-disable-next-line
        // @ts-ignore
        provider: 's3',
      });
      expect('should not').toEqual('get here');
    } catch (err) {
      expect(err.message).toEqual(
        'Missing a bucket required parameter: id, type, secret, key, bucketName, provider',
      );
    }
  });

  it('should fail if missing information for s3', async () => {
    const bucket: Bucket = {
      type: 's3',
      id: '1234',
      key: 'key',
      secret: 'abc',
      bucketName: 'testBucket',
      provider: 'lyvecloud',
    };
    try {
      validateBucket(bucket);
      expect('should not').toEqual('get here 1');
    } catch (err) {
      expect(err.message).toEqual(
        'Missing required s3 parameters: endpointUrl, region',
      );
    }

    try {
      bucket.endpointUrl = 'abc';
      validateBucket(bucket);
      expect('should not').toEqual('get here 2');
    } catch (err) {
      expect(err.message).toEqual(
        'Missing required s3 parameters: endpointUrl, region',
      );
    }
  });
});
