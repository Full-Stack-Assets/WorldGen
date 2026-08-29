import { canonicalize, hashCanonical } from './canonicalJson';
import { verifyMechanismContentHash } from './mechanismIdentity';
import type {
  CanonicalRevision,
  TransitionMechanismArtifact,
  TransitionReceiptEnvelope,
} from './types';
import type { EpistemicClass } from '../types';

export interface GenesisRevisionInput {
  worldId: string;
  branchId: string;
  simulationTime: number;
  stateSchema: string;
  epistemicClass: EpistemicClass;
  kernelVersion: string;
  state: unknown;
}

export async function createGenesisRevision(input: GenesisRevisionInput): Promise<CanonicalRevision> {
  const stateHash = await hashCanonical(input.state);
  const deterministic = {
    schema: 'worldline-canonical-revision-v1' as const,
    parentRevisionId: null,
    worldId: input.worldId,
    branchId: input.branchId,
    sequence: 0,
    simulationTime: input.simulationTime,
    stateSchema: input.stateSchema,
    stateHash,
    transitionReceiptCoreHash: null,
    epistemicClass: input.epistemicClass,
    kernelVersion: input.kernelVersion,
  };
  const digest = await hashCanonical(deterministic);
  return { ...deterministic, revisionId: `revision:${digest.slice('sha256:'.length)}` };
}

export function createInMemoryCanonicalStore() {
  const revisions = new Map<string, CanonicalRevision>();
  const states = new Map<string, unknown>();
  const stateCanonical = new Map<string, string>();
  const branchHeads = new Map<string, string>();
  const mechanisms = new Map<string, TransitionMechanismArtifact>();
  const receipts = new Map<string, TransitionReceiptEnvelope>();

  const putState = async (hash: string, state: unknown): Promise<void> => {
    const computed = await hashCanonical(state);
    if (computed !== hash) throw new Error('State hash mismatch');
    const canonical = canonicalize(state);
    const existing = stateCanonical.get(hash);
    if (existing !== undefined && existing !== canonical) throw new Error('State hash replacement rejected');
    if (existing === undefined) {
      stateCanonical.set(hash, canonical);
      states.set(hash, structuredClone(state));
    }
  };

  const putRevision = async (revision: CanonicalRevision, state: unknown): Promise<void> => {
    const existing = revisions.get(revision.revisionId);
    if (existing && canonicalize(existing) !== canonicalize(revision)) throw new Error('Revision replacement rejected');
    if (existing) return;
    await putState(revision.stateHash, state);
    revisions.set(revision.revisionId, structuredClone(revision));
  };

  const putGenesis = async (revision: CanonicalRevision, state: unknown): Promise<void> => {
    if (revision.parentRevisionId !== null || revision.sequence !== 0) throw new Error('Invalid genesis revision');
    if (branchHeads.has(revision.branchId)) throw new Error('Genesis branch already exists');
    await putRevision(revision, state);
    branchHeads.set(revision.branchId, revision.revisionId);
  };

  const appendRevision = async (revision: CanonicalRevision, state: unknown): Promise<void> => {
    if (!revision.parentRevisionId) throw new Error('Child revision requires parent');
    const parent = revisions.get(revision.parentRevisionId);
    if (!parent) throw new Error('Missing parent revision');
    const currentHead = branchHeads.get(revision.branchId);
    if (currentHead !== undefined && currentHead !== revision.parentRevisionId) throw new Error('Branch head replacement rejected');
    if (currentHead === undefined && parent.branchId === revision.branchId && parent.revisionId !== revision.parentRevisionId) {
      throw new Error('Invalid branch ancestry');
    }
    await putRevision(revision, state);
    branchHeads.set(revision.branchId, revision.revisionId);
  };

  const putMechanism = async (mechanism: TransitionMechanismArtifact): Promise<void> => {
    if (!await verifyMechanismContentHash(mechanism)) throw new Error('Mechanism content hash mismatch');
    const existing = mechanisms.get(mechanism.mechanismId);
    if (existing && canonicalize(existing) !== canonicalize(mechanism)) throw new Error('Mechanism replacement rejected');
    if (!existing) mechanisms.set(mechanism.mechanismId, structuredClone(mechanism));
  };

  const putReceipt = async (receipt: TransitionReceiptEnvelope): Promise<void> => {
    if (await hashCanonical(receipt.core) !== receipt.coreHash) throw new Error('Receipt core hash mismatch');
    const key = receipt.coreHash;
    const existing = receipts.get(key);
    if (existing && canonicalize(existing.core) !== canonicalize(receipt.core)) throw new Error('Receipt replacement rejected');
    if (!existing) receipts.set(key, structuredClone(receipt));
  };

  const getRevision = (revisionId: string): CanonicalRevision | null => {
    const value = revisions.get(revisionId);
    return value ? structuredClone(value) : null;
  };
  const getStateByHash = <T = unknown>(hash: string): T | null => {
    const value = states.get(hash);
    return value === undefined ? null : structuredClone(value) as T;
  };
  const getBranchHead = (branchId: string): CanonicalRevision | null => {
    const id = branchHeads.get(branchId);
    return id ? getRevision(id) : null;
  };
  const getMechanism = (mechanismId: string): TransitionMechanismArtifact | null => {
    const value = mechanisms.get(mechanismId);
    return value ? structuredClone(value) : null;
  };
  const getReceipt = (coreHash: string): TransitionReceiptEnvelope | null => {
    const value = receipts.get(coreHash);
    return value ? structuredClone(value) : null;
  };

  return { putGenesis, appendRevision, putMechanism, putReceipt, getRevision, getStateByHash, getBranchHead, getMechanism, getReceipt };
}
