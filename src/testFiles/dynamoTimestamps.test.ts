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

  it('update should allow createdAt on the schema', async () => {
    process.env.useTimestamps = 'true';
    const db = new Dynamo('primary');

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

    delete process.env.useTimestamps;
  });
});
