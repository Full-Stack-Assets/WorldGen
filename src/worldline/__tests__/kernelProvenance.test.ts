import { describe, expect, it } from 'vitest';
import { hashCanonical } from '../kernel/hash';
import { createProducerIdentity, verifyProducerIdentity } from '../kernel/producerIdentity';
import { verifyTransitionReceipt } from '../kernel/receipts';
import type { TransitionReceiptEnvelope } from '../kernel/types';

describe('kernel provenance and receipt integrity', () => {
  it('derives producer identity from the complete provenance payload', () => {
    const base = {
      foundationModel: { provider: 'demo', model: 'model', version: '1' },
      promptBundleDigest: 'sha256:prompt' as const,
      harnessDigest: 'sha256:harness-a' as const,
      memoryDigest: null,
      toolRegistryDigest: 'sha256:tools' as const,
      skillRegistryDigest: 'sha256:skills' as const,
      runtimeVersion: '1',
      runtimeParametersDigest: 'sha256:params' as const,
      harnessGenerator: null,
    };
    const first = createProducerIdentity(base);
    const replay = createProducerIdentity(base);
    const changedHarness = createProducerIdentity({ ...base, harnessDigest: 'sha256:harness-b' as const });
    expect(first.producerId).toBe(replay.producerId);
    expect(first.producerId).not.toBe(changedHarness.producerId);
    expect(verifyProducerIdentity(first)).toBe(true);
    expect(verifyProducerIdentity({ ...first, harnessDigest: 'sha256:tampered' })).toBe(false);
  });

  it('detects deterministic receipt-core tampering', () => {
    const receipt: TransitionReceiptEnvelope = {
      schema: 'worldline-transition-receipt-v1',
      core: {
        schema: 'worldline-transition-receipt-core-v1', baseRevisionId: 'r0', baseStateHash: null,
        mechanismId: 'm', mechanismHash: 'sha256:m', proposalId: 'p', inputHash: 'sha256:i', producerId: 'producer:p',
        kernelVersion: '1.0.0', prngId: null, seed: null, readSet: [], writeSet: [], gates: [], invariants: [],
        candidateStateHash: null, replayStateHash: null, verifierId: 'verifier:v', verifierConfigDigest: 'sha256:v',
        decision: 'REJECTED', humanApprovalReference: null,
      },
      coreHash: 'sha256:placeholder', recordedAt: '2026-08-27T00:00:00Z', notes: [], acceptedRevisionId: null,
    };
    receipt.coreHash = hashCanonical(receipt.core);
    expect(verifyTransitionReceipt(receipt)).toBe(true);
    receipt.core.proposalId = 'tampered';
    expect(verifyTransitionReceipt(receipt)).toBe(false);
  });
});
