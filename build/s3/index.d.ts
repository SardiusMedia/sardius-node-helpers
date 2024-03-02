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
    options?: DeleteObjectCommandInput,
  ): Promise<DeleteObjectCommandOutput>;
  deleteObjects(
    items: ObjectIdentifier[],
    options?: DeleteObjectsCommandInput,
  ): Promise<DeleteObjectsCommandOutput>;
  putObject(
    key: string,
    data: PutObjectCommandInput['Body'],
    options?: PutObjectCommandInput,
  ): Promise<PutObjectCommandOutput>;
  listObjects(
    prefix: string,
    options?: ListObjectsV2CommandInput,
  ): Promise<ListObjectsV2CommandOutput>;
  listBuckets(
    options?: ListBucketsCommandInput,
  ): Promise<ListBucketsCommandOutput>;
  headObject(
    key: string,
    options?: HeadObjectCommandInput,
  ): Promise<HeadObjectCommandOutput>;
  getObject(
    key: string,
    options?: GetObjectCommandInput,
  ): Promise<GetObjectCommandOutput>;
  getObjectAsString(
    key: string,
    options?: GetObjectCommandInput,
  ): Promise<string>;
}
export {};
