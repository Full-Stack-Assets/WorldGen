import type { BranchRecord, EpistemicClass, TimeMode, WorldRecord } from '../types';

export type Sha256Digest = `sha256:${string}`;
export type MechanismPromotionStatus = 'CANDIDATE' | 'APPROVED_EXECUTABLE' | 'RETIRED' | 'REJECTED';
export type TransitionDecision = 'ACCEPTED' | 'REJECTED' | 'HUMAN_REQUIRED';
export type MechanismSourceType = 'HUMAN_AUTHORED' | 'AGENT_GENERATED' | 'IMPORTED';
export type TransitionExecutorKind = 'TRANSITION_IR_V1';
export type DeterministicSeedPolicy = 'FORBIDDEN' | 'OPTIONAL' | 'REQUIRED';
export type TransitionRiskClass = 'LOW' | 'MEDIUM' | 'HIGH';
export type MechanismExecutionPolicy = 'AUTO_LOW_RISK' | 'HUMAN_EACH_EXECUTION';
export type CanonicalJsonPrimitive = string | number | boolean | null;
export type CanonicalJsonValue = CanonicalJsonPrimitive | CanonicalJsonValue[] | { [key: string]: CanonicalJsonValue };

export interface CanonicalWorldState {
  schema: 'worldline-canonical-state-v1';
  worlds: WorldRecord[];
  branches: Record<string, BranchRecord>;
}

export interface WorldlineSessionState {
  activeWorldId: string;
  activeBranchId: string;
  selectedYear: number;
  timeMode: TimeMode;
}

export interface FoundationModelIdentity {
  provider: string;
  model: string;
  version: string | null;
}

export interface HarnessGeneratorProvenance {
  generatorModel: FoundationModelIdentity;
  generatedHarnessDigest: Sha256Digest;
  lineageDigest: Sha256Digest | null;
  experienceArchiveDigest: Sha256Digest | null;
}

export interface ProducerIdentity {
  schema: 'worldline-producer-identity-v1';
  producerId: string;
  foundationModel: FoundationModelIdentity | null;
  promptBundleDigest: Sha256Digest;
  harnessDigest: Sha256Digest;
  memoryDigest: Sha256Digest | null;
  toolRegistryDigest: Sha256Digest;
  skillRegistryDigest: Sha256Digest | null;
  runtimeVersion: string;
  runtimeParametersDigest: Sha256Digest;
  harnessGenerator: HarnessGeneratorProvenance | null;
}

export interface CausalReference {
  type: string;
  ref: string;
}

export interface TransitionIrOperationBase {
  path: string;
}

export interface SetOperation extends TransitionIrOperationBase {
  op: 'SET';
  value: CanonicalJsonValue;
}

export interface IncrementOperation extends TransitionIrOperationBase {
  op: 'INCREMENT';
  value: number;
}

export interface AppendUniqueOperation extends TransitionIrOperationBase {
  op: 'APPEND_UNIQUE';
  value: CanonicalJsonValue;
}

export interface TombstoneOperation extends TransitionIrOperationBase {
  op: 'TOMBSTONE';
}

export interface AssertOperation extends TransitionIrOperationBase {
  op: 'ASSERT';
  equals: CanonicalJsonValue;
}

export interface LinkCauseOperation extends TransitionIrOperationBase {
  op: 'LINK_CAUSE';
  cause: CausalReference;
}

export type TransitionIrOperation =
  | SetOperation
  | IncrementOperation
  | AppendUniqueOperation
  | TombstoneOperation
  | AssertOperation
  | LinkCauseOperation;

export interface TransitionIrV1 {
  version: '1';
  operations: TransitionIrOperation[];
}

export interface TransitionMechanismArtifact {
  schema: 'worldline-transition-mechanism-v1';
  mechanismId: string;
  mechanismHash: Sha256Digest;
  producerId: string;
  sourceType: MechanismSourceType;
  executorKind: TransitionExecutorKind;
  stateSchema: string;
  inputSchema: string;
  readSet: string[];
  writeSet: string[];
  epistemicCeiling: EpistemicClass;
  deterministicSeedPolicy: DeterministicSeedPolicy;
  invariantSuiteIds: string[];
  riskClass: TransitionRiskClass;
  executionPolicy: MechanismExecutionPolicy;
  promotionStatus: MechanismPromotionStatus;
  approvalReceiptId: string | null;
  ir: TransitionIrV1;
}

export interface TransitionProposal {
  schema: 'worldline-transition-proposal-v1';
  proposalId: string;
  baseRevisionId: string;
  mechanismId: string;
  normalizedInputs: CanonicalJsonValue;
  inputHash: Sha256Digest;
  seed: string | null;
  producerId: string;
  causalClaims: CausalReference[];
}

export interface CanonicalRevision {
  schema: 'worldline-canonical-revision-v1';
  revisionId: string;
  parentRevisionId: string | null;
  worldId: string;
  branchId: string;
  sequence: number;
  simulationTime: number;
  stateSchema: string;
  stateHash: Sha256Digest;
  transitionReceiptCoreHash: Sha256Digest | null;
  epistemicClass: EpistemicClass;
  kernelVersion: string;
}

export interface GateResult {
  gate: string;
  passed: boolean;
  detail: string;
}

export interface InvariantResult {
  invariantId: string;
  passed: boolean;
  detail: string;
}

export interface TransitionReceiptCore {
  schema: 'worldline-transition-receipt-core-v1';
  baseRevisionId: string;
  baseStateHash: Sha256Digest;
  mechanismId: string;
  mechanismHash: Sha256Digest;
  proposalId: string;
  inputHash: Sha256Digest;
  producerId: string;
  kernelVersion: string;
  prngId: string | null;
  seed: string | null;
  readSet: string[];
  writeSet: string[];
  gates: GateResult[];
  invariants: InvariantResult[];
  candidateStateHash: Sha256Digest | null;
  replayStateHash: Sha256Digest | null;
  verifierId: string;
  verifierConfigDigest: Sha256Digest;
  decision: TransitionDecision;
  humanApprovalReference: string | null;
}

export interface TransitionReceiptEnvelope {
  schema: 'worldline-transition-receipt-v1';
  core: TransitionReceiptCore;
  coreHash: Sha256Digest;
  recordedAt: string;
  notes: string[];
  acceptedRevisionId: string | null;
}

export interface RenderEnvelope {
  schema: 'worldline-render-envelope-v1';
  sourceRevisionId: string;
  sourceStateHash: Sha256Digest;
  projectionDigest: Sha256Digest;
  projection: CanonicalJsonValue;
  spatialConstraints: CanonicalJsonValue[];
  temporalConstraints: CanonicalJsonValue[];
  epistemicClass: EpistemicClass;
  renderingIntent: string;
  rendererPolicy: string;
  renderSeed: string | null;
}

export interface RenderReceipt {
  schema: 'worldline-render-receipt-v1';
  sourceRevisionId: string;
  sourceStateHash: Sha256Digest;
  projectionDigest: Sha256Digest;
  rendererId: string;
  rendererVersion: string;
  promptConfigDigest: Sha256Digest;
  renderSeed: string | null;
  outputArtifactDigest: Sha256Digest;
  outputArtifactLocator: string | null;
  evaluationReceiptIds: string[];
}
