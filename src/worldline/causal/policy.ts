import { HUMAN_GATED_KINDS, isAutoPromoteEligible, isHumanGatedKind } from '../promotionPolicy';
import type { EpistemicClass } from '../types';
import type { MechanismPromotionStatus, MechanismSourceType, TransitionDecision } from './types';

export interface MechanismExecutionPolicyInput {
  sourceType: MechanismSourceType;
  promotionStatus: MechanismPromotionStatus;
  riskClass: string;
  reversible: boolean;
  machineVerifiable: boolean;
  independentVerificationPassed: boolean;
}

export function evaluateMechanismExecutionPolicy(input: MechanismExecutionPolicyInput): TransitionDecision {
  if (input.promotionStatus !== 'APPROVED_EXECUTABLE') return 'HUMAN_REQUIRED';
  if (isHumanGatedKind(input.riskClass)) return 'HUMAN_REQUIRED';
  if (!input.independentVerificationPassed) return 'REJECTED';
  if (isAutoPromoteEligible({
    kind: input.riskClass,
    reversible: input.reversible,
    machineVerifiable: input.machineVerifiable,
    independentVerificationPassed: input.independentVerificationPassed,
  })) return 'ACCEPTED';
  if (!input.reversible || !input.machineVerifiable) return 'HUMAN_REQUIRED';
  return 'HUMAN_REQUIRED';
}

export interface EpistemicTransitionInput {
  from: EpistemicClass;
  to: EpistemicClass;
  evidenceIngestAuthorized?: boolean;
  reconstructionAuthorized?: boolean;
}

export function validateEpistemicTransition(input: EpistemicTransitionInput): void {
  if (input.from === input.to) return;
  if (input.to === 'OBSERVED') {
    if (!input.evidenceIngestAuthorized) throw new Error('Epistemic uplift requires authorized evidence ingest');
    return;
  }
  if (input.to === 'RECONSTRUCTED') {
    if (!input.reconstructionAuthorized) throw new Error('Reconstruction requires authorized evidence derivation');
    return;
  }
  if (input.to === 'SIMULATED' || input.to === 'GENERATED' || input.to === 'SPECULATIVE') return;
  throw new Error('Unsupported epistemic transition');
}

export { HUMAN_GATED_KINDS };
