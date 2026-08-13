import { describe, expect, it } from 'vitest';
import { createImprovementMemory, recordCandidateEvaluation, selectExperienceReplay } from '../improvementMemory';

describe('Improvement memory', () => {
  it('retains the champion when a challenger degrades the frozen score', () => {
    const initial = createImprovementMemory({ championId: 'model-a', championScore: 0.82 });
    const next = recordCandidateEvaluation(initial, { candidateId: 'model-b', score: 0.78, reversible: true });
    expect(next.championId).toBe('model-a');
    expect(next.history.at(-1)?.decision).toBe('ROLLBACK');
    expect(next.history.at(-1)?.rollbackTo).toBe('model-a');
  });

  it('promotes a better reversible challenger and keeps deterministic replay examples', () => {
    let memory = createImprovementMemory({ championId: 'model-a', championScore: 0.82 });
    memory = recordCandidateEvaluation(memory, { candidateId: 'model-b', score: 0.86, reversible: true, replayExamples: ['case-c', 'case-a', 'case-b'] });
    expect(memory.championId).toBe('model-b');
    expect(memory.history.at(-1)?.decision).toBe('PROMOTE');
    expect(selectExperienceReplay(memory, 2)).toEqual(['case-a', 'case-b']);
  });
});
