import { describe, expect, it } from 'vitest';
import { appendResearchCycle, createResearchLedger } from '../researchLedger';
import { runDataUpdateCycle } from '../researchLoop';
import { loadResearchLedger, RESEARCH_STORAGE_KEY, resetResearchLedger, saveResearchLedger } from '../researchStorage';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe('research storage', () => {
  it('saves and reloads a durable ledger', () => {
    const storage = new MemoryStorage();
    const ledger = appendResearchCycle(createResearchLedger(), runDataUpdateCycle({ previousValue: 10, incomingValue: 14 }));
    saveResearchLedger(storage, ledger);
    const loaded = loadResearchLedger(storage);
    expect(loaded.warning).toBeNull();
    expect(loaded.ledger).toEqual(ledger);
  });

  it('fails closed with a visible warning when stored JSON is corrupt', () => {
    const storage = new MemoryStorage();
    storage.setItem(RESEARCH_STORAGE_KEY, '{broken');
    const loaded = loadResearchLedger(storage);
    expect(loaded.ledger.entries).toEqual([]);
    expect(loaded.warning).toMatch(/corrupt|invalid/i);
    expect(storage.getItem(RESEARCH_STORAGE_KEY)).toBe('{broken');
  });

  it('resets only after an explicit reset call', () => {
    const storage = new MemoryStorage();
    storage.setItem(RESEARCH_STORAGE_KEY, '{broken');
    loadResearchLedger(storage);
    expect(storage.getItem(RESEARCH_STORAGE_KEY)).not.toBeNull();
    resetResearchLedger(storage);
    expect(storage.getItem(RESEARCH_STORAGE_KEY)).toBeNull();
  });
});