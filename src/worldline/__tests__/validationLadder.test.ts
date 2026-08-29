import { describe, expect, it } from 'vitest';
import { CONTROLLED_VALIDATION_FIXTURES, NEW_BEDFORD_SCENARIO_LAB, strongestObservation, verifyValidationScenario } from '../validationLadder';

describe('validation ladder', () => {
  it('verifies complete synthetic and robotic simulator paths without upgrading evidence', async () => {
    for (const scenario of CONTROLLED_VALIDATION_FIXTURES) {
      expect((await verifyValidationScenario(scenario)).status).toBe('PATH_VERIFIED');
      expect(scenario.epistemicClass).toBe('SIMULATED');
    }
  });
  it('keeps physical observation sovereign over simulator output', () => {
    expect(strongestObservation([
      { observationId: 'sim', strength: 'SIMULATED', value: 'success', evidenceRef: 'sim://1' },
      { observationId: 'physical', strength: 'PHYSICAL', value: 'failure', evidenceRef: 'sensor://1' },
      { observationId: 'hil', strength: 'HARDWARE_IN_LOOP', value: 'success', evidenceRef: 'hil://1' },
    ])).toMatchObject({ strength: 'PHYSICAL', value: 'failure' });
  });
  it('verifies New Bedford only as bounded scenario analysis with separate clocks', async () => {
    const receipt = await verifyValidationScenario(NEW_BEDFORD_SCENARIO_LAB);
    expect(receipt).toMatchObject({ status: 'PATH_VERIFIED', claimBoundary: 'SCENARIO_ANALYSIS_NOT_PREDICTION' });
    expect(receipt.sourceTime).not.toBe(receipt.simulationTime);
    expect(NEW_BEDFORD_SCENARIO_LAB.expertReviewRequired).toBe(true);
  });
  it('rejects municipal prediction claims', async () => {
    await expect(verifyValidationScenario({ ...NEW_BEDFORD_SCENARIO_LAB, claimBoundary: 'GROUND_TRUTH_FIXTURE' })).rejects.toThrow('scenario analysis');
  });
});
