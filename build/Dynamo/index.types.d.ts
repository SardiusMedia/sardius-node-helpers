import Joi from 'joi';
import { KeyValueAny } from '../common/tsModels';
export interface DynamoDbTable {
  hashKey: string;
  rangeKey: string;
  timestamps: boolean;
  tableName: string;
  indexes: Array<{
    hashKey: string;
    rangeKey: string;
    type: string;
    name: string;
  }>;
}
export type Pk = string;
export type Operations =
  | '='
  | '=='
  | '==='
  | 'equals'
  | '<='
  | '<'
  | '>'
  | '>='
  | 'begins'
  | 'beginsWith'
  | 'between';
export type FilterOperations =
  | Operations
  | 'notEqual'
  | '!='
  | 'contains'
  | 'exist'
  | 'exists'
  | 'notExists'
  | 'null'
  | null;
export interface Sk {
  operation: Operations;
  value: Pk;
  value2?: Pk;
}
export interface Index {
  name: string;
  hashKey: Pk;
  rangeKey: Pk;
}
export interface Model {
  hashKey: Pk;
  rangeKey: Pk;
  tableName: string;
  timestamps: boolean;
  indexes: Index[];
}
export interface Table extends Model {
  query: (any: any) => Table;
  create: (data: any, args: any, callback: () => void) => Table;
  update: (data: any, callback: () => void) => Table;
  destroy: (data: any, args: any, callback: () => void) => Table;
  usingIndex: (any: any) => Table;
  startKey: (any: any) => Table;
  where: (any: any) => Table;
  equals: (any: any) => Table;
  attributes: (any: any) => Table;
}
export interface DynamoItem {
  attrs: KeyValueAny;
}
export interface DynamoResponse {
  Count?: number;
  Items: KeyValueAny[];
  LastEvaluatedKey?:
    | Pk
    | {
        [key: string]: Pk;
      };
  ScannedCount?: number;
}
export interface Schema {
  table: DynamoDbTable;
  schema: Record<string, Joi.Schema>;
}
export interface Filter {
  key: string;
  operation: FilterOperations;
  value: string | number | boolean;
  value2?: string | number | boolean;
}
export interface Options {
  sort?: 'ascending' | 'descending';
  attributes?: string[];
  filters?: Filter[];
  limit?: number;
  loadAll?: boolean;
  startKey?:
    | Pk
    | {
        [key: string]: Pk;
      };
  exactLimit?: number;
}
export interface DBSetupOptions {
  timestamps?: boolean;
}
