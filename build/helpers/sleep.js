'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = function (milliseconds) {
  return new Promise(function (resolve) {
    return setTimeout(function () {
      return resolve(undefined);
    }, milliseconds);
  });
};
