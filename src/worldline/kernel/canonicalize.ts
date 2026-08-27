import type { CanonicalJsonValue } from './types';

function canonicalNumber(value: number): string {
  if (!Number.isFinite(value)) throw new Error('Non-canonical number: only finite JSON numbers are permitted');
  return JSON.stringify(Object.is(value, -0) ? 0 : value);
}

function canonicalObject(value: object): string {
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error('Canonical values require a plain JSON object');
  }

  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key !== 'string')) {
    throw new Error('Non-canonical object: symbol keys are not permitted');
  }

  const entries: string[] = [];
  for (const key of (ownKeys as string[]).sort()) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || descriptor.get || descriptor.set) {
      throw new Error('Non-canonical object: properties must be enumerable data properties');
    }
    entries.push(`${JSON.stringify(key)}:${canonicalizeToJson(descriptor.value)}`);
  }
  return `{${entries.join(',')}}`;
}

export function canonicalizeToJson(value: unknown): string {
  if (value === null) return 'null';

  switch (typeof value) {
    case 'string':
      return JSON.stringify(value);
    case 'number':
      return canonicalNumber(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'undefined':
    case 'function':
    case 'symbol':
    case 'bigint':
      throw new Error(`Non-canonical value type: ${typeof value}`);
    case 'object':
      if (Array.isArray(value)) {
        const items: string[] = [];
        for (let index = 0; index < value.length; index += 1) {
          if (!(index in value)) throw new Error('Non-canonical array: sparse arrays are not permitted');
          items.push(canonicalizeToJson(value[index]));
        }
        return `[${items.join(',')}]`;
      }
      return canonicalObject(value);
    default:
      throw new Error('Non-canonical value');
  }
}

export function normalizeCanonicalValue(value: unknown): CanonicalJsonValue {
  return JSON.parse(canonicalizeToJson(value)) as CanonicalJsonValue;
}
