import { describe, expect, it } from 'vitest';
import { createInitialWorldlineState } from '../state';

const modules = import.meta.glob('../*.ts', { eager: true }) as Record<string, Record<string, any>>;
const studio = modules['../studioProjects.ts'];

describe('Worldline Studio projects', () => {
  it('creates deterministic versioned projects without mutating caller state', () => {
    expect(studio).toBeDefined();
    if (!studio) return;

    const state = createInitialWorldlineState();
    const originalYear = state.selectedYear;
    const input = { title: 'New Bedford Studio', now: '2026-08-12T20:00:00.000Z', sequence: 7 };
    const first = studio.createWorldProject(state, input);
    const second = studio.createWorldProject(state, input);

    expect(first.schema).toBe('worldline-project-v2');
    expect(first.id).toBe(second.id);
    expect(first.title).toBe('New Bedford Studio');
    expect(first.state).not.toBe(state);

    first.state.selectedYear = 2099;
    expect(state.selectedYear).toBe(originalYear);
  });

  it('round-trips a project and rejects malformed or wrong-schema payloads', () => {
    expect(studio).toBeDefined();
    if (!studio) return;

    const project = studio.createWorldProject(createInitialWorldlineState(), {
      title: 'Portable Studio',
      now: '2026-08-12T20:00:00.000Z',
      sequence: 3,
    });
    const parsed = studio.parseWorldProject(studio.serializeWorldProject(project));
    expect(parsed.ok).toBe(true);
    expect(parsed.ok && parsed.project).toEqual(project);

    expect(studio.parseWorldProject('{nope').ok).toBe(false);
    expect(studio.parseWorldProject(JSON.stringify({ ...project, schema: 'worldline-project-v1' })).ok).toBe(false);
  });
});
