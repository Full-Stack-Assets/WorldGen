import type { ReopenRecord, ResearchCycle, ResearchPromotion, ResearchVerifierReceipt } from './researchLoop';

export type ResearchLedgerEntry =
  | { id: string; kind: 'OBSERVATION'; observationId: string; conflictDetected: boolean }
  | { id: string; kind: 'ANOMALY'; observationId: string; label: string }
  | { id: string; kind: 'HYPOTHESIS'; observationId: string; candidateId: string; label: string; candidateKind: string; status: string }
  | { id: string; kind: 'EXPERIMENT'; observationId: string; evaluationContractId: string; immutable: true; metric: string; threshold: number }
  | { id: string; kind: 'VERIFICATION'; observationId: string; candidateId: string; generatorId: string; verifierId: string; evaluatorId: string; passed: boolean; reason: string }
  | { id: string; kind: 'PROMOTION'; observationId: string; candidateId: string | null; status: ResearchPromotion['status']; reason: string }
  | { id: string; kind: 'REALITY_WAKE'; observationId: string; message: string; affectedCandidateIds: string[] }
  | { id: string; kind: 'REOPEN'; observationId: string; decisionId: string; triggeringObservationId: string; reason: string };

export interface ResearchLedger {
  schemaVersion: 'worldline-research-ledger-v0.5';
  entries: ResearchLedgerEntry[];
}

export function createResearchLedger(): ResearchLedger {
  return { schemaVersion: 'worldline-research-ledger-v0.5', entries: [] };
}

function verificationEntry(observationId: string, receipt: ResearchVerifierReceipt): ResearchLedgerEntry {
  return {
    id: `${observationId}:verification:${receipt.candidateId}`,
    kind: 'VERIFICATION',
    observationId,
    candidateId: receipt.candidateId,
    generatorId: receipt.generatorId,
    verifierId: receipt.verifierId,
    evaluatorId: receipt.evaluatorId,
    passed: receipt.passed,
    reason: receipt.reason,
  };
}

export function appendResearchCycle(ledger: ResearchLedger, cycle: ResearchCycle): ResearchLedger {
  const observationId = cycle.observationId;
  const additions: ResearchLedgerEntry[] = [
    { id: `${observationId}:observation`, kind: 'OBSERVATION', observationId, conflictDetected: cycle.conflictDetected },
  ];
  if (cycle.conflictDetected) {
    additions.push({ id: `${observationId}:anomaly`, kind: 'ANOMALY', observationId, label: 'Source update conflict detected' });
  }
  for (const candidate of cycle.candidates) {
    additions.push({
      id: `${observationId}:hypothesis:${candidate.id}`,
      kind: 'HYPOTHESIS',
      observationId,
      candidateId: candidate.id,
      label: candidate.hypothesis,
      candidateKind: candidate.kind,
      status: candidate.status,
    });
  }
  additions.push({
    id: `${observationId}:experiment:${cycle.evaluationContract.id}`,
    kind: 'EXPERIMENT',
    observationId,
    evaluationContractId: cycle.evaluationContract.id,
    immutable: true,
    metric: cycle.evaluationContract.metric,
    threshold: cycle.evaluationContract.maximumLoss,
  });
  additions.push(...cycle.verifications.map((receipt) => verificationEntry(observationId, receipt)));
  additions.push({
    id: `${observationId}:promotion`,
    kind: 'PROMOTION',
    observationId,
    candidateId: cycle.promotion.candidateId,
    status: cycle.promotion.status,
    reason: cycle.promotion.reason,
  });
  additions.push({
    id: `${observationId}:reality-wake`,
    kind: 'REALITY_WAKE',
    observationId,
    message: cycle.realityWakeMessage,
    affectedCandidateIds: cycle.candidates.map((candidate) => candidate.id),
  });
  const existingIds = new Set(ledger.entries.map((entry) => entry.id));
  return {
    schemaVersion: ledger.schemaVersion,
    entries: [...ledger.entries.map((entry) => structuredClone(entry)), ...additions.filter((entry) => !existingIds.has(entry.id))],
  };
}

export function appendReopenRecord(ledger: ResearchLedger, observationId: string, reopen: ReopenRecord): ResearchLedger {
  if (ledger.entries.some((entry) => entry.id === reopen.id)) return structuredClone(ledger);
  return {
    schemaVersion: ledger.schemaVersion,
    entries: [...ledger.entries.map((entry) => structuredClone(entry)), {
      id: reopen.id,
      kind: 'REOPEN',
      observationId,
      decisionId: reopen.decisionId,
      triggeringObservationId: reopen.triggeringObservationId,
      reason: reopen.reason,
    }],
  };
}

export function serializeResearchLedger(ledger: ResearchLedger): string {
  return JSON.stringify(ledger);
}

function validateEntry(value: unknown): asserts value is ResearchLedgerEntry {
  if (!value || typeof value !== 'object') throw new Error('Invalid research ledger entry');
  const entry = value as Partial<ResearchLedgerEntry> & { id?: unknown; kind?: unknown; observationId?: unknown };
  if (typeof entry.id !== 'string' || typeof entry.observationId !== 'string') throw new Error('Invalid research ledger entry identity');
  const kinds = ['OBSERVATION', 'ANOMALY', 'HYPOTHESIS', 'EXPERIMENT', 'VERIFICATION', 'PROMOTION', 'REALITY_WAKE', 'REOPEN'];
  if (typeof entry.kind !== 'string' || !kinds.includes(entry.kind)) throw new Error('Invalid research ledger entry kind');
}

export function parseResearchLedger(text: string): ResearchLedger {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('Research ledger JSON is corrupt');
  }
  if (!value || typeof value !== 'object') throw new Error('Research ledger is invalid');
  const ledger = value as Partial<ResearchLedger>;
  if (ledger.schemaVersion !== 'worldline-research-ledger-v0.5') throw new Error('Unsupported research ledger schema');
  if (!Array.isArray(ledger.entries)) throw new Error('Research ledger entries are invalid');
  ledger.entries.forEach(validateEntry);
  return { schemaVersion: 'worldline-research-ledger-v0.5', entries: structuredClone(ledger.entries) as ResearchLedgerEntry[] };
}
