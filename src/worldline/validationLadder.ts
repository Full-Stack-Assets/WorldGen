import { hashCanonical, type Sha256Digest } from './causal/canonicalJson';
import type { EpistemicClass } from './types';

export type ValidationDomain = 'SYNTHETIC_GROUND_TRUTH' | 'ROBOTIC_SIMULATOR' | 'HARDWARE_IN_LOOP' | 'PHYSICAL' | 'MUNICIPAL_DECISION_SUPPORT';
export type ObservationStrength = 'SIMULATED' | 'HARDWARE_IN_LOOP' | 'PHYSICAL';

export interface ValidationStage {
  id: 'LANGUAGE_INTENT' | 'TRANSITION_PROPOSAL' | 'CANONICAL_STATE' | 'COUNTERFACTUAL_SEARCH' | 'CONSTRAINED_ACTION' | 'OBSERVATION' | 'EVIDENCE_UPDATE';
  artifactRef: string;
  passed: boolean;
}

export interface ValidationScenario {
  schema: 'worldline-validation-scenario-v1';
  scenarioId: string;
  domain: ValidationDomain;
  claimBoundary: 'GROUND_TRUTH_FIXTURE' | 'SIMULATOR_ONLY' | 'HIL_ONLY' | 'PHYSICALLY_OBSERVED' | 'SCENARIO_ANALYSIS_NOT_PREDICTION';
  sourceTime: string;
  simulationTime: string;
  epistemicClass: EpistemicClass;
  interventionIds: readonly string[];
  expertReviewRequired: boolean;
  stages: readonly ValidationStage[];
  limitations: readonly string[];
}

export interface ValidationReceipt {
  schema: 'worldline-validation-receipt-v1';
  scenarioId: string;
  domain: ValidationDomain;
  claimBoundary: ValidationScenario['claimBoundary'];
  sourceTime: string;
  simulationTime: string;
  completedStages: readonly string[];
  status: 'PATH_VERIFIED' | 'INCOMPLETE';
  limitations: readonly string[];
  receiptHash: Sha256Digest;
}

export interface EvidenceObservation {
  observationId: string;
  strength: ObservationStrength;
  value: unknown;
  evidenceRef: string;
}

const OBSERVATION_RANK: Record<ObservationStrength, number> = { SIMULATED: 0, HARDWARE_IN_LOOP: 1, PHYSICAL: 2 };
const REQUIRED_STAGES: ValidationStage['id'][] = ['LANGUAGE_INTENT', 'TRANSITION_PROPOSAL', 'CANONICAL_STATE', 'COUNTERFACTUAL_SEARCH', 'CONSTRAINED_ACTION', 'OBSERVATION', 'EVIDENCE_UPDATE'];

export async function verifyValidationScenario(scenario: ValidationScenario): Promise<ValidationReceipt> {
  if (!scenario.scenarioId || !scenario.sourceTime || !scenario.simulationTime) throw new Error('Scenario identity and times are required');
  const ids = scenario.stages.map((stage) => stage.id);
  if (new Set(ids).size !== ids.length) throw new Error('Validation stages must be unique');
  if (scenario.domain === 'MUNICIPAL_DECISION_SUPPORT') {
    if (scenario.claimBoundary !== 'SCENARIO_ANALYSIS_NOT_PREDICTION') throw new Error('Municipal outputs must be scenario analysis, not prediction');
    if (!scenario.expertReviewRequired) throw new Error('Municipal interventions require expert review');
    if (scenario.sourceTime === scenario.simulationTime) throw new Error('Municipal source time and simulation time must remain distinct');
    if (scenario.interventionIds.length === 0 || scenario.interventionIds.length > 5) throw new Error('Municipal pilot requires a bounded intervention set');
  }
  if ((scenario.domain === 'SYNTHETIC_GROUND_TRUTH' || scenario.domain === 'ROBOTIC_SIMULATOR') && scenario.epistemicClass !== 'SIMULATED') throw new Error('Synthetic and simulator scenarios must remain SIMULATED');
  const completedStages = REQUIRED_STAGES.filter((required) => scenario.stages.some((stage) => stage.id === required && stage.passed && stage.artifactRef));
  const status: ValidationReceipt['status'] = completedStages.length === REQUIRED_STAGES.length ? 'PATH_VERIFIED' : 'INCOMPLETE';
  const payload = { schema: 'worldline-validation-receipt-v1' as const, scenarioId: scenario.scenarioId, domain: scenario.domain, claimBoundary: scenario.claimBoundary, sourceTime: scenario.sourceTime, simulationTime: scenario.simulationTime, completedStages, status, limitations: [...scenario.limitations] };
  return Object.freeze({ ...payload, receiptHash: await hashCanonical(payload) });
}

export function strongestObservation(observations: readonly EvidenceObservation[]): EvidenceObservation {
  if (observations.length === 0) throw new Error('At least one observation is required');
  return structuredClone([...observations].sort((left, right) => OBSERVATION_RANK[right.strength] - OBSERVATION_RANK[left.strength] || left.observationId.localeCompare(right.observationId))[0]);
}

export const CONTROLLED_VALIDATION_FIXTURES: readonly ValidationScenario[] = Object.freeze([
  { schema: 'worldline-validation-scenario-v1', scenarioId: 'synthetic-block-transfer-v1', domain: 'SYNTHETIC_GROUND_TRUTH', claimBoundary: 'GROUND_TRUTH_FIXTURE', sourceTime: 'fixture:v1', simulationTime: 'step:12', epistemicClass: 'SIMULATED', interventionIds: ['set-force-2n'], expertReviewRequired: false, stages: REQUIRED_STAGES.map((id) => ({ id, artifactRef: `fixture://synthetic/${id.toLowerCase()}`, passed: true })), limitations: ['Deterministic fixture only; it is not physical evidence.'] },
  { schema: 'worldline-validation-scenario-v1', scenarioId: 'robotic-contact-sim-v1', domain: 'ROBOTIC_SIMULATOR', claimBoundary: 'SIMULATOR_ONLY', sourceTime: 'simulator-contract:v1', simulationTime: 'episode:42', epistemicClass: 'SIMULATED', interventionIds: ['gripper-close-bounded'], expertReviewRequired: false, stages: REQUIRED_STAGES.map((id) => ({ id, artifactRef: `fixture://robotic-sim/${id.toLowerCase()}`, passed: true })), limitations: ['No HIL or physical robot run has been performed.', 'Contact observations are simulator outputs.'] },
]);

export const NEW_BEDFORD_SCENARIO_LAB: ValidationScenario = Object.freeze({
  schema: 'worldline-validation-scenario-v1', scenarioId: 'new-bedford-bounded-scenario-lab-v1', domain: 'MUNICIPAL_DECISION_SUPPORT', claimBoundary: 'SCENARIO_ANALYSIS_NOT_PREDICTION', sourceTime: '2023–2026 source package', simulationTime: '2026–2046 scenario horizon', epistemicClass: 'RECONSTRUCTED', interventionIds: ['transit-access-sensitivity', 'harbor-resilience-sensitivity'], expertReviewRequired: true,
  stages: [
    { id: 'LANGUAGE_INTENT', artifactRef: 'scenario://new-bedford/problem-statement', passed: true },
    { id: 'TRANSITION_PROPOSAL', artifactRef: 'scenario://new-bedford/proposal-contract', passed: true },
    { id: 'CANONICAL_STATE', artifactRef: 'public/data/new-bedford/manifest.json', passed: true },
    { id: 'COUNTERFACTUAL_SEARCH', artifactRef: 'scenario://new-bedford/branch-contract', passed: true },
    { id: 'CONSTRAINED_ACTION', artifactRef: 'scenario://new-bedford/no-actuation', passed: true },
    { id: 'OBSERVATION', artifactRef: 'public/data/new-bedford/snapshots.json', passed: true },
    { id: 'EVIDENCE_UPDATE', artifactRef: 'scenario://new-bedford/review-required', passed: true },
  ],
  limitations: ['No municipal outcome prediction is claimed.', 'No expert approval, back-test, sensitivity calibration, HIL, or physical actuation has been completed.', 'Coverage geometry is a reconstructed service extent, not parcel geometry.'],
} satisfies ValidationScenario);
