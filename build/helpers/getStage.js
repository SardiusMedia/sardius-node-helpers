'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = function () {
  if (!process.env.cfstack) {
    throw Error('Missing required param');
  }
  var stage = process.env.cfstack.split('-')[0];
  return stage;
};
