import getPrimaryBucket from './getPrimaryBucket';

const mockManagedBB = {
  type: 's3' as const,
  id: 'bb_managed',
  key: 'k',
  secret: 's',
  bucketName: 'acct-bb',
  provider: 'backblaze' as const,
  region: 'us-west',
  endpointUrl: 'https://s3.us-west.backblazeb2.com',
  managedBySardius: true,
};

const mockAccount: any = {
  id: 'primaryTestAccount',
  storage: {
    primaryBucketId: mockManagedBB.id,
    buckets: [{ type: 'external', id: mockManagedBB.id }],
    externalProviders: [mockManagedBB],
  },
};

const mockGetAccount = jest.fn((_id?: string) => mockAccount);
jest.mock('../getAccountPrivate', () => ({
  __esModule: true,
  default: jest.fn((id: string) => mockGetAccount(id)),
}));

jest.mock('../getAWSSecrets', () => ({
  __esModule: true,
  default: jest.fn(),
}));

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

const clearBucketConfigCache = (accountId: string) => {
  process.env[`externalProviders_${accountId}`] = '';
  process.env[`accountBucketDefaults_${accountId}`] = '';
  process.env[`primaryBucketId_${accountId}`] = '';
  process.env[`entrypointPrimaryBucketId_${accountId}`] = '';
  process.env[`entrypointBuckets_${accountId}`] = '';
  process.env[`limitRaceworkerBuckets_${accountId}`] = '';
  process.env[`bucketConfigCached_${accountId}`] = '';
};

afterEach(() => {
  clearBucketConfigCache(mockAccount.id);
  jest.clearAllMocks();
  mockGetAccount.mockImplementation(() => mockAccount);
});

describe('src/helpers/buckets/getPrimaryBucket', () => {
  it('should return storage.primaryBucketId when set', async () => {
    const result = await getPrimaryBucket(mockAccount.id);
    expect(result).toEqual(mockManagedBB);
  });

  it('should fall back to sj_assets when primaryBucketId is unset', async () => {
    mockGetAccount.mockReturnValueOnce({
      id: mockAccount.id,
      storage: {
        externalProviders: [],
        buckets: [],
      },
    });

    const result = await getPrimaryBucket(mockAccount.id);
    expect(result).toEqual(mockSJEnvBucket);
  });
});
