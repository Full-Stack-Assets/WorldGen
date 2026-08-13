import { describe, expect, it } from 'vitest';

const modules = import.meta.glob('../*.ts', { eager: true }) as Record<string, Record<string, any>>;
const families = modules['../futureFamilies.ts'];

const sessions = [
  { id: 'b', resultMetrics: { affordability: 60, vitality: 70, resilience: 50 } },
  { id: 'a', resultMetrics: { affordability: 55, vitality: 68, resilience: 51 } },
  { id: 'c', resultMetrics: { affordability: 20, vitality: 30, resilience: 80 } },
];

describe('Future Families', () => {
  it('assigns deterministic families independent of input order', () => {
    expect(families).toBeDefined();
    if (!families) return;
    const first = families.buildFutureFamilies(sessions);
    const second = families.buildFutureFamilies([...sessions].reverse());
    expect(first).toEqual(second);
    expect(first.every((family: any) => !('probability' in family))).toBe(true);
  });

  it('computes deterministic centroids and neutral labels', () => {
    expect(families).toBeDefined();
    if (!families) return;
    const result = families.buildFutureFamilies([{ id: 'solo', resultMetrics: { affordability: 42, vitality: 55 } }]);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Family A');
    expect(result[0].memberIds).toEqual(['solo']);
    expect(result[0].centroid).toEqual({ affordability: 42, vitality: 55 });
  });
});
