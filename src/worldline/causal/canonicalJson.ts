export type Sha256Digest = `sha256:${string}`;

export function normalizeCanonical(value: unknown): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Non-finite number');
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) return value.map(normalizeCanonical);
  if (typeof value === 'object') {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) throw new Error('Unsupported canonical object');
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => {
        if (item === undefined || typeof item === 'function' || typeof item === 'symbol') {
          throw new Error('Unsupported canonical value');
        }
        return [key, normalizeCanonical(item)];
      }));
  }
  throw new Error('Unsupported canonical value');
}

export function canonicalize(value: unknown): string {
  return JSON.stringify(normalizeCanonical(value));
}

export async function hashCanonical(value: unknown): Promise<Sha256Digest> {
  const bytes = new TextEncoder().encode(canonicalize(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `sha256:${hex}`;
}
