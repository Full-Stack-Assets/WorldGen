import { hashCanonical } from './hash';
import type { ProducerIdentity } from './types';

export type ProducerIdentityInput = Omit<ProducerIdentity, 'schema' | 'producerId'>;

function producerIdentityPayload(input: ProducerIdentityInput | ProducerIdentity): ProducerIdentityInput {
  return {
    foundationModel: input.foundationModel,
    promptBundleDigest: input.promptBundleDigest,
    harnessDigest: input.harnessDigest,
    memoryDigest: input.memoryDigest,
    toolRegistryDigest: input.toolRegistryDigest,
    skillRegistryDigest: input.skillRegistryDigest,
    runtimeVersion: input.runtimeVersion,
    runtimeParametersDigest: input.runtimeParametersDigest,
    harnessGenerator: input.harnessGenerator,
  };
}

export function computeProducerId(input: ProducerIdentityInput | ProducerIdentity): string {
  return `producer:${hashCanonical(producerIdentityPayload(input)).slice('sha256:'.length)}`;
}

export function createProducerIdentity(input: ProducerIdentityInput): ProducerIdentity {
  return {
    schema: 'worldline-producer-identity-v1',
    producerId: computeProducerId(input),
    ...structuredClone(input),
  };
}

export function verifyProducerIdentity(identity: ProducerIdentity): boolean {
  return identity.schema === 'worldline-producer-identity-v1'
    && identity.producerId === computeProducerId(identity);
}
