import { hashCanonical, type Sha256Digest } from './canonicalJson';
import type { TransitionMechanismArtifact } from './types';

export function mechanismContentPayload(mechanism: TransitionMechanismArtifact): unknown {
  const {
    contentHash: _contentHash,
    promotionStatus: _promotionStatus,
    approvalReceiptId: _approvalReceiptId,
    ...content
  } = mechanism;
  return content;
}

export async function computeMechanismContentHash(mechanism: TransitionMechanismArtifact): Promise<Sha256Digest> {
  return hashCanonical(mechanismContentPayload(mechanism));
}

export async function verifyMechanismContentHash(mechanism: TransitionMechanismArtifact): Promise<boolean> {
  return await computeMechanismContentHash(mechanism) === mechanism.contentHash;
}
