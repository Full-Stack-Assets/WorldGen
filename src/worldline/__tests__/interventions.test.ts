import { describe, expect, it } from 'vitest';

const modules = import.meta.glob('../*.ts', { eager: true }) as Record<string, Record<string, any>>;
const interventions = modules['../interventions.ts'];

const baseInput = {
  worldId: 'new-bedford-earth',
  branchId: 'root',
  label: 'Housing supply package',
  category: 'housing',
  startYear: 2030,
  durationYears: 10,
  magnitude: 1,
  metricEffects: { affordability: 4, population: 1200 },
  notes: 'Scenario input only',
  epistemicClass: 'SIMULATED',
};

describe('Studio interventions', () => {
  it('creates stable IDs and rejects observed semantics', () => {
    expect(interventions).toBeDefined();
    if (!interventions) return;

    const a = interventions.createIntervention(baseInput);
    const b = interventions.createIntervention({ ...baseInput, metricEffects: { population: 1200, affordability: 4 } });
    expect(a.id).toBe(b.id);
    expect(a.epistemicClass).toBe('SIMULATED');
    expect(() => interventions.createIntervention({ ...baseInput, epistemicClass: 'OBSERVED' })).toThrow(/observed/i);
  });

  it('applies only active interventions in deterministic ID order without mutating baseline', () => {
    expect(interventions).toBeDefined();
    if (!interventions) return;

    const housing = interventions.createIntervention(baseInput);
    const transit = interventions.createIntervention({
      ...baseInput,
      label: 'Transit priority',
      category: 'mobility',
      startYear: 2032,
      durationYears: null,
      metricEffects: { vitality: 3, affordability: 1 },
    });
    const baseline = { affordability: 50, population: 100000, vitality: 60 };

    expect(interventions.isInterventionActive(housing, 2029)).toBe(false);
    expect(interventions.isInterventionActive(housing, 2030)).toBe(true);
    expect(interventions.isInterventionActive(housing, 2040)).toBe(false);

    const applied = interventions.applyInterventions(baseline, [transit, housing], 2035);
    expect(applied.metrics).toEqual({ affordability: 55, population: 101200, vitality: 63 });
    expect(applied.interventionIds).toEqual([...applied.interventionIds].sort());
    expect(baseline).toEqual({ affordability: 50, population: 100000, vitality: 60 });
  });
});
