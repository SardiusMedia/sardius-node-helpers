import {
  DeleteObjectCommandInput,
  DeleteObjectCommandOutput,
  DeleteObjectsCommandInput,
  DeleteObjectsCommandOutput,
  GetObjectCommandInput,
  GetObjectCommandOutput,
  HeadObjectCommandInput,
  HeadObjectCommandOutput,
  ListBucketsCommandInput,
  ListBucketsCommandOutput,
  ListObjectsV2CommandInput,
  ListObjectsV2CommandOutput,
  ObjectIdentifier,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
interface Params {
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket?: string;
  endpoint?: string;
  region?: string;
}
export default class {
  bucket?: string;
  s3: S3Client;
  constructor({
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint,
    region,
  }: Params);
  deleteObject(
    key: string,
    options?: Partial<DeleteObjectCommandInput>,
  ): Promise<DeleteObjectCommandOutput>;
  deleteObjects(
    items: ObjectIdentifier[],
    options?: Partial<DeleteObjectsCommandInput>,
  ): Promise<DeleteObjectsCommandOutput>;
  putObject(
    key: string,
    data: any,
    options?: Partial<PutObjectCommandInput>,
  ): Promise<PutObjectCommandOutput>;
  listObjects(
    prefix: string,
    options?: Partial<ListObjectsV2CommandInput>,
  ): Promise<ListObjectsV2CommandOutput>;
  listBuckets(
    options?: Partial<ListBucketsCommandInput>,
  ): Promise<ListBucketsCommandOutput>;
  headObject(
    key: string,
    options?: Partial<HeadObjectCommandInput>,
  ): Promise<HeadObjectCommandOutput>;
  getObject(
    key: string,
    options?: Partial<GetObjectCommandInput>,
  ): Promise<GetObjectCommandOutput>;
  getObjectAsString(
    key: string,
    options?: Partial<GetObjectCommandInput>,
  ): Promise<string>;
  getSignedUrl(
    key: string,
    Expires: number,
    options?: Partial<GetObjectCommandInput>,
  ): Promise<string>;
}
export {};
