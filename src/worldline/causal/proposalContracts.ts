import { hashCanonical } from './canonicalJson';
import { createTransitionProposal, type CreateTransitionProposalInput } from './kernel';
import { computeMechanismContentHash } from './mechanismIdentity';
import type {
  ExpectedDelta,
  MechanismSpec,
  TransitionMechanismArtifact,
  WorldTransitionProposal,
} from './types';
import type { TransitionIrProgram } from './transitionIr';

function nonEmptyList(values: readonly string[], label: string): string[] {
  const normalized = values.map((value) => value.normalize('NFC').trim()).filter(Boolean);
  if (normalized.length === 0) throw new Error(`${label} must not be empty`);
  return [...new Set(normalized)].sort();
}

function pathInside(path: string, allowed: readonly string[]): boolean {
  return path.startsWith('/') && allowed.some((prefix) => path === prefix || path.startsWith(`${prefix.replace(/\/$/, '')}/`));
}

function validateEffects(effects: readonly ExpectedDelta[], writeSet: readonly string[]): ExpectedDelta[] {
  return effects.map((effect) => {
    if (!pathInside(effect.path, writeSet)) throw new Error(`Expected delta is outside the declared write set: ${effect.path}`);
    if (!effect.rationale.trim()) throw new Error('Expected deltas require rationale');
    return { ...effect, rationale: effect.rationale.normalize('NFC').trim() };
  }).sort((left, right) => left.path.localeCompare(right.path));
}

export function validateMechanismSpec(spec: MechanismSpec): MechanismSpec {
  if (spec.schema !== 'worldline-mechanism-spec-v1' || !spec.mechanismKey || !spec.version || !spec.title || !spec.description) {
    throw new Error('MechanismSpec identity and description are required');
  }
  if (spec.writeSet.length === 0) throw new Error('MechanismSpec requires a bounded write set');
  const readSet = nonEmptyList(spec.readSet.length ? spec.readSet : ['/'], 'readSet');
  const writeSet = nonEmptyList(spec.writeSet, 'writeSet');
  return {
    ...structuredClone(spec),
    mechanismKey: spec.mechanismKey.normalize('NFC').trim(),
    version: spec.version.normalize('NFC').trim(),
    title: spec.title.normalize('NFC').trim(),
    description: spec.description.normalize('NFC').trim(),
    stateSchemas: nonEmptyList(spec.stateSchemas, 'stateSchemas'),
    readSet,
    writeSet,
    preconditions: nonEmptyList(spec.preconditions, 'preconditions'),
    assumptions: nonEmptyList(spec.assumptions, 'assumptions'),
    supportedRegimes: nonEmptyList(spec.supportedRegimes, 'supportedRegimes'),
    expectedEffects: validateEffects(spec.expectedEffects, writeSet),
    evidenceRefs: nonEmptyList(spec.evidenceRefs, 'evidenceRefs'),
  };
}

export async function createMechanismArtifact(input: {
  spec: MechanismSpec;
  program: TransitionIrProgram;
  producerId: string;
  sourceType?: TransitionMechanismArtifact['sourceType'];
  promotionStatus?: TransitionMechanismArtifact['promotionStatus'];
  approvalReceiptId?: string;
  riskClass?: string;
  invariantSuiteRefs?: readonly string[];
}): Promise<TransitionMechanismArtifact> {
  const spec = validateMechanismSpec(input.spec);
  const artifact: TransitionMechanismArtifact = {
    schema: 'worldline-transition-mechanism-v1',
    mechanismId: `${spec.mechanismKey}@${spec.version}`,
    contentHash: 'sha256:pending',
    sourceType: input.sourceType ?? 'AGENT_GENERATED',
    producerId: input.producerId,
    executorKind: 'TRANSITION_IR_V1',
    stateSchemas: spec.stateSchemas,
    readSet: spec.readSet,
    writeSet: spec.writeSet,
    inputSchema: spec.inputSchema,
    epistemicCeiling: 'SIMULATED',
    seedPolicy: 'EXPLICIT',
    invariantSuiteRefs: [...(input.invariantSuiteRefs ?? [])].sort(),
    riskClass: input.riskClass ?? 'REVERSIBLE_TUNING',
    reversible: true,
    machineVerifiable: true,
    automaticExecutionAllowed: spec.authorityCeiling === 'AUTOMATIC_INTERNAL',
    promotionStatus: input.promotionStatus ?? 'CANDIDATE',
    ...(input.approvalReceiptId ? { approvalReceiptId: input.approvalReceiptId } : {}),
    spec,
    program: structuredClone(input.program),
  };
  artifact.contentHash = await computeMechanismContentHash(artifact);
  return artifact;
}

export async function createWorldTransitionProposal(input: {
  transition: CreateTransitionProposalInput;
  mechanism: TransitionMechanismArtifact;
  intent: string;
  preconditions: readonly string[];
  touchedVariables: readonly string[];
  expectedDeltas: readonly ExpectedDelta[];
  assumptions: readonly string[];
  uncertainty: WorldTransitionProposal['uncertainty'];
  evidenceRefs: readonly string[];
  requestedAuthority?: WorldTransitionProposal['requestedAuthority'];
}): Promise<WorldTransitionProposal> {
  if (input.transition.mechanismId !== input.mechanism.mechanismId) throw new Error('Proposal mechanism identity mismatch');
  const touchedVariables = nonEmptyList(input.touchedVariables, 'touchedVariables');
  for (const path of touchedVariables) {
    if (!pathInside(path, input.mechanism.writeSet)) throw new Error(`Touched variable is outside the declared write set: ${path}`);
  }
  const deterministic = {
    schema: 'worldline-world-transition-proposal-v1' as const,
    proposal: await createTransitionProposal(input.transition),
    intent: input.intent.normalize('NFC').trim(),
    preconditions: nonEmptyList(input.preconditions, 'preconditions'),
    touchedVariables,
    expectedDeltas: validateEffects(input.expectedDeltas, input.mechanism.writeSet),
    assumptions: nonEmptyList(input.assumptions, 'assumptions'),
    uncertainty: input.uncertainty,
    evidenceRefs: nonEmptyList(input.evidenceRefs, 'evidenceRefs'),
    requestedAuthority: input.requestedAuthority ?? 'SANDBOX_ONLY',
  };
  if (!deterministic.intent) throw new Error('WorldTransitionProposal intent is required');
  return { ...deterministic, envelopeHash: await hashCanonical(deterministic) };
}
