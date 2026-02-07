/**
 * @description A function that takes an object and a mask and returns a new object with asterisks in place of the masked values
 */
export function objectMask<T extends Record<string, any>>(
  obj: T,
  mask: string[],
  seen = new WeakSet(),
): Partial<T> {
  if (obj == null) return obj;
  if (seen.has(obj)) return obj; // prevent infinite recursion
  seen.add(obj);

  const maskedObj: Record<string, any> = {};

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const isMasked = mask.includes(key);

    if (val == null) {
      maskedObj[key] = val;
    } else if (isMasked) {
      if (typeof val === 'object' && !Array.isArray(val)) {
        maskedObj[key] = deepValueMask(val, seen);
      } else {
        maskedObj[key] = maskValue(val);
      }
    } else if (typeof val === 'object' && !Array.isArray(val)) {
      maskedObj[key] = objectMask(val, mask, seen);
    } else {
      maskedObj[key] = val;
    }
  }

  return maskedObj as Partial<T>;
}

function deepValueMask(
  obj: Record<string, any>,
  seen: WeakSet<any>,
): Record<string, any> {
  if (seen.has(obj)) return obj;
  seen.add(obj);

  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (v == null) return [k, v];
      if (typeof v === 'object' && !Array.isArray(v)) {
        return [k, deepValueMask(v, seen)];
      }
      return [k, maskValue(v)];
    }),
  );
}

function maskValue(val: any): string {
  const str = typeof val === 'string' ? val : JSON.stringify(val);
  if (str.length <= 4) return '*';
  const visible = str.slice(0, 4);
  const stars = '*'.repeat(Math.min(20, Math.ceil(str.length / 4)));
  return visible + stars;
}
