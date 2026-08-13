import { describe, expect, it } from 'vitest';
import { WORLD_MODEL_REFERENCES, WORLD_MODEL_EVALUATION_DIMENSIONS, createWorldModelEvaluationReceipt, scoreFromReceipt } from '../worldModelRegistry';

describe('World model reference registry', () => {
  it('keeps Genie 3 and Cosmos 3 explicitly reference-only until a real adapter is connected', () => {
    const genie = WORLD_MODEL_REFERENCES.find((item) => item.id === 'genie-3');
    const cosmos = WORLD_MODEL_REFERENCES.find((item) => item.id === 'cosmos-3');
    expect(genie?.integrationStatus).toBe('REFERENCE_ONLY');
    expect(cosmos?.integrationStatus).toBe('REFERENCE_ONLY');
    expect(genie?.capabilities).toEqual(expect.arrayContaining(['REAL_TIME_WORLD_GENERATION', 'WORLD_MEMORY', 'PROMPTABLE_EVENTS']));
    expect(cosmos?.capabilities).toEqual(expect.arrayContaining(['PHYSICAL_REASONING', 'WORLD_GENERATION', 'ACTION_GENERATION']));
  });

  it('uses the four 4DWorldBench dimensions as the common evaluation spine', () => {
    expect(WORLD_MODEL_EVALUATION_DIMENSIONS).toEqual([
      'PERCEPTUAL_QUALITY',
      'CONDITION_4D_ALIGNMENT',
      'PHYSICAL_REALISM',
      'FOUR_D_CONSISTENCY',
    ]);
  });

  it('never invents a score for an unevaluated adapter', () => {
    const receipt = createWorldModelEvaluationReceipt({
      modelId: 'genie-3',
      evaluatorId: 'worldline-reference-contract',
      executed: false,
      evidence: [],
    });
    expect(receipt.status).toBe('NOT_EXECUTED');
    expect(receipt.scores).toBeNull();
    expect(scoreFromReceipt(receipt)).toBeNull();
  });

  it('scores only executed receipts that carry evidence', () => {
    const executed = createWorldModelEvaluationReceipt({
      modelId: 'genie-3',
      evaluatorId: '4dworldbench',
      executed: true,
      evidence: ['run-001'],
      scores: {
        PERCEPTUAL_QUALITY: 0.4,
        CONDITION_4D_ALIGNMENT: 0.6,
        PHYSICAL_REALISM: 0.5,
        FOUR_D_CONSISTENCY: 0.5,
      },
    });
    expect(scoreFromReceipt(executed)).toBe(0.5);
    expect(scoreFromReceipt(createWorldModelEvaluationReceipt({
      modelId: 'genie-3',
      evaluatorId: '4dworldbench',
      executed: true,
      evidence: [],
      scores: { PERCEPTUAL_QUALITY: 1 },
    }))).toBeNull();
  });
});
