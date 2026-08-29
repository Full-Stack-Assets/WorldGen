import { BRANCH_RULES_V1, buildWorldlineBranch } from './branchRules';
import { admitTransition, createTransitionProposal } from './kernel';
import { computeMechanismContentHash } from './mechanismIdentity';
import { createGenesisRevision, createInMemoryCanonicalStore } from './store';
import type { TransitionIrProgram } from './transitionIr';
import { createIndependentMechanismVerifier } from './mechanismVerifier';
import type { CanonicalRevision, TransitionMechanismArtifact, TransitionReceiptEnvelope } from './types';
import type { CanonicalWorldState, WorldlineState } from '../types';

const BRANCH_PROGRAM: TransitionIrProgram = {
  version: 'TRANSITION_IR_V1',
  operations: [{ op: 'SET', path: '/branches', value: { input: 'branches' } }],
};

export const BUILTIN_BRANCH_MECHANISM = Object.freeze({
  ...BRANCH_RULES_V1,
  mechanismId: 'builtin:branch-create:v1',
  executorKind: 'TRANSITION_IR_V1',
  program: BRANCH_PROGRAM,
});

export async function createBuiltinBranchMechanism(): Promise<TransitionMechanismArtifact> {
  const mechanism: TransitionMechanismArtifact = {
    schema: 'worldline-transition-mechanism-v1',
    mechanismId: BUILTIN_BRANCH_MECHANISM.mechanismId,
    contentHash: 'sha256:pending',
    sourceType: 'HUMAN_AUTHORED',
    producerId: 'producer:worldline-builtin-branch-v1',
    executorKind: 'TRANSITION_IR_V1',
    stateSchemas: ['worldline-state-v1'],
    readSet: [],
    writeSet: ['/branches'],
    inputSchema: { type: 'object', required: ['branches'] },
    epistemicCeiling: 'SIMULATED',
    seedPolicy: 'NONE',
    invariantSuiteRefs: ['branch-parent-immutability-v1', 'worldline-branch-rules-v1'],
    riskClass: 'REVERSIBLE_TUNING',
    reversible: true,
    machineVerifiable: true,
    automaticExecutionAllowed: true,
    promotionStatus: 'APPROVED_EXECUTABLE',
    approvalReceiptId: 'human-authority:worldline-4d-causal-kernel-plan',
    program: BRANCH_PROGRAM,
  };
  mechanism.contentHash = await computeMechanismContentHash(mechanism);
  return mechanism;
}

export async function createBranchThroughKernel(state: WorldlineState, input: { label: string; atYear: number }): Promise<{
  decision: 'ACCEPTED';
  state: WorldlineState;
  receipt: TransitionReceiptEnvelope;
  revision: CanonicalRevision;
}> {
  const canonical: CanonicalWorldState = {
    worlds: structuredClone(state.worlds),
    branches: structuredClone(state.branches),
  };
  const next = await buildWorldlineBranch(canonical, state.activeBranchId, input);
  const store = createInMemoryCanonicalStore();
  const genesis = await createGenesisRevision({
    worldId: state.activeWorld.id,
    branchId: state.activeBranchId,
    simulationTime: state.selectedYear,
    stateSchema: 'worldline-state-v1',
    epistemicClass: state.activeWorld.epistemicClass,
    kernelVersion: 'causal-kernel-v1',
    state: canonical,
  });
  await store.putGenesis(genesis, canonical);
  const mechanism = await createBuiltinBranchMechanism();
  await store.putMechanism(mechanism);
  const proposal = await createTransitionProposal({
    baseRevisionId: genesis.revisionId,
    mechanismId: mechanism.mechanismId,
    inputs: {
      branches: next.canonical.branches,
      activeBranchId: state.activeBranchId,
      label: input.label,
      atYear: input.atYear,
    },
    producerId: mechanism.producerId,
    targetBranchId: next.branchId,
    simulationTime: next.actualForkYear,
  });
  const verifier = await createIndependentMechanismVerifier({
    verifierId: 'verifier:worldline-builtin-branch-v1',
    implementationVersion: 'worldline-mechanism-verifier-v1',
    sandboxPolicyId: 'worldline-mechanism-sandbox-v1',
    invariantSuiteVersion: 'worldline-invariants-v1',
    allowedMechanismHashes: [mechanism.contentHash],
    evaluatorFrozenBeforeProposal: true,
  });
  const result = await admitTransition(store, proposal, verifier.asKernelVerifier());
  if (result.decision !== 'ACCEPTED' || !result.revision) {
    throw new Error(`Built-in branch admission failed: ${result.decision}`);
  }
  const admitted = store.getStateByHash<CanonicalWorldState>(result.revision.stateHash);
  if (!admitted) throw new Error('Admitted branch state is missing');
  return {
    decision: 'ACCEPTED',
    state: {
      ...state,
      worlds: admitted.worlds,
      branches: admitted.branches,
      activeBranchId: next.branchId,
      selectedYear: next.actualForkYear,
    },
    receipt: result.receipt,
    revision: result.revision,
  };
}
