import { describe, expect, it } from 'vitest';
import type {
  CanonicalRevision,
  ProducerIdentity,
  RenderEnvelope,
  TransitionMechanismArtifact,
  TransitionProposal,
} from '../kernel/types';

describe('Worldline causal kernel contracts', () => {
  it('binds proposals and render envelopes to explicit causal identities', () => {
    const producer: ProducerIdentity = {
      schema: 'worldline-producer-identity-v1',
      producerId: 'producer:demo',
      foundationModel: { provider: 'demo', model: 'demo-model', version: '1' },
      promptBundleDigest: 'sha256:abc',
      harnessDigest: 'sha256:def',
      memoryDigest: null,
      toolRegistryDigest: 'sha256:ghi',
      skillRegistryDigest: null,
      runtimeVersion: '1.0.0',
      runtimeParametersDigest: 'sha256:jkl',
      harnessGenerator: null,
    };

    const mechanism: TransitionMechanismArtifact = {
      schema: 'worldline-transition-mechanism-v1',
      mechanismId: 'mechanism:demo',
      mechanismHash: 'sha256:123',
      producerId: producer.producerId,
      sourceType: 'AGENT_GENERATED',
      executorKind: 'TRANSITION_IR_V1',
      stateSchema: 'worldline-canonical-state-v1',
      inputSchema: 'worldline-input-v1',
      readSet: ['/worlds'],
      writeSet: ['/branches'],
      epistemicCeiling: 'SIMULATED',
      deterministicSeedPolicy: 'REQUIRED',
      invariantSuiteIds: ['core'],
      riskClass: 'LOW',
      executionPolicy: 'AUTO_LOW_RISK',
      promotionStatus: 'CANDIDATE',
      approvalReceiptId: null,
      ir: { version: '1', operations: [] },
    };

    const proposal: TransitionProposal = {
      schema: 'worldline-transition-proposal-v1',
      proposalId: 'proposal:demo',
      baseRevisionId: 'revision:0',
      mechanismId: mechanism.mechanismId,
      normalizedInputs: { amount: 2 },
      inputHash: 'sha256:456',
      seed: 'seed-1',
      producerId: producer.producerId,
      causalClaims: [],
    };

    const revision: CanonicalRevision = {
      schema: 'worldline-canonical-revision-v1',
      revisionId: 'revision:1',
      parentRevisionId: 'revision:0',
      worldId: 'worldgen-prime',
      branchId: 'branch-root',
      sequence: 1,
      simulationTime: 2030,
      stateSchema: 'worldline-canonical-state-v1',
      stateHash: 'sha256:789',
      transitionReceiptCoreHash: 'sha256:999',
      epistemicClass: 'SIMULATED',
      kernelVersion: '1.0.0',
    };

    const envelope: RenderEnvelope = {
      schema: 'worldline-render-envelope-v1',
      sourceRevisionId: revision.revisionId,
      sourceStateHash: revision.stateHash,
      projectionDigest: 'sha256:aaa',
      projection: { entities: [] },
      spatialConstraints: [],
      temporalConstraints: [],
      epistemicClass: revision.epistemicClass,
      renderingIntent: 'overview',
      rendererPolicy: 'readonly',
      renderSeed: 'seed-r',
    };

    expect(proposal.mechanismId).toBe(mechanism.mechanismId);
    expect(proposal.producerId).toBe(producer.producerId);
    expect(envelope.sourceRevisionId).toBe(revision.revisionId);
    expect(envelope.sourceStateHash).toBe(revision.stateHash);
  });
});
