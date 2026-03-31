import { Lambda } from '@aws-sdk/client-lambda';
import type { LambdaClientConfig } from '@aws-sdk/client-lambda';

import keyValuePair from '../common/tsModels/keyValueAny';

type serviceType =
  | 'accounts'
  | 'analytics'
  | 'assets'
  | 'assets-stats'
  | 'bios'
  | 'Calendar'
  | 'calendars'
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
  | 'search-os'
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

function isClockSignatureError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { name?: string; message?: string };
  const name = String(err.name || '');
  const message = String(err.message || '').toLowerCase();
  return (
    name === 'InvalidSignatureException' ||
    message.includes('signature expired') ||
    message.includes('invalidsignatureexception') ||
    message.includes('requesttimetooskewed')
  );
}

export default async (
  service: serviceType,
  functionName: string,
  eventObj: eventObject,
  invocationType?: 'RequestResponse' | 'Event',
  options?: LambdaClientConfig,
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

  const createLambdaClient = () =>
    new Lambda({
      region: process.env.region,
      ...options,
    });
  const lambda = createLambdaClient();

  let data;
  try {
    data = await lambda.invoke(invokeParams);
  } catch (error) {
    if (!isClockSignatureError(error)) {
      throw error;
    }
    // One immediate retry with a fresh client helps when a stale signer/clock
    // offset exists in a warm Lambda execution environment.
    data = await createLambdaClient().invoke(invokeParams);
  }

  // Check for Lambda execution errors (unhandled exceptions)
  // When FunctionError is set, the Lambda threw an error
  if (data.FunctionError) {
    const payloadStr = data.Payload
      ? Buffer.from(data.Payload).toString()
      : '{}';
    const errorPayload = JSON.parse(payloadStr);
    const errorMessage =
      errorPayload.errorMessage || errorPayload.message || 'Unknown error';
    throw Error(`Invoke Lambda failed: ${errorMessage}`);
  }

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
    // Try to extract error message from various possible locations
    const errorDetail =
      body?.message ||
      body?.error ||
      parsedData.errorMessage ||
      (typeof body === 'string' ? body : JSON.stringify(body));

    const message = errorDetail
      ? `Invoke Lambda failed: ${errorDetail}`
      : `Invoke Lambda failed with status ${parsedData.statusCode}`;

    throw Error(message);
  }

  return body;
};
