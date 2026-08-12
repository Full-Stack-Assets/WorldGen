import { describe, expect, it } from 'vitest';
import { createTwinTimelineState, selectSimulationYear, selectSourceYear } from '../twinTimeline';

describe('Worldline twin timelines', () => {
  it('keeps source time and simulation time independent', () => {
    const initial = createTwinTimelineState(2026, 2025);
    const sourceMoved = selectSourceYear(initial, 2023);
    expect(sourceMoved.sourceYear).toBe(2023);
    expect(sourceMoved.simulationYear).toBe(2026);
    const simulationMoved = selectSimulationYear(sourceMoved, 2040);
    expect(simulationMoved.sourceYear).toBe(2023);
    expect(simulationMoved.simulationYear).toBe(2040);
  });
});