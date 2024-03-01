/**
 * @type {import('@shelf/jest-dynamodb/lib').Config}')}
 */
const config = {
  tables: [
    {
      TableName: `sardius_alpha-api_myServiceName`,
      KeySchema: [
        { AttributeName: 'pk', KeyType: 'HASH' },
        { AttributeName: 'sk', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'pk', AttributeType: 'S' },
        { AttributeName: 'sk', AttributeType: 'S' },
        { AttributeName: 'gsi1', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'sk-pk-index',
          Projection: {
            ProjectionType: 'ALL',
          },
          KeySchema: [
            {
              AttributeName: 'sk',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'pk',
              KeyType: 'RANGE',
            },
          ],
        },
        {
          IndexName: 'gsi1-sk-index',
          Projection: {
            ProjectionType: 'ALL',
          },
          KeySchema: [
            {
              AttributeName: 'gsi1',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'sk',
              KeyType: 'RANGE',
            },
          ],
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 100,
        WriteCapacityUnits: 100,
      },
    },
  ],
};

// Replace with your env var that is used in Dynamo/db.ts
process.env.dynamoTable = config.tables[0].TableName;

module.exports = config;
