import { describe, expect, it } from 'vitest';
import { createChronosGameplayState } from '../chronosGameplay';
import { runExperiment } from '../experiments';
import { createIntervention } from '../interventions';
import { createProviderRegistry, resolveSurfaceProvider } from '../providers';
import { createResearchLedger } from '../researchLedger';
import { WORLDLINE_RELEASE } from '../release';
import { createInitialWorldlineState, replayBranch } from '../state';
import { createWorldProject } from '../studioProjects';
import { createWorldpack, parseWorldpack, serializeWorldpack } from '../worldpack';

describe('Worldline 2.0 zero-credential smoke contract', () => {
  it('boots into the generated FIELD world without provider credentials', () => {
    const state = createInitialWorldlineState();
    expect(state.activeWorld.id).toBe('worldgen-prime');
    expect(state.activeWorld.epistemicClass).toBe('GENERATED');
    expect(state.activeWorld.fidelity).toBe('FIELD');
  });

  it('resolves the procedural surface when network Earth is unavailable', () => {
    const registry = createProviderRegistry({ networkAvailable: false, requested: 'open-earth-maplibre' });
    expect(resolveSurfaceProvider(registry, 'open-earth-maplibre').id).toBe('procedural-worldgen');
  });

  it('requires no paid provider in the release manifest', () => {
    expect(WORLDLINE_RELEASE.providerClasses).toEqual(expect.arrayContaining(['procedural-worldgen']));
    expect(WORLDLINE_RELEASE.providerClasses.join('|')).not.toMatch(/google|cesium|paid/i);
  });

  it('retains deterministic branch replay without a backend', () => {
    const state = createInitialWorldlineState();
    expect(replayBranch(state, state.activeBranchId)).toEqual(replayBranch(state, state.activeBranchId));
  });

  it('initializes research and Chronos locally', () => {
    expect(createResearchLedger().entries).toEqual([]);
    expect(createChronosGameplayState().samples).toHaveLength(1);
  });

  it('runs a complete offline Studio project → intervention → experiment → Worldpack round-trip', () => {
    const state = createInitialWorldlineState();
    const branch = state.branches[state.activeBranchId];
    const baseline = branch.snapshots[0];
    const project = createWorldProject(state, {
      title: 'Offline Studio Smoke',
      now: '2026-08-13T02:00:00.000Z',
      sequence: 1,
    });
    const intervention = createIntervention({
      worldId: state.activeWorld.id,
      branchId: state.activeBranchId,
      label: 'Resilience test',
      category: 'climate-resilience',
      startYear: baseline.year,
      durationYears: 10,
      magnitude: 1,
      metricEffects: { resilience: 2 },
      notes: 'Smoke-test scenario input',
      epistemicClass: 'SIMULATED',
    });
    const input = {
      projectId: project.id,
      worldId: state.activeWorld.id,
      branchId: state.activeBranchId,
      year: baseline.year,
      seed: branch.seed,
      baselineMetrics: baseline.metrics,
      interventions: [intervention],
      now: '2026-08-13T02:00:01.000Z',
    };
    const first = runExperiment(input);
    const second = runExperiment(input);
    expect(first.inputFingerprint).toBe(second.inputFingerprint);
    expect(first.resultMetrics).toEqual(second.resultMetrics);

    const populated = { ...project, interventions: [intervention], experiments: [first] };
    const text = serializeWorldpack(createWorldpack(populated, {
      exportedAt: '2026-08-13T02:00:02.000Z',
      provenance: { mode: 'offline-smoke' },
    }));
    const parsed = parseWorldpack(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.worldpack.project.experiments[0].resultMetrics).toEqual(first.resultMetrics);
    expect(parsed.worldpack.project.interventions[0].epistemicClass).toBe('SIMULATED');
  });
});
