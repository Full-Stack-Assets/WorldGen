import { normalizeCanonicalValue } from './canonicalize';
import { hashCanonical } from './hash';
import type {
  CanonicalRevision,
  CanonicalWorldState,
  RenderEnvelope,
  RenderReceipt,
  Sha256Digest,
} from './types';

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

export function createRenderEnvelope(input: {
  revision: CanonicalRevision;
  state: CanonicalWorldState;
  renderingIntent: string;
  rendererPolicy: string;
  renderSeed?: string | null;
}): RenderEnvelope {
  if (input.revision.stateSchema !== input.state.schema) {
    throw new Error('Render source state schema does not match the canonical revision');
  }
  const actualHash = hashCanonical(input.state);
  if (actualHash !== input.revision.stateHash) {
    throw new Error('Render source state hash does not match the canonical revision');
  }

  const projection = deepFreeze(normalizeCanonicalValue(input.state));
  return {
    schema: 'worldline-render-envelope-v1',
    sourceRevisionId: input.revision.revisionId,
    sourceStateHash: input.revision.stateHash,
    projectionDigest: hashCanonical(projection),
    projection,
    spatialConstraints: [],
    temporalConstraints: [],
    epistemicClass: input.revision.epistemicClass,
    renderingIntent: input.renderingIntent,
    rendererPolicy: input.rendererPolicy,
    renderSeed: input.renderSeed ?? null,
  };
}

export function createRenderReceipt(input: {
  envelope: RenderEnvelope;
  rendererId: string;
  rendererVersion: string;
  promptConfigDigest: Sha256Digest;
  outputArtifactDigest: Sha256Digest;
  outputArtifactLocator: string | null;
  evaluationReceiptIds: string[];
}): RenderReceipt {
  if (hashCanonical(input.envelope.projection) !== input.envelope.projectionDigest) {
    throw new Error('Render envelope projection digest mismatch');
  }
  return {
    schema: 'worldline-render-receipt-v1',
    sourceRevisionId: input.envelope.sourceRevisionId,
    sourceStateHash: input.envelope.sourceStateHash,
    projectionDigest: input.envelope.projectionDigest,
    rendererId: input.rendererId,
    rendererVersion: input.rendererVersion,
    promptConfigDigest: input.promptConfigDigest,
    renderSeed: input.envelope.renderSeed,
    outputArtifactDigest: input.outputArtifactDigest,
    outputArtifactLocator: input.outputArtifactLocator,
    evaluationReceiptIds: [...input.evaluationReceiptIds].sort(),
  };
}
