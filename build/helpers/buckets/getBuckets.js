'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
var index_1 = require('../index');
var validateBucket_1 = __importDefault(require('./validateBucket'));
var acceptedInternalIds = [
  'bb_assets',
  'bb_assets-eu',
  'lc_assets',
  'sj_assets',
  'default',
];
exports.default = function (accountId, buckets) {
  return __awaiter(void 0, void 0, void 0, function () {
    var externalProviders,
      accountBucketDefaults,
      foundExternalProviders,
      foundAccountBucketDefaults,
      account,
      results,
      formattedBuckets;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [4 /*yield*/, (0, index_1.getAWSSecrets)('transcode')];
        case 1:
          _a.sent();
          externalProviders = [];
          accountBucketDefaults = [];
          foundExternalProviders =
            process.env['externalProviders_'.concat(accountId)] || '';
          foundAccountBucketDefaults =
            process.env['accountBucketDefaults_'.concat(accountId)] || '';
          if (!(foundAccountBucketDefaults && foundExternalProviders))
            return [3 /*break*/, 2];
          externalProviders = JSON.parse(foundExternalProviders);
          accountBucketDefaults = JSON.parse(foundAccountBucketDefaults);
          return [3 /*break*/, 4];
        case 2:
          if (!(accountId !== 'sardiusAdmin')) return [3 /*break*/, 4];
          return [4 /*yield*/, (0, index_1.getAccount)(accountId)];
        case 3:
          account = _a.sent();
          if (account && account.storage && account.storage.externalProviders) {
            externalProviders = account.storage.externalProviders;
          }
          if (account && account.storage && account.storage.buckets) {
            accountBucketDefaults = account.storage.buckets;
          }
          process.env['externalProviders_'.concat(accountId)] =
            JSON.stringify(externalProviders);
          process.env['accountBucketDefaults_'.concat(accountId)] =
            JSON.stringify(accountBucketDefaults);
          _a.label = 4;
        case 4:
          results = [];
          if (!buckets || !buckets.forEach) {
            throw Error('No buckets found');
          }
          formattedBuckets = buckets;
          if (buckets.indexOf('default') > -1) {
            if (accountBucketDefaults.length > 0) {
              formattedBuckets = accountBucketDefaults.map(function (item) {
                return item.id;
              });
            } else {
              // System defaults
              formattedBuckets = [
                'sj_assets',
                'bb_assets',
                'bb_assets-eu',
                'lc_assets',
              ];
            }
          }
          if (buckets.indexOf('all') > -1) {
            formattedBuckets = [
              'sj_assets',
              'bb_assets',
              'bb_assets-eu',
              'lc_assets',
            ];
            externalProviders.forEach(function (bucket) {
              return formattedBuckets.push(bucket.id);
            });
          }
          formattedBuckets.forEach(function (incomingBucketId) {
            var foundBucket;
            var bucketId = incomingBucketId;
            // Just in case we get the bucket ID value for our
            // env vars, then we switch it out for the internal ID
            // so it can go through the same flow of building the bucket
            acceptedInternalIds.forEach(function (id) {
              if (process.env[''.concat(id, '_bucketId')] === bucketId) {
                bucketId = id;
              }
            });
            var externalBucket = externalProviders.find(function (bucket) {
              return bucket.id === bucketId;
            });
            // If the bucketID is a known id, then it should come from
            // AWS secrets. It means it is an internal storage bucket
            if (acceptedInternalIds.indexOf(bucketId) > -1) {
              if (bucketId.indexOf('bb_') > -1) {
                foundBucket = {
                  type: 'backblaze',
                  id: process.env[''.concat(bucketId, '_bucketId')] || '',
                  key: process.env[''.concat(bucketId, '_keyId')] || '',
                  secret: process.env[''.concat(bucketId, '_appKey')] || '',
                  bucketName:
                    process.env[''.concat(bucketId, '_bucketName')] || '',
                  region: process.env[''.concat(bucketId, '_region')] || '',
                  provider: 'backblaze',
                  endpointUrl:
                    process.env[''.concat(bucketId, '_endpoint')] || '',
                  internalBucket: true,
                };
              } else {
                var provider = bucketId === 'lc_assets' ? 'lyvecloud' : 'storj';
                foundBucket = {
                  type: 's3',
                  id: process.env[''.concat(bucketId, '_bucketId')] || '',
                  key: process.env[''.concat(bucketId, '_key')] || '',
                  secret: process.env[''.concat(bucketId, '_secret')] || '',
                  bucketName:
                    process.env[''.concat(bucketId, '_bucketName')] || '',
                  region: process.env[''.concat(bucketId, '_region')] || '',
                  provider: provider,
                  endpointUrl:
                    process.env[''.concat(bucketId, '_endpoint')] || '',
                  internalBucket: true,
                };
              }
            } else if (externalBucket) {
              foundBucket = externalBucket;
            } else {
              throw Error('Unrecognized bucket: '.concat(bucketId));
            }
            (0, validateBucket_1.default)(foundBucket);
            results.push(foundBucket);
          });
          return [2 /*return*/, results];
      }
    });
  });
};
