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
            key3: 'abc',
          },
        },
      },
    });

    const results = await db.query('pk_nestedKey1', undefined, {
      filters: [
        {
          key: 'key4.key1.key2.key3',
          operation: '=',
          value: 'abc',
        },
      ],
    });

    expect(results.Items.length).toEqual(1);
    expect(results).toMatchSnapshot();
  });

  it('remove works', async () => {
    const db = new Dynamo('primary');

    const beforeRemove = await db.query('pk_key1', 'sk_key1');

    const result = await db.remove('pk_key1', 'sk_key1');

    expect(result).toEqual(beforeRemove.Items[0]);

    const results = await db.query('pk_key1', 'sk_key1');

    expect(results.Items.length).toEqual(0);
  });
});
