export default interface Bucket {
  bucketName: string;
  endpointUrl?: string;
  fileId?: string; // Used for multipart uploads
  internalBucket?: boolean;
  id: string;
  key: string;
  region?: string;
  secret: string;
  type: 'backblaze' | 's3';
  provider: 'backblaze' | 'lyvecloud' | 'storj';
}
