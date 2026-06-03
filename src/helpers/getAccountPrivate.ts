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

// Identical to getAccount, but routes through the `getPrivateAccount` Lambda,
// which skips the active/finished gating and returns the raw account row.
// Use this for back-end/system flows (e.g. storage cleanup) that must work
// regardless of whether the account is currently active.
const getAccountPrivate = async (accountId: string): Promise<Account> => {
  const account = await invokeLambda('accounts', 'getPrivateAccount', {
    pathParameters: { accountId },
  });

  return account as Account;
};

export default getAccountPrivate;
