import { describe, expect, it } from 'vitest';
import {
  isAutoPromoteEligible,
  promotionBoundaryReason,
  requiresHumanApprovalForTransition,
} from '../promotionPolicy';

describe('promotion policy', () => {
  it('auto-promotes only reversible low-risk rendering and data-normalization work', () => {
    expect(isAutoPromoteEligible({
      kind: 'DATA_NORMALIZATION',
      reversible: true,
      machineVerifiable: true,
      independentVerificationPassed: true,
    })).toBe(true);
    expect(isAutoPromoteEligible({
      kind: 'ARCHITECTURAL',
      reversible: true,
      machineVerifiable: true,
      independentVerificationPassed: true,
    })).toBe(false);
  });

  it('blocks scientific claims even when scores improve', () => {
    expect(promotionBoundaryReason('SCIENTIFIC_CLAIM')).toMatch(/human-gated/i);
  });

  it('human-gates every mechanism version before it becomes executable', () => {
    expect(requiresHumanApprovalForTransition({
      decisionType: 'MECHANISM_PROMOTION',
      mechanismRiskClass: 'LOW',
      executionPolicy: 'AUTO_LOW_RISK',
      epistemicClass: 'SIMULATED',
      ambiguousPolicy: false,
    })).toBe(true);
  });

  it('permits only clear low-risk execution policy to avoid a human gate', () => {
    expect(requiresHumanApprovalForTransition({
      decisionType: 'EXECUTION_PROMOTION',
      mechanismRiskClass: 'LOW',
      executionPolicy: 'AUTO_LOW_RISK',
      epistemicClass: 'SIMULATED',
      ambiguousPolicy: false,
    })).toBe(false);

    expect(requiresHumanApprovalForTransition({
      decisionType: 'EXECUTION_PROMOTION',
      mechanismRiskClass: 'LOW',
      executionPolicy: 'HUMAN_EACH_EXECUTION',
      epistemicClass: 'SIMULATED',
      ambiguousPolicy: false,
    })).toBe(true);

    expect(requiresHumanApprovalForTransition({
      decisionType: 'EXECUTION_PROMOTION',
      mechanismRiskClass: 'MEDIUM',
      executionPolicy: 'AUTO_LOW_RISK',
      epistemicClass: 'SIMULATED',
      ambiguousPolicy: false,
    })).toBe(true);

    expect(requiresHumanApprovalForTransition({
      decisionType: 'EXECUTION_PROMOTION',
      mechanismRiskClass: 'LOW',
      executionPolicy: 'AUTO_LOW_RISK',
      epistemicClass: 'OBSERVED',
      ambiguousPolicy: false,
    })).toBe(true);

    expect(requiresHumanApprovalForTransition({
      decisionType: 'EXECUTION_PROMOTION',
      mechanismRiskClass: 'LOW',
      executionPolicy: 'AUTO_LOW_RISK',
      epistemicClass: 'GENERATED',
      ambiguousPolicy: true,
    })).toBe(true);
  });
});
