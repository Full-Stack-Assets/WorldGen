import { describe, expect, it } from 'vitest';
import { runDataUpdateCycle } from '../researchLoop';
import { appendResearchCycle, createResearchLedger, parseResearchLedger, serializeResearchLedger } from '../researchLedger';

describe('research ledger', () => {
  it('round-trips deterministic research receipts', () => {
    const cycle = runDataUpdateCycle({ previousValue: 10, incomingValue: 14, forceArchitecturalCandidate: true });
    const ledger = appendResearchCycle(createResearchLedger(), cycle);
    const encoded = serializeResearchLedger(ledger);
    expect(parseResearchLedger(encoded)).toEqual(ledger);
    expect(serializeResearchLedger(parseResearchLedger(encoded))).toBe(encoded);
  });

  it('appends without mutating prior ledger state', () => {
    const initial = createResearchLedger();
    const before = JSON.stringify(initial);
    const next = appendResearchCycle(initial, runDataUpdateCycle({ previousValue: 10, incomingValue: 14 }));
    expect(JSON.stringify(initial)).toBe(before);
    expect(next.entries.length).toBeGreaterThan(0);
  });

  it('persists separate generator and verifier identities', () => {
    const ledger = appendResearchCycle(createResearchLedger(), runDataUpdateCycle({ previousValue: 10, incomingValue: 14 }));
    const verification = ledger.entries.find((entry) => entry.kind === 'VERIFICATION');
    expect(verification?.kind).toBe('VERIFICATION');
    if (verification?.kind === 'VERIFICATION') expect(verification.generatorId).not.toBe(verification.verifierId);
  });

  it('fails closed on corrupt or wrong-schema JSON', () => {
    expect(() => parseResearchLedger('{broken')).toThrow();
    expect(() => parseResearchLedger('{"schemaVersion":"other","entries":[]}')).toThrow(/schema/i);
  });
});