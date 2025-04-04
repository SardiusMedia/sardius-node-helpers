import KeyValueAny from '../common/tsModels/keyValueAny';
import invokeLambda from './invokeLambda';

interface DefaultCronSettings {
  enabled: boolean;
  days?: number[];
  [key: string]: any;
}

interface Cron {
  [key: string]: DefaultCronSettings;
}

interface Account {
  access: string[];
  accountManager: boolean;
  active: boolean;
  adminPanel: KeyValueAny;
  allowedTokens: number;
  apiGatewayKey: string;
  apiKeys: KeyValueAny;
  orgInfo: KeyValueAny;
  billingInfo: KeyValueAny;
  chatTitles: string[];
  childAccounts: KeyValueAny;
  clippingFeedId: string;
  contactInfo: KeyValueAny;
  customerInfo: KeyValueAny;
  controlPanel: KeyValueAny;
  createdBy: string;
  defaultPlayerId: string;
  description: string;
  development: boolean;
  domains: string[];
  feeds: KeyValueAny;
  finished: boolean;
  gcp: KeyValueAny;
  googleAnalytics: KeyValueAny;
  hooks: KeyValueAny;
  id: string;
  links: KeyValueAny;
  login: KeyValueAny;
  logo: string;
  mediaSources: KeyValueAny;
  mpx: KeyValueAny;
  name: string;
  networking: {
    publicFields: string[];
    interests: string[];
  };
  orgSize: string;
  payments: KeyValueAny;
  postmark: KeyValueAny;
  preRollUrls: string[];
  publishingProfiles: string[];
  publishingProfileDefault: string;
  qEncodeApiKey: string;
  role: string;
  roles: KeyValueAny;
  scripts: KeyValueAny;
  sk: string;
  slug: string;
  tier: string;
  trial: number;
  youbora: KeyValueAny;
  cron?: Cron;
}

const getAccount = async (accountId: string): Promise<Account> => {
  // Fetch account
  const account = await invokeLambda('accounts', 'getAccount', {
    pathParameters: { accountId },
  });

  return account as Account;
};

export default getAccount;
