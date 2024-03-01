import { Lambda } from '@aws-sdk/client-lambda';

import keyValuePair from '../tsModels/keyValueAny';

export const lambda = new Lambda({
  region: process.env.region,
});

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
  | 'locations'
  | 'logs'
  | 'payments'
  | 'players'
  | 'products'
  | 'roles'
  | 'scp'
  | 'sites'
  | 'search'
  | 'static'
  | 'stream'
  | 'transcode'
  | 'user'
  | 'null'
  | null;

type httpType = 'GET' | 'POST' | 'DELETE' | 'PUT';

interface eventObject {
  headers?: keyValuePair;
  httpMethod?: httpType;
  pathParameters: keyValuePair;
  queryStringParameters?: keyValuePair;
  body?: keyValuePair;
}

export default async (
  service: serviceType,
  functionName: string,
  eventObj: eventObject,
  invocationType?: 'RequestResponse' | 'Event',
): Promise<keyValuePair> => {
  const type = invocationType || 'RequestResponse';

  const defaults = {
    headers: {},
    httpMethod: '',
    pathParameters: {},
    path: '',
  };

  const event = { ...defaults, ...eventObj };

  const invokeParams = {
    FunctionName: `${process.env.cfstack}-${service}-${process.env.stage}-${functionName}`,
    InvocationType: type,
    Payload: Buffer.from(JSON.stringify(event), 'utf8'),
  };

  const data = await lambda.invoke(invokeParams);

  const payloadResponse = data.Payload
    ? Buffer.from(data.Payload).toString()
    : '{}';

  const parsedData = payloadResponse ? JSON.parse(payloadResponse) : {};

  let body = parsedData.body || '';

  try {
    const parsedBody = JSON.parse(parsedData.body);
    body = parsedBody;
  } catch (error) {
    // Do nothing
  }

  if (
    parsedData.statusCode &&
    parsedData.statusCode !== 200 &&
    parsedData.statusCode !== 202
  ) {
    const message =
      body && body.message ? body.message : 'Invoke Lambda failed';

    throw Error(message);
  }

  return body;
};
