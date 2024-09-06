import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import Joi from 'joi';
import { KeyValueAny } from '../common/tsModels';
import {
  DynamoDbTable,
  DynamoResponse,
  Options,
  Pk,
  Sk,
  Schema,
  DBSetupOptions,
} from './index.types';
declare class DynamoWrapper {
  pk: Schema['table']['hashKey'];
  sk: Schema['table']['rangeKey'];
  model: DynamoDbTable;
  schema: Record<string, Joi.Schema>;
  indexNames: string[];
  timestamps: boolean;
  private mainIndex;
  private indexesByName;
  constructor(
    dbClient: DynamoDBClient,
    schema: Schema,
    options?: DBSetupOptions,
  );
  private buildQuery;
  loadAll(
    pk: Pk,
    sk?: Pk | Sk,
    options?: Options,
    gsiIndex?: (typeof this.indexNames)[number],
  ): Promise<DynamoResponse>;
  query(
    pk: Pk,
    sk?: Pk | Sk,
    options?: Options,
    gsiIndex?: (typeof this.indexNames)[number],
  ): Promise<DynamoResponse>;
  queryGSI(
    gsiName: (typeof this.indexNames)[number],
    pk: Pk,
    sk?: Pk | Sk,
    options?: Options,
  ): Promise<DynamoResponse>;
  scan(
    options?: Options,
    gsiName?: (typeof this.indexNames)[number],
  ): Promise<DynamoResponse>;
  private processOptions;
  private getKeys;
  private formatData;
  private checkSchema;
  create(data: KeyValueAny, overwrite?: boolean): Promise<KeyValueAny>;
  update(data: KeyValueAny, shouldExist?: boolean): Promise<KeyValueAny>;
  batchCreate(data: KeyValueAny[]): Promise<'success'>;
  batchGetAll(
    items: KeyValueAny[],
    attributes?: Options['attributes'],
  ): Promise<DynamoResponse['Items']>;
  splitArrayIntoChunks(arr: KeyValueAny[], chunkSize?: number): any[];
  batchGet(
    items: KeyValueAny[],
    attributes?: Options['attributes'],
  ): Promise<DynamoResponse['Items']>;
  remove(pk: Pk, sk?: Pk): Promise<KeyValueAny>;
}
export default DynamoWrapper;
