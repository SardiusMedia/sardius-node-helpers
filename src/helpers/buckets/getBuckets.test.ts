import getBuckets from './getBuckets';

const mockAccountBBBucket = {
  type: 'backblaze',
  id: 'a_id',
  key: 'a_key',
  bucketName: 'testBucket',
  provider: 'backblaze',
  secret: 'a_secret',
};

const mockAccountS3Bucket = {
  type: 's3',
  id: 'b_id',
  key: 'b_key',
  secret: 'b_secret',
  bucketName: 'testBucket',
  provider: 'lyvecloud',
  region: 'us-west',
  endpointUrl: 'https://...',
};

const mockAccount: any = {
  id: 'testAccount',
  storage: {
    externalProviders: [mockAccountBBBucket, mockAccountS3Bucket],
  },
};

const mockGetAccount = jest.fn(accountId => mockAccount);
jest.mock('../index', () => ({
  __esModule: true,
  getAccount: jest.fn().mockImplementation(param1 => mockGetAccount(param1)),
  getAWSSecrets: jest.fn(),
}));

const mockBBEnvBucket = {
  type: 'backblaze',
  id: 'bucketId',
  endpointUrl: '',
  provider: 'backblaze',
  region: '',
  key: 'keyId',
  secret: 'appKey',
  internalBucket: true,
  bucketName: 'testBucket',
};
process.env.bb_assets_appKey = mockBBEnvBucket.secret;
process.env.bb_assets_bucketId = mockBBEnvBucket.id;
process.env.bb_assets_keyId = mockBBEnvBucket.key;
process.env.bb_assets_bucketName = mockBBEnvBucket.bucketName;

const mockBBEUEnvBucket = {
  type: 'backblaze',
  endpointUrl: '',
  provider: 'backblaze',
  region: '',
  id: 'bucketIdEU',
  key: 'appKeyEU',
  secret: 'appSecretEU',
  internalBucket: true,
  bucketName: 'bbBucketName',
};

process.env['bb_assets-eu_appKey'] = mockBBEUEnvBucket.secret;
process.env['bb_assets-eu_bucketId'] = mockBBEUEnvBucket.id;
process.env['bb_assets-eu_bucketName'] = mockBBEUEnvBucket.bucketName;
process.env['bb_assets-eu_keyId'] = mockBBEUEnvBucket.key;

const mockSJEnvBucket = {
  type: 's3',
  endpointUrl: 'https://test2.com',
  provider: 'storj',
  region: 'global',
  id: 'storjId',
  key: 'storjAppKey',
  secret: 'storjAppSecret',
  internalBucket: true,
  bucketName: 'storjBucketName',
};

process.env['sj_assets_key'] = mockSJEnvBucket.key;
process.env['sj_assets_bucketId'] = mockSJEnvBucket.id;
process.env['sj_assets_bucketName'] = mockSJEnvBucket.bucketName;
process.env['sj_assets_secret'] = mockSJEnvBucket.secret;
process.env['sj_assets_endpoint'] = mockSJEnvBucket.endpointUrl;
process.env['sj_assets_region'] = mockSJEnvBucket.region;

const mockLCEnvBucket = {
  type: 's3',
  endpointUrl: 'https://test.com',
  provider: 'lyvecloud',
  region: 'us-west-1',
  id: 'lyvecloudId',
  key: 'lyvecloudAppKey',
  secret: 'lyvecloudAppSecret',
  internalBucket: true,
  bucketName: 'lyvecloudBucketName',
};

process.env['lc_assets_key'] = mockLCEnvBucket.key;
process.env['lc_assets_bucketId'] = mockLCEnvBucket.id;
process.env['lc_assets_bucketName'] = mockLCEnvBucket.bucketName;
process.env['lc_assets_secret'] = mockLCEnvBucket.secret;
process.env['lc_assets_endpoint'] = mockLCEnvBucket.endpointUrl;
process.env['lc_assets_region'] = mockLCEnvBucket.region;

afterEach(() => {
  process.env[`externalProviders_${mockAccount.id}`] = '';
  process.env[`accountBucketDefaults_${mockAccount.id}`] = '';
  jest.clearAllMocks();
});

describe('src/helpers/buckets/getBuckets', () => {
  it('should exist', () => {
    expect(getBuckets).toBeTruthy();
  });

  it('should work', async () => {
    const results = await getBuckets(mockAccount.id, [
      mockAccountBBBucket.id,
      mockAccountS3Bucket.id,
      'bb_assets',
      'bb_assets-eu',
    ]);

    expect(results).toEqual([
      mockAccountBBBucket,
      mockAccountS3Bucket,
      mockBBEnvBucket,
      mockBBEUEnvBucket,
    ]);
  });

  it('should work with bucket IDs', async () => {
    const results = await getBuckets(mockAccount.id, [
      mockLCEnvBucket.id,
      mockSJEnvBucket.id,
      mockBBEUEnvBucket.id,
      mockBBEnvBucket.id,
    ]);

    expect(results).toEqual([
      mockLCEnvBucket,
      mockSJEnvBucket,
      mockBBEUEnvBucket,
      mockBBEnvBucket,
    ]);
  });

  it('should fail if given bad id', async () => {
    try {
      await getBuckets(mockAccount.id, ['badBucketId']);
      expect('should not').toEqual('get here');
    } catch (err) {
      expect(err.message).toEqual('Unrecognized bucket: badBucketId');
    }
  });

  it('should fail if account has bad bucket', async () => {
    try {
      mockGetAccount.mockReturnValueOnce({
        id: mockAccount.id,
        storage: {
          // eslint-disable-next-line
          // @ts-ignore
          externalProviders: [{ id: 'badBucket' }],
        },
      });
      await getBuckets(mockAccount.id, ['badBucket']);
      expect('should not').toEqual('get here');
    } catch (err) {
      expect(err.message).toEqual(
        'Missing a bucket required parameter: id, type, secret, key, bucketName, provider',
      );
    }
  });

  it('should not call account if environment variable was found', async () => {
    process.env[`externalProviders_${mockAccount.id}`] = JSON.stringify(
      mockAccount.storage.externalProviders,
    );
    process.env[`accountBucketDefaults_${mockAccount.id}`] = JSON.stringify([]);
    const results = await getBuckets(mockAccount.id, [mockAccountBBBucket.id]);
    expect(mockGetAccount).toHaveBeenCalledTimes(0);
    expect(results).toEqual([mockAccountBBBucket]);
  });

  it('should work with "default" setting and no account settings', async () => {
    const results = await getBuckets(mockAccount.id, ['default']);

    expect(results).toEqual([
      mockSJEnvBucket,
      mockBBEnvBucket,
      mockBBEUEnvBucket,
      // mockLCEnvBucket,
    ]);
  });

  it('should work with "default" setting and custom account buckets', async () => {
    mockGetAccount.mockReturnValueOnce({
      id: 'testAccount',
      storage: {
        buckets: [
          {
            type: 'default',
            id: 'lc_assets',
          },
          {
            type: 'default',
            id: 'sj_assets',
          },
          {
            type: 'external',
            id: mockAccountBBBucket.id,
          },
          {
            type: 'external',
            id: mockAccountS3Bucket.id,
          },
        ],
        externalProviders: [mockAccountBBBucket, mockAccountS3Bucket],
      },
    });

    const results = await getBuckets(mockAccount.id, ['default']);

    expect(results).toEqual([
      mockLCEnvBucket,
      mockSJEnvBucket,
      mockAccountBBBucket,
      mockAccountS3Bucket,
    ]);
  });

  it('should work with "all" setting and no account settings', async () => {
    process.env[`accountBucketDefaults_${mockAccount.id}`] = '';
    process.env[`externalProviders_${mockAccount.id}`] = '';
    mockGetAccount.mockReturnValueOnce({});

    const results = await getBuckets(mockAccount.id, ['all']);

    expect(results).toEqual([
      mockSJEnvBucket,
      mockBBEnvBucket,
      mockBBEUEnvBucket,
      mockLCEnvBucket,
    ]);
  });

  it('should work with "all" setting and custom account buckets', async () => {
    mockGetAccount.mockReturnValueOnce({
      id: 'testAccount',
      storage: {
        buckets: [
          {
            type: 'default',
            id: 'lc_assets',
          },
          {
            type: 'default',
            id: 'sj_assets',
          },
        ],
        externalProviders: [mockAccountBBBucket, mockAccountS3Bucket],
      },
    });

    const results = await getBuckets(mockAccount.id, ['all']);

    expect(results).toEqual([
      mockSJEnvBucket,
      mockBBEnvBucket,
      mockBBEUEnvBucket,
      mockLCEnvBucket,
      mockAccountBBBucket,
      mockAccountS3Bucket,
    ]);
  });
});
