export default interface Bucket {
  bucketName: string;
  endpointUrl?: string;
  fileId?: string; // Used for multipart uploads
  internalBucket?: boolean;
  id: string;
  key: string;
  region?: string;
  secret: string;
  /** Client protocol: native B2 (`backblaze`) or S3-compatible (`s3`). Managed BB/R2 use `s3`. */
  type: 'backblaze' | 's3';
  /** Logical provider for analytics/totals (not the S3 client type). */
  provider: 'backblaze' | 'storj' | 'r2';
  readOnly?: boolean;
  disabled?: boolean;
  hasLifecycle?: boolean;
  enforceLifecycle?: boolean;
  managedBySardius?: boolean;
  excludeFromEntrypoint?: boolean;
  /** B2-style visibility; `allPrivate` → Bitmovin PRIVATE object ACL. */
  bucketType?: 'allPrivate' | 'allPublic';
}
