import { createResearchLedger, parseResearchLedger, serializeResearchLedger, type ResearchLedger } from './researchLedger';

export const RESEARCH_STORAGE_KEY = 'worldline.research-ledger.v0.5';

export interface ResearchStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface ResearchLedgerLoadResult {
  ledger: ResearchLedger;
  warning: string | null;
}

export function loadResearchLedger(storage: ResearchStorage): ResearchLedgerLoadResult {
  const stored = storage.getItem(RESEARCH_STORAGE_KEY);
  if (stored === null) return { ledger: createResearchLedger(), warning: null };
  try {
    return { ledger: parseResearchLedger(stored), warning: null };
  } catch (error) {
    return {
      ledger: createResearchLedger(),
      warning: error instanceof Error ? `Stored research history is corrupt or invalid: ${error.message}` : 'Stored research history is corrupt or invalid.',
    };
  }
}

export function saveResearchLedger(storage: ResearchStorage, ledger: ResearchLedger): void {
  storage.setItem(RESEARCH_STORAGE_KEY, serializeResearchLedger(ledger));
}

export function resetResearchLedger(storage: ResearchStorage): void {
  storage.removeItem(RESEARCH_STORAGE_KEY);
}
