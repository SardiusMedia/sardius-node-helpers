'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = function (incomingVar) {
  try {
    if (
      typeof incomingVar === 'object' &&
      incomingVar !== null &&
      // eslint-ignore-next-line no-prototype-builtins
      Object.prototype.isPrototypeOf.call(
        Object.getPrototypeOf(incomingVar),
        Object,
      )
    ) {
      return true;
    }
  } catch (err) {
    // Do nothing if it fails
  }
  return false;
};
