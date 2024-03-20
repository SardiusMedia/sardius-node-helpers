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
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/dynamodb/
var client_dynamodb_1 = require('@aws-sdk/client-dynamodb');
var util_dynamodb_1 = require('@aws-sdk/util-dynamodb');
var joi_1 = __importDefault(require('joi'));
var sleep_1 = __importDefault(require('../helpers/sleep'));
var convertOperation = function (operation) {
  if (operation === '<') {
    return 'LT';
  }
  if (operation === '<=') {
    return 'LE';
  }
  if (operation === '>') {
    return 'GT';
  }
  if (operation === '>=') {
    return 'GE';
  }
  if (
    operation === '=' ||
    operation === '==' ||
    operation === '===' ||
    operation === 'equals'
  ) {
    return 'EQ';
  }
  if (operation === 'between') {
    return 'BETWEEN';
  }
  if (operation === 'begins' || operation === 'beginsWith') {
    return 'BEGINS_WITH';
  }
  if (operation === 'contains') {
    return 'CONTAINS';
  }
  if (operation === 'exist' || operation === 'exists') {
    return 'NOT_NULL';
  }
  if (operation === 'null' || operation === null) {
    return 'NULL';
  }
  throw Error('Invalid operation');
};
var convertOperationToExpression = function (key, operation, value, value2) {
  var operator = '';
  if (operation === '<') {
    operator = '<';
  }
  if (operation === '<=') {
    operator = '<=';
  }
  if (operation === '>') {
    operator = '>';
  }
  if (operation === '>=') {
    operator = '>=';
  }
  if (
    operation === '=' ||
    operation === '==' ||
    operation === '===' ||
    operation === 'equals'
  ) {
    operator = '=';
  }
  if (operation === '!=' || operation === 'notEqual') {
    operator = '<>';
  }
  if (operator) {
    return ''.concat(key, ' ').concat(operator, ' ').concat(value);
  }
  if (operation === 'between') {
    return ''.concat(key, ' BETWEEN ').concat(value, ' AND ').concat(value2);
  }
  if (operation === 'begins' || operation === 'beginsWith') {
    return 'begins_with('.concat(key, ', ').concat(value, ')');
  }
  if (operation === 'contains') {
    return 'contains('.concat(key, ', ').concat(value, ')');
  }
  if (operation === 'exist' || operation === 'exists') {
    return 'attribute_exists('.concat(key, ')');
  }
  if (operation === 'null' || operation === null || operation === 'notExists') {
    return 'attribute_not_exists('.concat(key, ')');
  }
  throw Error('Invalid operation');
};
var DynamoWrapper = /** @class */ (function () {
  function DynamoWrapper(dbClient, schema, options) {
    this.mainIndex = dbClient;
    this.pk = schema.table.hashKey;
    this.sk = schema.table.rangeKey;
    this.model = schema.table;
    this.schema = schema.schema;
    this.timestamps =
      (options === null || options === void 0 ? void 0 : options.timestamps) ||
      this.model.timestamps;
    this.indexesByName = {};
    this.indexNames = schema.table.indexes.map(function (index) {
      return index.name;
    });
    for (var i = 0; i < schema.table.indexes.length; i += 1) {
      var index = schema.table.indexes[i];
      this.indexesByName[index.name] = index;
    }
  }
  DynamoWrapper.prototype.buildQuery = function (pk, sk, gsiIndex) {
    var _a;
    var hashKey = this.pk;
    var rangeKey = this.sk;
    if (gsiIndex) {
      var foundIndex = this.indexesByName[gsiIndex];
      if (!foundIndex) {
        throw Error('Unrecognized GSI index: '.concat(gsiIndex));
      }
      hashKey = foundIndex.hashKey;
      rangeKey = foundIndex.rangeKey;
    }
    var pkAttribute = (0, util_dynamodb_1.marshall)({ pk: pk });
    var keys =
      ((_a = {}),
      (_a[hashKey] = {
        AttributeValueList: [pkAttribute.pk],
        ComparisonOperator: 'EQ',
      }),
      _a);
    if (sk) {
      var value = typeof sk === 'object' ? sk.value : sk;
      var value2 = typeof sk === 'object' ? sk.value2 : undefined;
      var operation = typeof sk === 'object' ? sk.operation : 'equals';
      var attribute = { value: value };
      if (value2) {
        attribute.value2 = value2;
      }
      var skAttribute = (0, util_dynamodb_1.marshall)(attribute);
      var attributeList = [skAttribute.value];
      if (value2) {
        attributeList.push(skAttribute.value2);
      }
      keys[rangeKey] = {
        AttributeValueList: attributeList,
        ComparisonOperator: convertOperation(operation),
      };
    }
    return keys;
  };
  DynamoWrapper.prototype.loadAll = function (pk, sk, options, gsiIndex) {
    return __awaiter(this, void 0, void 0, function () {
      var finalCount,
        finalScannedCount,
        allItems,
        modOptions,
        hashKey,
        rangeKey,
        lastEvaluatedKeys,
        foundIndex,
        lastKey,
        _loop_1,
        this_1,
        out_i_1,
        i;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            finalCount = 0;
            finalScannedCount = 0;
            allItems = [];
            modOptions = options ? __assign({}, options) : {};
            modOptions.loadAll = false;
            modOptions.limit = undefined;
            modOptions.exactLimit = undefined;
            hashKey = this.pk;
            rangeKey = this.sk;
            lastEvaluatedKeys = [hashKey, rangeKey];
            if (gsiIndex) {
              foundIndex = this.indexesByName[gsiIndex];
              if (!foundIndex) {
                throw Error('Unrecognized GSI index: '.concat(gsiIndex));
              }
              hashKey = foundIndex.hashKey;
              rangeKey = foundIndex.rangeKey;
              lastEvaluatedKeys.push(foundIndex.hashKey);
              if (foundIndex.rangeKey) {
                lastEvaluatedKeys.push(foundIndex.rangeKey);
              }
            }
            // If we have an exactLimit, then we have to ensure
            // that all the needed attributes to build a custom
            // LastEvaluatedKey exists
            if (
              (options === null || options === void 0
                ? void 0
                : options.exactLimit) &&
              modOptions.attributes
            ) {
              lastEvaluatedKeys.forEach(function (key) {
                var _a;
                if (
                  ((_a = modOptions.attributes) === null || _a === void 0
                    ? void 0
                    : _a.indexOf(key)) === -1
                ) {
                  modOptions.attributes.push(key);
                }
              });
            }
            lastKey =
              options === null || options === void 0
                ? void 0
                : options.startKey;
            _loop_1 = function (i) {
              var response, lastItem_1, customLastKey_1;
              return __generator(this, function (_b) {
                switch (_b.label) {
                  case 0:
                    modOptions.startKey = lastKey;
                    return [
                      4 /*yield*/,
                      this_1.query(pk, sk, modOptions, gsiIndex),
                    ];
                  case 1:
                    response = _b.sent();
                    finalCount += response.Count || 0;
                    finalScannedCount += response.ScannedCount || 0;
                    response.Items.forEach(function (item) {
                      if (
                        !(options === null || options === void 0
                          ? void 0
                          : options.exactLimit) ||
                        allItems.length < options.exactLimit
                      ) {
                        allItems.push(item);
                      }
                    });
                    lastKey = response.LastEvaluatedKey;
                    // Once we hit our exact limit, we can stop our loop function
                    if (
                      (options === null || options === void 0
                        ? void 0
                        : options.exactLimit) &&
                      allItems.length >= options.exactLimit
                    ) {
                      i = 1000;
                      lastItem_1 = allItems[allItems.length - 1];
                      customLastKey_1 = {};
                      lastEvaluatedKeys.forEach(function (key) {
                        customLastKey_1[key] = lastItem_1[key];
                      });
                      lastKey = customLastKey_1;
                    }
                    if (!response.LastEvaluatedKey) {
                      i = 1000;
                    }
                    out_i_1 = i;
                    return [2 /*return*/];
                }
              });
            };
            this_1 = this;
            i = 0;
            _a.label = 1;
          case 1:
            if (!(i < 1000)) return [3 /*break*/, 4];
            return [5 /*yield**/, _loop_1(i)];
          case 2:
            _a.sent();
            i = out_i_1;
            _a.label = 3;
          case 3:
            i += 1;
            return [3 /*break*/, 1];
          case 4:
            return [
              2 /*return*/,
              {
                Count: finalCount,
                ScannedCount: finalScannedCount,
                Items: allItems,
                LastEvaluatedKey: lastKey,
              },
            ];
        }
      });
    });
  };
  DynamoWrapper.prototype.query = function (pk, sk, options, gsiIndex) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
      var allResults, keys, buildOptions, input, response, formattedResponse;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            if (
              !(
                (options === null || options === void 0
                  ? void 0
                  : options.loadAll) ||
                (options === null || options === void 0
                  ? void 0
                  : options.exactLimit)
              )
            )
              return [3 /*break*/, 2];
            return [4 /*yield*/, this.loadAll(pk, sk, options, gsiIndex)];
          case 1:
            allResults = _b.sent();
            return [2 /*return*/, allResults];
          case 2:
            keys = this.buildQuery(pk, sk, gsiIndex);
            buildOptions = this.processOptions(options);
            input = new client_dynamodb_1.QueryCommand(
              __assign(__assign({}, buildOptions), {
                TableName: this.model.tableName,
                KeyConditions: keys,
                IndexName: gsiIndex || undefined,
              }),
            );
            return [4 /*yield*/, this.mainIndex.send(input)];
          case 3:
            response = _b.sent();
            formattedResponse = {
              Count: response.Count,
              Items:
                ((_a = response.Items) === null || _a === void 0
                  ? void 0
                  : _a.map(function (item) {
                      return (0, util_dynamodb_1.unmarshall)(item);
                    })) || [],
              LastEvaluatedKey: response.LastEvaluatedKey
                ? (0, util_dynamodb_1.unmarshall)(response.LastEvaluatedKey)
                : undefined,
              ScannedCount: response.ScannedCount,
            };
            if (
              (options === null || options === void 0
                ? void 0
                : options.attributes) &&
              (options === null || options === void 0
                ? void 0
                : options.filters) &&
              (options === null || options === void 0
                ? void 0
                : options.filters.length) > 0
            ) {
              formattedResponse.Items = formattedResponse.Items.map(
                function (item) {
                  var _a;
                  var fullItem = {};
                  (_a =
                    options === null || options === void 0
                      ? void 0
                      : options.attributes) === null || _a === void 0
                    ? void 0
                    : _a.forEach(function (key) {
                        if (item[key] !== undefined) {
                          fullItem[key] = item[key];
                        }
                      });
                  return fullItem;
                },
              );
            }
            return [2 /*return*/, formattedResponse];
        }
      });
    });
  };
  DynamoWrapper.prototype.queryGSI = function (gsiName, pk, sk, options) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        if (!this.indexesByName[gsiName]) {
          throw Error(
            'The following index was not found in your dynogels model: '.concat(
              gsiName,
            ),
          );
        }
        return [2 /*return*/, this.query(pk, sk, options, gsiName)];
      });
    });
  };
  DynamoWrapper.prototype.processOptions = function (options) {
    var _a;
    var validOptions = {};
    if (options && options.limit) {
      validOptions.Limit = options.limit;
    }
    if (options && options.filters && options.filters.length > 0) {
      validOptions.ExpressionAttributeNames = {};
      validOptions.ExpressionAttributeValues = {};
      var filterExpressions_1 = [];
      options.filters.forEach(function (filter) {
        var attribute = { value: filter.value };
        if (filter.value2) {
          attribute.value2 = filter.value2;
        }
        var cleanItem = (0, util_dynamodb_1.marshall)(attribute);
        var attributeList = [cleanItem.value];
        if (filter.value2) {
          attributeList.push(cleanItem.value2);
        }
        if (
          validOptions.ExpressionAttributeNames &&
          validOptions.ExpressionAttributeValues
        ) {
          var key = '#'.concat(filter.key);
          var valueKey = ':'.concat(filter.key);
          var valueKey2 = ':'.concat(filter.key, '2');
          var noValueOperations = [
            'exist',
            'exists',
            'null',
            'notExists',
            null,
          ];
          // If we have a . in the key name, then that means
          // we are attempting to filter on a nested object
          // so we have to do some special logic to break out
          // that key in the correct way for Dynamo
          if (filter.key.indexOf('.') > -1) {
            // Split the keys by the . so we can process them
            var splitKeys = filter.key.split('.');
            // We have to add a unique key for each splitKey
            splitKeys.forEach(function (splitKey) {
              if (validOptions.ExpressionAttributeNames) {
                validOptions.ExpressionAttributeNames['#'.concat(splitKey)] =
                  splitKey;
              }
            });
            // Format the keys to have the # in front
            var splitKeysFormatted = splitKeys.map(function (splitKey) {
              return '#'.concat(splitKey);
            });
            // Join the keys back together so its nested again
            key = splitKeysFormatted.join('.');
            // Update our value keys to only use the first key
            // since Dynamo doesn't like . in those valueKey names
            valueKey = ':'.concat(splitKeys[0]);
            valueKey2 = ':'.concat(splitKeys[0], '2');
          } else {
            validOptions.ExpressionAttributeNames[key] = filter.key;
          }
          if (noValueOperations.indexOf(filter.operation) === -1) {
            validOptions.ExpressionAttributeValues[valueKey] = cleanItem.value;
            if (filter.value2 !== undefined && filter.operation === 'between') {
              validOptions.ExpressionAttributeValues[valueKey2] =
                cleanItem.value2;
            }
          }
          filterExpressions_1.push(
            convertOperationToExpression(
              key,
              filter.operation,
              valueKey,
              valueKey2,
            ),
          );
        }
      });
      // If we have a single filter operation like 'exists', then no values
      // will be present. We delete the ExpressionAttributeValues object if that
      // is the case, or else Dynamo throws an error
      if (Object.keys(validOptions.ExpressionAttributeValues).length === 0) {
        delete validOptions.ExpressionAttributeValues;
      }
      validOptions.FilterExpression = filterExpressions_1.join(' AND ');
    }
    if (options === null || options === void 0 ? void 0 : options.attributes) {
      if (options && options.filters && options.filters.length > 0) {
        // Do nothing
      } else {
        validOptions.AttributesToGet = options.attributes;
      }
    }
    if (options && options.startKey) {
      if (typeof options.startKey === 'string') {
        validOptions.ExclusiveStartKey = (0, util_dynamodb_1.marshall)(
          ((_a = {}), (_a[this.model.hashKey] = options.startKey), _a),
        );
      } else {
        validOptions.ExclusiveStartKey = (0, util_dynamodb_1.marshall)(
          options.startKey,
        );
      }
    }
    if (options && options.sort && options.sort === 'ascending') {
      validOptions.ScanIndexForward = true;
    } else if (options && options.sort && options.sort === 'descending') {
      validOptions.ScanIndexForward = false;
    }
    return validOptions;
  };
  DynamoWrapper.prototype.getKeys = function (pk, sk) {
    var _a;
    var hashKey = this.pk;
    var rangeKey = this.sk;
    if (!pk) {
      throw Error('DynamoDB update error: Missing hashKey');
    }
    var tableKeys = {
      hashKey: pk,
    };
    if (rangeKey) {
      if (!sk) {
        throw Error('DynamoDB update error: Missing rangeKey');
      }
      tableKeys.rangeKey = sk;
    }
    var keyAttributes = (0, util_dynamodb_1.marshall)(tableKeys);
    var keys = ((_a = {}), (_a[hashKey] = keyAttributes.hashKey), _a);
    if (rangeKey) {
      keys[rangeKey] = keyAttributes.rangeKey;
    }
    return keys;
  };
  DynamoWrapper.prototype.formatData = function (data, method) {
    var formattedData = __assign(__assign({}, data), { incrementValues: [] });
    // marshall doesn't like undefined or empty strings
    // so we manually take them out. Joi also doesn't like
    // empty strings unless if you specify
    Object.keys(data).forEach(function (key) {
      var value = data[key];
      if (value === undefined) {
        delete formattedData[key];
      }
      if (value === '') {
        if (method === 'create') {
          delete formattedData[key];
        }
      }
      if (value === null) {
        if (method === 'create') {
          delete formattedData[key];
        } else if (method === 'update') {
          // For updates, if we receive an empty string
          // then the only way to clear out the string from
          // Dynamo is to pass a null instead
          formattedData[key] = '';
        }
      }
      // Since increment functions are ran on a number field
      // we cant let an object pass for those fields, so we pull
      // them out into a separate field for processing later
      if (value && value['$add']) {
        formattedData.incrementValues.push(key);
        formattedData[key] = value['$add'];
      }
    });
    if (this.timestamps) {
      if (method === 'create') {
        formattedData.createdAt = new Date().toISOString();
      } else if (method === 'update') {
        formattedData.updatedAt = new Date().toISOString();
      }
    }
    if (method === 'create') {
      delete formattedData.incrementValues;
    }
    return formattedData;
  };
  DynamoWrapper.prototype.checkSchema = function (data, method) {
    var _this = this;
    var schema = {};
    var joiData = __assign({}, data);
    if (method === 'create') {
      // For creates, we use the whole schema
      schema = this.schema;
    } else if (method === 'update') {
      // For updates, we use only a partial schema since
      // an update can update only a single key, but the schema
      // says more then one key is required. We don't want to require
      // our consumers to always have to include every required key
      // for every update
      // Marshall doesn't like undefined or empty strings
      // so we manually take them out. Joi also doesn't like
      // empty strings unless if you specify
      Object.keys(data).forEach(function (key) {
        var value = data[key];
        // Get rid of undefined values since both Dynamo and Joi do not want those
        if (value === undefined) {
          delete joiData[key];
        }
        // If empty string, the only way to delete
        // a string from Dynamo is by passing a null
        if (value === '') {
          delete joiData[key];
        }
        // If null, that means we are attempting to delete
        // a string from Dynamo, we do not need to check the type
        // in Joi for this
        if (value === null) {
          delete joiData[key];
        }
        if (key === 'incrementValues') {
          delete joiData[key];
        }
        if (_this.schema[key]) {
          schema[key] = _this.schema[key];
        }
      });
    }
    if (this.timestamps) {
      if (method === 'create') {
        schema.createdAt = joi_1.default.string();
      } else if (method === 'update') {
        schema.createdAt = joi_1.default.string();
        schema.updatedAt = joi_1.default.string();
      }
    }
    joi_1.default.attempt(joiData, joi_1.default.object(schema));
    return null;
  };
  DynamoWrapper.prototype.create = function (data, overwrite) {
    return __awaiter(this, void 0, void 0, function () {
      var formattedData, Expected, dynamoFormatData, command, err_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            formattedData = this.formatData(data, 'create');
            this.checkSchema(formattedData, 'create');
            Expected = {};
            if (!overwrite) {
              Expected[this.pk] = { Exists: false };
              if (this.sk) {
                Expected[this.sk] = { Exists: false };
              }
            }
            dynamoFormatData = (0, util_dynamodb_1.marshall)(formattedData, {
              removeUndefinedValues: true,
            });
            command = new client_dynamodb_1.PutItemCommand({
              TableName: this.model.tableName,
              Item: dynamoFormatData,
              ReturnValues: 'ALL_OLD',
              Expected: Expected,
            });
            // PutItem does not return the values for created rows
            return [4 /*yield*/, this.mainIndex.send(command)];
          case 1:
            // PutItem does not return the values for created rows
            _a.sent();
            return [2 /*return*/, formattedData];
          case 2:
            err_1 = _a.sent();
            if (err_1.message === 'The conditional request failed') {
              throw Error('This item already exists');
            } else {
              throw err_1;
            }
            return [3 /*break*/, 3];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  DynamoWrapper.prototype.update = function (data, shouldExist) {
    return __awaiter(this, void 0, void 0, function () {
      var formattedData_1,
        keys,
        dynamoFormatData_1,
        ExpressionAttributeNames_1,
        ExpressionAttributeValues_1,
        allExpressions_1,
        addExpressions_1,
        UpdateExpression,
        ConditionExpression,
        updateConfig,
        command,
        response,
        formattedResponse,
        err_2;
      var _this = this;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            formattedData_1 = this.formatData(data, 'update');
            this.checkSchema(formattedData_1, 'update');
            keys = this.getKeys(data[this.pk], data[this.sk]);
            dynamoFormatData_1 = (0, util_dynamodb_1.marshall)(
              formattedData_1,
              {
                removeUndefinedValues: true,
              },
            );
            ExpressionAttributeNames_1 = {};
            ExpressionAttributeValues_1 = {};
            allExpressions_1 = [];
            addExpressions_1 = [];
            Object.keys(formattedData_1).forEach(function (key) {
              if (
                key !== _this.pk &&
                key !== _this.sk &&
                key !== 'incrementValues'
              ) {
                var value = dynamoFormatData_1[key];
                ExpressionAttributeNames_1['#'.concat(key)] = key;
                ExpressionAttributeValues_1[':'.concat(key)] = value;
                if (formattedData_1.incrementValues.indexOf(key) === -1) {
                  allExpressions_1.push('#'.concat(key, ' = :').concat(key));
                } else {
                  addExpressions_1.push('#'.concat(key, ' :').concat(key));
                }
              }
            });
            UpdateExpression = '';
            if (allExpressions_1.length > 0) {
              UpdateExpression = 'SET '.concat(allExpressions_1.join(', '));
            }
            if (addExpressions_1.length > 0) {
              UpdateExpression += ''
                .concat(UpdateExpression ? ' ' : '', ' ADD ')
                .concat(addExpressions_1.join(', '));
            }
            ConditionExpression = void 0;
            if (shouldExist) {
              ConditionExpression = 'attribute_exists('.concat(this.pk, ')');
              if (this.sk) {
                ConditionExpression += ' AND attribute_exists('.concat(
                  this.sk,
                  ')',
                );
              }
            }
            updateConfig = {
              TableName: this.model.tableName,
              Key: keys,
              ReturnValues: 'ALL_NEW',
              ConditionExpression: ConditionExpression,
              ExpressionAttributeValues: ExpressionAttributeValues_1,
              ExpressionAttributeNames: ExpressionAttributeNames_1,
              UpdateExpression: UpdateExpression,
            };
            command = new client_dynamodb_1.UpdateItemCommand(updateConfig);
            return [4 /*yield*/, this.mainIndex.send(command)];
          case 1:
            response = _a.sent();
            formattedResponse = response.Attributes
              ? (0, util_dynamodb_1.unmarshall)(response.Attributes)
              : {};
            return [2 /*return*/, formattedResponse];
          case 2:
            err_2 = _a.sent();
            if (err_2.message === 'The conditional request failed') {
              throw Error('This item already exists');
            } else {
              throw err_2;
            }
            return [3 /*break*/, 3];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  // Warning, batchCreate will overwrite any existing rows with the same
  // pk / sk, so use with caution
  DynamoWrapper.prototype.batchCreate = function (data) {
    return __awaiter(this, void 0, void 0, function () {
      var formattedItems,
        batchCommandInput,
        attempts_1,
        maxAttempts_1,
        timeBetweenEvents_1,
        attemptUntilSuccessful_1,
        results,
        err_3;
      var _a;
      var _this = this;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            _b.trys.push([0, 2, , 3]);
            if (data.length > 25) {
              throw Error('Cannot batchCreate more then 25 items at a time');
            }
            formattedItems = data.map(function (item) {
              var formattedData = _this.formatData(item, 'create');
              _this.checkSchema(formattedData, 'create');
              return formattedData;
            });
            batchCommandInput = {
              RequestItems:
                ((_a = {}),
                (_a[this.model.tableName] = formattedItems.map(function (item) {
                  return {
                    PutRequest: {
                      Item: (0, util_dynamodb_1.marshall)(item),
                    },
                  };
                })),
                _a),
            };
            attempts_1 = 0;
            maxAttempts_1 = 10;
            timeBetweenEvents_1 = 1000;
            attemptUntilSuccessful_1 = function (itemsToWrite) {
              return __awaiter(_this, void 0, void 0, function () {
                var command, results;
                var _a;
                return __generator(this, function (_b) {
                  switch (_b.label) {
                    case 0:
                      attempts_1 += 1;
                      command = new client_dynamodb_1.BatchWriteItemCommand(
                        itemsToWrite,
                      );
                      return [4 /*yield*/, this.mainIndex.send(command)];
                    case 1:
                      results = _b.sent();
                      if (
                        !(
                          results.UnprocessedItems &&
                          results.UnprocessedItems[this.model.tableName] &&
                          results.UnprocessedItems[this.model.tableName]
                            .length > 0 &&
                          attempts_1 < maxAttempts_1
                        )
                      )
                        return [3 /*break*/, 4];
                      return [
                        4 /*yield*/,
                        (0, sleep_1.default)(timeBetweenEvents_1 * attempts_1),
                      ];
                    case 2:
                      _b.sent();
                      return [
                        4 /*yield*/,
                        attemptUntilSuccessful_1({
                          RequestItems:
                            ((_a = {}),
                            (_a[this.model.tableName] =
                              results.UnprocessedItems[this.model.tableName]),
                            _a),
                        }),
                      ];
                    case 3:
                      _b.sent();
                      _b.label = 4;
                    case 4:
                      return [2 /*return*/, results];
                  }
                });
              });
            };
            return [4 /*yield*/, attemptUntilSuccessful_1(batchCommandInput)];
          case 1:
            results = _b.sent();
            // If some items failed to update, throw an error
            if (
              results.UnprocessedItems &&
              results.UnprocessedItems[this.model.tableName] &&
              results.UnprocessedItems[this.model.tableName].length > 0
            ) {
              console.log(
                'Number of failed Items: ',
                results.UnprocessedItems[this.model.tableName].length,
              );
              throw Error('Failed to batchUpdate storage rows');
            }
            return [2 /*return*/, 'success'];
          case 2:
            err_3 = _b.sent();
            if (err_3.message === 'The conditional request failed') {
              throw Error('This item already exists');
            } else {
              throw err_3;
            }
            return [3 /*break*/, 3];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  DynamoWrapper.prototype.remove = function (pk, sk) {
    return __awaiter(this, void 0, void 0, function () {
      var keys, Expected, command, response, formattedResponse;
      var _a;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            keys = this.getKeys(pk, sk);
            Expected =
              ((_a = {}),
              (_a[this.pk] = {
                Exists: true,
                Value: keys[this.pk],
              }),
              _a);
            if (this.sk) {
              Expected[this.sk] = {
                Exists: true,
                Value: keys[this.sk],
              };
            }
            command = new client_dynamodb_1.DeleteItemCommand({
              TableName: this.model.tableName,
              Key: keys,
              Expected: Expected,
              ReturnValues: 'ALL_OLD',
            });
            return [4 /*yield*/, this.mainIndex.send(command)];
          case 1:
            response = _b.sent();
            formattedResponse = response.Attributes
              ? (0, util_dynamodb_1.unmarshall)(response.Attributes)
              : {};
            return [2 /*return*/, formattedResponse];
        }
      });
    });
  };
  return DynamoWrapper;
})();
exports.default = DynamoWrapper;
