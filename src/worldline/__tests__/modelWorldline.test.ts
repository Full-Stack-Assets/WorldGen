import { describe, expect, it } from 'vitest';
import { appendResearchCycle, createResearchLedger } from '../researchLedger';
import { runDataUpdateCycle } from '../researchLoop';
import { deriveModelWorldline } from '../modelWorldline';

describe('Model Worldline', () => {
  it('derives observation, hypotheses, verification, and promotion ancestry from the ledger', () => {
    const cycle = runDataUpdateCycle({ previousValue: 10, incomingValue: 14, forceArchitecturalCandidate: true });
    const ledger = appendResearchCycle(createResearchLedger(), cycle);
    const graph = deriveModelWorldline(ledger);
    expect(graph.nodes.some((node) => node.kind === 'OBSERVATION')).toBe(true);
    expect(graph.nodes.some((node) => node.kind === 'HYPOTHESIS' && node.status === 'REJECTED')).toBe(true);
    expect(graph.nodes.some((node) => node.kind === 'PROMOTION' && node.status === cycle.promotion.status)).toBe(true);
    const verification = graph.nodes.find((node) => node.kind === 'VERIFICATION' && node.status === 'PASSED');
    expect(verification?.label).toMatch(/verifier/i);
    expect(graph.edges.length).toBeGreaterThan(0);
  });
});