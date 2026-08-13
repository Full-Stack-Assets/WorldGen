import { isAutoPromoteEligible, promotionBoundaryReason } from './promotionPolicy';

export type RecursiveStage =
  | 'OBSERVE' | 'DETECT' | 'EXPLAIN' | 'CHALLENGE' | 'EXPERIMENT' | 'BUILD'
  | 'EXECUTE' | 'COMPARE' | 'VERIFY' | 'PROMOTE_REJECT' | 'MONITOR' | 'REALITY_WAKE' | 'REOPEN';

export type CandidateKind = 'REVERSIBLE_TUNING' | 'RENDER_OPTIMIZATION' | 'ARCHITECTURAL' | 'SCIENTIFIC_CLAIM' | 'AUTHORITY_POLICY';
export type CandidateStatus = 'PROPOSED' | 'EVALUATED' | 'VERIFIED' | 'AUTO_PROMOTABLE' | 'REJECTED' | 'REQUIRES_APPROVAL';

export interface EvaluationContract {
  id: string;
  metric: 'qualityScore';
  minimumScore: number;
  regressionFloor: number;
  immutable: true;
}

export interface RecursiveCandidate {
  id: string;
  kind: CandidateKind;
  label: string;
  parentObservationId: string;
  proposedScore: number;
  reversible: boolean;
  machineVerifiable: boolean;
  status: CandidateStatus;
  evaluationContractId: string;
}

export interface VerificationRecord {
  evaluatorId: string;
  evaluationContractId: string;
  candidateId: string;
  passed: boolean;
  reason: string;
}

export interface PromotionDecision {
  candidateId: string | null;
  status: 'NO_PROMOTION' | 'AUTO_PROMOTED' | 'REQUIRES_APPROVAL';
  reason: string;
}

export interface RecursiveCycleResult {
  stages: RecursiveStage[];
  observationId: string;
  anomalyDetected: boolean;
  evaluationContract: EvaluationContract;
  candidates: RecursiveCandidate[];
  verifications: VerificationRecord[];
  verification: VerificationRecord;
  promotion: PromotionDecision;
  lineage: string[];
}

export const RECURSIVE_STAGES: RecursiveStage[] = [
  'OBSERVE', 'DETECT', 'EXPLAIN', 'CHALLENGE', 'EXPERIMENT', 'BUILD', 'EXECUTE',
  'COMPARE', 'VERIFY', 'PROMOTE_REJECT', 'MONITOR', 'REALITY_WAKE', 'REOPEN',
];

export function detectRegression(baselineScore: number, observedScore: number): boolean {
  return observedScore < baselineScore;
}

export function generateCandidates(input: {
  observationId: string;
  observedScore: number;
  contract: EvaluationContract;
  forceArchitecturalCandidate?: boolean;
}): RecursiveCandidate[] {
  const improvement = Math.min(1.15, input.observedScore + 0.18);
  const candidates: RecursiveCandidate[] = [
    {
      id: 'candidate-tuning',
      kind: 'REVERSIBLE_TUNING',
      label: 'Reversible temporal consistency tuning',
      parentObservationId: input.observationId,
      proposedScore: improvement,
      reversible: true,
      machineVerifiable: true,
      status: 'PROPOSED',
      evaluationContractId: input.contract.id,
    },
    {
      id: 'candidate-control',
      kind: 'RENDER_OPTIMIZATION',
      label: 'Aggressive render shortcut control',
      parentObservationId: input.observationId,
      proposedScore: Math.max(0, input.observedScore - 0.05),
      reversible: true,
      machineVerifiable: true,
      status: 'PROPOSED',
      evaluationContractId: input.contract.id,
    },
  ];
  if (input.forceArchitecturalCandidate) {
    candidates.push({
      id: 'candidate-architecture',
      kind: 'ARCHITECTURAL',
      label: 'Replace canonical state representation',
      parentObservationId: input.observationId,
      proposedScore: Math.max(improvement, input.contract.minimumScore + 0.05),
      reversible: false,
      machineVerifiable: false,
      status: 'PROPOSED',
      evaluationContractId: input.contract.id,
    });
  }
  return candidates;
}

export function evaluateCandidate(candidate: RecursiveCandidate, contract: EvaluationContract): RecursiveCandidate {
  if (candidate.evaluationContractId !== contract.id) {
    return { ...candidate, status: 'REJECTED' };
  }
  const passed = candidate.proposedScore >= contract.minimumScore;
  return { ...candidate, status: passed ? 'EVALUATED' : 'REJECTED' };
}

export function verifyCandidate(candidate: RecursiveCandidate, contract: EvaluationContract): VerificationRecord {
  const sameContract = candidate.evaluationContractId === contract.id;
  const passedScore = candidate.proposedScore >= contract.minimumScore;
  return {
    evaluatorId: 'independent-verifier-v1',
    evaluationContractId: contract.id,
    candidateId: candidate.id,
    passed: sameContract && passedScore,
    reason: !sameContract
      ? 'Candidate attempted evaluation-contract drift.'
      : passedScore
        ? 'Candidate satisfies the frozen evaluation contract.'
        : 'Candidate fails the frozen minimum score.',
  };
}

export function decidePromotion(candidate: RecursiveCandidate, verification: VerificationRecord): PromotionDecision {
  if (!verification.passed) {
    return { candidateId: candidate.id, status: 'NO_PROMOTION', reason: verification.reason };
  }
  if (!isAutoPromoteEligible({
    kind: candidate.kind,
    reversible: candidate.reversible,
    machineVerifiable: candidate.machineVerifiable,
    independentVerificationPassed: verification.passed,
  })) {
    return {
      candidateId: candidate.id,
      status: 'REQUIRES_APPROVAL',
      reason: promotionBoundaryReason(candidate.kind),
    };
  }
  return {
    candidateId: candidate.id,
    status: 'AUTO_PROMOTED',
    reason: 'Low-risk reversible candidate passed independent machine-verifiable gates.',
  };
}

export function runRecursiveCycle(input: {
  baselineScore: number;
  observedScore: number;
  forceArchitecturalCandidate?: boolean;
}): RecursiveCycleResult {
  const observationId = `observation-${Math.round(input.observedScore * 1000)}`;
  const anomalyDetected = detectRegression(input.baselineScore, input.observedScore);
  const evaluationContract: EvaluationContract = Object.freeze({
    id: `contract-v1-${Math.round(input.baselineScore * 1000)}`,
    metric: 'qualityScore',
    minimumScore: Math.max(0, input.baselineScore - 0.08),
    regressionFloor: Math.max(0, input.baselineScore - 0.2),
    immutable: true,
  });

  if (!anomalyDetected) {
    const verification: VerificationRecord = {
      evaluatorId: 'independent-verifier-v1',
      evaluationContractId: evaluationContract.id,
      candidateId: 'none',
      passed: true,
      reason: 'No regression detected.',
    };
    return {
      stages: RECURSIVE_STAGES,
      observationId,
      anomalyDetected,
      evaluationContract,
      candidates: [],
      verifications: [verification],
      verification,
      promotion: { candidateId: null, status: 'NO_PROMOTION', reason: 'No candidate required.' },
      lineage: [observationId, evaluationContract.id],
    };
  }

  const proposed = generateCandidates({
    observationId,
    observedScore: input.observedScore,
    contract: evaluationContract,
    forceArchitecturalCandidate: input.forceArchitecturalCandidate,
  });
  const evaluated = proposed.map((candidate) => evaluateCandidate(candidate, evaluationContract));
  const verifications = evaluated.map((candidate) => verifyCandidate(candidate, evaluationContract));
  const candidates = evaluated.map((candidate, index) => {
    const verification = verifications[index];
    if (!verification.passed) return { ...candidate, status: 'REJECTED' as const };
    const decision = decidePromotion(candidate, verification);
    if (decision.status === 'AUTO_PROMOTED') return { ...candidate, status: 'AUTO_PROMOTABLE' as const };
    if (decision.status === 'REQUIRES_APPROVAL') return { ...candidate, status: 'REQUIRES_APPROVAL' as const };
    return { ...candidate, status: 'VERIFIED' as const };
  });

  const best = [...candidates]
    .filter((candidate) => candidate.status !== 'REJECTED')
    .sort((a, b) => b.proposedScore - a.proposedScore)[0];
  const verification = best
    ? verifications.find((item) => item.candidateId === best.id) ?? verifications[0]
    : verifications[0];
  const promotion = best
    ? decidePromotion(best, verification)
    : { candidateId: null, status: 'NO_PROMOTION' as const, reason: 'All candidates failed.' };

  return {
    stages: RECURSIVE_STAGES,
    observationId,
    anomalyDetected,
    evaluationContract,
    candidates,
    verifications,
    verification,
    promotion,
    lineage: [observationId, evaluationContract.id, ...candidates.map((candidate) => candidate.id)],
  };
}
