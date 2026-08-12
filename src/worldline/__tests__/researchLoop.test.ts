import { describe, expect, it } from 'vitest';
import { reopenResearchDecision, runDataUpdateCycle } from '../researchLoop';

describe('recursive research loop', () => {
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

  it('records Reality Wake without rewriting the prior observation values', () => {
    const cycle = runDataUpdateCycle({ previousValue: 10, incomingValue: 14 });
    expect(cycle.realityWake.previousValue).toBe(10);
    expect(cycle.realityWake.incomingValue).toBe(14);
    expect(cycle.realityWake.message).toBe('The set of futures consistent with current evidence changed.');
  });

  it('reopens a prior decision without mutating the original cycle', () => {
    const cycle = runDataUpdateCycle({ previousValue: 10, incomingValue: 14 });
    const before = JSON.stringify(cycle);
    const reopened = reopenResearchDecision(cycle, 'Later evidence contradicted the reconciliation.', 'source-update-14-9');
    expect(JSON.stringify(cycle)).toBe(before);
    expect(reopened.reopen.triggeringObservationId).toBe('source-update-14-9');
    expect(reopened.reopen.decisionId).toContain(cycle.observationId);
    expect(reopened.realityWake.previousValue).toBe(10);
  });
});
