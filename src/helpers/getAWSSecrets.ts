import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

const getAwsSecrets = async (whichSecret: string): Promise<void> => {
  // If this plugin has ran once before, don't run again
  if (process.env[`${whichSecret}_loaded`] === '1') {
    return undefined;
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
    process.env[`${whichSecret}_loaded`] = '1';

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
