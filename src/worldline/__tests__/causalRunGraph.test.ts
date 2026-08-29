import { describe, expect, it } from 'vitest';
import { createBuiltinBranchMechanism } from '../causal/builtinMechanisms';
import { buildWorldlineBranch } from '../causal/branchRules';
import { hashCanonical } from '../causal/canonicalJson';
import { admitTransition, createTransitionProposal } from '../causal/kernel';
import { buildCanonicalRunGraph, exportCanonicalRunGraph, importCanonicalRunGraph, verifyCanonicalRunGraph } from '../causal/runGraph';
import { createGenesisRevision, createInMemoryCanonicalStore } from '../causal/store';
import { executeTransitionIr, type TransitionIrProgram } from '../causal/transitionIr';
import { createInitialCanonicalWorldState } from '../state';

describe('Worldline canonical RunGraph', () => {
  it('exports byte-stable revisions, states, branch heads, and receipt chains', async () => {
    const store = createInMemoryCanonicalStore();
    const state = createInitialCanonicalWorldState();
    const genesis = await createGenesisRevision({
      worldId: 'worldgen-prime', branchId: 'branch-root', simulationTime: 2026,
      stateSchema: 'worldline-state-v1', epistemicClass: 'SIMULATED', kernelVersion: 'causal-kernel-v1', state,
    });
    await store.putGenesis(genesis, state);
    const mechanism = await createBuiltinBranchMechanism();
    await store.putMechanism(mechanism);
    const branch = await buildWorldlineBranch(state, 'branch-root', { label: 'Run graph branch', atYear: 2030 });
    const proposal = await createTransitionProposal({
      baseRevisionId: genesis.revisionId,
      mechanismId: mechanism.mechanismId,
      inputs: {
        branches: branch.canonical.branches,
        activeBranchId: 'branch-root',
        label: 'Run graph branch',
        atYear: 2030,
      },
      producerId: mechanism.producerId,
      targetBranchId: branch.branchId,
      simulationTime: 2030,
    });
    const verifier = {
      verifierId: 'verifier:run-graph-test',
      configDigest: 'sha256:run-graph-test' as const,
      replay: ({ baseState, program, inputs }: { baseState: unknown; program: TransitionIrProgram; inputs: Record<string, unknown> }) =>
        executeTransitionIr(baseState, program, inputs),
    };
    const admitted = await admitTransition(store, proposal, verifier);
    expect(admitted.decision).toBe('ACCEPTED');

    const graph = await buildCanonicalRunGraph(store);
    const first = exportCanonicalRunGraph(graph);
    const second = exportCanonicalRunGraph(await buildCanonicalRunGraph(store));
    expect(second).toBe(first);
    await expect(verifyCanonicalRunGraph(JSON.parse(first))).resolves.toMatchObject({ ok: true, verifiedRevisionCount: 2 });
    const imported = await importCanonicalRunGraph(first);
    expect(exportCanonicalRunGraph(await buildCanonicalRunGraph(imported.store))).toBe(first);
  });

  it('rejects state, receipt, ancestry, and graph-hash tampering', async () => {
    const store = createInMemoryCanonicalStore();
    const state = { worlds: [], branches: {} };
    const genesis = await createGenesisRevision({
      worldId: 'worldgen-prime', branchId: 'root', simulationTime: 2026,
      stateSchema: 'worldline-state-v1', epistemicClass: 'SIMULATED', kernelVersion: 'causal-kernel-v1', state,
    });
    await store.putGenesis(genesis, state);
    const graph = await buildCanonicalRunGraph(store);
    const tampered = JSON.parse(exportCanonicalRunGraph(graph));
    tampered.states[genesis.stateHash] = { worlds: ['tampered'], branches: {} };
    const { graphHash: _oldGraphHash, ...tamperedCore } = tampered;
    tampered.graphHash = await hashCanonical(tamperedCore);
    await expect(verifyCanonicalRunGraph(tampered)).resolves.toMatchObject({ ok: false, errorCode: 'E_STATE_HASH' });
  });
});
