import { hashCanonical } from './canonicalJson';
import type { ProducerIdentityInput } from './types';

export async function deriveProducerId(input: ProducerIdentityInput): Promise<string> {
  const digest = await hashCanonical({ schema: 'worldline-producer-identity-v1', ...input });
  return `producer:${digest.slice('sha256:'.length)}`;
}
