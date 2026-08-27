import { hashCanonical } from './hash';
import type {
  CanonicalRevision,
  CanonicalWorldState,
  Sha256Digest,
} from './types';

export interface StoredCanonicalRevision {
  revision: CanonicalRevision;
  state: CanonicalWorldState;
}

export interface RevisionStore {
  putRevision(revision: CanonicalRevision, state: CanonicalWorldState): void;
  getRevision(revisionId: string): StoredCanonicalRevision | null;
  getBranchHead(worldId: string, branchId: string): CanonicalRevision | null;
}

function revisionIdentityPayload(revision: Omit<CanonicalRevision, 'revisionId'> | CanonicalRevision): Omit<CanonicalRevision, 'revisionId'> {
  return {
    schema: revision.schema,
    parentRevisionId: revision.parentRevisionId,
    worldId: revision.worldId,
    branchId: revision.branchId,
    sequence: revision.sequence,
    simulationTime: revision.simulationTime,
    stateSchema: revision.stateSchema,
    stateHash: revision.stateHash,
    transitionReceiptCoreHash: revision.transitionReceiptCoreHash,
    epistemicClass: revision.epistemicClass,
    kernelVersion: revision.kernelVersion,
  };
}

export function computeRevisionId(revision: Omit<CanonicalRevision, 'revisionId'> | CanonicalRevision): string {
  return `revision:${hashCanonical(revisionIdentityPayload(revision)).slice('sha256:'.length)}`;
}

export function createGenesisRevision(input: {
  worldId: string;
  branchId: string;
  simulationTime: number;
  state: CanonicalWorldState;
  epistemicClass: CanonicalRevision['epistemicClass'];
  kernelVersion: string;
}): { revision: CanonicalRevision; stateHash: Sha256Digest } {
  const stateHash = hashCanonical(input.state);
  const core: Omit<CanonicalRevision, 'revisionId'> = {
    schema: 'worldline-canonical-revision-v1',
    parentRevisionId: null,
    worldId: input.worldId,
    branchId: input.branchId,
    sequence: 0,
    simulationTime: input.simulationTime,
    stateSchema: input.state.schema,
    stateHash,
    transitionReceiptCoreHash: null,
    epistemicClass: input.epistemicClass,
    kernelVersion: input.kernelVersion,
  };
  return {
    revision: { ...core, revisionId: computeRevisionId(core) },
    stateHash,
  };
}

function branchKey(worldId: string, branchId: string): string {
  return `${worldId}\u0000${branchId}`;
}

export function createRevisionStore(): RevisionStore {
  const revisions = new Map<string, StoredCanonicalRevision>();
  const heads = new Map<string, string>();

  return {
    putRevision(revision, state) {
      if (revisions.has(revision.revisionId)) throw new Error(`Append-only violation: revision ${revision.revisionId} already exists`);
      if (revision.stateSchema !== state.schema) throw new Error(`State schema mismatch: revision expects ${revision.stateSchema}, received ${state.schema}`);

      const actualStateHash = hashCanonical(state);
      if (actualStateHash !== revision.stateHash) throw new Error(`State hash mismatch for revision ${revision.revisionId}`);
      if (computeRevisionId(revision) !== revision.revisionId) throw new Error(`Revision ID does not match deterministic revision content: ${revision.revisionId}`);

      const key = branchKey(revision.worldId, revision.branchId);
      const currentHeadId = heads.get(key) ?? null;

      if (revision.parentRevisionId === null) {
        if (revision.sequence !== 0) throw new Error('Genesis revision sequence must be zero');
        if (currentHeadId !== null) throw new Error(`Append-only branch ${revision.branchId} already has a head`);
      } else {
        const parent = revisions.get(revision.parentRevisionId);
        if (!parent) throw new Error(`Unknown parent revision ${revision.parentRevisionId}`);
        if (parent.revision.worldId !== revision.worldId) throw new Error('Revision parent must belong to the same world');
        if (revision.sequence !== parent.revision.sequence + 1) throw new Error('Revision sequence must increment its parent sequence by one');
        if (revision.simulationTime < parent.revision.simulationTime) throw new Error('Canonical simulation time cannot move backward within a revision chain');
        if (currentHeadId !== null && currentHeadId !== revision.parentRevisionId) {
          throw new Error(`Stale branch head: ${revision.parentRevisionId} is not the current head of ${revision.branchId}`);
        }
      }

      revisions.set(revision.revisionId, structuredClone({ revision, state }));
      heads.set(key, revision.revisionId);
    },

    getRevision(revisionId) {
      const stored = revisions.get(revisionId);
      return stored ? structuredClone(stored) : null;
    },

    getBranchHead(worldId, branchId) {
      const revisionId = heads.get(branchKey(worldId, branchId));
      if (!revisionId) return null;
      return structuredClone(revisions.get(revisionId)?.revision ?? null);
    },
  };
}
