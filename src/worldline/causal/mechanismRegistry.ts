import { canonicalize, hashCanonical, type Sha256Digest } from './canonicalJson';
import { verifyMechanismContentHash } from './mechanismIdentity';
import type { TransitionMechanismArtifact } from './types';

export interface HumanAuthorityMechanismApproval {
  schema: 'worldline-human-mechanism-approval-v1';
  approvalId: string;
  authority: 'HUMAN_AUTHORITY';
  action: 'PROMOTE' | 'ROLLBACK' | 'RETIRE';
  mechanismId: string;
  mechanismHash: Sha256Digest;
  verificationReceiptHash: Sha256Digest;
  verificationStatus: 'PASS';
  scope: 'INTERNAL_EXECUTION' | 'CANONICAL_ADMISSION';
}

export interface MechanismPromotionEvidenceInput {
  mechanism: TransitionMechanismArtifact;
  approval: HumanAuthorityMechanismApproval;
}

export interface MechanismRegistryOptions {
  verifyPromotionEvidence?: (input: MechanismPromotionEvidenceInput) => boolean | Promise<boolean>;
}

export interface MechanismRegistryEvent {
  schema: 'worldline-mechanism-registry-event-v1';
  sequence: number;
  previousEventHash: Sha256Digest | null;
  action: 'REGISTER_CANDIDATE' | 'PROMOTE' | 'RETIRE' | 'ROLLBACK';
  mechanismId: string;
  mechanismHash: Sha256Digest;
  mechanismKey: string;
  version: string;
  authorityReceiptId: string | null;
  verificationReceiptHash: Sha256Digest | null;
  eventHash: Sha256Digest;
}

function requireSpec(artifact: TransitionMechanismArtifact) {
  if (!artifact.spec) throw new Error('Versioned MechanismRegistry requires MechanismSpec');
  return artifact.spec;
}

export function createMechanismRegistry(options: MechanismRegistryOptions = {}) {
  const artifacts = new Map<string, TransitionMechanismArtifact>();
  const versionIndex = new Map<string, string>();
  const activeByKey = new Map<string, string>();
  const approvedIds = new Set<string>();
  const events: MechanismRegistryEvent[] = [];

  const appendEvent = async (input: Omit<MechanismRegistryEvent, 'schema' | 'sequence' | 'previousEventHash' | 'eventHash'>) => {
    const core = {
      schema: 'worldline-mechanism-registry-event-v1' as const,
      sequence: events.length,
      previousEventHash: events.at(-1)?.eventHash ?? null,
      ...input,
    };
    const event = Object.freeze({ ...core, eventHash: await hashCanonical(core) });
    events.push(event);
    return event;
  };

  const registerCandidate = async (artifact: TransitionMechanismArtifact) => {
    if (!await verifyMechanismContentHash(artifact)) throw new Error('Mechanism content hash mismatch');
    const spec = requireSpec(artifact);
    if (artifact.promotionStatus !== 'CANDIDATE') throw new Error('New registry entries must begin as CANDIDATE');
    const versionKey = `${spec.mechanismKey}@${spec.version}`;
    const existingVersion = versionIndex.get(versionKey);
    if (existingVersion && existingVersion !== artifact.mechanismId) throw new Error('Mechanism version replacement rejected');
    const existing = artifacts.get(artifact.mechanismId);
    if (existing) {
      if (canonicalize(existing) !== canonicalize(artifact)) throw new Error('Mechanism replacement rejected');
      return events.find((event) => event.action === 'REGISTER_CANDIDATE' && event.mechanismId === artifact.mechanismId)!;
    }
    artifacts.set(artifact.mechanismId, structuredClone(artifact));
    versionIndex.set(versionKey, artifact.mechanismId);
    return appendEvent({
      action: 'REGISTER_CANDIDATE', mechanismId: artifact.mechanismId, mechanismHash: artifact.contentHash,
      mechanismKey: spec.mechanismKey, version: spec.version, authorityReceiptId: null, verificationReceiptHash: null,
    });
  };

  const validateApproval = (artifact: TransitionMechanismArtifact, approval: HumanAuthorityMechanismApproval, action: HumanAuthorityMechanismApproval['action']) => {
    if (approval.schema !== 'worldline-human-mechanism-approval-v1'
      || approval.authority !== 'HUMAN_AUTHORITY'
      || approval.action !== action
      || approval.verificationStatus !== 'PASS'
      || !approval.approvalId.trim()) throw new Error('Human Authority approval is required');
    if (approval.mechanismId !== artifact.mechanismId || approval.mechanismHash !== artifact.contentHash) throw new Error('Approval scope does not match mechanism');
    if (!/^sha256:[0-9a-f]{64}$/i.test(approval.verificationReceiptHash)) throw new Error('Approval requires a valid verification receipt hash');
    if (action === 'PROMOTE' && approval.scope !== 'CANONICAL_ADMISSION') throw new Error('Canonical mechanism promotion requires canonical admission scope');
  };

  const promote = async (mechanismId: string, approval: HumanAuthorityMechanismApproval) => {
    const artifact = artifacts.get(mechanismId);
    if (!artifact) throw new Error('Unknown mechanism candidate');
    validateApproval(artifact, approval, 'PROMOTE');
    if (!options.verifyPromotionEvidence) throw new Error('Trusted promotion evidence verifier is unavailable');
    if (!await options.verifyPromotionEvidence({ mechanism: structuredClone(artifact), approval: structuredClone(approval) })) {
      throw new Error('Attested promotion evidence verification failed');
    }
    const spec = requireSpec(artifact);
    const currentId = activeByKey.get(spec.mechanismKey);
    if (currentId && currentId !== mechanismId) {
      const current = artifacts.get(currentId)!;
      artifacts.set(currentId, { ...current, promotionStatus: 'RETIRED' });
      await appendEvent({
        action: 'RETIRE', mechanismId: current.mechanismId, mechanismHash: current.contentHash, mechanismKey: spec.mechanismKey,
        version: requireSpec(current).version, authorityReceiptId: approval.approvalId, verificationReceiptHash: approval.verificationReceiptHash,
      });
    }
    artifacts.set(mechanismId, { ...artifact, promotionStatus: 'APPROVED_EXECUTABLE', approvalReceiptId: approval.approvalId });
    approvedIds.add(mechanismId);
    activeByKey.set(spec.mechanismKey, mechanismId);
    return appendEvent({
      action: 'PROMOTE', mechanismId, mechanismHash: artifact.contentHash, mechanismKey: spec.mechanismKey, version: spec.version,
      authorityReceiptId: approval.approvalId, verificationReceiptHash: approval.verificationReceiptHash,
    });
  };

  const rollback = async (mechanismId: string, approval: HumanAuthorityMechanismApproval) => {
    const target = artifacts.get(mechanismId);
    if (!target || !approvedIds.has(mechanismId)) throw new Error('Rollback target was never approved');
    validateApproval(target, approval, 'ROLLBACK');
    const spec = requireSpec(target);
    const currentId = activeByKey.get(spec.mechanismKey);
    if (currentId && currentId !== mechanismId) {
      const current = artifacts.get(currentId)!;
      artifacts.set(currentId, { ...current, promotionStatus: 'RETIRED' });
      await appendEvent({
        action: 'RETIRE', mechanismId: currentId, mechanismHash: current.contentHash, mechanismKey: spec.mechanismKey,
        version: requireSpec(current).version, authorityReceiptId: approval.approvalId, verificationReceiptHash: approval.verificationReceiptHash,
      });
    }
    artifacts.set(mechanismId, { ...target, promotionStatus: 'APPROVED_EXECUTABLE', approvalReceiptId: approval.approvalId });
    activeByKey.set(spec.mechanismKey, mechanismId);
    return appendEvent({
      action: 'ROLLBACK', mechanismId, mechanismHash: target.contentHash, mechanismKey: spec.mechanismKey, version: spec.version,
      authorityReceiptId: approval.approvalId, verificationReceiptHash: approval.verificationReceiptHash,
    });
  };

  const getArtifact = (mechanismId: string) => {
    const artifact = artifacts.get(mechanismId);
    return artifact ? structuredClone(artifact) : null;
  };
  const getActive = (mechanismKey: string) => {
    const mechanismId = activeByKey.get(mechanismKey);
    return mechanismId ? getArtifact(mechanismId) : null;
  };
  const getEvents = () => structuredClone(events);

  return Object.freeze({ registerCandidate, promote, rollback, getArtifact, getActive, getEvents });
}
