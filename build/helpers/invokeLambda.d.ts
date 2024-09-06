import { Lambda } from '@aws-sdk/client-lambda';
import keyValuePair from '../common/tsModels/keyValueAny';
export declare const lambda: Lambda;
type serviceType =
  | 'accounts'
  | 'analytics'
  | 'assets'
  | 'assets-stats'
  | 'bios'
  | 'Calendar'
  | 'categories'
  | 'chat'
  | 'emails'
  | 'feeds'
  | 'files'
  | 'hooks'
  | 'ingest'
  | 'locations'
  | 'logs'
  | 'media'
  | 'payments'
  | 'places'
  | 'players'
  | 'products'
  | 'roles'
  | 'scp'
  | 'search'
  | 'sites'
  | 'static'
  | 'stream'
  | 'transcode'
  | 'transcribe'
  | 'user';
type httpType = 'GET' | 'POST' | 'DELETE' | 'PUT';
interface eventObject {
  headers?: keyValuePair;
  httpMethod?: httpType;
  pathParameters: keyValuePair;
  queryStringParameters?: keyValuePair;
  body?: keyValuePair;
}
declare const _default: (
  service: serviceType,
  functionName: string,
  eventObj: eventObject,
  invocationType?: 'RequestResponse' | 'Event',
) => Promise<keyValuePair>;
export default _default;
