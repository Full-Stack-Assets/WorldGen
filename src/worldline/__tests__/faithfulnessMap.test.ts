import { describe, expect, it } from 'vitest';
import {
  createRegimeConditionedFaithfulnessMap,
  verifyFaithfulnessMapSnapshot,
  type FaithfulnessObservation,
} from '../causal/faithfulnessMap';

function digest(character: string): `sha256:${string}` {
  return `sha256:${character.repeat(64)}`;
}

function observation(id: string, success: boolean, regimeId = 'new-bedford-current-law'): FaithfulnessObservation {
  return {
    schema: 'worldline-faithfulness-observation-v1',
    observationId: id,
    model: { provider: 'test', model: 'causal-model', version: '1' },
    taskFamily: 'municipal-housing-intervention',
    capability: 'HIDDEN_RULE_ROBUSTNESS',
    regime: {
      regimeId,
      domain: 'municipal-housing',
      geography: 'new-bedford',
      temporalHorizon: '2026-2046',
      mechanismClass: 'housing-capacity',
      epistemicClass: 'SIMULATED',
    },
    complexity: 'MULTI_HOP',
    success,
    causalBlastPrecision: success ? 1 : 0.5,
    causalBlastRecall: success ? 1 : 0.5,
    decisionRegret: success ? 0 : 0.3,
    costUsd: 0.04,
    latencyMs: 850,
    evaluationReceiptHash: digest('a'),
    attestationHash: digest('b'),
  };
}

describe('regime-conditioned faithfulness map', () => {
  it('keeps empirical capability evidence in exact regime cells instead of a global score', async () => {
    const map = createRegimeConditionedFaithfulnessMap();
    await map.record(observation('1', true));
    await map.record(observation('2', false));
    await map.record(observation('3', true, 'new-bedford-zoning-reform'));

    const cell = map.getCell({
      model: { provider: 'test', model: 'causal-model', version: '1' },
      taskFamily: 'municipal-housing-intervention',
      capability: 'HIDDEN_RULE_ROBUSTNESS',
      regime: observation('x', true).regime,
      complexity: 'MULTI_HOP',
    });
    expect(cell?.trials).toBe(2);
    expect(cell?.successes).toBe(1);
    expect(cell?.empiricalSuccessRate).toBe(0.5);
    expect(map.cells()).toHaveLength(2);
    expect('globalScore' in map).toBe(false);
  });

  it('is idempotent for identical evidence and rejects observation replacement', async () => {
    const map = createRegimeConditionedFaithfulnessMap();
    const first = observation('1', true);
    await map.record(first);
    await map.record(first);
    expect(map.cells()[0].trials).toBe(1);
    await expect(map.record({ ...first, success: false })).rejects.toThrow('Faithfulness observation replacement rejected');

    const snapshot = await map.exportSnapshot();
    expect(await verifyFaithfulnessMapSnapshot(snapshot)).toBe(true);
  });
});
