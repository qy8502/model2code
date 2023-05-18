export const timestampConvertor = (obj) => {
  return deepClone(obj, true);
};

export const deepClone = (obj, dateToTimestamp?: boolean) => {
  let newObject;
  if (obj === undefined) {
    return undefined;
  }
  else if (obj === null) {
    return null;
  }
  else if (!(obj instanceof Object)) {
    return obj;
  }
  else if (obj instanceof Date) {
    if (dateToTimestamp) {
      return obj.valueOf();
    } else {
      return new Date(obj);
    }
  }
  else if (obj instanceof Function) {
    return {...obj};
  }
  else if (obj instanceof RegExp) {
    return new RegExp(obj);
  }
  else if (obj instanceof Array) {
    newObject = [];
    for (const item of obj) {
      newObject.push(deepClone(item, dateToTimestamp));
    }
  }
  else {
    newObject = Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
    for (const key of Object.keys(obj)) {
      newObject[key] = newObject[key] !== obj ? deepClone(obj[key], dateToTimestamp) : newObject;
    }
  }
  return newObject;
};
