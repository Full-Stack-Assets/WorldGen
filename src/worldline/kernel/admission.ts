import { canonicalizeToJson } from './canonicalize';
import { hashCanonical } from './hash';
import { allInvariantsPassed, runCoreInvariants } from './invariants';
import { PRNG_V1 } from './prng';
import { computeRevisionId, type RevisionStore } from './revisionStore';
import { assertIrWithinDeclaredSets, assertTransitionIrV1, computeMechanismHash } from './transitionIr';
import type {
  CanonicalJsonValue,
  CanonicalRevision,
  CanonicalWorldState,
  GateResult,
  TransitionMechanismArtifact,
  TransitionProposal,
  TransitionReceiptCore,
  TransitionReceiptEnvelope,
  TransitionIrOperation,
} from './types';
import { requiresHumanApprovalForTransition } from '../promotionPolicy';

export interface MechanismApprovalClaim {
  mechanismId: string;
  mechanismHash: `sha256:${string}`;
  approvalReceiptId: string;
}

export interface ExecutionApprovalClaim {
  approvalReference: string;
  mechanismId: string;
  mechanismHash: `sha256:${string}`;
  proposalId: string;
  baseRevisionId: string;
}

export interface AdmissionDependencies {
  store: RevisionStore;
  kernelVersion: string;
  verifierId: string;
  verifierConfigDigest: `sha256:${string}`;
  verifyMechanismApproval?: (claim: MechanismApprovalClaim) => boolean;
  verifyExecutionApproval?: (claim: ExecutionApprovalClaim) => boolean;
  replayTransition?: (before: CanonicalWorldState, mechanism: TransitionMechanismArtifact) => CanonicalWorldState;
  now?: () => string;
}

export interface AdmissionInput {
  mechanism: TransitionMechanismArtifact;
  proposal: TransitionProposal;
  simulationTime?: number;
  humanApprovalReference?: string | null;
}

type MutableJson = CanonicalJsonValue | CanonicalWorldState;

function decodePointer(path: string): string[] {
  if (path === '') return [];
  return path.slice(1).split('/').map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'));
}

const FORBIDDEN_WRITE_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

function assertSafeSegments(segments: string[]): void {
  if (segments.some((segment) => FORBIDDEN_WRITE_SEGMENTS.has(segment))) {
    throw new Error('Unsafe JSON Pointer segment is forbidden');
  }
}

function arrayIndex(segment: string, length: number): number {
  if (!/^(0|[1-9]\d*)$/.test(segment)) throw new Error(`Array path segment is not a canonical index: ${segment}`);
  const index = Number(segment);
  if (!Number.isSafeInteger(index) || index < 0 || index >= length) {
    throw new Error(`Array index out of range: ${segment}`);
  }
  return index;
}

function readPointer(root: unknown, path: string): unknown {
  let current: unknown = root;
  for (const segment of decodePointer(path)) {
    if (Array.isArray(current)) {
      current = current[arrayIndex(segment, current.length)];
    } else if (current && typeof current === 'object' && Object.hasOwn(current, segment)) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      throw new Error(`JSON Pointer does not resolve: ${path}`);
    }
  }
  return current;
}

function parentPointer(root: unknown, path: string): { parent: Record<string, unknown> | unknown[]; key: string } {
  const segments = decodePointer(path);
  if (segments.length === 0) throw new Error('Transition IR cannot replace or tombstone the canonical root');
  assertSafeSegments(segments);
  const key = segments.pop()!;
  const parentPath = segments.length === 0
    ? ''
    : `/${segments.map((segment) => segment.replace(/~/g, '~0').replace(/\//g, '~1')).join('/')}`;
  const parent = readPointer(root, parentPath);
  if (!parent || typeof parent !== 'object') throw new Error(`JSON Pointer parent is not a container: ${path}`);
  return { parent: parent as Record<string, unknown> | unknown[], key };
}

function setPointer(root: unknown, path: string, value: unknown): void {
  const { parent, key } = parentPointer(root, path);
  if (Array.isArray(parent)) parent[arrayIndex(key, parent.length)] = structuredClone(value);
  else parent[key] = structuredClone(value);
}

function deletePointer(root: unknown, path: string): void {
  const { parent, key } = parentPointer(root, path);
  if (Array.isArray(parent)) throw new Error('TOMBSTONE cannot target an array item in v1');
  if (!Object.hasOwn(parent, key)) throw new Error(`TOMBSTONE target does not exist: ${path}`);
  delete parent[key];
}

function applyOperation(root: MutableJson, operation: TransitionIrOperation): void {
  switch (operation.op) {
    case 'SET':
      setPointer(root, operation.path, operation.value);
      return;
    case 'INCREMENT': {
      const current = readPointer(root, operation.path);
      if (typeof current !== 'number' || !Number.isFinite(current)) {
        throw new Error(`INCREMENT target is not a finite number: ${operation.path}`);
      }
      setPointer(root, operation.path, current + operation.value);
      return;
    }
    case 'APPEND_UNIQUE': {
      const current = readPointer(root, operation.path);
      if (!Array.isArray(current)) throw new Error(`APPEND_UNIQUE target is not an array: ${operation.path}`);
      const candidate = canonicalizeToJson(operation.value);
      if (!current.some((item) => canonicalizeToJson(item) === candidate)) {
        current.push(structuredClone(operation.value));
      }
      return;
    }
    case 'TOMBSTONE':
      deletePointer(root, operation.path);
      return;
    case 'ASSERT': {
      const current = readPointer(root, operation.path);
      if (canonicalizeToJson(current) !== canonicalizeToJson(operation.equals)) {
        throw new Error(`ASSERT precondition failed: ${operation.path}`);
      }
      return;
    }
    case 'LINK_CAUSE': {
      const current = readPointer(root, operation.path);
      if (!Array.isArray(current)) throw new Error(`LINK_CAUSE target is not an array: ${operation.path}`);
      const candidate = canonicalizeToJson(operation.cause);
      if (!current.some((item) => canonicalizeToJson(item) === candidate)) {
        current.push(structuredClone(operation.cause));
      }
      return;
    }
  }
}

export function applyTransitionIr(
  before: CanonicalWorldState,
  mechanism: TransitionMechanismArtifact,
): CanonicalWorldState {
  assertTransitionIrV1(mechanism.ir);
  assertIrWithinDeclaredSets(mechanism.ir, mechanism.readSet, mechanism.writeSet);
  const after = structuredClone(before);
  for (const operation of mechanism.ir.operations) applyOperation(after, operation);
  canonicalizeToJson(after);
  return after;
}

function gate(gates: GateResult[], name: string, passed: boolean, detail: string): boolean {
  gates.push({ gate: name, passed, detail });
  return passed;
}

function envelope(
  deps: AdmissionDependencies,
  core: TransitionReceiptCore,
  acceptedRevisionId: string | null,
  notes: string[],
): TransitionReceiptEnvelope {
  return {
    schema: 'worldline-transition-receipt-v1',
    core,
    coreHash: hashCanonical(core),
    recordedAt: (deps.now ?? (() => new Date().toISOString()))(),
    notes,
    acceptedRevisionId,
  };
}

function preliminaryCore(
  deps: AdmissionDependencies,
  input: AdmissionInput,
  gates: GateResult[],
  baseStateHash: `sha256:${string}` | null,
): TransitionReceiptCore {
  return {
    schema: 'worldline-transition-receipt-core-v1',
    baseRevisionId: input.proposal.baseRevisionId,
    baseStateHash,
    mechanismId: input.mechanism.mechanismId,
    mechanismHash: input.mechanism.mechanismHash,
    proposalId: input.proposal.proposalId,
    inputHash: input.proposal.inputHash,
    producerId: input.proposal.producerId,
    kernelVersion: deps.kernelVersion,
    prngId: input.proposal.seed === null ? null : PRNG_V1,
    seed: input.proposal.seed,
    readSet: [...input.mechanism.readSet].sort(),
    writeSet: [...input.mechanism.writeSet].sort(),
    gates,
    invariants: [],
    candidateStateHash: null,
    replayStateHash: null,
    verifierId: deps.verifierId,
    verifierConfigDigest: deps.verifierConfigDigest,
    decision: 'REJECTED',
    humanApprovalReference: input.humanApprovalReference ?? null,
  };
}

export function admitTransition(
  deps: AdmissionDependencies,
  input: AdmissionInput,
): TransitionReceiptEnvelope {
  const gates: GateResult[] = [];
  const stored = deps.store.getRevision(input.proposal.baseRevisionId);
  const core = preliminaryCore(deps, input, gates, stored?.revision.stateHash ?? null);

  const reject = (name: string, detail: string): TransitionReceiptEnvelope => {
    gate(gates, name, false, detail);
    core.decision = 'REJECTED';
    return envelope(deps, core, null, [detail]);
  };

  if (!stored) return reject('base-revision', `Unknown base revision ${input.proposal.baseRevisionId}`);
  gate(gates, 'base-revision', true, 'Base revision exists.');

  const head = deps.store.getBranchHead(stored.revision.worldId, stored.revision.branchId);
  if (!head || head.revisionId !== stored.revision.revisionId) {
    return reject('branch-head-freshness', 'Proposal base revision is not the current branch head.');
  }
  gate(gates, 'branch-head-freshness', true, 'Proposal targets the current branch head.');

  if (input.mechanism.promotionStatus !== 'APPROVED_EXECUTABLE' || !input.mechanism.approvalReceiptId) {
    return reject('mechanism-claim', 'Mechanism does not carry an approved-executable claim and approval receipt reference.');
  }
  gate(gates, 'mechanism-claim', true, 'Mechanism carries an approved-executable claim.');

  if (computeMechanismHash(input.mechanism) !== input.mechanism.mechanismHash) {
    return reject('mechanism-integrity', 'Mechanism hash does not match the immutable mechanism definition.');
  }
  gate(gates, 'mechanism-integrity', true, 'Mechanism definition hash is valid.');

  if (!deps.verifyMechanismApproval) {
    return reject('mechanism-authority', 'No trusted mechanism-approval verifier is configured.');
  }
  let mechanismApproved = false;
  try {
    mechanismApproved = deps.verifyMechanismApproval({
      mechanismId: input.mechanism.mechanismId,
      mechanismHash: input.mechanism.mechanismHash,
      approvalReceiptId: input.mechanism.approvalReceiptId,
    });
  } catch {
    mechanismApproved = false;
  }
  if (!mechanismApproved) {
    return reject('mechanism-authority', 'Trusted authority did not verify the mechanism approval receipt.');
  }
  gate(gates, 'mechanism-authority', true, 'Trusted authority verified the mechanism approval receipt.');

  if (input.proposal.mechanismId !== input.mechanism.mechanismId) {
    return reject('proposal-binding', 'Proposal mechanismId does not match the supplied mechanism.');
  }
  if (hashCanonical(input.proposal.normalizedInputs) !== input.proposal.inputHash) {
    return reject('input-integrity', 'Proposal inputHash does not match normalized inputs.');
  }
  if (input.mechanism.stateSchema !== stored.state.schema) {
    return reject('state-schema', 'Mechanism state schema is incompatible with the base canonical state.');
  }
  gate(gates, 'integrity', true, 'Mechanism, proposal, inputs, and state schema are internally consistent.');

  if (input.mechanism.deterministicSeedPolicy === 'REQUIRED' && input.proposal.seed === null) {
    return reject('seed-policy', 'Mechanism requires an explicit deterministic seed.');
  }
  if (input.mechanism.deterministicSeedPolicy === 'FORBIDDEN' && input.proposal.seed !== null) {
    return reject('seed-policy', 'Mechanism forbids a seed.');
  }
  gate(gates, 'seed-policy', true, 'Seed policy is satisfied.');

  if (input.mechanism.epistemicCeiling === 'OBSERVED' || input.mechanism.epistemicCeiling === 'RECONSTRUCTED') {
    gate(gates, 'epistemic-policy', false, 'Observed/reconstructed admission requires the dedicated evidence-intake path.');
    core.decision = 'HUMAN_REQUIRED';
    return envelope(deps, core, null, ['Generic transition mechanisms cannot promote observed or reconstructed truth.']);
  }
  gate(gates, 'epistemic-policy', true, 'Mechanism output remains simulated/generated/speculative.');

  let candidate: CanonicalWorldState;
  let replay: CanonicalWorldState;
  try {
    candidate = applyTransitionIr(stored.state, input.mechanism);
    const replayExecutor = deps.replayTransition ?? applyTransitionIr;
    replay = replayExecutor(structuredClone(stored.state), input.mechanism);
    gate(gates, 'transition-execution', true, 'Candidate execution and independent replay completed from the immutable base state.');
  } catch (error) {
    return reject('transition-execution', error instanceof Error ? error.message : 'Transition execution failed.');
  }

  const candidateHash = hashCanonical(candidate);
  const replayHash = hashCanonical(replay);
  core.candidateStateHash = candidateHash;
  core.replayStateHash = replayHash;
  if (candidateHash !== replayHash) {
    return reject('replay-verification', 'Independent replay hash does not match the candidate state hash.');
  }
  gate(gates, 'replay-verification', true, 'Independent replay hash matches the candidate state hash.');

  if (!input.mechanism.invariantSuiteIds.includes('core')) {
    return reject('invariant-suite', 'Approved executable must include the core invariant suite.');
  }
  const invariants = runCoreInvariants({
    before: stored.state,
    after: candidate,
    mechanism: input.mechanism,
    proposal: input.proposal,
  });
  core.invariants = invariants;
  if (!allInvariantsPassed(invariants)) {
    return reject('invariants', 'One or more core causal invariants failed.');
  }
  gate(gates, 'invariants', true, 'All required core causal invariants passed.');

  const simulationTime = input.simulationTime ?? stored.revision.simulationTime;
  if (!Number.isFinite(simulationTime) || simulationTime < stored.revision.simulationTime) {
    return reject('simulation-time', 'Simulation time must be finite and cannot move backward.');
  }
  gate(gates, 'simulation-time', true, 'Simulation time is monotonic.');

  const humanRequired = requiresHumanApprovalForTransition({
    decisionType: 'EXECUTION_PROMOTION',
    mechanismRiskClass: input.mechanism.riskClass,
    executionPolicy: input.mechanism.executionPolicy,
    epistemicClass: input.mechanism.epistemicCeiling,
    ambiguousPolicy: false,
  });
  if (humanRequired) {
    if (!input.humanApprovalReference) {
      gate(gates, 'promotion-policy', false, 'This execution requires Human Authority before canonical admission.');
      core.decision = 'HUMAN_REQUIRED';
      return envelope(deps, core, null, ['Validated candidate preserved outside canonical truth pending Human Authority.']);
    }
    if (!deps.verifyExecutionApproval) {
      gate(gates, 'execution-authority', false, 'No trusted execution-approval verifier is configured.');
      core.decision = 'HUMAN_REQUIRED';
      return envelope(deps, core, null, ['Approval reference supplied but not independently verified.']);
    }
    let executionApproved = false;
    try {
      executionApproved = deps.verifyExecutionApproval({
        approvalReference: input.humanApprovalReference,
        mechanismId: input.mechanism.mechanismId,
        mechanismHash: input.mechanism.mechanismHash,
        proposalId: input.proposal.proposalId,
        baseRevisionId: input.proposal.baseRevisionId,
      });
    } catch {
      executionApproved = false;
    }
    if (!executionApproved) {
      gate(gates, 'execution-authority', false, 'Trusted authority did not verify the execution approval reference.');
      core.decision = 'HUMAN_REQUIRED';
      return envelope(deps, core, null, ['Execution remains outside canonical truth because Human Authority was not verified.']);
    }
    gate(gates, 'execution-authority', true, 'Trusted authority verified this specific execution approval.');
  }
  gate(
    gates,
    'promotion-policy',
    true,
    humanRequired
      ? 'Human-gated execution is verified and eligible for admission.'
      : 'Low-risk execution is eligible for automatic admission.',
  );

  core.decision = 'ACCEPTED';
  const coreHash = hashCanonical(core);
  const revisionCore: Omit<CanonicalRevision, 'revisionId'> = {
    schema: 'worldline-canonical-revision-v1',
    parentRevisionId: stored.revision.revisionId,
    worldId: stored.revision.worldId,
    branchId: stored.revision.branchId,
    sequence: stored.revision.sequence + 1,
    simulationTime,
    stateSchema: candidate.schema,
    stateHash: candidateHash,
    transitionReceiptCoreHash: coreHash,
    epistemicClass: input.mechanism.epistemicCeiling,
    kernelVersion: deps.kernelVersion,
  };
  const revision: CanonicalRevision = { ...revisionCore, revisionId: computeRevisionId(revisionCore) };
  deps.store.putRevision(revision, candidate);
  return {
    schema: 'worldline-transition-receipt-v1',
    core,
    coreHash,
    recordedAt: (deps.now ?? (() => new Date().toISOString()))(),
    notes: ['Canonical revision admitted after deterministic validation and replay.'],
    acceptedRevisionId: revision.revisionId,
  };
}
