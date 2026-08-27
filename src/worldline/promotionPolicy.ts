import type { EpistemicClass } from './types';
import type { MechanismExecutionPolicy, TransitionRiskClass } from './kernel/types';

export type AutoPromoteKind =
  | 'LOW_RISK_RENDERING'
  | 'DATA_NORMALIZATION'
  | 'REVERSIBLE_TUNING'
  | 'RENDER_OPTIMIZATION';

export const AUTO_PROMOTE_KINDS: readonly AutoPromoteKind[] = [
  'LOW_RISK_RENDERING',
  'DATA_NORMALIZATION',
  'REVERSIBLE_TUNING',
  'RENDER_OPTIMIZATION',
] as const;

export const HUMAN_GATED_KINDS = [
  'ARCHITECTURAL',
  'SCIENTIFIC_CLAIM',
  'AUTHORITY_POLICY',
  'POLICY',
  'MODEL',
  'BENCHMARK',
] as const;

export function isAutoPromoteEligible(input: {
  kind: string;
  reversible: boolean;
  machineVerifiable: boolean;
  independentVerificationPassed: boolean;
}): boolean {
  if (!input.independentVerificationPassed) return false;
  if (!input.reversible || !input.machineVerifiable) return false;
  return (AUTO_PROMOTE_KINDS as readonly string[]).includes(input.kind);
}

export function promotionBoundaryReason(kind: string): string {
  if ((HUMAN_GATED_KINDS as readonly string[]).includes(kind)) {
    return 'Architecture, policy, model, benchmark, and scientific-claim changes remain human-gated.';
  }
  return 'Only reversible machine-verifiable low-risk rendering or data-normalization candidates may auto-promote.';
}

export function requiresHumanApprovalForTransition(input: {
  decisionType: 'MECHANISM_PROMOTION' | 'EXECUTION_PROMOTION';
  mechanismRiskClass: TransitionRiskClass;
  executionPolicy: MechanismExecutionPolicy;
  epistemicClass: EpistemicClass;
  ambiguousPolicy: boolean;
}): boolean {
  if (input.decisionType === 'MECHANISM_PROMOTION') return true;
  if (input.ambiguousPolicy) return true;
  if (input.executionPolicy === 'HUMAN_EACH_EXECUTION') return true;
  if (input.mechanismRiskClass !== 'LOW') return true;
  if (input.epistemicClass === 'OBSERVED' || input.epistemicClass === 'RECONSTRUCTED') return true;
  return false;
}
