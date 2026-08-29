import type { EpistemicClass } from '../types';
import type { Sha256Digest } from './canonicalJson';

export type MechanismSourceType = 'HUMAN_AUTHORED' | 'AGENT_GENERATED' | 'IMPORTED';
export type MechanismPromotionStatus = 'CANDIDATE' | 'APPROVED_EXECUTABLE' | 'RETIRED' | 'REJECTED';
export type TransitionDecision = 'ACCEPTED' | 'REJECTED' | 'HUMAN_REQUIRED';

export interface ProducerIdentityInput {
  model: { provider: string; model: string; version: string };
  promptBundleDigest: string;
  harnessDigest: string;
  memoryDigest: string;
  toolRegistryDigest: string;
  skillRegistryDigest: string;
  runtimeDigest: string;
  decoding: Record<string, string | number | boolean>;
  harnessGenerator?: { modelId: string; artifactDigest: string; lineageDigest: string; archiveDigest: string };
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

export interface CausalReference {
  sourceType: 'ENTITY' | 'EVENT' | 'EVIDENCE' | 'ACTION' | 'INTERVENTION' | 'REVISION';
  sourceId: string;
  sourceRevisionId: string;
  relation: 'TRIGGERED_BY' | 'CONSTRAINED_BY' | 'DERIVED_FROM' | 'COUNTERFACTUAL_TO' | 'EVIDENCED_BY';
  explanationCode?: string;
  provenanceDigest: Sha256Digest;
}

export interface TransitionMechanismArtifact {
  schema: 'worldline-transition-mechanism-v1';
  mechanismId: string;
  contentHash: Sha256Digest;
  sourceType: MechanismSourceType;
  producerId: string;
  executorKind: 'TRANSITION_IR_V1';
  stateSchemas: readonly string[];
  readSet: readonly string[];
  writeSet: readonly string[];
  inputSchema: unknown;
  epistemicCeiling: EpistemicClass;
  seedPolicy: 'NONE' | 'EXPLICIT';
  invariantSuiteRefs: readonly string[];
  riskClass: string;
  reversible: boolean;
  machineVerifiable: boolean;
  automaticExecutionAllowed: boolean;
  promotionStatus: MechanismPromotionStatus;
  approvalReceiptId?: string;
  program: unknown;
}

export interface TransitionProposal {
  schema: 'worldline-transition-proposal-v1';
  proposalId: string;
  baseRevisionId: string;
  mechanismId: string;
  normalizedInputs: unknown;
  inputHash: Sha256Digest;
  seed: string | null;
  producerId: string;
  causalClaims: readonly CausalReference[];
  targetBranchId?: string;
  simulationTime?: number;
}

export interface GateResult {
  id: string;
  result: 'PASS' | 'FAIL' | 'HUMAN_REQUIRED';
  detail: string;
}

export interface InvariantResult {
  id: string;
  passed: boolean;
  detail: string;
}

export interface TransitionReceiptCore {
  schema: 'worldline-transition-receipt-v1';
  baseRevisionId: string;
  baseStateHash: Sha256Digest;
  mechanismId: string;
  mechanismHash: Sha256Digest;
  proposalId: string;
  inputHash: Sha256Digest;
  producerId: string;
  kernelVersion: string;
  prng: { id: string; seed: string | null } | null;
  declaredReadSet: readonly string[];
  declaredWriteSet: readonly string[];
  gates: readonly GateResult[];
  invariants: readonly InvariantResult[];
  candidateStateHash: Sha256Digest;
  independentReplayStateHash: Sha256Digest;
  verifierId: string;
  verifierConfigDigest: Sha256Digest;
  decision: TransitionDecision;
  humanApprovalRef: string | null;
}

export interface TransitionReceiptEnvelope {
  core: TransitionReceiptCore;
  coreHash: Sha256Digest;
  recordedAt?: string;
  storageId?: string;
  ciUrls?: readonly string[];
  notes?: readonly string[];
}

export interface RenderEnvelope {
  schema: 'worldline-render-envelope-v1';
  sourceRevisionId: string;
  sourceStateHash: Sha256Digest;
  projection: unknown;
  projectionDigest: Sha256Digest;
  spatialConstraints: unknown;
  temporalConstraints: unknown;
  epistemicLabels: readonly EpistemicClass[];
  renderingIntent: string;
  rendererPolicy: Readonly<Record<string, unknown>>;
  seed: string | null;
}

export interface RenderReceipt {
  schema: 'worldline-render-receipt-v1';
  sourceRevisionId: string;
  sourceStateHash: Sha256Digest;
  projectionDigest: Sha256Digest;
  rendererId: string;
  rendererVersion: string;
  configurationDigest: Sha256Digest;
  seed: string | null;
  outputArtifactDigest: Sha256Digest;
  outputLocator?: string;
  benchmarkReceiptIds: readonly string[];
}
