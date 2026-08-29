import { expect, it } from 'vitest';
import { createRenderEnvelope, createRenderReceipt } from '../causal/renderBoundary';
import type { CanonicalRevision } from '../causal/types';

function revision(): CanonicalRevision {
  return {
    schema: 'worldline-canonical-revision-v1',
    revisionId: 'revision:test',
    parentRevisionId: null,
    worldId: 'worldgen-prime',
    branchId: 'root',
    sequence: 0,
    simulationTime: 2026,
    stateSchema: 'worldline-state-v1',
    stateHash: 'sha256:state',
    transitionReceiptCoreHash: null,
    epistemicClass: 'GENERATED',
    kernelVersion: 'causal-kernel-v1',
  };
}

it('renderer input is a detached immutable projection with no admission capability', async () => {
  const projection = { metrics: { population: 100 } };
  const envelope = await createRenderEnvelope({
    revision: revision(),
    projection,
    spatialConstraints: {},
    temporalConstraints: { simulationTime: 2026 },
    epistemicLabels: ['GENERATED'],
    renderingIntent: 'world-preview',
    rendererPolicy: { provider: 'procedural-worldgen' },
    seed: 'render-1',
  });
  const before = envelope.projectionDigest;
  projection.metrics.population = 999;
  expect((envelope.projection as { metrics: { population: number } }).metrics.population).toBe(100);
  expect(envelope.projectionDigest).toBe(before);
  expect('admitTransition' in (envelope as unknown as Record<string, unknown>)).toBe(false);
  expect(Object.isFrozen(envelope)).toBe(true);
  expect(Object.isFrozen(envelope.projection)).toBe(true);
});

it('render receipts remain downstream evidence tied to the source revision and projection', async () => {
  const envelope = await createRenderEnvelope({
    revision: revision(),
    projection: { metrics: { population: 100 } },
    spatialConstraints: {},
    temporalConstraints: { simulationTime: 2026 },
    epistemicLabels: ['GENERATED'],
    renderingIntent: 'world-preview',
    rendererPolicy: { provider: 'procedural-worldgen' },
  });
  const receipt = await createRenderReceipt({
    envelope,
    rendererId: 'procedural-worldgen',
    rendererVersion: '1',
    configuration: { quality: 'draft' },
    outputArtifactDigest: 'sha256:artifact',
    benchmarkReceiptIds: ['benchmark:executed'],
  });
  expect(receipt.sourceRevisionId).toBe(envelope.sourceRevisionId);
  expect(receipt.projectionDigest).toBe(envelope.projectionDigest);
  expect(receipt.benchmarkReceiptIds).toEqual(['benchmark:executed']);
  expect('decision' in (receipt as unknown as Record<string, unknown>)).toBe(false);
});
