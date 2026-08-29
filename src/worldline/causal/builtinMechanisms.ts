import { hashCanonical } from './canonicalJson';
import { admitTransition, createTransitionProposal } from './kernel';
import { computeMechanismContentHash } from './mechanismIdentity';
import { createGenesisRevision, createInMemoryCanonicalStore } from './store';
import { executeTransitionIr, type TransitionIrProgram } from './transitionIr';
import type { CanonicalRevision, TransitionMechanismArtifact, TransitionReceiptEnvelope } from './types';
import type { BranchRecord, CanonicalWorldState, WorldSnapshot, WorldlineState } from '../types';

const BRANCH_PROGRAM: TransitionIrProgram = {
  version: 'TRANSITION_IR_V1',
  operations: [{ op: 'SET', path: '/branches', value: { input: 'branches' } }],
};

export const BUILTIN_BRANCH_MECHANISM = Object.freeze({
  rulesVersion: 'worldline-branch-rules-v1',
  mechanismId: 'builtin:branch-create:v1',
  executorKind: 'TRANSITION_IR_V1',
  branchIdNormalization: 'lowercase-nonalphanumeric-to-hyphen',
  seedMultiplier: 7919,
  snapshotStepYears: 5,
  metricDeltas: Object.freeze({
    population: 850,
    affordability: 1.5,
    vitality: 2.2,
    resilience: 1.8,
  }),
  program: BRANCH_PROGRAM,
});

function divergedSnapshot(source: WorldSnapshot, branchId: string, forkYear: number, direction: number): WorldSnapshot {
  const steps = Math.max(0, Math.round((source.year - forkYear) / BUILTIN_BRANCH_MECHANISM.snapshotStepYears));
  const metrics = Object.fromEntries(Object.entries(source.metrics).map(([key, value]) => {
    if (key === 'population') return [key, Math.round(value + direction * steps * BUILTIN_BRANCH_MECHANISM.metricDeltas.population)];
    if (key === 'affordability') return [key, Math.max(0, Math.min(100, value + direction * steps * BUILTIN_BRANCH_MECHANISM.metricDeltas.affordability))];
    if (key === 'vitality') return [key, Math.max(0, Math.min(100, value + direction * steps * BUILTIN_BRANCH_MECHANISM.metricDeltas.vitality))];
    if (key === 'resilience') return [key, Math.max(0, Math.min(100, value + direction * steps * BUILTIN_BRANCH_MECHANISM.metricDeltas.resilience))];
    return [key, value];
  }));
  const metricText = Object.entries(metrics)
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
  return {
    ...structuredClone(source),
    id: `${branchId}-${source.year}`,
    branchId,
    metrics,
    commitment: `${branchId}:${source.year}:${metricText}`,
  };
}

function buildBranch(canonical: CanonicalWorldState, activeBranchId: string, input: { label: string; atYear: number }) {
  const parent = canonical.branches[activeBranchId];
  if (!parent) throw new Error('Active branch is missing');
  const eligibleSnapshots = parent.snapshots.filter((snapshot) => snapshot.year <= input.atYear);
  if (eligibleSnapshots.length === 0) throw new Error('Cannot branch before the first committed snapshot');
  const actualForkYear = eligibleSnapshots[eligibleSnapshots.length - 1].year;
  const branchIndex = Object.keys(canonical.branches).length;
  const normalizedLabel = input.label.normalize('NFC');
  const slug = normalizedLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const id = `branch-${branchIndex}-${slug}`;
  if (canonical.branches[id]) throw new Error(`Branch already exists: ${id}`);
  const direction = branchIndex % 2 === 0 ? -1 : 1;
  const sourceSnapshots = parent.snapshots.filter((snapshot) => snapshot.year >= actualForkYear);
  const childSnapshots = sourceSnapshots.map((snapshot) => divergedSnapshot(snapshot, id, actualForkYear, direction));
  const child: BranchRecord = {
    id,
    label: normalizedLabel,
    parentId: parent.id,
    forkYear: actualForkYear,
    seed: parent.seed + branchIndex * BUILTIN_BRANCH_MECHANISM.seedMultiplier,
    events: [{
      id: `${id}-event`,
      year: actualForkYear,
      type: 'scenario-intervention',
      label: direction > 0 ? 'Adaptive intervention' : 'Constraint shock',
      delta: { direction },
    }],
    snapshots: childSnapshots,
  };
  return {
    canonical: {
      ...structuredClone(canonical),
      branches: { ...structuredClone(canonical.branches), [id]: child },
    },
    branchId: id,
    actualForkYear,
  };
}

export async function createBuiltinBranchMechanism(): Promise<TransitionMechanismArtifact> {
  const candidate: TransitionMechanismArtifact = {
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
  candidate.contentHash = await computeMechanismContentHash(candidate);
  return candidate;
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
  const next = buildBranch(canonical, state.activeBranchId, input);
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
    inputs: { branches: next.canonical.branches },
    producerId: mechanism.producerId,
    targetBranchId: next.branchId,
    simulationTime: next.actualForkYear,
  });
  const verifier = {
    verifierId: 'verifier:worldline-builtin-branch-v1',
    configDigest: await hashCanonical({
      id: 'worldline-builtin-branch-verifier-v1',
      mechanismHash: mechanism.contentHash,
    }),
    replay: ({ baseState, program, inputs }: {
      baseState: unknown;
      program: TransitionIrProgram;
      inputs: Record<string, unknown>;
    }) => executeTransitionIr(baseState, program, inputs),
  };
  const result = await admitTransition(store, proposal, verifier);
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
