import { createTables, deleteTables } from 'jest-dynalite';

import Dynamo from './dynamo';

// Each test in this builds upon the previous one. For example
// the update test will update the items created by the create test.
// So if multiple test fails, fix the earliest one first in order
// to potentially fix downstream tests failing
describe('repositories/Dynamo/index', () => {
  // Since we are using dynamo in these tests
  beforeAll(createTables);
  afterAll(deleteTables);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should exist', () => {
    expect(Dynamo).toBeTruthy();
  });

  it('create works', async () => {
    const db = new Dynamo('primary');

    const data = {
      pk: 'pk_key1',
      sk: 'sk_key1',
      gsi1: 'gsi_key1',
    };

    const result = await db.create(data);

    expect(result).toEqual(data);

    // Overwrite works
    const result2 = await db.create(data, true);

    expect(result2).toEqual(data);

    // Same pk but different sk works
    const result3 = await db.create({ ...data, sk: 'sk_key2' });

    expect(result3).toEqual({ ...data, sk: 'sk_key2' });
  });

  it('create works with timestampsUpdatedAtOnCreate', async () => {
    // test option
    const dbOption = new Dynamo('primary', {
      timestamps: true,
      timestampsUpdatedAtOnCreate: true,
    });

    const dataOption = {
      pk: 'pk_keyTimestampsTest1',
      sk: 'sk_keyTimestampsTest1',
      gsi1: 'gsi_keyTimestampsTest1',
    };

    const resultOption = await dbOption.create(dataOption);

    expect(resultOption.updatedAt).toBeTruthy();
    expect(resultOption.createdAt).toBeTruthy();

    // text model
    const db = new Dynamo('timestampsTest');

    const data = {
      pk: 'pk_keyTimestampsTest2',
      sk: 'sk_keyTimestampsTest2',
      gsi1: 'gsi_keyTimestampsTest2',
    };

    const result = await db.create(data);

    expect(result.updatedAt).toBeTruthy();
    expect(result.createdAt).toBeTruthy();
  });

  it('create fails as expected', async () => {
    const db = new Dynamo('primary');

    // Cannot create an item that already exists with same keys
    try {
      await db.create({
        pk: 'pk_key1',
        sk: 'sk_key1',
        gsi1: 'gsi_key1',
      });
      expect('should not').toEqual('get here');
    } catch (err) {
      expect(err.message).toEqual('This item already exists');
    }

    // Cannot create an item this is missing required field
    try {
      await db.create({
        pk: 'pk_key2',
        sk: 'sk_key2',
      });
      expect('should not').toEqual('get here');
    } catch (err) {
      expect(err.message).toEqual('"gsi1" is required');
    }

    // Cannot create an item that is wrong joi type
    try {
      await db.create({
        pk: 'pk_key2',
        sk: 'sk_key2',
        gsi1: 'gsi_key2',
        key1: 234,
      });
      expect('should not').toEqual('get here');
    } catch (err) {
      expect(err.message).toEqual('"key1" must be a string');
    }

    // Cannot create an item that is not in joi schema
    try {
      await db.create({
        pk: 'pk_key2',
        sk: 'sk_key2',
        gsi1: 'gsi_key2',
        badKey: '1234234',
      });
      expect('should not').toEqual('get here');
    } catch (err) {
      expect(err.message).toEqual('"badKey" is not allowed');
    }
  });

  it('batch create works', async () => {
    const db = new Dynamo('primary');

    const data: any[] = [];

    for (let i = 0; i < 25; i += 1) {
      data.push({
        pk: `pk_batchKey`,
        sk: `sk_batchKey_${i}`,
        gsi1: `gsi1_batchKey_${i}`,
        key1: `key1_batchKey_${i}`,
        key3: i < 10 ? true : false,
      });
    }

    const result = await db.batchCreate(data);

    expect(result).toEqual('success');

    const allBatchResults = await db.query('pk_batchKey');

    expect(allBatchResults).toMatchSnapshot();
  });

  it('batch get works', async () => {
    const db = new Dynamo('primary');

    const data: any[] = [];

    for (let i = 0; i < 25; i += 1) {
      data.push({
        pk: `pk_batchKey`,
        sk: `sk_batchKey_${i}`,
      });
    }

    const results = await db.batchGet(data);

    expect(Array.isArray(results)).toEqual(true);
    results.forEach(result => {
      expect(typeof result.gsi1).toEqual('string');
      expect(typeof result.pk).toEqual('string');
      expect(typeof result.sk).toEqual('string');
    });

    const allBatchResults = await db.query('pk_batchKey');

    expect(allBatchResults).toMatchSnapshot('All batch get results');
  });

  it('batch get works with more than 100', async () => {
    const db = new Dynamo('primary');

    const data: any[] = [];

    for (let i = 0; i < 125; i += 1) {
      data.push({
        pk: `pk_batchKey`,
        sk: `sk_batchKey_${i}`,
      });
    }

    const results = await db.batchGet(data);

    expect(Array.isArray(results)).toEqual(true);
    results.forEach(result => {
      expect(typeof result.gsi1).toEqual('string');
      expect(typeof result.pk).toEqual('string');
      expect(typeof result.sk).toEqual('string');
    });

    const allBatchResults = await db.query('pk_batchKey');

    expect(allBatchResults).toMatchSnapshot('All batch get results');
  });

  it('update works', async () => {
    const db = new Dynamo('primary');

    // Purposely do not include gsi1 to prove we can update without
    // needing a required field from Joi
    const data = {
      pk: 'pk_key1',
      sk: 'sk_key1',
      key1: 'abc',
    };

    const result = await db.update(data);

    // This also proves that on update, you get the whole object back
    expect(result).toEqual({ ...data, gsi1: 'gsi_key1' });

    // Update an item that doesn't exist, it should create it
    const data2 = {
      pk: 'pk_key2',
      sk: 'sk_key2',
      gsi1: 'gsi1_key2',
    };

    const result2 = await db.update(data2);

    expect(result2).toEqual(data2);
  });

  it('update increment and deincrement', async () => {
    const db = new Dynamo('primary');

    // Purposely do not include gsi1 to prove we can update without
    // needing a required field from Joi
    const data = {
      pk: 'pk_incrementKey',
      sk: 'sk_incrementKey',
      gsi1: 'gsi1_incrementKey',
      numberKey: 1,
    };

    await db.create(data);

    const result = await db.update({
      pk: data.pk,
      sk: data.sk,
      numberKey: {
        $add: 5,
      },
    });

    expect(result.numberKey).toEqual(6);

    const result2 = await db.update({
      pk: data.pk,
      sk: data.sk,
      numberKey: {
        $add: -2,
      },
    });

    expect(result2.numberKey).toEqual(4);
  });

  it('update works with empty strings and null', async () => {
    const db = new Dynamo('primary');

    await db.create({
      pk: 'pk_updateTestKey1',
      sk: 'sk_updateTestKey1',
      gsi1: 'gsi1_updateTestKey1',
      key1: 'abc',
      key2: '123',
      key3: null,
    });

    const result = await db.update({
      pk: 'pk_updateTestKey1',
      sk: 'sk_updateTestKey1',
      key1: '',
      key2: null,
    });

    expect(result.key1).toEqual(undefined);
    expect(result.key2).toEqual(undefined);

    const results = await db.query('pk_updateTestKey1', 'sk_updateTestKey1');

    expect(results.Items).toEqual([
      {
        pk: 'pk_updateTestKey1',
        sk: 'sk_updateTestKey1',
        gsi1: 'gsi1_updateTestKey1',
      },
    ]);
  });

  it('update should allow createdAt on the schema', async () => {
    const db = new Dynamo('primary', { timestamps: true });

    // Purposely do not include gsi1 to prove we can update without
    // needing a required field from Joi
    const data = {
      pk: 'pk_testCreateAt',
      sk: 'sk_testCreateAt',
      key1: 'testCreateAt',
      gsi1: 'gsi_testCreateAt',
    };

    const createResult = await db.create(data);

    expect(createResult.pk).toEqual(data.pk);
    expect(createResult.sk).toEqual(data.sk);
    expect(createResult.key1).toEqual('testCreateAt');
    expect(createResult.gsi1).toEqual(data.gsi1);
    expect(typeof createResult.createdAt).toEqual('string');
    expect(createResult.createdAt.length).not.toEqual(0);
    expect(typeof createResult.updatedAt).toEqual('undefined');

    const updateResult = await db.update({ ...data, key1: 'testCreateAt2' });

    // This also proves that on update, you get the whole object back
    expect(updateResult.pk).toEqual(data.pk);
    expect(updateResult.sk).toEqual(data.sk);
    expect(updateResult.key1).toEqual('testCreateAt2');
    expect(updateResult.gsi1).toEqual(data.gsi1);
    expect(typeof updateResult.createdAt).toEqual('string');
    expect(updateResult.createdAt.length).not.toEqual(0);
    expect(typeof updateResult.updatedAt).toEqual('string');
    expect(updateResult.updatedAt.length).not.toEqual(0);
  });

  it('update with preventUpdatedAtChange option should not update updatedAt timestamp', async () => {
    const db = new Dynamo('primary', { timestamps: true });

    const data = {
      pk: 'pk_testPreventUpdatedAt',
      sk: 'sk_testPreventUpdatedAt',
      key1: 'testPreventUpdatedAt',
      gsi1: 'gsi_testPreventUpdatedAt',
    };

    const createResult = await db.create(data);

    expect(createResult.pk).toEqual(data.pk);
    expect(createResult.sk).toEqual(data.sk);
    expect(createResult.key1).toEqual('testPreventUpdatedAt');
    expect(createResult.gsi1).toEqual(data.gsi1);
    expect(typeof createResult.createdAt).toEqual('string');
    expect(createResult.createdAt.length).not.toEqual(0);
    expect(typeof createResult.updatedAt).toEqual('undefined');

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update with preventUpdatedAtChange: true
    const updateResult = await db.update(
      { ...data, key1: 'testPreventUpdatedAt2' },
      { preventUpdatedAtChange: true },
    );

    expect(updateResult.pk).toEqual(data.pk);
    expect(updateResult.sk).toEqual(data.sk);
    expect(updateResult.key1).toEqual('testPreventUpdatedAt2');
    expect(updateResult.gsi1).toEqual(data.gsi1);
    expect(typeof updateResult.createdAt).toEqual('string');
    expect(updateResult.createdAt.length).not.toEqual(0);
    // updatedAt should not be set when preventUpdatedAtChange is true
    expect(typeof updateResult.updatedAt).toEqual('undefined');

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update without preventUpdatedAtChange (default behavior)
    const updateResult2 = await db.update({
      ...data,
      key1: 'testPreventUpdatedAt3',
    });

    expect(updateResult2.pk).toEqual(data.pk);
    expect(updateResult2.sk).toEqual(data.sk);
    expect(updateResult2.key1).toEqual('testPreventUpdatedAt3');
    expect(updateResult2.gsi1).toEqual(data.gsi1);
    expect(typeof updateResult2.createdAt).toEqual('string');
    expect(updateResult2.createdAt.length).not.toEqual(0);
    // updatedAt should be set when preventUpdatedAtChange is false/undefined
    expect(typeof updateResult2.updatedAt).toEqual('string');
    expect(updateResult2.updatedAt.length).not.toEqual(0);
  });

  it('update fails as expected', async () => {
    const db = new Dynamo('primary');

    // Missing sk
    try {
      const data = {
        pk: 'pk_key1',
      };

      await db.update(data);
      expect('should not').toEqual('get here');
    } catch (err) {
      expect(err.message).toEqual('DynamoDB update error: Missing rangeKey');
    }

    // Wrong joi type
    try {
      const data = {
        pk: 'pk_key1',
        sk: 'sk_key1',
        key1: 1234,
      };

      await db.update(data);
      expect('should not').toEqual('get here');
    } catch (err) {
      expect(err.message).toEqual('"key1" must be a string');
    }

    // Should fail if item exists and parameter is provided
    try {
      const data = {
        pk: 'pk_keyDoesntExist',
        sk: 'sk_keyDoesntExist',
        key1: '234234',
      };

      await db.update(data, true);
      expect('should not').toEqual('get here');
    } catch (err) {
      expect(err.message).toEqual('This item already exists');
    }
  });

  it('query works', async () => {
    const db = new Dynamo('primary');

    // No SK
    const result = await db.query('pk_key1');
    expect(result).toMatchSnapshot('No SK');

    // Pk and SK
    const result2 = await db.query('pk_key1', 'sk_key1');
    expect(result2).toMatchSnapshot('Pk and SK');

    // Pk and SK with beginsWith
    const result3 = await db.query('pk_batchKey', {
      operation: 'beginsWith',
      value: 'sk_batchKey_1',
    });
    expect(result3).toMatchSnapshot('Pk and SK with beginsWith');

    // GSI
    const result4 = await db.queryGSI('sk-pk-index', 'sk_key1');
    expect(result4).toMatchSnapshot('GSI');
  });

  it('query options work', async () => {
    const db = new Dynamo('primary');

    // Limit
    const result = await db.query('pk_batchKey', undefined, {
      limit: 5,
    });
    expect(result).toMatchSnapshot('Limit');

    // Attributes
    const result2 = await db.query('pk_batchKey', undefined, {
      attributes: ['pk'],
    });
    expect(result2).toMatchSnapshot('Attributes');

    // Filters less then
    const result3 = await db.query('pk_batchKey', undefined, {
      filters: [
        {
          key: 'key1',
          operation: '<',
          value: 'key1_batchKey_15',
        },
      ],
    });
    expect(result3).toMatchSnapshot('Filters less then ');

    // Filters greater then
    const result4 = await db.query('pk_batchKey', undefined, {
      filters: [
        {
          key: 'key1',
          operation: '>',
          value: 'key1_batchKey_22',
        },
      ],
    });
    expect(result4).toMatchSnapshot('Filters greater then ');

    // Filters equals
    const result5 = await db.query('pk_batchKey', undefined, {
      filters: [
        {
          key: 'key3',
          operation: 'equals',
          value: true,
        },
      ],
    });
    expect(result5).toMatchSnapshot('Filters equals');

    // Multiple Filters
    const result6 = await db.query('pk_batchKey', undefined, {
      filters: [
        {
          key: 'key3',
          operation: 'equals',
          value: true,
        },
        {
          key: 'key1',
          operation: 'beginsWith',
          value: 'key1_batchKey_1',
        },
      ],
    });
    expect(result6).toMatchSnapshot('Multiple Filters');

    // Contains
    const result7 = await db.query('pk_batchKey', undefined, {
      filters: [
        {
          key: 'key1',
          operation: 'contains',
          value: 'batchKey_1',
        },
      ],
    });
    expect(result7).toMatchSnapshot('Contains');

    // Between
    const result8 = await db.query('pk_batchKey', undefined, {
      filters: [
        {
          key: 'key1',
          operation: 'between',
          value: 'key1_batchKey_12',
          value2: 'key1_batchKey_15',
        },
      ],
    });
    expect(result8).toMatchSnapshot('Between');

    // Exists
    const result9 = await db.query('pk_batchKey', undefined, {
      filters: [
        {
          key: 'key3',
          operation: 'exist',
          value: '',
        },
      ],
    });
    expect(result9).toMatchSnapshot('Exists');

    // Not Exists
    const result10 = await db.query('pk_batchKey', undefined, {
      filters: [
        {
          key: 'key2',
          operation: 'notExists',
          value: '',
        },
      ],
    });
    expect(result10).toMatchSnapshot('Not Exists');

    // Not Equal
    const result11 = await db.query('pk_batchKey', undefined, {
      filters: [
        {
          key: 'key3',
          operation: '!=',
          value: false,
        },
      ],
    });
    expect(result11).toMatchSnapshot('Not Equal');

    // Start Key
    const result12 = await db.query('pk_batchKey', undefined, {
      limit: 5,
      startKey: {
        pk: 'pk_batchKey',
        sk: 'sk_batchKey_12',
      },
    });
    expect(result12).toMatchSnapshot('Start Key');

    // Descending
    const result13 = await db.query('pk_batchKey', undefined, {
      sort: 'descending',
    });
    expect(result13).toMatchSnapshot('Descending');

    // Not Contains
    const result14 = await db.query('pk_batchKey', undefined, {
      filters: [
        {
          key: 'key1',
          operation: 'notContains',
          value: '_1',
        },
      ],
    });
    expect(result14).toMatchSnapshot('Not Contains');
  });

  it('query options empty filter array works', async () => {
    const db = new Dynamo('primary');

    // Limit
    const result = await db.query('pk_batchKey', undefined, {
      filters: [],
    });
    expect(result).toMatchSnapshot('Empty Filter');
  });

  it('query options attributes and filter works', async () => {
    const db = new Dynamo('primary');

    // Limit
    const result = await db.query('pk_batchKey', undefined, {
      filters: [
        {
          key: 'key1',
          operation: '<',
          value: 'key1_batchKey_15',
        },
      ],
      attributes: ['key1'],
    });

    expect(result).toMatchSnapshot();
  });

  it('loadAllWorks', async () => {
    const db = new Dynamo('primary');

    let data: any[] = [];

    let superLongString = '';

    for (let i = 0; i < 1000; i += 1) {
      superLongString += 'adsfasdfadsfasdfasdfasdfasdfasdfasdfasdfasdfasdf';
    }

    for (let i = 0; i < 50; i += 1) {
      data.push({
        pk: `pk_batchKey1`,
        sk: `sk_batchKey_${i}`,
        gsi1: `gsi1_batchKey_${i}`,
        key1: `key1_batchKey_${i}`,
        key2: superLongString,
      });

      if (data.length === 25) {
        await db.batchCreate(data);
        data = [];
      }
    }

    const getAllItems = await db.query('pk_batchKey1', undefined, {
      loadAll: true,
    });

    expect(getAllItems.Items.length).toEqual(50);
  });

  it('exactLimit Works', async () => {
    const db = new Dynamo('primary');

    let data: any[] = [];

    let superLongString = '';

    for (let i = 0; i < 1000; i += 1) {
      superLongString += 'adsfasdfadsfasdfasdfasdfasdfasdfasdfasdfasdfasdf';
    }

    for (let i = 0; i < 50; i += 1) {
      data.push({
        pk: `pk_batchKey1`,
        sk: `sk_batchKey_${i}`,
        gsi1: `gsi1_batchKey_${i}`,
        key1: `key1_batchKey_${i}`,
        key2: superLongString,
      });

      if (data.length === 25) {
        await db.batchCreate(data);
        data = [];
      }
    }

    const results = await db.query('pk_batchKey1', undefined, {
      exactLimit: 2,
      filters: [
        {
          key: 'key1',
          operation: '>',
          value: 'key1_batchKey_45',
        },
      ],
    });

    expect(results).toMatchSnapshot();
  });

  it('Nested Object Filters Works', async () => {
    const db = new Dynamo('primary');

    await db.create({
      pk: `pk_nestedKey1`,
      sk: `sk_nestedKey1`,
      gsi1: `gsi1_nestedKey1`,
      key4: {
        key1: {
          key2: {
            // Purposely use a hyphen to catch a bug
            'key-3': 'abc',
          },
        },
      },
    });

    const results = await db.query('pk_nestedKey1', undefined, {
      filters: [
        {
          key: 'key4.key1.key2.key-3',
          operation: '=',
          value: 'abc',
        },
      ],
    });

    expect(results.Items.length).toEqual(1);
    expect(results).toMatchSnapshot();
  });

  it('Filters supports OR operation', async () => {
    const db = new Dynamo('primary');

    await db.create({
      pk: 'pk_orKey1',
      sk: 'sk_orKey1',
      gsi1: 'gsi1_orKey1',
      key5: ['value1', 'value2'],
    });

    await db.create({
      pk: 'pk_orKey1',
      sk: 'sk_orKey2',
      gsi1: 'gsi1_orKey2',
      key5: ['value3', 'value4'],
    });

    await db.create({
      pk: 'pk_orKey1',
      sk: 'sk_orKey3',
      gsi1: 'gsi1_orKey3',
      key5: ['value5', 'value6'],
    });

    const result = await db.query('pk_orKey1', undefined, {
      filters: [
        {
          key: 'key5',
          operation: 'contains',
          value: 'value1',
        },
        {
          key: 'key5',
          operation: 'contains',
          value: 'value3',
        },
      ],
      filtersOperation: 'OR',
    });

    expect(result.Items.length).toEqual(2);
    expect(result).toMatchSnapshot();
  });

  it('Filters supports AND operation', async () => {
    const db = new Dynamo('primary');

    await db.create({
      pk: 'pk_orKey2',
      sk: 'sk_orKey1',
      gsi1: 'gsi1_orKey1',
      key5: ['value1', 'value2'],
    });

    await db.create({
      pk: 'pk_orKey2',
      sk: 'sk_orKey2',
      gsi1: 'gsi1_orKey2',
      key5: ['value1', 'value4'],
    });

    await db.create({
      pk: 'pk_orKey2',
      sk: 'sk_orKey3',
      gsi1: 'gsi1_orKey3',
      key5: ['value1', 'value6'],
    });

    const result = await db.query('pk_orKey2', undefined, {
      filters: [
        {
          key: 'key5',
          operation: 'contains',
          value: 'value1',
        },
        {
          key: 'key5',
          operation: 'contains',
          value: 'value2',
        },
      ],
      filtersOperation: 'AND',
    });

    expect(result.Items.length).toEqual(1);
    expect(result).toMatchSnapshot();
  });

  it('scan works', async () => {
    const db = new Dynamo('primary');

    // Raw Scan
    const result = await db.scan({
      limit: 10,
    });
    expect(result).toMatchSnapshot('Raw Scan');

    expect(result.LastEvaluatedKey).not.toEqual(undefined);

    // Pagination works
    const result2 = await db.scan({
      limit: 10,
      startKey: result.LastEvaluatedKey,
    });
    expect(result2).toMatchSnapshot('Raw Scan Page 2');

    // Filter Scan
    const result3 = await db.scan({
      filters: [
        {
          key: 'key1',
          operation: 'beginsWith',
          value: 'key1_batchKey_1',
        },
      ],
    });

    expect(result3).toMatchSnapshot('Filter Scan');
  });

  it('remove works', async () => {
    const db = new Dynamo('primary');

    const beforeRemove = await db.query('pk_key1', 'sk_key1');

    const result = await db.remove('pk_key1', 'sk_key1');

    expect(result).toEqual(beforeRemove.Items[0]);

    const results = await db.query('pk_key1', 'sk_key1');

    expect(results.Items.length).toEqual(0);
  });

  it('should crud with pk and sk number values', async () => {
    const db = new Dynamo('zeroTest');

    // Create an item with an sk number value of 0
    const created = await db.create({ pk: 0, sk: 0, gsi1: 'test' });
    expect(created).toMatchSnapshot();

    // Make sure the item exists
    const queried = await db.query(0, 0);
    expect(queried).toMatchSnapshot();

    // Delete the item
    const remove = await db.remove(0, 0);
    expect(remove).toEqual(created);

    // Check that the item was deleted
    const check = await db.query(0, 0);
    expect(check.Items.length).toEqual(0);
  });

  it('should update with conditionals', async () => {
    const db = new Dynamo('primary');

    // Create an item with an sk number value of 0
    const created = await db.create({
      pk: 'conditionalPK',
      sk: 'conditionalSK',
      gsi1: 'conditionalGSI1',
      key3: true,
      key4: { key1: 'exists', 'key1-test': 'exists2' },
      numberKey: 5,
    });

    expect(created).toMatchSnapshot();

    // Should fail since condition is wrong
    try {
      await db.update(
        {
          pk: 'conditionalPK',
          sk: 'conditionalSK',
          gsi1: 'conditionalGSI1',
        },
        {
          conditionals: [
            {
              key: 'gsi1',
              operation: '=',
              value: 'conditionalGSI2',
            },
          ],
        },
      );
    } catch (err) {
      expect(err.message).toEqual('The conditional request failed');
    }

    const updateData = {
      pk: 'conditionalPK',
      sk: 'conditionalSK',
      key5: [{ key1: 'equals' }],
    };

    // Equals condition should pass
    const equalsResult = await db.update(updateData, {
      conditionals: [
        {
          key: 'gsi1',
          operation: '=',
          value: 'conditionalGSI1',
        },
      ],
    });

    expect(equalsResult.key5).toEqual(updateData.key5);

    // Greater Than condition should pass
    updateData.key5 = [{ key1: '>' }];

    const greaterResult = await db.update(updateData, {
      conditionals: [
        {
          key: 'numberKey',
          operation: '>',
          value: 3,
        },
      ],
    });

    expect(greaterResult.key5).toEqual(updateData.key5);

    // Greater Than or Equals condition should pass
    updateData.key5 = [{ key1: '>=' }];

    const greaterEqualsResult = await db.update(updateData, {
      conditionals: [
        {
          key: 'numberKey',
          operation: '>=',
          value: 5,
        },
      ],
    });

    expect(greaterEqualsResult.key5).toEqual(updateData.key5);

    // Less Than condition should pass
    updateData.key5 = [{ key1: '<' }];

    const lessResult = await db.update(updateData, {
      conditionals: [
        {
          key: 'numberKey',
          operation: '<',
          value: 6,
        },
      ],
    });

    expect(lessResult.key5).toEqual(updateData.key5);

    // Less Than or Equals condition should pass
    updateData.key5 = [{ key1: '<=' }];

    const lessEqualsResult = await db.update(updateData, {
      conditionals: [
        {
          key: 'numberKey',
          operation: '<=',
          value: 5,
        },
      ],
    });

    expect(lessEqualsResult.key5).toEqual(updateData.key5);

    // Conditional check on value to update should pass
    // This seems to work on the base level, but not nested
    const conditionalCheckOnValueToUpdateResult = await db.update(
      {
        pk: 'conditionalPK',
        sk: 'conditionalSK',
        numberKey: 4,
      },
      {
        conditionals: [
          {
            key: 'numberKey',
            operation: '=',
            value: 5,
          },
        ],
      },
    );

    expect(conditionalCheckOnValueToUpdateResult.numberKey).toEqual(4);

    // Exists condition should pass
    updateData.key5 = [{ key1: 'exists' }];

    const existsResult = await db.update(updateData, {
      conditionals: [
        {
          key: 'key4.key1',
          operation: 'attribute_exists',
        },
      ],
    });

    expect(existsResult.key5).toEqual(updateData.key5);

    // Exists condition should pass with a hypen in the key
    // eslint-disable-next-line
    // @ts-ignore
    updateData.key5 = [{ 'key3-test': 'exists2' }];

    const existsResult2 = await db.update(updateData, {
      conditionals: [
        {
          key: 'key4.key1-test',
          operation: 'attribute_exists',
        },
      ],
    });

    expect(existsResult2.key5).toEqual(updateData.key5);

    // Not Exists condition should pass
    updateData.key5 = [{ key1: 'not exists' }];

    const notExstsResult = await db.update(updateData, {
      conditionals: [
        {
          key: 'key6',
          operation: 'attribute_not_exists',
        },
      ],
    });

    expect(notExstsResult.key5).toEqual(updateData.key5);

    // Attribute Type condition should pass with number
    updateData.key5 = [{ key1: 'typeNumber' }];

    const typeResultNumber = await db.update(updateData, {
      conditionals: [
        {
          key: 'numberKey',
          operation: 'attribute_type',
          value: 'number',
        },
      ],
    });

    expect(typeResultNumber.key5).toEqual(updateData.key5);

    // // Attribute Type condition should pass with string
    updateData.key5 = [{ key1: 'typeString' }];

    const typeResultString = await db.update(updateData, {
      conditionals: [
        {
          key: 'gsi1',
          operation: 'attribute_type',
          value: 'string',
        },
      ],
    });

    expect(typeResultString.key5).toEqual(updateData.key5);

    // // Attribute Type condition should pass with boolean
    updateData.key5 = [{ key1: 'typeBoolean' }];

    const typeResultBoolean = await db.update(updateData, {
      conditionals: [
        {
          key: 'key3',
          operation: 'attribute_type',
          value: 'boolean',
        },
      ],
    });

    expect(typeResultBoolean.key5).toEqual(updateData.key5);

    // // Attribute Type condition should pass with object
    updateData.key5 = [{ key1: 'typeObject' }];

    const typeResultObject = await db.update(updateData, {
      conditionals: [
        {
          key: 'key4',
          operation: 'attribute_type',
          value: 'object',
        },
      ],
    });

    expect(typeResultObject.key5).toEqual(updateData.key5);

    // Attribute Type condition should pass with array
    updateData.key5 = [{ key1: 'typeArray' }];

    const typeResultArray = await db.update(updateData, {
      conditionals: [
        {
          key: 'key5',
          operation: 'attribute_type',
          value: 'array',
        },
      ],
    });

    expect(typeResultArray.key5).toEqual(updateData.key5);

    // Begins With condition should pass
    updateData.key5 = [{ key1: 'beginsWith' }];

    const beginsWithResult = await db.update(updateData, {
      conditionals: [
        {
          key: 'gsi1',
          operation: 'begins_with',
          value: 'conditional',
        },
      ],
    });

    expect(beginsWithResult.key5).toEqual(updateData.key5);

    // Begins With condition should pass
    updateData.key5 = [{ key1: 'contains' }];

    const containsResult = await db.update(updateData, {
      conditionals: [
        {
          key: 'gsi1',
          operation: 'contains',
          value: 'tional',
        },
      ],
    });

    expect(containsResult.key5).toEqual(updateData.key5);

    // Size condition should pass
    updateData.key5 = [{ key1: 'size' }];

    const sizeResult = await db.update(updateData, {
      conditionals: [
        {
          key: 'gsi1',
          operation: 'size',
          value: 15, // Length of 'conditionalGSI1'
        },
      ],
    });

    expect(sizeResult.key5).toEqual(updateData.key5);

    // between condition should pass
    updateData.key5 = [{ key1: 'between' }];

    const betweenResult = await db.update(updateData, {
      conditionals: [
        {
          key: 'numberKey',
          operation: 'between',
          value: 2,
          value2: 10,
        },
      ],
    });

    expect(betweenResult.key5).toEqual(updateData.key5);
  });

  it('should update part of an object', async () => {
    const db = new Dynamo('primary');

    const key4 = {
      key1: {
        key1Test: 'key1',
      },
      key2: {
        key2Test: 'key2',
      },
    };

    // Create an item with an sk number value of 0
    const created = await db.create({
      pk: 'pk',
      sk: 'sk',
      gsi1: 'gsi1',
      key4,
      numberKey: 5,
    });

    expect(created).toMatchSnapshot();

    const result = await db.update(
      {
        pk: 'pk',
        sk: 'sk',
        'key4.key2': {
          key2Test: 'key2NewValue',
          key2Test2: 'key2NewValue2',
        },
      },
      {
        shouldExist: true,
      },
    );

    expect(result.key4).toEqual({
      ...key4,
      key2: {
        key2Test: 'key2NewValue',
        key2Test2: 'key2NewValue2',
      },
    });

    // Should be able to remove a key from an object
    const result2 = await db.update(
      {
        pk: 'pk',
        sk: 'sk',
        'key4.key2': null,
      },
      {
        shouldExist: true,
      },
    );

    expect(result2.key4).toEqual({
      key1: {
        key1Test: 'key1',
      },
      key2: undefined,
    });

    // Should be able to use a key with hyphens
    const result3 = await db.update({
      pk: 'pk',
      sk: 'sk',
      'key4.key3-test': 'success',
    });

    expect(result3.key4['key3-test']).toEqual('success');
  });

  it('update skips Joi validation', async () => {
    const db = new Dynamo('primary');

    await db.create({
      pk: 'pk_joiValidation',
      sk: 'sk_joiValidation',
      gsi1: 'gsi_joiValidation',
    });

    const results = await db.update(
      {
        pk: 'pk_joiValidation',
        sk: 'sk_joiValidation',
        keyThatIsNotInJoiModel: 234,
      },
      { skipJoiCheck: true, shouldExist: true },
    );

    expect(results).toMatchSnapshot();
  });

  it('should update nested object array element status', async () => {
    const db = new Dynamo('primary');

    // Create an item with a nested object containing an array
    const created = await db.create({
      pk: 'nestedObjectArrayPK',
      sk: 'nestedObjectArraySK',
      gsi1: 'nestedObjectArrayGSI1',
      key4: {
        key5: [
          { id: 'input1', status: 'active' },
          { id: 'input2', status: 'inactive' },
          { id: 'input3', status: 'active' },
          { id: 'input4', status: 'inactive' },
        ],
      },
    });

    expect(created).toMatchSnapshot();

    // Update the status of key4.key5[3]
    const updateData = {
      pk: 'nestedObjectArrayPK',
      sk: 'nestedObjectArraySK',
      'key4.key5[3].status': 'active',
    };

    const result = await db.update(updateData, { skipJoiCheck: true });

    expect(result.key4.key5[3].status).toEqual('active');
    expect(result.key4.key5[0]).toEqual({
      id: 'input1',
      status: 'active',
    });
    expect(result.key4.key5).toHaveLength(4);
  });

  it('should update with complex nested conditionals', async () => {
    const db = new Dynamo('primary');

    // Create an item with a nested object containing an array
    const created = await db.create({
      pk: 'complexConditionalPK',
      sk: 'complexConditionalSK',
      gsi1: 'complexConditionalGSI1',
      key4: {
        key5: [
          { id: 'input1', status: 'active' },
          { id: 'input2', status: 'inactive' },
          { id: 'input3', status: 'active' },
          { id: 'input4', status: 'inactive' },
        ],
        key6: '123',
      },
    });

    expect(created).toMatchSnapshot();

    // Update key4.key5[3].status with complex conditionals
    const updateData = {
      pk: 'complexConditionalPK',
      sk: 'complexConditionalSK',
      'key4.key5[3].status': 'active',
    };

    const conditionals: any = [
      {
        key: 'key4.key5[3].status',
        operation: 'attribute_exists',
      },
      // For some reason, we can't expect a value that we are updated
      // when working with nested keys. Would be good to figure this
      // out some day
      // {
      //   key: 'key4.key5[3].status',
      //   operation: '=',
      //   value: 'inactive',
      // },
      {
        key: 'key4.key5[3].id',
        operation: '=',
        value: 'input4',
      },
      {
        key: 'key4.key5[0].id',
        operation: 'contains',
        value: '1',
      },
    ];

    const result = await db.update(updateData, {
      skipJoiCheck: true,
      conditionals,
    });

    expect(result.key4.key5[3].status).toEqual('active');
    expect(result.key4.key5[0]).toEqual({
      id: 'input1',
      status: 'active',
    });
    expect(result.key4.key5).toHaveLength(4);

    // Test that update fails when conditions are not met
    // Create an item without key4.key5[3].status
    await db.create({
      pk: 'failConditionalPK',
      sk: 'failConditionalSK',
      gsi1: 'failConditionalGSI1',
      key4: {
        key5: [
          { id: 'input1', status: 'active' },
          { id: 'input2', status: 'inactive' },
          { id: 'input3', status: 'active' },
          { id: 'input4' }, // No status field
        ],
      },
    });

    await expect(
      db.update(
        {
          pk: 'failConditionalPK',
          sk: 'failConditionalSK',
          'key4.key5[3].status': 'active',
        },
        {
          skipJoiCheck: true,
          conditionals: [
            {
              key: 'key4.key5[3].status',
              operation: 'attribute_exists',
            },
          ],
        },
      ),
    ).rejects.toThrow('The conditional request failed');
  });

  it('should handle OR conditionals', async () => {
    const db = new Dynamo('primary');

    const pk = 'orConditionPK';
    const sk = 'orConditionSK';
    const gsi1 = 'orConditionGSI1';

    // Test that update fails when OR conditions are not met
    // Create an item without key4.key5[3].status
    await db.create({ pk, sk, gsi1, key3: true });

    // Should fail if key3 is true
    await expect(
      db.update(
        { pk, sk, key3: false },
        {
          skipJoiCheck: true,
          conditionalsCombiner: 'OR',
          conditionals: [
            {
              key: 'key3',
              operation: 'attribute_not_exists',
            },
            {
              key: 'key3',
              operation: '=',
              value: false,
            },
          ],
        },
      ),
    ).rejects.toThrow('The conditional request failed');

    // Should fail when only checking if key3 is false
    await expect(
      db.update(
        { pk, sk, key3: false },
        {
          skipJoiCheck: true,
          conditionalsCombiner: 'OR',
          conditionals: [
            {
              key: 'key3',
              operation: '=',
              value: false,
            },
          ],
        },
      ),
    ).rejects.toThrow('The conditional request failed');

    // Should fail since it exists
    await expect(
      db.update(
        { pk, sk, key3: false },
        {
          skipJoiCheck: true,
          conditionalsCombiner: 'OR',
          conditionals: [
            {
              key: 'key3',
              operation: 'attribute_not_exists',
            },
          ],
        },
      ),
    ).rejects.toThrow('The conditional request failed');

    await db.update({
      pk,
      sk,
      key2: 'test',
      key3: false,
    });

    // Should not fail since key3 is now false
    expect(
      await db.update(
        { pk, sk, key2: 'test 2' },
        {
          skipJoiCheck: true,
          conditionalsCombiner: 'OR',
          conditionals: [
            {
              key: 'key3',
              operation: 'attribute_not_exists',
            },
            {
              key: 'key3',
              operation: '=',
              value: false,
            },
          ],
        },
      ),
    ).toEqual({
      gsi1: 'orConditionGSI1',
      key3: false,
      key2: 'test 2',
      pk: 'orConditionPK',
      sk: 'orConditionSK',
    });

    // Should fail since it exists, even though it's false
    await expect(
      db.update(
        { pk, sk, key2: 'test 3' },
        {
          skipJoiCheck: true,
          conditionalsCombiner: 'OR',
          conditionals: [
            {
              key: 'key3',
              operation: 'attribute_not_exists',
            },
          ],
        },
      ),
    ).rejects.toThrow('The conditional request failed');
  });
});
