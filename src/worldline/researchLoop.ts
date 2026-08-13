import { createImprovementMemory, recordCandidateEvaluation, type ImprovementMemory } from './improvementMemory';
import { isAutoPromoteEligible, promotionBoundaryReason } from './promotionPolicy';
import { RECURSIVE_STAGES, type RecursiveStage } from './recursive';
import { compressSkillPatches } from './skillCompression';

export type ResearchCandidateKind =
  | 'LOW_RISK_RENDERING'
  | 'DATA_NORMALIZATION'
  | 'SIMULATION_PARAMETER'
  | 'MODEL_VARIANT'
  | 'BENCHMARK_CANDIDATE'
  | 'ARCHITECTURAL'
  | 'POLICY';

export type ResearchCandidateStatus = 'PROPOSED' | 'REJECTED' | 'VERIFIED' | 'AUTO_PROMOTABLE' | 'REQUIRES_APPROVAL' | 'BLOCKED';

export const RESEARCH_SKILL_COMPRESSION = compressSkillPatches([
  {
    id: 'source-reconciliation',
    trigger: 'new source conflicts with accepted state',
    workflow: ['freeze evaluator', 'generate candidates', 'independent verification', 'write immutable receipt'],
    toolRequirements: ['provenance-store', 'independent-verifier'],
    obligations: ['preserve prior observation', 'emit reality wake'],
    outputFields: ['evaluationContract', 'verifierReceipt', 'promotionReceipt'],
  },
  {
    id: 'world-model-evaluation',
    trigger: 'world model adapter produces candidate output',
    workflow: ['freeze evaluator', 'generate candidates', 'independent verification', 'write immutable receipt'],
    toolRequirements: ['benchmark-adapter', 'independent-verifier'],
    obligations: ['do not invent benchmark success', 'preserve epistemic class'],
    outputFields: ['evaluationContract', 'verifierReceipt', 'promotionReceipt'],
  },
  {
    id: 'restricted-source',
    trigger: 'restricted source enters research intake',
    workflow: ['quarantine source'],
    toolRequirements: ['policy-gate'],
    obligations: ['never enter autonomous training loop'],
    outputFields: ['decisionReceipt'],
  },
]);

export interface FrozenEvaluationContract {
  id: string;
  immutable: true;
  metric: 'reconciliationLoss';
  maximumLoss: number;
}

export interface ResearchCandidate {
  id: string;
  kind: ResearchCandidateKind;
  hypothesis: string;
  value: number;
  loss: number;
  reversible: boolean;
  evaluatorId: string;
  status: ResearchCandidateStatus;
  rollbackRef: string;
}

export interface ResearchVerifierReceipt {
  generatorId: string;
  verifierId: string;
  evaluatorId: string;
  candidateId: string;
  passed: boolean;
  reason: string;
}

export interface ResearchPromotion {
  candidateId: string | null;
  status: 'AUTO_PROMOTED' | 'REQUIRES_APPROVAL' | 'BLOCKED' | 'NO_PROMOTION';
  reason: string;
}

export interface RealityWakeRecord {
  id: string;
  previousObservationId: string;
  incomingObservationId: string;
  previousValue: number;
  incomingValue: number;
  affectedCandidateIds: string[];
  message: string;
}

export interface ReopenRecord {
  id: string;
  decisionId: string;
  reason: string;
  triggeringObservationId: string;
}

export interface ResearchCycle {
  stageHistory: RecursiveStage[];
  observationId: string;
  conflictDetected: boolean;
  evaluationContract: FrozenEvaluationContract;
  candidates: ResearchCandidate[];
  verifier: ResearchVerifierReceipt;
  verifications: ResearchVerifierReceipt[];
  promotion: ResearchPromotion;
  improvementMemory: ImprovementMemory;
  realityWake: RealityWakeRecord;
  realityWakeMessage: string;
  lineage: string[];
}

export interface ReopenedResearchCycle extends ResearchCycle {
  reopen: ReopenRecord;
}

function loss(candidate: number, incoming: number): number {
  return Math.abs(candidate - incoming);
}

function scoreFromLoss(value: number): number {
  return Number((1 / (1 + Math.max(0, value))).toFixed(6));
}

function verify(
  candidate: ResearchCandidate,
  contract: FrozenEvaluationContract,
  generatorId: string,
  verifierId: string,
): ResearchVerifierReceipt {
  const sameEvaluator = candidate.evaluatorId === contract.id;
  const independent = generatorId !== verifierId;
  const passed = sameEvaluator && independent && candidate.loss <= contract.maximumLoss;
  return {
    generatorId,
    verifierId,
    evaluatorId: contract.id,
    candidateId: candidate.id,
    passed,
    reason: !sameEvaluator
      ? 'Candidate attempted to change the deciding evaluator.'
      : !independent
        ? 'Generator and verifier identities are not independent.'
        : passed
          ? 'Candidate passed the frozen reconciliation contract under an independent verifier.'
          : 'Candidate failed the frozen reconciliation loss threshold.',
  };
}

function decide(candidate: ResearchCandidate, receipt: ResearchVerifierReceipt): ResearchPromotion {
  if (!receipt.passed) return { candidateId: candidate.id, status: 'BLOCKED', reason: receipt.reason };
  if (isAutoPromoteEligible({
    kind: candidate.kind,
    reversible: candidate.reversible,
    machineVerifiable: true,
    independentVerificationPassed: receipt.passed,
  })) {
    return { candidateId: candidate.id, status: 'AUTO_PROMOTED', reason: 'Reversible machine-verifiable candidate passed frozen independent verification.' };
  }
  return { candidateId: candidate.id, status: 'REQUIRES_APPROVAL', reason: promotionBoundaryReason(candidate.kind) };
}

function createRealityWake(input: {
  previousValue: number;
  incomingValue: number;
  observationId: string;
  candidateIds: string[];
  conflictDetected: boolean;
}): RealityWakeRecord {
  const previousObservationId = `accepted-source-${input.previousValue}`;
  return {
    id: `reality-wake:${input.observationId}`,
    previousObservationId,
    incomingObservationId: input.observationId,
    previousValue: input.previousValue,
    incomingValue: input.incomingValue,
    affectedCandidateIds: [...input.candidateIds],
    message: input.conflictDetected
      ? 'The set of futures consistent with current evidence changed.'
      : 'No new evidence conflict changed the represented future set.',
  };
}

function buildImprovementMemory(input: {
  previousValue: number;
  incomingValue: number;
  observationId: string;
  evaluationContractId: string;
  selected?: ResearchCandidate;
}): ImprovementMemory {
  const initial = createImprovementMemory({
    championId: `accepted-source-${input.previousValue}`,
    championScore: scoreFromLoss(loss(input.previousValue, input.incomingValue)),
  });
  if (!input.selected) return initial;
  return recordCandidateEvaluation(initial, {
    candidateId: input.selected.id,
    score: scoreFromLoss(input.selected.loss),
    reversible: input.selected.reversible,
    replayExamples: [input.observationId, input.evaluationContractId],
  });
}

export function runDataUpdateCycle(input: {
  previousValue: number;
  incomingValue: number;
  mutateEvaluator?: boolean;
  forceArchitecturalCandidate?: boolean;
}): ResearchCycle {
  const generatorId = 'worldline-candidate-generator-v0.5';
  const verifierId = 'worldline-independent-verifier-v0.5';
  const conflictDetected = input.previousValue !== input.incomingValue;
  const observationId = `source-update-${input.previousValue}-${input.incomingValue}`;
  const evaluationContract: FrozenEvaluationContract = Object.freeze({
    id: `reconciliation-contract-${input.previousValue}-${input.incomingValue}`,
    immutable: true,
    metric: 'reconciliationLoss',
    maximumLoss: Math.max(0.5, Math.abs(input.incomingValue - input.previousValue) * 0.25),
  });

  if (!conflictDetected) {
    const verifier: ResearchVerifierReceipt = {
      generatorId,
      verifierId,
      evaluatorId: evaluationContract.id,
      candidateId: 'none',
      passed: true,
      reason: 'No source conflict detected.',
    };
    const realityWake = createRealityWake({ ...input, observationId, candidateIds: [], conflictDetected });
    return {
      stageHistory: [...RECURSIVE_STAGES],
      observationId,
      conflictDetected,
      evaluationContract,
      candidates: [],
      verifier,
      verifications: [verifier],
      promotion: { candidateId: null, status: 'NO_PROMOTION', reason: 'No reconciliation candidate required.' },
      improvementMemory: buildImprovementMemory({
        previousValue: input.previousValue,
        incomingValue: input.incomingValue,
        observationId,
        evaluationContractId: evaluationContract.id,
      }),
      realityWake,
      realityWakeMessage: realityWake.message,
      lineage: [observationId, evaluationContract.id, realityWake.id],
    };
  }

  const midpoint = (input.previousValue + input.incomingValue) / 2;
  const candidates: ResearchCandidate[] = [
    {
      id: 'candidate-normalize-new-source',
      kind: 'DATA_NORMALIZATION',
      hypothesis: 'Accept the new source value after schema-compatible normalization.',
      value: input.incomingValue,
      loss: loss(input.incomingValue, input.incomingValue),
      reversible: true,
      evaluatorId: input.mutateEvaluator ? `${evaluationContract.id}-mutated` : evaluationContract.id,
      status: 'PROPOSED',
      rollbackRef: `rollback:${observationId}:previous`,
    },
    {
      id: 'candidate-midpoint-control',
      kind: 'DATA_NORMALIZATION',
      hypothesis: 'Blend old and new values as a control candidate.',
      value: midpoint,
      loss: loss(midpoint, input.incomingValue),
      reversible: true,
      evaluatorId: evaluationContract.id,
      status: 'PROPOSED',
      rollbackRef: `rollback:${observationId}:previous`,
    },
  ];
  if (input.forceArchitecturalCandidate) {
    candidates.push({
      id: 'candidate-rewrite-schema',
      kind: 'ARCHITECTURAL',
      hypothesis: 'Replace the canonical source schema to absorb the discrepancy.',
      value: input.incomingValue,
      loss: 0,
      reversible: false,
      evaluatorId: evaluationContract.id,
      status: 'PROPOSED',
      rollbackRef: `rollback:${observationId}:architecture`,
    });
  }

  const verifications = candidates.map((candidate) => verify(candidate, evaluationContract, generatorId, verifierId));
  const evaluated = candidates.map((candidate, index) => {
    const receipt = verifications[index];
    if (!receipt.passed) return { ...candidate, status: 'REJECTED' as const };
    const decision = decide(candidate, receipt);
    if (decision.status === 'AUTO_PROMOTED') return { ...candidate, status: 'AUTO_PROMOTABLE' as const };
    if (decision.status === 'REQUIRES_APPROVAL') return { ...candidate, status: 'REQUIRES_APPROVAL' as const };
    return { ...candidate, status: 'VERIFIED' as const };
  });

  const selected = [...evaluated]
    .filter((candidate) => candidate.status !== 'REJECTED')
    .sort((a, b) => a.loss - b.loss || a.id.localeCompare(b.id))[0];
  const verifier = selected
    ? verifications.find((receipt) => receipt.candidateId === selected.id) ?? verifications[0]
    : verifications[0];
  const promotion = selected ? decide(selected, verifier) : { candidateId: null, status: 'NO_PROMOTION' as const, reason: 'All candidates failed frozen verification.' };
  const improvementMemory = buildImprovementMemory({
    previousValue: input.previousValue,
    incomingValue: input.incomingValue,
    observationId,
    evaluationContractId: evaluationContract.id,
    selected,
  });
  const realityWake = createRealityWake({
    previousValue: input.previousValue,
    incomingValue: input.incomingValue,
    observationId,
    candidateIds: evaluated.map((candidate) => candidate.id),
    conflictDetected,
  });

  return {
    stageHistory: [...RECURSIVE_STAGES],
    observationId,
    conflictDetected,
    evaluationContract,
    candidates: evaluated,
    verifier,
    verifications,
    promotion,
    improvementMemory,
    realityWake,
    realityWakeMessage: realityWake.message,
    lineage: [observationId, evaluationContract.id, ...evaluated.map((candidate) => candidate.id), verifier.verifierId, improvementMemory.championId, realityWake.id],
  };
}

export function reopenResearchDecision(
  cycle: ResearchCycle,
  reason: string,
  triggeringObservationId: string,
): ReopenedResearchCycle {
  const decisionId = `${cycle.observationId}:promotion`;
  return {
    ...structuredClone(cycle),
    reopen: {
      id: `reopen:${decisionId}:${triggeringObservationId}`,
      decisionId,
      reason,
      triggeringObservationId,
    },
    lineage: [...cycle.lineage, `reopen:${decisionId}:${triggeringObservationId}`],
  };
}
