export type WorldModelCapability =
  | 'REAL_TIME_WORLD_GENERATION'
  | 'WORLD_MEMORY'
  | 'PROMPTABLE_EVENTS'
  | 'REALITY_GROUNDING'
  | 'PHYSICAL_REASONING'
  | 'WORLD_GENERATION'
  | 'ACTION_CONDITIONED_PREDICTION'
  | 'ACTION_GENERATION';

export type WorldModelIntegrationStatus = 'REFERENCE_ONLY' | 'ADAPTER_READY' | 'CONNECTED';

export type WorldModelEvaluationDimension =
  | 'PERCEPTUAL_QUALITY'
  | 'CONDITION_4D_ALIGNMENT'
  | 'PHYSICAL_REALISM'
  | 'FOUR_D_CONSISTENCY';

export const WORLD_MODEL_EVALUATION_DIMENSIONS: WorldModelEvaluationDimension[] = [
  'PERCEPTUAL_QUALITY',
  'CONDITION_4D_ALIGNMENT',
  'PHYSICAL_REALISM',
  'FOUR_D_CONSISTENCY',
];

export interface WorldModelReference {
  id: string;
  name: string;
  sourceTitle: string;
  sourceUrl: string;
  integrationStatus: WorldModelIntegrationStatus;
  capabilities: WorldModelCapability[];
  memoryHorizon: string;
  grounding: string;
  limitations: string[];
  evaluationNotes: string[];
}

export const WORLD_MODEL_REFERENCES: WorldModelReference[] = [
  {
    id: 'genie-3',
    name: 'Genie 3',
    sourceTitle: 'Genie 3',
    sourceUrl: 'https://deepmind.google/models/genie/',
    integrationStatus: 'REFERENCE_ONLY',
    capabilities: [
      'REAL_TIME_WORLD_GENERATION',
      'WORLD_MEMORY',
      'PROMPTABLE_EVENTS',
      'REALITY_GROUNDING',
    ],
    memoryHorizon: 'Source describes sustained interaction and revisited-detail consistency on minute-scale experiences.',
    grounding: 'Source describes grounding in Google Street View data.',
    limitations: [
      'Reference-only in Worldline; no production adapter is connected.',
      'Source describes minute-scale experiences rather than hour-scale persistent simulation.',
      'Worldline must not treat generated surfaces as observed evidence.',
    ],
    evaluationNotes: [
      'Use controllability, revisitation stability, and prompt-event persistence as qualitative adapter tests.',
      'Map generated outputs into the shared 4DWorldBench evaluation spine only after an executed adapter run.',
    ],
  },
  {
    id: 'cosmos-3',
    name: 'NVIDIA Cosmos 3',
    sourceTitle: 'Develop Physical AI Reasoning, World, and Action Models with NVIDIA Cosmos 3',
    sourceUrl: 'https://developer.nvidia.com/blog/develop-physical-ai-reasoning-world-and-action-models-with-nvidia-cosmos-3',
    integrationStatus: 'REFERENCE_ONLY',
    capabilities: [
      'PHYSICAL_REASONING',
      'WORLD_GENERATION',
      'ACTION_CONDITIONED_PREDICTION',
      'ACTION_GENERATION',
    ],
    memoryHorizon: 'Not used as a Worldline persistence claim; reasoning/generation are modeled as adapter capabilities.',
    grounding: 'Open physical-AI datasets and action/video conditioning are treated as possible future evidence sources, not current runtime state.',
    limitations: [
      'Reference-only in Worldline; no production model weights or NIM are connected.',
      'Worldline does not inherit benchmark claims reported by NVIDIA.',
      'Model-generated physical scenes remain simulated/generated until independently evaluated.',
    ],
    evaluationNotes: [
      'Borrow the reasoner → generator separation for future adapters.',
      'Use atomic physical-fact verification as an additional receipt format alongside 4DWorldBench dimensions.',
    ],
  },
];

export interface WorldModelEvaluationReceipt {
  id: string;
  modelId: string;
  evaluatorId: string;
  status: 'NOT_EXECUTED' | 'EXECUTED';
  dimensions: WorldModelEvaluationDimension[];
  evidence: string[];
  scores: Record<WorldModelEvaluationDimension, number> | null;
}

export function createWorldModelEvaluationReceipt(input: {
  modelId: string;
  evaluatorId: string;
  executed: boolean;
  evidence: string[];
  scores?: Partial<Record<WorldModelEvaluationDimension, number>>;
}): WorldModelEvaluationReceipt {
  const evidence = [...input.evidence].sort();
  if (!input.executed) {
    return {
      id: `${input.modelId}:${input.evaluatorId}:not-executed`,
      modelId: input.modelId,
      evaluatorId: input.evaluatorId,
      status: 'NOT_EXECUTED',
      dimensions: [...WORLD_MODEL_EVALUATION_DIMENSIONS],
      evidence,
      scores: null,
    };
  }

  const scores = Object.fromEntries(WORLD_MODEL_EVALUATION_DIMENSIONS.map((dimension) => [
    dimension,
    Number(input.scores?.[dimension] ?? 0),
  ])) as Record<WorldModelEvaluationDimension, number>;

  return {
    id: `${input.modelId}:${input.evaluatorId}:executed:${evidence.join('|') || 'no-evidence'}`,
    modelId: input.modelId,
    evaluatorId: input.evaluatorId,
    status: 'EXECUTED',
    dimensions: [...WORLD_MODEL_EVALUATION_DIMENSIONS],
    evidence,
    scores,
  };
}

/** Adapter readiness is not a score. Only executed receipts with evidence may report numbers. */
export function scoreFromReceipt(receipt: WorldModelEvaluationReceipt): number | null {
  if (receipt.status !== 'EXECUTED' || !receipt.scores || receipt.evidence.length === 0) return null;
  const values = WORLD_MODEL_EVALUATION_DIMENSIONS.map((dimension) => receipt.scores?.[dimension] ?? 0);
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(4));
}
