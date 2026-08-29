export type Sha256Digest = `sha256:${string}`;

const textEncoder = new TextEncoder();
const hasOwn = (value: object, key: PropertyKey): boolean => Object.prototype.hasOwnProperty.call(value, key);

function validateUnicode(value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new Error('Unpaired high surrogate');
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new Error('Unpaired low surrogate');
    }
  }
}

function normalizeString(value: string): string {
  validateUnicode(value);
  return value.normalize('NFC');
}

function compareUtf8(left: string, right: string): number {
  const leftBytes = textEncoder.encode(left);
  const rightBytes = textEncoder.encode(right);
  const length = Math.min(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index += 1) {
    if (leftBytes[index] !== rightBytes[index]) return leftBytes[index] - rightBytes[index];
  }
  return leftBytes.length - rightBytes.length;
}

function normalize(value: unknown, stack: Set<object>): unknown {
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'string') return normalizeString(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Non-finite number');
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value !== 'object') throw new Error('Unsupported canonical value');
  if (stack.has(value)) throw new Error('Canonical values cannot contain cycles');
  stack.add(value);
  try {
    if (Array.isArray(value)) {
      const allowedProperties = new Set(['length', ...Array.from({ length: value.length }, (_, index) => String(index))]);
      if (Reflect.ownKeys(value).some((key) => typeof key !== 'string' || !allowedProperties.has(key))) {
        throw new Error('Arrays cannot contain non-index properties');
      }
      for (let index = 0; index < value.length; index += 1) {
        if (!hasOwn(value, index)) throw new Error('Sparse arrays are not canonical');
      }
      return value.map((item) => normalize(item, stack));
    }

    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) throw new Error('Unsupported canonical object');
    if (Object.getOwnPropertySymbols(value).length > 0 || Object.getOwnPropertyNames(value).length !== Object.keys(value).length) {
      throw new Error('Symbol or hidden object keys are not canonical');
    }

    const normalizedKeys = new Set<string>();
    const entries: Array<[string, unknown]> = [];
    for (const key of Object.keys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !descriptor.enumerable || !hasOwn(descriptor, 'value')) throw new Error('Accessors are not canonical');
      const normalizedKey = normalizeString(key);
      if (normalizedKeys.has(normalizedKey)) throw new Error(`Canonical key collision after NFC normalization: ${normalizedKey}`);
      normalizedKeys.add(normalizedKey);
      entries.push([normalizedKey, normalize(descriptor.value, stack)]);
    }
    entries.sort(([left], [right]) => compareUtf8(left, right));
    return Object.fromEntries(entries);
  } finally {
    stack.delete(value);
  }
}

export function normalizeCanonical(value: unknown): unknown {
  return normalize(value, new Set<object>());
}

export function canonicalize(value: unknown): string {
  return JSON.stringify(normalizeCanonical(value));
}

export async function hashCanonical(value: unknown): Promise<Sha256Digest> {
  const bytes = textEncoder.encode(canonicalize(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `sha256:${hex}`;
}
