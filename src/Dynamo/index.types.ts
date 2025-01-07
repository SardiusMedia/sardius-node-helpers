import Joi from 'joi';

import { KeyValueAny } from '../common/tsModels';

export interface DynamoDbTable {
  hashKey: string | number;
  rangeKey: string | number;
  timestamps: boolean;
  tableName: string;
  indexes: Array<{
    hashKey: string;
    rangeKey: string;
    type: string;
    name: string;
  }>;
}

export type Pk = string | number;

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
  | 'notContains'
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

// TODO: Add types if possible without making less of a boilerplate
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

// TODO: Add type if possible without making less of a boilerplate
export interface DynamoItem {
  attrs: KeyValueAny;
}

export interface DynamoResponse {
  Count?: number;
  Items: KeyValueAny[];
  LastEvaluatedKey?: Pk | { [key: string]: Pk };
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
  filtersOperation?: 'AND' | 'OR';
  limit?: number;
  loadAll?: boolean;
  startKey?: Pk | { [key: string]: Pk };
  exactLimit?: number;
}

export interface DBSetupOptions {
  timestamps?: boolean;
}

interface Conditional {
  key: string;
  operation:
    | 'attribute_exists'
    | 'attribute_not_exists'
    | 'attribute_type'
    | 'begins_with'
    | 'contains'
    | 'size'
    | 'between'
    | '='
    | '<='
    | '<'
    | '>='
    | '>';
  value?: Pk | 'string' | 'number' | 'boolean' | 'array' | 'object';
  value2?: Pk; // For between
}

export interface UpdateOptions {
  shouldExist?: boolean;
  conditionals?: Conditional[];
}
