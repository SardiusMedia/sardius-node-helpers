export default (incomingVar: any): boolean => {
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
