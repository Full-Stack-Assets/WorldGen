import { hashCanonical, type Sha256Digest } from './canonicalJson';
import type { CanonicalRevision, RenderEnvelope, RenderReceipt } from './types';
import type { EpistemicClass } from '../types';

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value as Record<string, unknown>)) deepFreeze(item);
  }
  return value;
}

export async function createRenderEnvelope(input: {
  revision: CanonicalRevision;
  projection: unknown;
  spatialConstraints: unknown;
  temporalConstraints: unknown;
  epistemicLabels: readonly EpistemicClass[];
  renderingIntent: string;
  rendererPolicy: Readonly<Record<string, unknown>>;
  seed?: string | null;
}): Promise<RenderEnvelope> {
  const projection = structuredClone(input.projection);
  const projectionDigest = await hashCanonical(projection);
  const envelope: RenderEnvelope = {
    schema: 'worldline-render-envelope-v1',
    sourceRevisionId: input.revision.revisionId,
    sourceStateHash: input.revision.stateHash,
    projection: deepFreeze(projection),
    projectionDigest,
    spatialConstraints: deepFreeze(structuredClone(input.spatialConstraints)),
    temporalConstraints: deepFreeze(structuredClone(input.temporalConstraints)),
    epistemicLabels: deepFreeze([...input.epistemicLabels]),
    renderingIntent: input.renderingIntent,
    rendererPolicy: deepFreeze(structuredClone(input.rendererPolicy)),
    seed: input.seed ?? null,
  };
  return deepFreeze(envelope);
}

export async function createRenderReceipt(input: {
  envelope: RenderEnvelope;
  rendererId: string;
  rendererVersion: string;
  configuration: unknown;
  outputArtifactDigest: Sha256Digest;
  outputLocator?: string;
  benchmarkReceiptIds?: readonly string[];
}): Promise<RenderReceipt> {
  const configurationDigest = await hashCanonical(input.configuration);
  return {
    schema: 'worldline-render-receipt-v1',
    sourceRevisionId: input.envelope.sourceRevisionId,
    sourceStateHash: input.envelope.sourceStateHash,
    projectionDigest: input.envelope.projectionDigest,
    rendererId: input.rendererId,
    rendererVersion: input.rendererVersion,
    configurationDigest,
    seed: input.envelope.seed,
    outputArtifactDigest: input.outputArtifactDigest,
    ...(input.outputLocator ? { outputLocator: input.outputLocator } : {}),
    benchmarkReceiptIds: [...(input.benchmarkReceiptIds ?? [])].sort(),
  };
}
