import { startDb, stopDb, createTables, deleteTables } from 'jest-dynalite';

beforeAll(startDb);

// Create tables but don't delete them after tests
// This can cause issues if you have tests reading / writing the same
// data. For example, two tests both try to create a row with the
// same pk / sk, it will throw an error on the second one since it
// already exists
// beforeAll(createTables);

// Before and after each test, wipe the dynamo tables. This ensures no data
// persists between each test execution. The only downside is it can be
// helpful to have a single test file keep all the same data throughout all
// the tests in it as you build upon the data
// beforeEach(createTables);
// afterEach(deleteTables);

afterAll(stopDb);
