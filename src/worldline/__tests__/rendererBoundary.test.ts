import { describe, expect, it } from 'vitest';
import { createRenderEnvelope, createRenderReceipt } from '../kernel/projection';
import { createGenesisRevision } from '../kernel/revisionStore';
import type { CanonicalWorldState } from '../kernel/types';

function stateFixture(): CanonicalWorldState {
  return {
    schema: 'worldline-canonical-state-v1',
    worlds: [{
      id: 'w1',
      name: 'World',
      kind: 'GENERATED',
      epistemicClass: 'GENERATED',
      fidelity: 'FIELD',
      provider: 'test',
      description: 'fixture',
    }],
    branches: {},
  };
}

describe('renderer isolation boundary', () => {
  it('creates a recursively immutable render envelope tied to canonical revision content', () => {
    const state = stateFixture();
    const genesis = createGenesisRevision({
      worldId: 'w1', branchId: 'root', simulationTime: 2026, state,
      epistemicClass: 'GENERATED', kernelVersion: '1.0.0',
    });

    const envelope = createRenderEnvelope({
      revision: genesis.revision,
      state,
      renderingIntent: 'overview',
      rendererPolicy: 'readonly',
    });

    expect(envelope.sourceRevisionId).toBe(genesis.revision.revisionId);
    expect(envelope.sourceStateHash).toBe(genesis.revision.stateHash);
    expect(Object.isFrozen(envelope.projection)).toBe(true);
    const projection = envelope.projection as { worlds: unknown[] };
    expect(Object.isFrozen(projection.worlds)).toBe(true);
    expect(Object.isFrozen(projection.worlds[0])).toBe(true);
    expect('store' in (envelope as unknown as Record<string, unknown>)).toBe(false);
  });

  it('rejects rendering a state that does not match the canonical revision hash', () => {
    const state = stateFixture();
    const genesis = createGenesisRevision({
      worldId: 'w1', branchId: 'root', simulationTime: 2026, state,
      epistemicClass: 'GENERATED', kernelVersion: '1.0.0',
    });
    const tampered = stateFixture();
    tampered.worlds[0].name = 'Tampered';
    expect(() => createRenderEnvelope({
      revision: genesis.revision,
      state: tampered,
      renderingIntent: 'overview',
      rendererPolicy: 'readonly',
    })).toThrow(/state hash/i);
  });

  it('creates a downstream render receipt bound to the source projection', () => {
    const state = stateFixture();
    const genesis = createGenesisRevision({
      worldId: 'w1', branchId: 'root', simulationTime: 2026, state,
      epistemicClass: 'GENERATED', kernelVersion: '1.0.0',
    });
    const envelope = createRenderEnvelope({
      revision: genesis.revision,
      state,
      renderingIntent: 'overview',
      rendererPolicy: 'readonly',
      renderSeed: 'render-seed',
    });
    const receipt = createRenderReceipt({
      envelope,
      rendererId: 'renderer:test',
      rendererVersion: '1',
      promptConfigDigest: 'sha256:prompt',
      outputArtifactDigest: 'sha256:artifact',
      outputArtifactLocator: null,
      evaluationReceiptIds: ['eval:b', 'eval:a'],
    });

    expect(receipt.sourceRevisionId).toBe(genesis.revision.revisionId);
    expect(receipt.projectionDigest).toBe(envelope.projectionDigest);
    expect(receipt.renderSeed).toBe('render-seed');
    expect(receipt.evaluationReceiptIds).toEqual(['eval:a', 'eval:b']);
  });
});
