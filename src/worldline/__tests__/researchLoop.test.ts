import { describe, expect, it } from 'vitest';
import { runDataUpdateCycle } from '../researchLoop';

describe('recursive research loop v0.2', () => {
  it('detects a conflict, rejects a weaker candidate, and verifies a winner independently', () => {
    const cycle = runDataUpdateCycle({ previousValue: 10, incomingValue: 14 });
    expect(cycle.stageHistory).toContain('DETECT');
    expect(cycle.candidates.some((candidate) => candidate.status === 'REJECTED')).toBe(true);
    expect(cycle.verifier.generatorId).not.toBe(cycle.verifier.verifierId);
    expect(cycle.promotion.status).toBe('AUTO_PROMOTED');
  });

  it('blocks a candidate that changes its deciding evaluator', () => {
    const cycle = runDataUpdateCycle({ previousValue: 10, incomingValue: 14, mutateEvaluator: true });
    const mutated = cycle.candidates.find((candidate) => candidate.id === 'candidate-normalize-new-source');
    expect(mutated?.status).toBe('REJECTED');
  });

  it('keeps architectural candidates gated', () => {
    const cycle = runDataUpdateCycle({ previousValue: 10, incomingValue: 14, forceArchitecturalCandidate: true });
    const architectural = cycle.candidates.find((candidate) => candidate.kind === 'ARCHITECTURAL');
    expect(architectural?.status).toBe('REQUIRES_APPROVAL');
  });
});
