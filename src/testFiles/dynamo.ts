import db from './db';
import Dynamo from '../Dynamo/index';
import { DBSetupOptions } from 'src/Dynamo/index.types';

export type Schemas = 'primary' | 'zeroTest' | 'timestampsTest'; // Update based on schemas from db.ts

export type IndexNames = 'sk-pk-index' | 'gsi1-sk-index'; // Replace with actual index names

export default class DynamoWrapper extends Dynamo {
  constructor(schema: Schemas, options?: DBSetupOptions) {
    if (!db[schema]) {
      throw Error('Invalid schema');
    }

    super(db.dbClient, db[schema], options);
  }
}
