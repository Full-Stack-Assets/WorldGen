import { describe, expect, it } from 'vitest';
import { deriveProducerId } from '../causal/producerIdentity';

const BASE = {
  model: { provider: 'example', model: 'coder-v1', version: '1' },
  promptBundleDigest: 'sha256:prompt',
  harnessDigest: 'sha256:harness-a',
  memoryDigest: 'sha256:memory',
  toolRegistryDigest: 'sha256:tools',
  skillRegistryDigest: 'sha256:skills',
  runtimeDigest: 'sha256:runtime',
  decoding: { temperature: 0 },
};

describe('producer identity', () => {
  it('changes when the generated harness changes', async () => {
    const first = await deriveProducerId(BASE);
    const second = await deriveProducerId({ ...BASE, harnessDigest: 'sha256:harness-b' });
    expect(first).not.toBe(second);
  });
});
