import { hashCanonical, normalizeCanonical, type Sha256Digest } from './canonicalJson';
import { evaluateInvariantSuite } from './invariants';
import { evaluateMechanismExecutionPolicy, validateEpistemicTransition } from './policy';
import type { createInMemoryCanonicalStore } from './store';
import { executeTransitionIr, validateTransitionIr, type TransitionIrProgram } from './transitionIr';
import type {
  CanonicalRevision,
  CausalReference,
  GateResult,
  TransitionMechanismArtifact,
  TransitionProposal,
  TransitionReceiptCore,
  TransitionReceiptEnvelope,
} from './types';

type CanonicalStore = ReturnType<typeof createInMemoryCanonicalStore>;

export interface IndependentVerifier {
  verifierId: string;
  configDigest: Sha256Digest;
  replay(input: {
    baseState: unknown;
    program: TransitionIrProgram;
    inputs: Record<string, unknown>;
  }): unknown | Promise<unknown>;
}

export interface CreateTransitionProposalInput {
  baseRevisionId: string;
  mechanismId: string;
  inputs: unknown;
  seed?: string | null;
  producerId: string;
  causalClaims?: readonly CausalReference[];
  targetBranchId?: string;
  simulationTime?: number;
}

export async function createTransitionProposal(input: CreateTransitionProposalInput): Promise<TransitionProposal> {
  const normalizedInputs = normalizeCanonical(input.inputs);
  const inputHash = await hashCanonical(normalizedInputs);
  const deterministic = {
    schema: 'worldline-transition-proposal-v1' as const,
    baseRevisionId: input.baseRevisionId,
    mechanismId: input.mechanismId,
    normalizedInputs,
    inputHash,
    seed: input.seed ?? null,
    producerId: input.producerId,
    causalClaims: structuredClone(input.causalClaims ?? []),
    ...(input.targetBranchId ? { targetBranchId: input.targetBranchId } : {}),
    ...(input.simulationTime !== undefined ? { simulationTime: input.simulationTime } : {}),
  };
  const digest = await hashCanonical(deterministic);
  return { ...deterministic, proposalId: `proposal:${digest.slice('sha256:'.length)}` };
}

export async function verifyReceiptCoreHash(receiptCore: TransitionReceiptCore, expectedHash: Sha256Digest): Promise<boolean> {
  return await hashCanonical(receiptCore) === expectedHash;
}

function requireInputs(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Transition inputs must be an object');
  return value as Record<string, unknown>;
}

async function createChildRevision(input: {
  base: CanonicalRevision;
  mechanism: TransitionMechanismArtifact;
  proposal: TransitionProposal;
  candidateStateHash: Sha256Digest;
  receiptCoreHash: Sha256Digest;
}): Promise<CanonicalRevision> {
  const deterministic = {
    schema: 'worldline-canonical-revision-v1' as const,
    parentRevisionId: input.base.revisionId,
    worldId: input.base.worldId,
    branchId: input.proposal.targetBranchId ?? input.base.branchId,
    sequence: input.base.sequence + 1,
    simulationTime: input.proposal.simulationTime ?? input.base.simulationTime,
    stateSchema: input.base.stateSchema,
    stateHash: input.candidateStateHash,
    transitionReceiptCoreHash: input.receiptCoreHash,
    epistemicClass: input.mechanism.epistemicCeiling,
    kernelVersion: input.base.kernelVersion,
  };
  const digest = await hashCanonical(deterministic);
  return { ...deterministic, revisionId: `revision:${digest.slice('sha256:'.length)}` };
}

function gate(id: string, passed: boolean, detail: string): GateResult {
  return { id, result: passed ? 'PASS' : 'FAIL', detail };
}

export async function executeCandidate(store: CanonicalStore, proposal: TransitionProposal, verifier: IndependentVerifier) {
  if (!verifier?.verifierId || !verifier.configDigest) throw new Error('Missing verifier identity');
  if (proposal.producerId === verifier.verifierId) throw new Error('Producer/verifier identity collision');
  const base = store.getRevision(proposal.baseRevisionId);
  if (!base) throw new Error('Unknown base revision');
  const branchHead = store.getBranchHead(base.branchId);
  if (!branchHead || branchHead.revisionId !== base.revisionId) throw new Error('Stale base revision');
  const baseState = store.getStateByHash(base.stateHash);
  if (baseState === null) throw new Error('Missing base state');
  const mechanism = store.getMechanism(proposal.mechanismId);
  if (!mechanism) throw new Error('Unknown mechanism');
  if (mechanism.promotionStatus === 'RETIRED' || mechanism.promotionStatus === 'REJECTED') throw new Error('Mechanism is not executable');
  if (mechanism.promotionStatus !== 'APPROVED_EXECUTABLE') throw new Error('Mechanism requires Human Authority promotion');
  if (!mechanism.automaticExecutionAllowed) throw new Error('Mechanism execution requires Human Authority');
  const program = mechanism.program as TransitionIrProgram;
  validateTransitionIr(program, mechanism);
  const inputs = requireInputs(proposal.normalizedInputs);
  const candidateState = executeTransitionIr(baseState, program, inputs);
  const candidateStateHash = await hashCanonical(candidateState);

  const invariants = evaluateInvariantSuite(mechanism.invariantSuiteRefs, {
    baseState,
    candidateState,
    proposal,
    mechanism,
  });
  const invariantsPassed = invariants.every((result) => result.passed);

  let epistemicPassed = true;
  let epistemicDetail = `Transition remains within ${mechanism.epistemicCeiling} epistemic authority.`;
  try {
    validateEpistemicTransition({ from: base.epistemicClass, to: mechanism.epistemicCeiling });
  } catch (error) {
    epistemicPassed = false;
    epistemicDetail = error instanceof Error ? error.message : 'Epistemic transition rejected';
  }

  const replayState = await verifier.replay({
    baseState: structuredClone(baseState),
    program: structuredClone(program),
    inputs: structuredClone(inputs),
  });
  const independentReplayStateHash = await hashCanonical(replayState);
  const replayMatched = candidateStateHash === independentReplayStateHash;
  const verificationPassed = replayMatched && invariantsPassed && epistemicPassed;
  const decision = verificationPassed ? evaluateMechanismExecutionPolicy({
    sourceType: mechanism.sourceType,
    promotionStatus: mechanism.promotionStatus,
    riskClass: mechanism.riskClass,
    reversible: mechanism.reversible,
    machineVerifiable: mechanism.machineVerifiable,
    independentVerificationPassed: true,
  }) : 'REJECTED';
  return {
    base,
    baseState,
    mechanism,
    candidateState,
    candidateStateHash,
    replayState,
    independentReplayStateHash,
    replayMatched,
    invariants,
    invariantsPassed,
    epistemicPassed,
    epistemicDetail,
    decision,
  };
}

async function createPreExecutionReceipt(
  store: CanonicalStore,
  proposal: TransitionProposal,
  verifier: IndependentVerifier,
  decision: 'REJECTED' | 'HUMAN_REQUIRED',
  reason: string,
): Promise<TransitionReceiptEnvelope | null> {
  if (!verifier?.verifierId || !verifier.configDigest) return null;
  const base = store.getRevision(proposal.baseRevisionId);
  const mechanism = store.getMechanism(proposal.mechanismId);
  if (!base || !mechanism) return null;
  const core: TransitionReceiptCore = {
    schema: 'worldline-transition-receipt-v1',
    baseRevisionId: base.revisionId,
    baseStateHash: base.stateHash,
    previousReceiptCoreHash: base.transitionReceiptCoreHash,
    mechanismId: mechanism.mechanismId,
    mechanismHash: mechanism.contentHash,
    proposalId: proposal.proposalId,
    inputHash: proposal.inputHash,
    producerId: proposal.producerId,
    kernelVersion: base.kernelVersion,
    prng: proposal.seed ? { id: 'explicit-seed-v1', seed: proposal.seed } : null,
    declaredReadSet: [...mechanism.readSet],
    declaredWriteSet: [...mechanism.writeSet],
    gates: [{
      id: 'pre-execution',
      result: decision === 'HUMAN_REQUIRED' ? 'HUMAN_REQUIRED' : 'FAIL',
      detail: reason,
    }],
    invariants: [],
    candidateStateHash: null,
    independentReplayStateHash: null,
    verifierId: verifier.verifierId,
    verifierConfigDigest: verifier.configDigest,
    decision,
    humanApprovalRef: decision === 'HUMAN_REQUIRED' ? mechanism.approvalReceiptId ?? null : null,
  };
  const coreHash = await hashCanonical(core);
  const receipt: TransitionReceiptEnvelope = { core, coreHash };
  await store.putReceipt(receipt);
  return receipt;
}

export async function admitTransition(store: CanonicalStore, proposal: TransitionProposal, verifier: IndependentVerifier): Promise<{
  decision: 'ACCEPTED' | 'REJECTED' | 'HUMAN_REQUIRED';
  receipt: TransitionReceiptEnvelope;
  revision?: CanonicalRevision;
}> {
  let execution: Awaited<ReturnType<typeof executeCandidate>>;
  try {
    execution = await executeCandidate(store, proposal, verifier);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const humanRequired = message === 'Mechanism requires Human Authority promotion'
      || message === 'Mechanism execution requires Human Authority';
    const auditable = humanRequired
      || message === 'Stale base revision'
      || message === 'Producer/verifier identity collision'
      || message === 'Mechanism is not executable';
    if (auditable) {
      const decision = humanRequired ? 'HUMAN_REQUIRED' : 'REJECTED';
      const receipt = await createPreExecutionReceipt(store, proposal, verifier, decision, message);
      if (receipt) return { decision, receipt };
    }
    throw error;
  }
  const gates: GateResult[] = [
    gate('base-current', true, 'Proposal is bound to the current branch head.'),
    gate('mechanism-approved', execution.mechanism.promotionStatus === 'APPROVED_EXECUTABLE', 'Mechanism promotion status checked.'),
    gate('replay-match', execution.replayMatched, execution.replayMatched ? 'Independent replay matched candidate hash.' : 'Independent replay hash mismatch.'),
    gate('invariants', execution.invariantsPassed, execution.invariantsPassed ? 'All trusted invariant suites passed.' : 'One or more trusted invariants failed.'),
    gate('epistemic', execution.epistemicPassed, execution.epistemicDetail),
  ];
  const core: TransitionReceiptCore = {
    schema: 'worldline-transition-receipt-v1',
    baseRevisionId: execution.base.revisionId,
    baseStateHash: execution.base.stateHash,
    previousReceiptCoreHash: execution.base.transitionReceiptCoreHash,
    mechanismId: execution.mechanism.mechanismId,
    mechanismHash: execution.mechanism.contentHash,
    proposalId: proposal.proposalId,
    inputHash: proposal.inputHash,
    producerId: proposal.producerId,
    kernelVersion: execution.base.kernelVersion,
    prng: proposal.seed ? { id: 'explicit-seed-v1', seed: proposal.seed } : null,
    declaredReadSet: [...execution.mechanism.readSet],
    declaredWriteSet: [...execution.mechanism.writeSet],
    gates,
    invariants: execution.invariants,
    candidateStateHash: execution.candidateStateHash,
    independentReplayStateHash: execution.independentReplayStateHash,
    verifierId: verifier.verifierId,
    verifierConfigDigest: verifier.configDigest,
    decision: execution.decision,
    humanApprovalRef: execution.decision === 'HUMAN_REQUIRED' ? execution.mechanism.approvalReceiptId ?? null : null,
  };
  const coreHash = await hashCanonical(core);
  const receipt: TransitionReceiptEnvelope = { core, coreHash };
  await store.putReceipt(receipt);
  if (execution.decision !== 'ACCEPTED') return { decision: execution.decision, receipt };
  const revision = await createChildRevision({
    base: execution.base,
    mechanism: execution.mechanism,
    proposal,
    candidateStateHash: execution.candidateStateHash,
    receiptCoreHash: coreHash,
  });
  await store.appendRevision(revision, execution.candidateState);
  return { decision: 'ACCEPTED', receipt, revision };
}
