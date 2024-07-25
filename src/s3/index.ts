import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  DeleteObjectCommandOutput,
  DeleteObjectsCommand,
  DeleteObjectsCommandInput,
  DeleteObjectsCommandOutput,
  GetObjectCommand,
  GetObjectCommandInput,
  GetObjectCommandOutput,
  HeadObjectCommand,
  HeadObjectCommandInput,
  HeadObjectCommandOutput,
  ListBucketsCommand,
  ListBucketsCommandInput,
  ListBucketsCommandOutput,
  ListObjectsV2CommandInput,
  ListObjectsV2CommandOutput,
  ListObjectsV2Command,
  ObjectIdentifier,
  PutObjectCommand,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import isObject from '../helpers/isObject';

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
  }: Params) {
    if (!accessKeyId && !bucket) {
      throw Error('accessKeyId is required to use the s3 class');
    }

    if (!secretAccessKey && !bucket) {
      throw Error('secretAccessKey is required to use the s3 class');
    }

    if (bucket) {
      this.bucket = bucket;
    }

    const config: S3ClientConfig = {};

    if (region) {
      config.region = region;
    }

    if (endpoint) {
      config.endpoint = `https://${endpoint}`;
    }

    if (accessKeyId && secretAccessKey) {
      config.credentials = {
        accessKeyId,
        secretAccessKey,
      };
    }

    const s3 = new S3Client(config);

    this.s3 = s3;
  }

  async deleteObject(
    key: string,
    options?: Partial<DeleteObjectCommandInput>,
  ): Promise<DeleteObjectCommandOutput> {
    const fullOptions = options || {};

    const command = new DeleteObjectCommand({
      ...fullOptions,
      Bucket: options?.Bucket || this.bucket,
      Key: key,
    });

    const response = await this.s3.send(command);

    return response;
  }

  async deleteObjects(
    items: ObjectIdentifier[],
    options?: Partial<DeleteObjectsCommandInput>,
  ): Promise<DeleteObjectsCommandOutput> {
    const fullOptions = options || {};

    const command = new DeleteObjectsCommand({
      ...fullOptions,
      Bucket: options?.Bucket || this.bucket,
      Delete: {
        Objects: items,
      },
    });

    const response = await this.s3.send(command);

    return response;
  }

  async putObject(
    key: string,
    data: any,
    options?: Partial<PutObjectCommandInput>,
  ): Promise<PutObjectCommandOutput> {
    let formattedData = data;

    if (isObject(data)) {
      formattedData = JSON.stringify(data);
    }

    const fullOptions = options || {};

    const command = new PutObjectCommand({
      ...fullOptions,
      Bucket: options?.Bucket || this.bucket,
      Key: key,
      Body: formattedData,
    });

    const response = await this.s3.send(command);

    return response;
  }

  async listObjects(
    prefix: string,
    options?: Partial<ListObjectsV2CommandInput>,
  ): Promise<ListObjectsV2CommandOutput> {
    const fullOptions = options || {};

    const command = new ListObjectsV2Command({
      ...fullOptions,
      Prefix: prefix,
      Bucket: options?.Bucket || this.bucket,
    });

    const response = await this.s3.send(command);

    return response;
  }

  async listBuckets(
    options?: Partial<ListBucketsCommandInput>,
  ): Promise<ListBucketsCommandOutput> {
    const fullOptions = options || {};

    const command = new ListBucketsCommand(fullOptions);

    const response = await this.s3.send(command);

    return response;
  }

  async headObject(
    key: string,
    options?: Partial<HeadObjectCommandInput>,
  ): Promise<HeadObjectCommandOutput> {
    const fullOptions = options || {};

    const command = new HeadObjectCommand({
      ...fullOptions,
      Key: key,
      Bucket: options?.Bucket || this.bucket,
    });

    const response = await this.s3.send(command);

    return response;
  }

  async getObject(
    key: string,
    options?: Partial<GetObjectCommandInput>,
  ): Promise<GetObjectCommandOutput> {
    const fullOptions = options || {};

    const command = new GetObjectCommand({
      ...fullOptions,
      Key: key,
      Bucket: options?.Bucket || this.bucket,
    });

    const response = await this.s3.send(command);

    return response;
  }

  async getObjectAsString(
    key: string,
    options?: Partial<GetObjectCommandInput>,
  ): Promise<string> {
    const response = await this.getObject(key, options);

    if (response.Body?.transformToString) {
      const responseAsString = await response.Body?.transformToString();

      return responseAsString;
    }

    return '';
  }

  async getSignedUrl(
    key: string,
    Expires: number,
    options?: Partial<GetObjectCommandInput>,
  ): Promise<string> {
    const fullOptions = options || {};

    const command = new GetObjectCommand({
      ...fullOptions,
      Key: key,
      Bucket: options?.Bucket || this.bucket,
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const url = await getSignedUrl(this.s3, command, {
      expiresIn: Expires,
    });

    return url;
  }
}
