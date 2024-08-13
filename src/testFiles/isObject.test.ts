import isObject from '../helpers/isObject';

describe('common/helpers/isObject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should exist', () => {
    expect(isObject).toBeTruthy();
  });

  it('works', async () => {
    const correct = { a: '1' };

    const result = isObject(correct);

    expect(result).toEqual(true);
  });

  it('catches buffer types', async () => {
    const arrayBuffer = new ArrayBuffer(50);
    const arrayBufferResult = isObject(arrayBuffer);
    expect(arrayBufferResult).toEqual(false);

    const buffer = Buffer.from(arrayBuffer);
    const bufferResult = isObject(buffer);
    expect(bufferResult).toEqual(false);
  });

  it('catches normal object traps', async () => {
    const arrayTest = [1, 2, 3];
    const arrayTestResult = isObject(arrayTest);
    expect(arrayTestResult).toEqual(false);

    const nullTest = null;
    const nullTestResult = isObject(nullTest);
    expect(nullTestResult).toEqual(false);

    const functionTest = () => console.log('a');
    const functionTestResult = isObject(functionTest);
    expect(functionTestResult).toEqual(false);
  });

  it('catches other random types', async () => {
    const numberTest = 1;
    const numberTestResult = isObject(numberTest);
    expect(numberTestResult).toEqual(false);

    const stringTest = '1';
    const stringTestResult = isObject(stringTest);
    expect(stringTestResult).toEqual(false);

    const undefinedTest = undefined;
    const undefinedTestResult = isObject(undefinedTest);
    expect(undefinedTestResult).toEqual(false);
  });
});
