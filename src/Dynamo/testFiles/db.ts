// Import packages and files
import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

import Joi from 'joi';

import { DynamoDbTable, Schema } from '../index.types';

const dbClientConfig: DynamoDBClientConfig = {
  region: 'us-east-1',
};

if (process.env.MOCK_DYNAMODB_ENDPOINT) {
  dbClientConfig.endpoint = process.env.MOCK_DYNAMODB_ENDPOINT;
  dbClientConfig.region = 'local';
}

const dbClient = new DynamoDBClient(dbClientConfig);

const table: DynamoDbTable = {
  hashKey: 'pk',
  rangeKey: 'sk',
  tableName: process.env.dynamoTable || '',
  timestamps: true,
  indexes: [
    {
      hashKey: 'sk',
      rangeKey: 'pk',
      name: 'sk-pk-index',
      type: 'global',
    },
    {
      hashKey: 'gsi1',
      rangeKey: 'sk',
      name: 'gsi1-sk-index',
      type: 'global',
    },
  ],
};

// Turn off timestamps for jest tests since that is hard to control
if (process.env.MOCK_DYNAMODB_ENDPOINT) {
  table.timestamps = false;
}

const primarySchema = {
  pk: Joi.string().required(),
  sk: Joi.string().required(),
  gsi1: Joi.string().required(),
  key1: Joi.string(),
  key2: Joi.string(),
  key3: Joi.boolean(),
};

const primary: Schema = {
  table,
  schema: primarySchema,
};

export default {
  dbClient,
  primary,
};
