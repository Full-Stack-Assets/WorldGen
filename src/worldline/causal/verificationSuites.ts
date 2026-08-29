import { hashCanonical, type Sha256Digest } from './canonicalJson';
import { executeInMechanismSandbox } from './sandbox';
import type { TransitionMechanismArtifact, WorldTransitionProposal } from './types';

export interface VerificationGate {
  id: 'INVARIANT' | 'REPLAY' | 'PAIRED_INTERVENTION' | 'FAILURE_PRESERVATION' | 'COUNTEREXAMPLE_SEARCH';
  passed: boolean;
  detail: string;
  evidenceRefs: readonly string[];
}

export interface CounterexampleProbe {
  id: string;
  proposal: WorldTransitionProposal;
  invariant(candidateState: unknown): boolean;
  detail: string;
}

export interface MechanismVerificationSuiteReceipt {
  schema: 'worldline-mechanism-verification-suite-v1';
  mechanismId: string;
  mechanismHash: Sha256Digest;
  verifierConfigId: string;
  heldOut: boolean;
  gates: readonly VerificationGate[];
  counterexampleIds: readonly string[];
  status: 'PASS' | 'FAIL';
  receiptHash: Sha256Digest;
}

function readPath(root: unknown, path: string): unknown {
  let cursor = root;
  for (const segment of path.slice(1).split('/').map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))) {
    if (!cursor || typeof cursor !== 'object') return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return cursor;
}

export async function runMechanismVerificationSuite(input: {
  mechanism: TransitionMechanismArtifact;
  baseState: unknown;
  verifierConfigId: string;
  heldOut: boolean;
  replayProposal: WorldTransitionProposal;
  pairedIntervention: {
    control: WorldTransitionProposal;
    intervention: WorldTransitionProposal;
    observedPath: string;
    expected: 'INCREASE' | 'DECREASE' | 'CHANGE' | 'UNCHANGED';
  };
  failureCases: readonly { id: string; proposal: WorldTransitionProposal; expectedError: string }[];
  counterexampleProbes: readonly CounterexampleProbe[];
}): Promise<MechanismVerificationSuiteReceipt> {
  if (!input.verifierConfigId) throw new Error('Verifier configuration identity is required');
  const gates: VerificationGate[] = [];
  const first = await executeInMechanismSandbox({ baseState: input.baseState, proposal: input.replayProposal, mechanism: input.mechanism });
  const second = await executeInMechanismSandbox({ baseState: input.baseState, proposal: input.replayProposal, mechanism: input.mechanism });
  const replayPassed = first.receipt.candidateStateHash === second.receipt.candidateStateHash;
  gates.push({ id: 'REPLAY', passed: replayPassed, detail: replayPassed ? 'Independent sandbox replays matched.' : 'Sandbox replay hashes diverged.', evidenceRefs: [first.receipt.receiptHash, second.receipt.receiptHash] });

  const control = await executeInMechanismSandbox({ baseState: input.baseState, proposal: input.pairedIntervention.control, mechanism: input.mechanism });
  const intervention = await executeInMechanismSandbox({ baseState: input.baseState, proposal: input.pairedIntervention.intervention, mechanism: input.mechanism });
  const controlValue = readPath(control.candidateState, input.pairedIntervention.observedPath);
  const interventionValue = readPath(intervention.candidateState, input.pairedIntervention.observedPath);
  const expected = input.pairedIntervention.expected;
  const pairedPassed = expected === 'CHANGE' ? control.receipt.candidateStateHash !== intervention.receipt.candidateStateHash
    : expected === 'UNCHANGED' ? control.receipt.candidateStateHash === intervention.receipt.candidateStateHash
      : expected === 'INCREASE' ? Number(interventionValue) > Number(controlValue)
        : Number(interventionValue) < Number(controlValue);
  gates.push({
    id: 'PAIRED_INTERVENTION',
    passed: pairedPassed,
    detail: pairedPassed ? `Paired intervention satisfied ${expected} at ${input.pairedIntervention.observedPath}.` : `Paired intervention violated ${expected} at ${input.pairedIntervention.observedPath}.`,
    evidenceRefs: [control.receipt.receiptHash, intervention.receipt.receiptHash],
  });

  const failureEvidence: string[] = [];
  let failuresPreserved = true;
  for (const testCase of input.failureCases) {
    try {
      await executeInMechanismSandbox({ baseState: input.baseState, proposal: testCase.proposal, mechanism: input.mechanism });
      failuresPreserved = false;
      failureEvidence.push(`${testCase.id}:unexpected-pass`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes(testCase.expectedError)) failuresPreserved = false;
      failureEvidence.push(`${testCase.id}:${message}`);
    }
  }
  gates.push({ id: 'FAILURE_PRESERVATION', passed: failuresPreserved, detail: failuresPreserved ? 'All declared failure cases remained rejected.' : 'A failure case passed or changed failure mode.', evidenceRefs: failureEvidence });

  const counterexampleIds: string[] = [];
  const counterexampleEvidence: string[] = [];
  for (const probe of input.counterexampleProbes) {
    try {
      const result = await executeInMechanismSandbox({ baseState: input.baseState, proposal: probe.proposal, mechanism: input.mechanism });
      if (!probe.invariant(result.candidateState)) counterexampleIds.push(probe.id);
      counterexampleEvidence.push(result.receipt.receiptHash);
    } catch {
      counterexampleIds.push(probe.id);
      counterexampleEvidence.push(`${probe.id}:execution-rejected`);
    }
  }
  gates.push({
    id: 'COUNTEREXAMPLE_SEARCH',
    passed: counterexampleIds.length === 0,
    detail: counterexampleIds.length === 0 ? 'No bounded counterexample was found.' : `Counterexamples retained: ${counterexampleIds.join(', ')}.`,
    evidenceRefs: counterexampleEvidence,
  });
  gates.push({
    id: 'INVARIANT',
    passed: input.counterexampleProbes.length > 0 && input.counterexampleProbes.every((probe) => probe.detail.trim().length > 0),
    detail: 'Verifier-owned invariants were explicitly named for every bounded probe.',
    evidenceRefs: input.counterexampleProbes.map((probe) => `invariant:${probe.id}`),
  });
  const core = {
    schema: 'worldline-mechanism-verification-suite-v1' as const,
    mechanismId: input.mechanism.mechanismId,
    mechanismHash: input.mechanism.contentHash,
    verifierConfigId: input.verifierConfigId,
    heldOut: input.heldOut,
    gates,
    counterexampleIds,
    status: gates.every((gate) => gate.passed) ? 'PASS' as const : 'FAIL' as const,
  };
  return { ...core, receiptHash: await hashCanonical(core) };
}
