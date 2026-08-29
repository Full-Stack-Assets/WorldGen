import { canonicalize, hashCanonical, type Sha256Digest } from './canonicalJson';
import type { CanonicalRevision } from './types';
import type { CanonicalWorldState } from '../types';

export interface RenderProjection {
  schema: 'worldline-render-projection-v1';
  sourceRevisionId: string;
  sourceStateHash: Sha256Digest;
  providerId: string;
  projectionSpecId: string;
  worldIds: readonly string[];
  branchIds: readonly string[];
  temporalAnchors: readonly { branchId: string; years: readonly number[] }[];
  epistemicClasses: readonly string[];
  projectionDigest: Sha256Digest;
  authority: 'READ_ONLY';
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value as Record<string, unknown>)) deepFreeze(item);
  }
  return value;
}

export async function createRenderProjection(input: {
  revision: CanonicalRevision;
  state: CanonicalWorldState;
  providerId: string;
  projectionSpecId: string;
}): Promise<RenderProjection> {
  if (await hashCanonical(input.state) !== input.revision.stateHash) throw new Error('RenderProjection state does not match canonical revision');
  const core = {
    schema: 'worldline-render-projection-v1' as const,
    sourceRevisionId: input.revision.revisionId,
    sourceStateHash: input.revision.stateHash,
    providerId: input.providerId,
    projectionSpecId: input.projectionSpecId,
    worldIds: input.state.worlds.map((world) => world.id).sort(),
    branchIds: Object.keys(input.state.branches).sort(),
    temporalAnchors: Object.values(input.state.branches)
      .map((branch) => ({ branchId: branch.id, years: branch.snapshots.map((snapshot) => snapshot.year).sort((a, b) => a - b) }))
      .sort((left, right) => left.branchId.localeCompare(right.branchId)),
    epistemicClasses: [...new Set(input.state.worlds.map((world) => world.epistemicClass))].sort(),
    authority: 'READ_ONLY' as const,
  };
  return deepFreeze({ ...core, projectionDigest: await hashCanonical(core) });
}

export async function verifyRenderProjectionIsolation(input: {
  revision: CanonicalRevision;
  stateBefore: CanonicalWorldState;
  stateAfter: CanonicalWorldState;
  projection: RenderProjection;
}): Promise<boolean> {
  const before = canonicalize(input.stateBefore);
  const after = canonicalize(input.stateAfter);
  const { projectionDigest: _digest, ...core } = input.projection;
  return before === after
    && await hashCanonical(input.stateAfter) === input.revision.stateHash
    && input.projection.sourceRevisionId === input.revision.revisionId
    && input.projection.sourceStateHash === input.revision.stateHash
    && input.projection.authority === 'READ_ONLY'
    && await hashCanonical(core) === input.projection.projectionDigest;
}
