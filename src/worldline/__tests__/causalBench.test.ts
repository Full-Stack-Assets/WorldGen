import { describe, expect, it } from 'vitest';
import { runCausalBench, WORLDLINE_CAUSALBENCH_V1, type CausalBenchObservation } from '../causalBench';

function completeObservations(): CausalBenchObservation[] {
  return WORLDLINE_CAUSALBENCH_V1.map((dimension, index) => ({
    caseId: `case-${dimension.level}`,
    level: dimension.level,
    passed: index < 3 || index % 2 === 0,
    weight: 1,
    detail: `Executed ${dimension.label}`,
    evidenceRefs: [`receipt:${dimension.level}`],
  }));
}

describe('worldline-causalbench-v1', () => {
  it('keeps visual fidelity separate from causal reliability', async () => {
    const receipt = await runCausalBench({
      artifactVersion: 'worldline-internal-v1',
      evaluatorConfigId: 'causalbench-fixed-evaluator-v1',
      verifierId: 'verifier:causalbench-v1',
      heldOut: true,
      observations: completeObservations(),
    });
    expect(receipt.status).toBe('COMPLETED');
    expect(receipt.visualFidelity).toBe(100);
    expect(receipt.causalReliability).toBeLessThan(receipt.visualFidelity);
    expect(receipt.dimensionScores.C4).toBe(100);
  });

  it('fails compatibility rather than inventing scores for missing dimensions', async () => {
    const receipt = await runCausalBench({
      artifactVersion: 'worldline-internal-v1',
      evaluatorConfigId: 'causalbench-fixed-evaluator-v1',
      verifierId: 'verifier:causalbench-v1',
      heldOut: false,
      observations: completeObservations().filter((observation) => observation.level === 'C0'),
    });
    expect(receipt.status).toBe('INCOMPATIBLE');
    expect(receipt.causalReliability).toBe(0);
    expect(receipt.limitations.join(' ')).toContain('not held out');
    expect(receipt.limitations.join(' ')).toContain('Missing benchmark dimensions');
  });

  it('requires evidence for every executed case', async () => {
    const observations = completeObservations();
    observations[0] = { ...observations[0], evidenceRefs: [] };
    await expect(runCausalBench({
      artifactVersion: 'worldline-internal-v1', evaluatorConfigId: 'fixed', verifierId: 'verifier', heldOut: true, observations,
    })).rejects.toThrow('requires detail and evidence');
  });
});
