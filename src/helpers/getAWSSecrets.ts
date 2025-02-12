import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

interface Options {
  expires?: number;
}

const getAwsSecrets = async (
  whichSecret: string,
  options?: Options,
): Promise<void> => {
  const lastLoaded = process.env[`${whichSecret}_loaded`] || '';

  // If this plugin has ran once before, don't run again
  if (lastLoaded) {
    let shouldRefetch = false;

    // Allow for the refetching of a secret if it's expired
    if (options && options.expires) {
      try {
        const lastLoadedAsNumber = parseInt(lastLoaded, 10);

        const now = Date.now();

        if (now - lastLoadedAsNumber > options.expires) {
          shouldRefetch = true;
        }
      } catch (err) {
        // Do nothing with error
      }
    }

    if (!shouldRefetch) {
      return undefined;
    }
  }

  // This determines which secret to pull from AWS
  const SecretId = `${process.env.cfstack}/${whichSecret}`;

  try {
    // Create an AWS Secrets Manager client
    const client = new SecretsManagerClient({
      endpoint: `https://secretsmanager.${process.env.AWS_REGION}.amazonaws.com`,
      region: process.env.AWS_REGION,
    });

    const command = new GetSecretValueCommand({
      SecretId,
    });

    const data = await client.send(command);

    if (!data.SecretString) {
      return undefined;
    }

    const secret = JSON.parse(data.SecretString);

    const keys = Object.keys(secret);

    for (let i = 0; i < keys.length; i += 1) {
      process.env[keys[i]] = secret[keys[i]];
    }

    // Set a variable so we don't run this function again
    process.env[`${whichSecret}_loaded`] = Date.now().toString();

    return undefined;
  } catch (err) {
    let errorMessage = err.message;

    if (err.code === 'ResourceNotFoundException') {
      errorMessage = `The requested secret ${SecretId} was not found`;
    } else if (err.code === 'InvalidRequestException') {
      errorMessage = `The request was invalid due to: ${err.message}`;
    } else if (err.code === 'InvalidParameterException') {
      errorMessage = `The request had invalid params: ${err.message}`;
    }

    throw Error(errorMessage);
  }
};

export default getAwsSecrets;
