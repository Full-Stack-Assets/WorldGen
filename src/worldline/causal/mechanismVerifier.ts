import { hashCanonical, type Sha256Digest } from './canonicalJson';
import type { IndependentVerifier } from './kernel';
import { executeInMechanismSandbox } from './sandbox';
import { executeTransitionIr, type TransitionIrProgram } from './transitionIr';
import type { TransitionMechanismArtifact, WorldTransitionProposal } from './types';

export interface MechanismVerifierConfig {
  verifierId: string;
  implementationVersion: string;
  sandboxPolicyId: string;
  invariantSuiteVersion: string;
  allowedMechanismHashes: readonly Sha256Digest[];
  evaluatorFrozenBeforeProposal: boolean;
}

export interface MechanismVerifierReceipt {
  schema: 'worldline-mechanism-verifier-receipt-v1';
  verifierId: string;
  verifierConfigDigest: Sha256Digest;
  mechanismId: string;
  mechanismHash: Sha256Digest;
  proposalEnvelopeHash: Sha256Digest;
  candidateStateHash: Sha256Digest | null;
  sandboxReceiptHash: Sha256Digest | null;
  decision: 'VERIFIED' | 'REJECTED';
  reasons: readonly string[];
  receiptHash: Sha256Digest;
}

export async function createIndependentMechanismVerifier(sourceConfig: MechanismVerifierConfig) {
  const config: MechanismVerifierConfig = Object.freeze({
    ...structuredClone(sourceConfig),
    allowedMechanismHashes: Object.freeze([...sourceConfig.allowedMechanismHashes].sort()),
  });
  if (!config.verifierId || !config.implementationVersion || !config.sandboxPolicyId || !config.invariantSuiteVersion) {
    throw new Error('MechanismVerifier identity and versions are required');
  }
  if (!config.evaluatorFrozenBeforeProposal) throw new Error('MechanismVerifier must be frozen before proposal evaluation');
  const configDigest = await hashCanonical(config);

  const asKernelVerifier = (): IndependentVerifier => Object.freeze({
    verifierId: config.verifierId,
    configDigest,
    replay: ({ baseState, program, inputs }: { baseState: unknown; program: TransitionIrProgram; inputs: Record<string, unknown> }) =>
      executeTransitionIr(structuredClone(baseState), structuredClone(program), structuredClone(inputs)),
  });

  const verify = async (input: {
    baseState: unknown;
    proposal: WorldTransitionProposal;
    mechanism: TransitionMechanismArtifact;
  }): Promise<MechanismVerifierReceipt> => {
    const reasons: string[] = [];
    let candidateStateHash: Sha256Digest | null = null;
    let sandboxReceiptHash: Sha256Digest | null = null;
    if (input.proposal.proposal.producerId === config.verifierId) reasons.push('Producer/verifier identity collision.');
    if (!config.allowedMechanismHashes.includes(input.mechanism.contentHash)) reasons.push('Mechanism hash is outside the frozen verifier allowlist.');
    if (input.proposal.proposal.mechanismId !== input.mechanism.mechanismId) reasons.push('Proposal mechanism identity mismatch.');
    if (reasons.length === 0) {
      try {
        const result = await executeInMechanismSandbox(input);
        candidateStateHash = result.receipt.candidateStateHash;
        sandboxReceiptHash = result.receipt.receiptHash;
      } catch (error) {
        reasons.push(error instanceof Error ? error.message : String(error));
      }
    }
    const core = {
      schema: 'worldline-mechanism-verifier-receipt-v1' as const,
      verifierId: config.verifierId,
      verifierConfigDigest: configDigest,
      mechanismId: input.mechanism.mechanismId,
      mechanismHash: input.mechanism.contentHash,
      proposalEnvelopeHash: input.proposal.envelopeHash,
      candidateStateHash,
      sandboxReceiptHash,
      decision: reasons.length === 0 ? 'VERIFIED' as const : 'REJECTED' as const,
      reasons: Object.freeze(reasons),
    };
    return Object.freeze({ ...core, receiptHash: await hashCanonical(core) });
  };

  return Object.freeze({
    verifierId: config.verifierId,
    configDigest,
    config,
    asKernelVerifier,
    verify,
  });
}
