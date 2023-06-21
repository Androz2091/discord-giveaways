function deepmerge(target, source) {
  if (typeof target !== 'object' || typeof source !== 'object') {
    return source;
  }

  const merged = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (target.hasOwnProperty(key)) {
        merged[key] = deepmerge(target[key], source[key]);
      } else {
        merged[key] = source[key];
      }
    }
  }

  return merged;
}

module.exports = { deepmerge };