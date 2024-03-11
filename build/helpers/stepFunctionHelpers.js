'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var returnResults = function (event, data, statusCode) {
  if (statusCode === void 0) {
    statusCode = 200;
  }
  if (
    event.requestContext &&
    event.requestContext.accountId === 'offlineContext_accountId'
  ) {
    return {
      statusCode: statusCode,
      body: JSON.stringify(data),
    };
  }
  return data;
};
var returnEvent = function (event) {
  // If we are running lambda locally, then pull body as event
  if (
    event.requestContext &&
    event.requestContext.accountId === 'offlineContext_accountId' &&
    event.body
  ) {
    var data = JSON.parse(event.body);
    return data;
  }
  return event;
};
exports.default = {
  returnResults: returnResults,
  returnEvent: returnEvent,
};
