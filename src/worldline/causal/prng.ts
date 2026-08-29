export type Xoshiro128State = readonly [number, number, number, number];

const UINT32_RANGE = 0x1_0000_0000;

function validateState(input: readonly number[]): [number, number, number, number] {
  if (input.length !== 4 || input.some((word) => !Number.isInteger(word) || word < 0 || word >= UINT32_RANGE)) {
    throw new Error('E_INVALID_PRNG_STATE: xoshiro128** requires four unsigned 32-bit words');
  }
  if (input.every((word) => word === 0)) throw new Error('E_INVALID_PRNG_STATE: all-zero state is forbidden');
  return [input[0] >>> 0, input[1] >>> 0, input[2] >>> 0, input[3] >>> 0];
}

function rotateLeft(value: number, bits: number): number {
  return ((value << bits) | (value >>> (32 - bits))) >>> 0;
}

export async function seedToPrngState(seed: string | number): Promise<Xoshiro128State> {
  if (typeof seed !== 'string' && !Number.isSafeInteger(seed)) throw new Error('E_INVALID_PRNG_STATE: seed must be a string or safe integer');
  const bytes = new TextEncoder().encode(`worldline-xoshiro128ss-v1:${String(seed)}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const view = new DataView(digest);
  const state: [number, number, number, number] = [0, 4, 8, 12].map((offset) => view.getUint32(offset, true)) as [number, number, number, number];
  if (state.every((word) => word === 0)) state[0] = 1;
  return Object.freeze(state);
}

export function createPrng(initialState: readonly number[]) {
  let state = validateState(initialState);
  const nextUint32 = (): number => {
    const result = Math.imul(rotateLeft(Math.imul(state[1], 5) >>> 0, 7), 9) >>> 0;
    const shifted = (state[1] << 9) >>> 0;
    state[2] = (state[2] ^ state[0]) >>> 0;
    state[3] = (state[3] ^ state[1]) >>> 0;
    state[1] = (state[1] ^ state[2]) >>> 0;
    state[0] = (state[0] ^ state[3]) >>> 0;
    state[2] = (state[2] ^ shifted) >>> 0;
    state[3] = rotateLeft(state[3], 11);
    return result;
  };
  const nextInt = (maxExclusive: number): number => {
    if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive >= UINT32_RANGE) {
      throw new Error('E_INVALID_PRNG_STATE: bound must be from 1 through 4294967295');
    }
    const limit = UINT32_RANGE - (UINT32_RANGE % maxExclusive);
    let value: number;
    do value = nextUint32(); while (value >= limit);
    return value % maxExclusive;
  };
  const snapshot = (): Xoshiro128State => Object.freeze([...state]) as Xoshiro128State;
  const clone = () => createPrng(snapshot());
  return Object.freeze({ nextUint32, nextInt, snapshot, clone });
}
