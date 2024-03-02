'use strict';
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
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
Object.defineProperty(exports, '__esModule', { value: true });
var client_s3_1 = require('@aws-sdk/client-s3');
var default_1 = /** @class */ (function () {
  function default_1(_a) {
    var accessKeyId = _a.accessKeyId,
      secretAccessKey = _a.secretAccessKey,
      bucket = _a.bucket,
      endpoint = _a.endpoint,
      region = _a.region;
    if (!accessKeyId && !bucket) {
      throw Error('accessKeyId is required to use the s3 class');
    }
    if (!secretAccessKey && !bucket) {
      throw Error('secretAccessKey is required to use the s3 class');
    }
    if (bucket) {
      this.bucket = bucket;
    }
    var config = {};
    if (region) {
      config.region = region;
    }
    if (endpoint) {
      config.endpoint = 'https://'.concat(endpoint);
    }
    if (accessKeyId && secretAccessKey) {
      config.credentials = {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      };
    }
    var s3 = new client_s3_1.S3Client(config);
    this.s3 = s3;
  }
  default_1.prototype.deleteObject = function (key, options) {
    return __awaiter(this, void 0, void 0, function () {
      var fullOptions, command, response;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            fullOptions = options || {};
            command = new client_s3_1.DeleteObjectCommand(
              __assign(__assign({}, fullOptions), {
                Bucket:
                  (options === null || options === void 0
                    ? void 0
                    : options.Bucket) || this.bucket,
                Key: key,
              }),
            );
            return [4 /*yield*/, this.s3.send(command)];
          case 1:
            response = _a.sent();
            return [2 /*return*/, response];
        }
      });
    });
  };
  default_1.prototype.deleteObjects = function (items, options) {
    return __awaiter(this, void 0, void 0, function () {
      var fullOptions, command, response;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            fullOptions = options || {};
            command = new client_s3_1.DeleteObjectsCommand(
              __assign(__assign({}, fullOptions), {
                Bucket:
                  (options === null || options === void 0
                    ? void 0
                    : options.Bucket) || this.bucket,
                Delete: {
                  Objects: items,
                },
              }),
            );
            return [4 /*yield*/, this.s3.send(command)];
          case 1:
            response = _a.sent();
            return [2 /*return*/, response];
        }
      });
    });
  };
  default_1.prototype.putObject = function (key, data, options) {
    return __awaiter(this, void 0, void 0, function () {
      var formattedData, fullOptions, command, response;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            formattedData = data;
            if (typeof data === 'object' && data !== null) {
              formattedData = JSON.stringify(data);
            }
            fullOptions = options || {};
            command = new client_s3_1.PutObjectCommand(
              __assign(__assign({}, fullOptions), {
                Bucket:
                  (options === null || options === void 0
                    ? void 0
                    : options.Bucket) || this.bucket,
                Key: key,
                Body: formattedData,
              }),
            );
            return [4 /*yield*/, this.s3.send(command)];
          case 1:
            response = _a.sent();
            return [2 /*return*/, response];
        }
      });
    });
  };
  default_1.prototype.listObjects = function (prefix, options) {
    return __awaiter(this, void 0, void 0, function () {
      var fullOptions, command, response;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            fullOptions = options || {};
            command = new client_s3_1.ListObjectsV2Command(
              __assign(__assign({}, fullOptions), {
                Prefix: prefix,
                Bucket:
                  (options === null || options === void 0
                    ? void 0
                    : options.Bucket) || this.bucket,
              }),
            );
            return [4 /*yield*/, this.s3.send(command)];
          case 1:
            response = _a.sent();
            return [2 /*return*/, response];
        }
      });
    });
  };
  default_1.prototype.listBuckets = function (options) {
    return __awaiter(this, void 0, void 0, function () {
      var fullOptions, command, response;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            fullOptions = options || {};
            command = new client_s3_1.ListBucketsCommand(fullOptions);
            return [4 /*yield*/, this.s3.send(command)];
          case 1:
            response = _a.sent();
            return [2 /*return*/, response];
        }
      });
    });
  };
  default_1.prototype.headObject = function (key, options) {
    return __awaiter(this, void 0, void 0, function () {
      var fullOptions, command, response;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            fullOptions = options || {};
            command = new client_s3_1.HeadObjectCommand(
              __assign(__assign({}, fullOptions), {
                Key: key,
                Bucket:
                  (options === null || options === void 0
                    ? void 0
                    : options.Bucket) || this.bucket,
              }),
            );
            return [4 /*yield*/, this.s3.send(command)];
          case 1:
            response = _a.sent();
            return [2 /*return*/, response];
        }
      });
    });
  };
  default_1.prototype.getObject = function (key, options) {
    return __awaiter(this, void 0, void 0, function () {
      var fullOptions, command, response;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            fullOptions = options || {};
            command = new client_s3_1.GetObjectCommand(
              __assign(__assign({}, fullOptions), {
                Key: key,
                Bucket:
                  (options === null || options === void 0
                    ? void 0
                    : options.Bucket) || this.bucket,
              }),
            );
            return [4 /*yield*/, this.s3.send(command)];
          case 1:
            response = _a.sent();
            return [2 /*return*/, response];
        }
      });
    });
  };
  default_1.prototype.getObjectAsString = function (key, options) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
      var response, responseAsString;
      return __generator(this, function (_c) {
        switch (_c.label) {
          case 0:
            return [4 /*yield*/, this.getObject(key, options)];
          case 1:
            response = _c.sent();
            if (
              !((_a = response.Body) === null || _a === void 0
                ? void 0
                : _a.transformToString)
            )
              return [3 /*break*/, 3];
            return [
              4 /*yield*/,
              (_b = response.Body) === null || _b === void 0
                ? void 0
                : _b.transformToString(),
            ];
          case 2:
            responseAsString = _c.sent();
            return [2 /*return*/, responseAsString];
          case 3:
            return [2 /*return*/, ''];
        }
      });
    });
  };
  return default_1;
})();
exports.default = default_1;
