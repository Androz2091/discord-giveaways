function deepmergeCustom(options) {
  return function merge(target, source) {
    if (Array.isArray(target) && Array.isArray(source) && !options.mergeArrays) {
      return source;
    }

    if (target && typeof target === 'object' && source && typeof source === 'object') {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          if (target.hasOwnProperty(key)) {
            target[key] = merge(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        }
      }
    }

    return target;
  };
}

module.exports = { deepmergeCustom };