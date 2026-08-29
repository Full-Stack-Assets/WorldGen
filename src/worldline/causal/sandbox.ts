import { canonicalize, hashCanonical, type Sha256Digest } from './canonicalJson';
import { verifyMechanismContentHash } from './mechanismIdentity';
import { executeTransitionIr, validateTransitionIr, type TransitionIrProgram } from './transitionIr';
import type { TransitionMechanismArtifact, WorldTransitionProposal } from './types';

export interface SandboxPolicy {
  policyId: string;
  maxOperations: number;
  maxInputBytes: number;
  maxOutputBytes: number;
}

export const DEFAULT_MECHANISM_SANDBOX_POLICY: SandboxPolicy = Object.freeze({
  policyId: 'worldline-mechanism-sandbox-v1',
  maxOperations: 256,
  maxInputBytes: 1_000_000,
  maxOutputBytes: 2_000_000,
});

export interface CompiledSandboxMechanism {
  schema: 'worldline-compiled-sandbox-mechanism-v1';
  mechanismId: string;
  mechanismHash: Sha256Digest;
  program: TransitionIrProgram;
  programHash: Sha256Digest;
  policyId: string;
  operationCount: number;
  authority: 'NONE';
}

export interface SandboxExecutionReceipt {
  schema: 'worldline-sandbox-execution-receipt-v1';
  proposalEnvelopeHash: Sha256Digest;
  baseStateHash: Sha256Digest;
  candidateStateHash: Sha256Digest;
  mechanismHash: Sha256Digest;
  programHash: Sha256Digest;
  inputBytes: number;
  outputBytes: number;
  operationCount: number;
  authority: 'NONE';
  canonicalWriteAttempted: false;
  status: 'COMPLETED';
  receiptHash: Sha256Digest;
}

function byteLength(value: unknown): number {
  return new TextEncoder().encode(canonicalize(value)).byteLength;
}

export async function compileMechanismForSandbox(
  mechanism: TransitionMechanismArtifact,
  policy: SandboxPolicy = DEFAULT_MECHANISM_SANDBOX_POLICY,
): Promise<CompiledSandboxMechanism> {
  if (!await verifyMechanismContentHash(mechanism)) throw new Error('Mechanism content hash mismatch');
  if (mechanism.executorKind !== 'TRANSITION_IR_V1') throw new Error('Sandbox accepts Transition IR only');
  if (!Number.isInteger(policy.maxOperations) || policy.maxOperations < 1) throw new Error('Invalid sandbox operation budget');
  const program = structuredClone(mechanism.program) as TransitionIrProgram;
  validateTransitionIr(program, mechanism);
  if (program.operations.length > policy.maxOperations) throw new Error('Sandbox operation budget exceeded');
  return Object.freeze({
    schema: 'worldline-compiled-sandbox-mechanism-v1',
    mechanismId: mechanism.mechanismId,
    mechanismHash: mechanism.contentHash,
    program: Object.freeze(program),
    programHash: await hashCanonical(program),
    policyId: policy.policyId,
    operationCount: program.operations.length,
    authority: 'NONE',
  });
}

export async function executeInMechanismSandbox(input: {
  baseState: unknown;
  proposal: WorldTransitionProposal;
  mechanism: TransitionMechanismArtifact;
  policy?: SandboxPolicy;
}): Promise<{ candidateState: unknown; receipt: SandboxExecutionReceipt }> {
  const policy = input.policy ?? DEFAULT_MECHANISM_SANDBOX_POLICY;
  const { envelopeHash: suppliedEnvelopeHash, ...envelopeCore } = input.proposal;
  if (await hashCanonical(envelopeCore) !== suppliedEnvelopeHash) throw new Error('Proposal envelope hash mismatch');
  if (input.proposal.proposal.mechanismId !== input.mechanism.mechanismId) throw new Error('Proposal mechanism identity mismatch');
  const compiled = await compileMechanismForSandbox(input.mechanism, policy);
  const inputBytes = byteLength({ baseState: input.baseState, inputs: input.proposal.proposal.normalizedInputs });
  if (inputBytes > policy.maxInputBytes) throw new Error('Sandbox input budget exceeded');
  const baseState = structuredClone(input.baseState);
  const transitionInputs = input.proposal.proposal.normalizedInputs;
  if (!transitionInputs || typeof transitionInputs !== 'object' || Array.isArray(transitionInputs)) throw new Error('Transition inputs must be an object');
  const candidateState = executeTransitionIr(baseState, compiled.program, transitionInputs as Record<string, unknown>);
  const outputBytes = byteLength(candidateState);
  if (outputBytes > policy.maxOutputBytes) throw new Error('Sandbox output budget exceeded');
  const receiptCore = {
    schema: 'worldline-sandbox-execution-receipt-v1' as const,
    proposalEnvelopeHash: suppliedEnvelopeHash,
    baseStateHash: await hashCanonical(input.baseState),
    candidateStateHash: await hashCanonical(candidateState),
    mechanismHash: compiled.mechanismHash,
    programHash: compiled.programHash,
    inputBytes,
    outputBytes,
    operationCount: compiled.operationCount,
    authority: 'NONE' as const,
    canonicalWriteAttempted: false as const,
    status: 'COMPLETED' as const,
  };
  return {
    candidateState: structuredClone(candidateState),
    receipt: Object.freeze({ ...receiptCore, receiptHash: await hashCanonical(receiptCore) }),
  };
}
