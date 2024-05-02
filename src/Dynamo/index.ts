// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/dynamodb/
import {
  BatchWriteItemCommand,
  BatchWriteItemInput,
  DynamoDBClient,
  QueryCommand,
  ComparisonOperator,
  QueryCommandInput,
  PutItemCommand,
  UpdateItemCommand,
  UpdateItemCommandInput,
  DeleteItemCommand,
  AttributeValue,
  BatchGetItemCommand,
  BatchGetItemInput,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';

import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

import Joi from 'joi';

import { KeyValueAny } from '../common/tsModels';

import {
  DynamoDbTable,
  DynamoResponse,
  Index,
  Options,
  Pk,
  Sk,
  Schema,
  Operations,
  Filter,
  FilterOperations,
  DBSetupOptions,
} from './index.types';

import sleep from '../helpers/sleep';

const convertOperation = (
  operation: Operations | FilterOperations,
): ComparisonOperator => {
  if (operation === '<') {
    return 'LT';
  }

  if (operation === '<=') {
    return 'LE';
  }

  if (operation === '>') {
    return 'GT';
  }

  if (operation === '>=') {
    return 'GE';
  }

  if (
    operation === '=' ||
    operation === '==' ||
    operation === '===' ||
    operation === 'equals'
  ) {
    return 'EQ';
  }

  if (operation === 'between') {
    return 'BETWEEN';
  }

  if (operation === 'begins' || operation === 'beginsWith') {
    return 'BEGINS_WITH';
  }

  if (operation === 'contains') {
    return 'CONTAINS';
  }

  if (operation === 'notContains') {
    return 'NOT_CONTAINS';
  }

  if (operation === 'exist' || operation === 'exists') {
    return 'NOT_NULL';
  }

  if (operation === 'null' || operation === null) {
    return 'NULL';
  }

  throw Error('Invalid operation');
};

const convertOperationToExpression = (
  key: string,
  operation: Operations | FilterOperations,
  value: string,
  value2?: string,
): string => {
  let operator = '';

  if (operation === '<') {
    operator = '<';
  }

  if (operation === '<=') {
    operator = '<=';
  }

  if (operation === '>') {
    operator = '>';
  }

  if (operation === '>=') {
    operator = '>=';
  }

  if (
    operation === '=' ||
    operation === '==' ||
    operation === '===' ||
    operation === 'equals'
  ) {
    operator = '=';
  }

  if (operation === '!=' || operation === 'notEqual') {
    operator = '<>';
  }

  if (operator) {
    return `${key} ${operator} ${value}`;
  }

  if (operation === 'between') {
    return `${key} BETWEEN ${value} AND ${value2}`;
  }

  if (operation === 'begins' || operation === 'beginsWith') {
    return `begins_with(${key}, ${value})`;
  }

  if (operation === 'contains') {
    return `contains(${key}, ${value})`;
  }

  if (operation === 'notContains') {
    return `not contains(${key}, ${value})`;
  }

  if (operation === 'exist' || operation === 'exists') {
    return `attribute_exists(${key})`;
  }

  if (operation === 'null' || operation === null || operation === 'notExists') {
    return `attribute_not_exists(${key})`;
  }

  throw Error('Invalid operation');
};

class DynamoWrapper {
  pk: Schema['table']['hashKey'];
  sk: Schema['table']['rangeKey'];
  model: DynamoDbTable;
  schema: Record<string, Joi.Schema>;
  indexNames: string[];
  timestamps: boolean;
  private mainIndex: DynamoDBClient;

  private indexesByName: {
    [key: string]: Index;
  };

  constructor(
    dbClient: DynamoDBClient,
    schema: Schema,
    options?: DBSetupOptions,
  ) {
    this.mainIndex = dbClient;
    this.pk = schema.table.hashKey;
    this.sk = schema.table.rangeKey;
    this.model = schema.table;
    this.schema = schema.schema;
    this.timestamps = options?.timestamps || this.model.timestamps;

    this.indexesByName = {};
    this.indexNames = schema.table.indexes.map((index: Index) => index.name);

    for (let i = 0; i < schema.table.indexes.length; i += 1) {
      const index: Index = schema.table.indexes[i];
      this.indexesByName[index.name] = index;
    }
  }

  private buildQuery(
    pk: Pk,
    sk?: Pk | Sk,
    gsiIndex?: (typeof this.indexNames)[number],
  ): QueryCommand['input']['KeyConditions'] {
    let hashKey = this.pk;
    let rangeKey = this.sk;

    if (gsiIndex) {
      const foundIndex = this.indexesByName[gsiIndex];

      if (!foundIndex) {
        throw Error(`Unrecognized GSI index: ${gsiIndex}`);
      }

      hashKey = foundIndex.hashKey;
      rangeKey = foundIndex.rangeKey;
    }

    const pkAttribute = marshall({ pk }, { removeUndefinedValues: true });

    const keys: QueryCommand['input']['KeyConditions'] = {
      [hashKey]: {
        AttributeValueList: [pkAttribute.pk],
        ComparisonOperator: 'EQ',
      },
    };

    if (sk) {
      const value = typeof sk === 'object' ? sk.value : sk;
      const value2 = typeof sk === 'object' ? sk.value2 : undefined;
      const operation = typeof sk === 'object' ? sk.operation : 'equals';

      const attribute: { value: string | number; value2?: string | number } = {
        value,
      };

      if (value2) {
        attribute.value2 = value2;
      }

      const skAttribute = marshall(attribute, { removeUndefinedValues: true });

      const attributeList = [skAttribute.value];

      if (value2) {
        attributeList.push(skAttribute.value2);
      }

      keys[rangeKey] = {
        AttributeValueList: attributeList,
        ComparisonOperator: convertOperation(operation),
      };
    }

    return keys;
  }

  async loadAll(
    pk: Pk,
    sk?: Pk | Sk,
    options?: Options,
    gsiIndex?: (typeof this.indexNames)[number],
  ): Promise<DynamoResponse> {
    let finalCount = 0;
    let finalScannedCount = 0;
    const allItems: DynamoResponse['Items'] = [];
    const modOptions = options ? { ...options } : {};

    modOptions.loadAll = false;
    modOptions.limit = undefined;
    modOptions.exactLimit = undefined;

    let hashKey = this.pk;
    let rangeKey = this.sk;
    const lastEvaluatedKeys = [hashKey, rangeKey];

    if (gsiIndex) {
      const foundIndex = this.indexesByName[gsiIndex];

      if (!foundIndex) {
        throw Error(`Unrecognized GSI index: ${gsiIndex}`);
      }

      hashKey = foundIndex.hashKey;
      rangeKey = foundIndex.rangeKey;

      lastEvaluatedKeys.push(foundIndex.hashKey);

      if (foundIndex.rangeKey) {
        lastEvaluatedKeys.push(foundIndex.rangeKey);
      }
    }

    // If we have an exactLimit, then we have to ensure
    // that all the needed attributes to build a custom
    // LastEvaluatedKey exists
    if (options?.exactLimit && modOptions.attributes) {
      lastEvaluatedKeys.forEach(key => {
        if (modOptions.attributes?.indexOf(`${key}`) === -1) {
          modOptions.attributes.push(`${key}`);
        }
      });
    }

    let lastKey: DynamoResponse['LastEvaluatedKey'] = options?.startKey;

    // Max out at a 1000 iterations. Anything longer will probably take too long
    // to fulfill in a single lambda iteration
    for (let i = 0; i < 1000; i += 1) {
      modOptions.startKey = lastKey;

      const response = await this.query(pk, sk, modOptions, gsiIndex);

      finalCount += response.Count || 0;
      finalScannedCount += response.ScannedCount || 0;

      response.Items.forEach(item => {
        if (!options?.exactLimit || allItems.length < options.exactLimit) {
          allItems.push(item);
        }
      });

      lastKey = response.LastEvaluatedKey;

      // Once we hit our exact limit, we can stop our loop function
      if (options?.exactLimit && allItems.length >= options.exactLimit) {
        i = 1000;

        // We build our LastEvaluatedKey based on the lastItem in the list
        const lastItem = allItems[allItems.length - 1];

        const customLastKey: DynamoResponse['LastEvaluatedKey'] = {};

        lastEvaluatedKeys.forEach(key => {
          customLastKey[key] = lastItem[key];
        });

        lastKey = customLastKey;
      }

      if (!response.LastEvaluatedKey) {
        i = 1000;
      }
    }

    return {
      Count: finalCount,
      ScannedCount: finalScannedCount,
      Items: allItems,
      LastEvaluatedKey: lastKey,
    };
  }

  async query(
    pk: Pk,
    sk?: Pk | Sk,
    options?: Options,
    gsiIndex?: (typeof this.indexNames)[number],
  ): Promise<DynamoResponse> {
    if (options?.loadAll || options?.exactLimit) {
      const allResults = await this.loadAll(pk, sk, options, gsiIndex);

      return allResults;
    }

    const keys = this.buildQuery(pk, sk, gsiIndex);
    const buildOptions = this.processOptions(options);

    const input = new QueryCommand({
      ...buildOptions,
      TableName: this.model.tableName,
      KeyConditions: keys,
      IndexName: gsiIndex || undefined,
    });

    const response = await this.mainIndex.send(input);

    const formattedResponse: DynamoResponse = {
      Count: response.Count,
      Items: response.Items?.map(item => unmarshall(item)) || [],
      LastEvaluatedKey: response.LastEvaluatedKey
        ? unmarshall(response.LastEvaluatedKey)
        : undefined,
      ScannedCount: response.ScannedCount,
    };

    if (
      options?.attributes &&
      options?.filters &&
      options?.filters.length > 0
    ) {
      formattedResponse.Items = formattedResponse.Items.map(item => {
        const fullItem: any = {};

        options?.attributes?.forEach((key: string) => {
          if (item[key] !== undefined) {
            fullItem[key] = item[key];
          }
        });

        return fullItem;
      });
    }

    return formattedResponse;
  }

  async queryGSI(
    gsiName: (typeof this.indexNames)[number],
    pk: Pk,
    sk?: Pk | Sk,
    options?: Options,
  ): Promise<DynamoResponse> {
    if (!this.indexesByName[gsiName]) {
      throw Error(
        `The following index was not found in your dynogels model: ${gsiName}`,
      );
    }

    return this.query(pk, sk, options, gsiName);
  }

  async scan(options?: Options, gsiName?: (typeof this.indexNames)[number]) {
    if (gsiName && !this.indexesByName[gsiName]) {
      throw Error(
        `The following index was not found in your dynogels model: ${gsiName}`,
      );
    }
    const buildOptions = this.processOptions(options);

    const input = new ScanCommand({
      ...buildOptions,
      TableName: this.model.tableName,
      IndexName: gsiName || undefined,
    });

    const response = await this.mainIndex.send(input);

    const formattedResponse: DynamoResponse = {
      Count: response.Count,
      Items: response.Items?.map(item => unmarshall(item)) || [],
      LastEvaluatedKey: response.LastEvaluatedKey
        ? unmarshall(response.LastEvaluatedKey)
        : undefined,
      ScannedCount: response.ScannedCount,
    };

    if (
      options?.attributes &&
      options?.filters &&
      options?.filters.length > 0
    ) {
      formattedResponse.Items = formattedResponse.Items.map(item => {
        const fullItem: any = {};

        options?.attributes?.forEach((key: string) => {
          if (item[key] !== undefined) {
            fullItem[key] = item[key];
          }
        });

        return fullItem;
      });
    }

    return formattedResponse;
  }

  private processOptions(options?: Options): Partial<QueryCommandInput> {
    const validOptions: Partial<QueryCommandInput> = {};

    if (options && options.limit) {
      validOptions.Limit = options.limit;
    }

    if (options && options.filters && options.filters.length > 0) {
      validOptions.ExpressionAttributeNames = {};
      validOptions.ExpressionAttributeValues = {};
      const filterExpressions: string[] = [];

      options.filters.forEach((filter, index) => {
        const attribute: { value: Filter['value']; value2?: Filter['value2'] } =
          { value: filter.value };

        if (filter.value2) {
          attribute.value2 = filter.value2;
        }

        const cleanItem = marshall(attribute, { removeUndefinedValues: true });

        const attributeList = [cleanItem.value];

        if (filter.value2) {
          attributeList.push(cleanItem.value2);
        }

        if (
          validOptions.ExpressionAttributeNames &&
          validOptions.ExpressionAttributeValues
        ) {
          let key = `#${index}`;
          const valueKey = `:${index}`;
          const valueKey2 = `:${index}2`;

          const noValueOperations = [
            'exist',
            'exists',
            'null',
            'notExists',
            null,
          ];

          // If we have a . in the key name, then that means
          // we are attempting to filter on a nested object
          // so we have to do some special logic to break out
          // that key in the correct way for Dynamo
          if (filter.key.indexOf('.') > -1) {
            // Split the keys by the . so we can process them
            const splitKeys = filter.key.split('.');

            const splitKeysFormatted: string[] = [];

            // We have to add a unique key for each splitKey
            splitKeys.forEach((splitKey, index2) => {
              const fullSplitKey = `${key}split${index2}`;

              if (validOptions.ExpressionAttributeNames) {
                validOptions.ExpressionAttributeNames[fullSplitKey] = splitKey;
              }

              splitKeysFormatted.push(fullSplitKey);
            });

            // Join the keys back together so its nested again
            key = splitKeysFormatted.join('.');
          } else {
            validOptions.ExpressionAttributeNames[key] = filter.key;
          }

          if (noValueOperations.indexOf(filter.operation) === -1) {
            validOptions.ExpressionAttributeValues[valueKey] = cleanItem.value;

            if (filter.value2 !== undefined && filter.operation === 'between') {
              validOptions.ExpressionAttributeValues[valueKey2] =
                cleanItem.value2;
            }
          }

          filterExpressions.push(
            convertOperationToExpression(
              key,
              filter.operation,
              valueKey,
              valueKey2,
            ),
          );
        }
      });

      // If we have a single filter operation like 'exists', then no values
      // will be present. We delete the ExpressionAttributeValues object if that
      // is the case, or else Dynamo throws an error
      if (Object.keys(validOptions.ExpressionAttributeValues).length === 0) {
        delete validOptions.ExpressionAttributeValues;
      }

      const operation = options.filtersOperation || 'AND';

      validOptions.FilterExpression = filterExpressions.join(` ${operation} `);
    }

    if (options?.attributes) {
      if (options && options.filters && options.filters.length > 0) {
        // Do nothing
      } else {
        validOptions.AttributesToGet = options.attributes;
      }
    }

    if (options && options.startKey) {
      if (typeof options.startKey === 'string') {
        validOptions.ExclusiveStartKey = marshall(
          {
            [this.model.hashKey]: options.startKey,
          },
          { removeUndefinedValues: true },
        );
      } else {
        validOptions.ExclusiveStartKey = marshall(options.startKey, {
          removeUndefinedValues: true,
        });
      }
    }

    if (options && options.sort && options.sort === 'ascending') {
      validOptions.ScanIndexForward = true;
    } else if (options && options.sort && options.sort === 'descending') {
      validOptions.ScanIndexForward = false;
    }

    return validOptions;
  }

  private getKeys(pk: Pk, sk?: Pk): Record<string, AttributeValue> {
    const hashKey = this.pk;
    const rangeKey = this.sk;

    if (pk === undefined || pk === null) {
      throw Error('DynamoDB update error: Missing hashKey');
    }

    const tableKeys: KeyValueAny = {
      hashKey: pk,
    };

    if (rangeKey) {
      if (sk === undefined || sk === null) {
        throw Error('DynamoDB update error: Missing rangeKey');
      }

      tableKeys.rangeKey = sk;
    }

    const keyAttributes = marshall(tableKeys, { removeUndefinedValues: true });

    const keys: UpdateItemCommand['input']['Key'] = {
      [hashKey]: keyAttributes.hashKey,
    };

    if (rangeKey) {
      keys[rangeKey] = keyAttributes.rangeKey;
    }

    return keys;
  }

  private formatData(data: any, method: 'create' | 'update'): any {
    const formattedData = { ...data, incrementValues: [] };

    // marshall doesn't like undefined or empty strings
    // so we manually take them out. Joi also doesn't like
    // empty strings unless if you specify
    Object.keys(data).forEach(key => {
      const value = data[key];

      if (value === undefined) {
        delete formattedData[key];
      }

      if (value === '' || value === null) {
        if (method === 'create') {
          delete formattedData[key];
        }
      }

      // Since increment functions are ran on a number field
      // we cant let an object pass for those fields, so we pull
      // them out into a separate field for processing later
      if (value && value['$add']) {
        formattedData.incrementValues.push(key);

        formattedData[key] = value['$add'];
      }
    });

    if (this.timestamps) {
      if (method === 'create') {
        formattedData.createdAt = new Date().toISOString();
      } else if (method === 'update') {
        formattedData.updatedAt = new Date().toISOString();
      }
    }

    if (method === 'create') {
      delete formattedData.incrementValues;
    }

    return formattedData;
  }

  private checkSchema(data: any, method: 'create' | 'update'): null {
    let schema: Partial<typeof this.schema> = {};
    const joiData = { ...data };

    if (method === 'create') {
      // For creates, we use the whole schema
      schema = this.schema;
    } else if (method === 'update') {
      // For updates, we use only a partial schema since
      // an update can update only a single key, but the schema
      // says more then one key is required. We don't want to require
      // our consumers to always have to include every required key
      // for every update

      // Marshall doesn't like undefined or empty strings
      // so we manually take them out. Joi also doesn't like
      // empty strings unless if you specify
      Object.keys(data).forEach(key => {
        const value = data[key];

        // Get rid of undefined values since both Dynamo and Joi do not want those
        if (value === undefined) {
          delete joiData[key];
        }

        // If empty string, the only way to delete
        // a string from Dynamo is by passing a null
        if (value === '') {
          delete joiData[key];
        }

        // If null, that means we are attempting to delete
        // a string from Dynamo, we do not need to check the type
        // in Joi for this
        if (value === null) {
          delete joiData[key];
        }

        if (key === 'incrementValues') {
          delete joiData[key];
        }

        if (this.schema[key]) {
          schema[key] = this.schema[key];
        }
      });
    }

    if (this.timestamps) {
      if (method === 'create') {
        schema.createdAt = Joi.string();
      } else if (method === 'update') {
        schema.createdAt = Joi.string();
        schema.updatedAt = Joi.string();
      }
    }

    Joi.attempt(joiData, Joi.object(schema));

    return null;
  }

  async create(data: KeyValueAny, overwrite?: boolean): Promise<KeyValueAny> {
    try {
      const formattedData = this.formatData(data, 'create');

      this.checkSchema(formattedData, 'create');

      const Expected: PutItemCommand['input']['Expected'] = {};

      if (!overwrite) {
        Expected[this.pk] = { Exists: false };

        if (this.sk) {
          Expected[this.sk] = { Exists: false };
        }
      }

      const dynamoFormatData = marshall(formattedData, {
        removeUndefinedValues: true,
      });

      const command = new PutItemCommand({
        TableName: this.model.tableName,
        Item: dynamoFormatData,
        ReturnValues: 'ALL_OLD',
        Expected,
      });

      // PutItem does not return the values for created rows
      await this.mainIndex.send(command);

      return formattedData;
    } catch (err) {
      if (err.message === 'The conditional request failed') {
        throw Error('This item already exists');
      } else {
        throw err;
      }
    }
  }

  async update(data: KeyValueAny, shouldExist?: boolean): Promise<KeyValueAny> {
    try {
      const formattedData = this.formatData(data, 'update');

      this.checkSchema(formattedData, 'update');

      const keys = this.getKeys(data[this.pk], data[this.sk]);

      const dynamoFormatData = marshall(formattedData, {
        removeUndefinedValues: true,
      });

      // Using AttributeValues is depreciated so we may
      // need to switch to using the below code at some point
      const ExpressionAttributeNames: UpdateItemCommand['input']['ExpressionAttributeNames'] =
        {};
      const ExpressionAttributeValues: UpdateItemCommand['input']['ExpressionAttributeValues'] =
        {};
      const allExpressions: string[] = [];
      const addExpressions: string[] = [];
      const removeExpressions: string[] = [];

      Object.keys(formattedData).forEach(key => {
        if (key !== this.pk && key !== this.sk && key !== 'incrementValues') {
          const value = dynamoFormatData[key];

          ExpressionAttributeNames[`#${key}`] = key;
          ExpressionAttributeValues[`:${key}`] = value;

          // If null or empty string, we want to remove from Dynamo
          if (formattedData[key] === null || formattedData[key] === '') {
            removeExpressions.push(`#${key}`);
            delete ExpressionAttributeValues[`:${key}`];
          } else if (formattedData.incrementValues.indexOf(key) === -1) {
            allExpressions.push(`#${key} = :${key}`);
          } else {
            addExpressions.push(`#${key} :${key}`);
          }
        }
      });

      let UpdateExpression = '';

      if (allExpressions.length > 0) {
        UpdateExpression = `SET ${allExpressions.join(', ')}`;
      }

      if (addExpressions.length > 0) {
        UpdateExpression += `${
          UpdateExpression ? ' ' : ''
        } ADD ${addExpressions.join(', ')}`;
      }

      if (removeExpressions.length > 0) {
        UpdateExpression += `${
          UpdateExpression ? ' ' : ''
        } REMOVE ${removeExpressions.join(', ')}`;
      }

      let ConditionExpression: UpdateItemCommand['input']['ConditionExpression'];

      if (shouldExist) {
        ConditionExpression = `attribute_exists(${this.pk})`;

        if (this.sk) {
          ConditionExpression += ` AND attribute_exists(${this.sk})`;
        }
      }

      const updateConfig: UpdateItemCommandInput = {
        TableName: this.model.tableName,
        Key: keys,
        ReturnValues: 'ALL_NEW',
        ConditionExpression,
        ExpressionAttributeValues,
        ExpressionAttributeNames,
        UpdateExpression,
      };

      // In the case where we are only removing values from Dynamo
      // then we cannot have ExpressionAttributeValues exist when
      // running the command or else Dynamo throws an error
      if (Object.keys(ExpressionAttributeValues).length === 0) {
        updateConfig.ExpressionAttributeValues = undefined;
      }

      const command = new UpdateItemCommand(updateConfig);

      const response = await this.mainIndex.send(command);

      const formattedResponse = response.Attributes
        ? unmarshall(response.Attributes)
        : {};

      return formattedResponse;
    } catch (err) {
      if (err.message === 'The conditional request failed') {
        throw Error('This item already exists');
      } else {
        throw err;
      }
    }
  }

  // Warning, batchCreate will overwrite any existing rows with the same
  // pk / sk, so use with caution
  async batchCreate(data: KeyValueAny[]): Promise<'success'> {
    try {
      if (data.length > 25) {
        throw Error('Cannot batchCreate more then 25 items at a time');
      }

      const formattedItems = data.map(item => {
        const formattedData = this.formatData(item, 'create');

        this.checkSchema(formattedData, 'create');

        return formattedData;
      });

      const batchCommandInput: BatchWriteItemInput = {
        RequestItems: {
          [this.model.tableName]: formattedItems.map(item => ({
            PutRequest: {
              Item: marshall(item, { removeUndefinedValues: true }),
            },
          })),
        },
      };

      let attempts = 0;
      const maxAttempts = 10;
      const timeBetweenEvents = 1000;

      // We use an exponential backing off method where every time
      // items fail to write, we wait longer and longer between attempts until
      // we have reached our maxAttempts. Each attempt adds a second of wait time
      // before attempting again. An example is a maxAttempt of 5 and timeBetweenEvents of 1 second
      // will result in 15 seconds of total wait time: 1 + 2 + 3 + 4 + 5 = 15
      const attemptUntilSuccessful = async (
        itemsToWrite: BatchWriteItemInput,
      ) => {
        attempts += 1;

        const command = new BatchWriteItemCommand(itemsToWrite);

        // PutItem does not return the values for created rows
        const results = await this.mainIndex.send(command);

        if (
          results.UnprocessedItems &&
          results.UnprocessedItems[this.model.tableName] &&
          results.UnprocessedItems[this.model.tableName].length > 0 &&
          attempts < maxAttempts
        ) {
          await sleep(timeBetweenEvents * attempts);

          await attemptUntilSuccessful({
            RequestItems: {
              [this.model.tableName]:
                results.UnprocessedItems[this.model.tableName],
            },
          });
        }

        return results;
      };

      const results = await attemptUntilSuccessful(batchCommandInput);

      // If some items failed to update, throw an error
      if (
        results.UnprocessedItems &&
        results.UnprocessedItems[this.model.tableName] &&
        results.UnprocessedItems[this.model.tableName].length > 0
      ) {
        console.log(
          'Number of failed Items: ',
          results.UnprocessedItems[this.model.tableName].length,
        );

        throw Error('Failed to batchUpdate storage rows');
      }

      return 'success';
    } catch (err) {
      if (err.message === 'The conditional request failed') {
        throw Error('This item already exists');
      } else {
        throw err;
      }
    }
  }

  async batchGet(
    items: KeyValueAny[],
    attributes?: Options['attributes'],
  ): Promise<DynamoResponse['Items']> {
    if (items.length > 100) {
      throw Error('Cannot batchGet more then 100 items at a time');
    }

    const batchCommandInput: BatchGetItemInput = {
      RequestItems: {
        [this.model.tableName]: {
          AttributesToGet: attributes || undefined,
          Keys: items.map(item =>
            marshall(item, { removeUndefinedValues: true }),
          ),
        },
      },
    };

    let attempts = 0;
    const maxAttempts = 10;
    const timeBetweenEvents = 1000;

    // We use an exponential backing off method where every time
    // items fail to write, we wait longer and longer between attempts until
    // we have reached our maxAttempts. Each attempt adds a second of wait time
    // before attempting again. An example is a maxAttempt of 5 and timeBetweenEvents of 1 second
    // will result in 15 seconds of total wait time: 1 + 2 + 3 + 4 + 5 = 15
    const attemptUntilSuccessful = async (itemsToGet: BatchGetItemInput) => {
      attempts += 1;

      const command = new BatchGetItemCommand(itemsToGet);

      // PutItem does not return the values for created rows
      const results = await this.mainIndex.send(command);

      const UnprocessedKeys =
        results.UnprocessedKeys?.[this.model.tableName]?.Keys || [];

      if (UnprocessedKeys.length > 0 && attempts < maxAttempts) {
        await sleep(timeBetweenEvents * attempts);

        await attemptUntilSuccessful({
          RequestItems: {
            [this.model.tableName]: {
              AttributesToGet: attributes || undefined,
              Keys: UnprocessedKeys,
            },
          },
        });
      }

      return results.Responses?.[this.model.tableName];
    };

    const results = await attemptUntilSuccessful(batchCommandInput);

    const Items: DynamoResponse['Items'] =
      results?.map(item => unmarshall(item)) || [];

    return Items;
  }

  async remove(pk: Pk, sk?: Pk): Promise<KeyValueAny> {
    const keys: DeleteItemCommand['input']['Key'] = this.getKeys(pk, sk);

    const Expected: UpdateItemCommand['input']['Expected'] = {
      [this.pk]: {
        Exists: true,
        Value: keys[this.pk],
      },
    };

    if (this.sk) {
      Expected[this.sk] = {
        Exists: true,
        Value: keys[this.sk],
      };
    }

    const command = new DeleteItemCommand({
      TableName: this.model.tableName,
      Key: keys,
      Expected,
      ReturnValues: 'ALL_OLD',
    });

    const response = await this.mainIndex.send(command);

    const formattedResponse = response.Attributes
      ? unmarshall(response.Attributes)
      : {};

    return formattedResponse;
  }
}

export default DynamoWrapper;
