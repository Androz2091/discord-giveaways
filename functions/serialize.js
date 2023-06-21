function serialize(obj) {
  if (typeof obj === 'undefined' || obj === null) {
    return '';
  }
  
  if (typeof obj === 'function') {
    return obj.toString();
  } else if (obj instanceof RegExp) {
    return obj.toString();
  } else if (obj instanceof Date) {
    return 'new Date(' + obj.getTime() + ')';
  } else if (obj instanceof Set) {
    return 'new Set(' + serialize([...obj]) + ')';
  } else if (obj instanceof Map) {
    const entries = [...obj.entries()].map(([key, value]) => `[${serialize(key)}, ${serialize(value)}]`);
    return 'new Map(' + serialize(entries) + ')';
  } else if (typeof obj === 'bigint') {
    return 'BigInt(' + obj.toString() + ')';
  } else if (typeof obj === 'object' && obj !== null) {
    const keys = Object.keys(obj);
    const serializedObj = keys.reduce((acc, key) => {
      const value = obj[key];
      acc[key] = serialize(value);
      return acc;
    }, {});
    return JSON.stringify(serializedObj);
  } else {
    return JSON.stringify(obj);
  }
}

module.exports = { serialize };