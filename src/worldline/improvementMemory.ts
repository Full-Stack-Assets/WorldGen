export interface ImprovementDecision {
  candidateId: string;
  candidateScore: number;
  priorChampionId: string;
  priorChampionScore: number;
  decision: 'PROMOTE' | 'ROLLBACK' | 'REQUIRES_APPROVAL';
  rollbackTo: string | null;
  replayExamples: string[];
}

export interface ImprovementMemory {
  schema: 'worldline-improvement-memory-v2';
  championId: string;
  championScore: number;
  replayExamples: string[];
  history: ImprovementDecision[];
}

export function createImprovementMemory(input: { championId: string; championScore: number }): ImprovementMemory {
  return {
    schema: 'worldline-improvement-memory-v2',
    championId: input.championId,
    championScore: input.championScore,
    replayExamples: [],
    history: [],
  };
}

export function recordCandidateEvaluation(
  memory: ImprovementMemory,
  input: { candidateId: string; score: number; reversible: boolean; replayExamples?: string[] },
): ImprovementMemory {
  const replayExamples = [...new Set([...(memory.replayExamples ?? []), ...(input.replayExamples ?? [])])].sort();
  const improves = input.score > memory.championScore;
  const decision: ImprovementDecision['decision'] = improves
    ? input.reversible ? 'PROMOTE' : 'REQUIRES_APPROVAL'
    : 'ROLLBACK';
  const historyEntry: ImprovementDecision = {
    candidateId: input.candidateId,
    candidateScore: input.score,
    priorChampionId: memory.championId,
    priorChampionScore: memory.championScore,
    decision,
    rollbackTo: decision === 'ROLLBACK' ? memory.championId : null,
    replayExamples: [...(input.replayExamples ?? [])].sort(),
  };

  return {
    ...memory,
    championId: decision === 'PROMOTE' ? input.candidateId : memory.championId,
    championScore: decision === 'PROMOTE' ? input.score : memory.championScore,
    replayExamples,
    history: [...memory.history, historyEntry],
  };
}

export function selectExperienceReplay(memory: ImprovementMemory, limit: number): string[] {
  return [...memory.replayExamples].sort().slice(0, Math.max(0, limit));
}
