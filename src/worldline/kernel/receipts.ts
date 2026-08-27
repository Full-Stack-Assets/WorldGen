import { hashCanonical } from './hash';
import type { TransitionReceiptEnvelope } from './types';

export function verifyTransitionReceipt(receipt: TransitionReceiptEnvelope): boolean {
  return hashCanonical(receipt.core) === receipt.coreHash;
}
