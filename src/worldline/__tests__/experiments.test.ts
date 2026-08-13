import { describe, expect, it } from 'vitest';
import { createInitialWorldlineState } from '../state';

const modules = import.meta.glob('../*.ts', { eager: true }) as Record<string, Record<string, any>>;
const experiments = modules['../experiments.ts'];
const interventions = modules['../interventions.ts'];

describe('Studio experiments', () => {
  it('replays deterministically from committed inputs independent of intervention order', () => {
    expect(experiments).toBeDefined();
    expect(interventions).toBeDefined();
    if (!experiments || !interventions) return;

    const state = createInitialWorldlineState();
    const branch = state.branches[state.activeBranchId];
    const snapshot = branch.snapshots.find((item) => item.year === 2030) ?? branch.snapshots[0];
    const a = interventions.createIntervention({ worldId: state.activeWorld.id, branchId: branch.id, label: 'Housing', category: 'housing', startYear: snapshot.year, durationYears: null, magnitude: 1, metricEffects: { affordability: 4 }, notes: '', epistemicClass: 'SIMULATED' });
    const b = interventions.createIntervention({ worldId: state.activeWorld.id, branchId: branch.id, label: 'Transit', category: 'mobility', startYear: snapshot.year, durationYears: null, magnitude: 1, metricEffects: { vitality: 2 }, notes: '', epistemicClass: 'SIMULATED' });
    const input = { projectId: 'project-a', worldId: state.activeWorld.id, branchId: branch.id, year: snapshot.year, seed: 42, baselineMetrics: snapshot.metrics, interventions: [a, b], now: '2026-08-12T20:00:00.000Z' };

    const first = experiments.runExperiment(input);
    const second = experiments.runExperiment({ ...input, interventions: [b, a] });

    expect(first.schema).toBe('worldline-experiment-v2');
    expect(first.inputFingerprint).toBe(second.inputFingerprint);
    expect(first.resultMetrics).toEqual(second.resultMetrics);
    expect(first.interventionIds).toEqual([...first.interventionIds].sort());
    expect(snapshot.metrics).toEqual(input.baselineMetrics);
  });

  it('commits the seed without relying on ambient randomness', () => {
    expect(experiments).toBeDefined();
    if (!experiments) return;
    const base = { projectId: 'p', worldId: 'w', branchId: 'b', year: 2040, baselineMetrics: { vitality: 50 }, interventions: [], now: '2026-08-12T20:00:00.000Z' };
    const a = experiments.runExperiment({ ...base, seed: 1 });
    const b = experiments.runExperiment({ ...base, seed: 2 });
    expect(a.inputFingerprint).not.toBe(b.inputFingerprint);
    expect(experiments.runExperiment({ ...base, seed: 1 })).toEqual(a);
  });
});
