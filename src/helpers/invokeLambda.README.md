# invokeLambda

Helper function to invoke AWS Lambda functions with proper error handling.

## Usage

```typescript
import { invokeLambda } from 'sardius-node-helpers';

const result = await invokeLambda('assets', 'getAsset', {
  pathParameters: { accountId: '123', assetId: '456' },
});
```

## Parameters

| Parameter      | Type                         | Required | Description                                            |
| -------------- | ---------------------------- | -------- | ------------------------------------------------------ |
| service        | serviceType                  | Yes      | Service name (e.g., 'assets', 'accounts', 'search-os') |
| functionName   | string                       | Yes      | Lambda function name                                   |
| eventObj       | eventObject                  | Yes      | Event object with pathParameters, body, etc.           |
| invocationType | 'RequestResponse' \| 'Event' | No       | Invocation type (default: 'RequestResponse')           |

## Error Handling

The function handles two types of errors:

### 1. Lambda Execution Errors (FunctionError)

When Lambda throws an unhandled exception, the AWS SDK returns `FunctionError`
in the response. The error payload contains `errorMessage`, `errorType`, and
`stackTrace`.

```typescript
// Thrown error format:
"Invoke Lambda failed: Cannot read property 'x' of undefined";
```

### 2. HTTP Status Code Errors

When Lambda returns a non-200/202 status code, the function extracts error
details from:

1. `body.message` - Standard error message field
2. `body.error` - Alternative error field
3. `parsedData.errorMessage` - Lambda-level error message
4. String body or stringified object body as fallback

```typescript
// Thrown error format:
'Invoke Lambda failed: Bad request - missing required field';

// When no error details available:
'Invoke Lambda failed with status 500';
```

## Backwards Compatibility

This function maintains backwards compatibility:

- Existing error handling for HTTP status codes works the same way
- Error messages now include the prefix "Invoke Lambda failed:" for consistency
- All existing API contracts are preserved

## AI Notes

When using this function:

- Always wrap calls in try/catch to handle potential errors
- Check the error message for "Invoke Lambda failed:" prefix to identify
  invokeLambda errors
- The function automatically constructs the Lambda function name from
  environment variables:
  `${process.env.cfstack}-${service}-${process.env.stage}-${functionName}`
