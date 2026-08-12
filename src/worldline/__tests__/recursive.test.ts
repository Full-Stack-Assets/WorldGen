import { describe, expect, it } from 'vitest';
import { runRecursiveCycle } from '../recursive';

describe('constitutional recursive autonomy', () => {
  it('rejects a failing candidate and records lineage', () => {
    const result = runRecursiveCycle({ baselineScore: 1, observedScore: 0.7 });
    expect(result.candidates.some((candidate) => candidate.status === 'REJECTED')).toBe(true);
    expect(result.lineage.length).toBeGreaterThan(0);
  });

  it('does not allow a candidate to replace its deciding test', () => {
    const result = runRecursiveCycle({ baselineScore: 1, observedScore: 0.7 });
    expect(result.evaluationContract.id).toBe(result.verification.evaluationContractId);
    expect(result.evaluationContract.immutable).toBe(true);
  });

  it('gates architectural candidates even when their score improves', () => {
    const result = runRecursiveCycle({ baselineScore: 1, observedScore: 0.7, forceArchitecturalCandidate: true });
    const candidate = result.candidates.find((item) => item.kind === 'ARCHITECTURAL');
    expect(candidate?.status).toBe('REQUIRES_APPROVAL');
  });
});
