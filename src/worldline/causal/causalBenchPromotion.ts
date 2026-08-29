import { hashCanonical, type Sha256Digest } from './canonicalJson';
import type {
  CausalBenchCandidateIdentity,
  CausalBenchEvaluationReceipt,
  EvaluatorAttestation,
} from './causalBenchAttestation';
import type { createLockedCausalEvaluator } from './lockedCausalEvaluator';
import type { MechanismPromotionEvidenceInput } from './mechanismRegistry';

type LockedCausalEvaluator = Awaited<ReturnType<typeof createLockedCausalEvaluator>>;

export interface LockedCausalBenchEvidenceBundle {
  receipt: CausalBenchEvaluationReceipt;
  attestation: EvaluatorAttestation;
  exactCandidate: CausalBenchCandidateIdentity;
  exactInputState: unknown;
  exactProposal: unknown;
  exactResultingState: unknown;
}

export interface LockedCausalBenchPromotionVerifierOptions {
  lockedEvaluator: LockedCausalEvaluator;
  resolveEvidence(receiptHash: Sha256Digest): LockedCausalBenchEvidenceBundle | null | Promise<LockedCausalBenchEvidenceBundle | null>;
}

/**
 * Adapts a Locked CausalBench evaluator to the MechanismRegistry trust boundary.
 * The evaluated proposal must be byte-identical, after canonicalization, to the
 * mechanism candidate that Human Authority is approving.
 */
export function createLockedCausalBenchPromotionEvidenceVerifier(
  options: LockedCausalBenchPromotionVerifierOptions,
) {
  return async ({ mechanism, approval }: MechanismPromotionEvidenceInput): Promise<boolean> => {
    if (approval.action !== 'PROMOTE' || approval.scope !== 'CANONICAL_ADMISSION') return false;
    const evidence = await options.resolveEvidence(approval.verificationReceiptHash);
    if (!evidence || evidence.receipt.receiptHash !== approval.verificationReceiptHash) return false;
    if (await hashCanonical(evidence.exactProposal) !== await hashCanonical(mechanism)) return false;
    const decision = await options.lockedEvaluator.verify(evidence);
    return decision.decision === 'ELIGIBLE_FOR_HUMAN_REVIEW'
      && decision.canonicalStateEligible
      && decision.requiresHumanAuthority
      && decision.evaluationReceiptHash === approval.verificationReceiptHash
      && decision.reasons.length === 0;
  };
}
