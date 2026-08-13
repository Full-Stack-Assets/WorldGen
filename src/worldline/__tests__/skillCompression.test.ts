import { describe, expect, it } from 'vitest';
import { compressSkillPatches, zipSkillPatchOnWrite, type SkillPatch } from '../skillCompression';

const basePatches: SkillPatch[] = [
  {
    id: 'earth-ingest',
    trigger: 'new earth dataset arrives',
    workflow: ['validate source', 'normalize schema', 'write receipt'],
    toolRequirements: ['provenance-store'],
    obligations: ['preserve source time'],
    outputFields: ['sourceId', 'checksum'],
  },
  {
    id: 'planet-ingest',
    trigger: 'new planetary dataset arrives',
    workflow: ['validate source', 'normalize schema', 'write receipt'],
    toolRequirements: ['provenance-store'],
    obligations: ['preserve reference frame'],
    outputFields: ['sourceId', 'checksum'],
  },
];

describe('Skill compression', () => {
  it('factors repeated workflow structure once while preserving typed residuals', () => {
    const compressed = compressSkillPatches(basePatches);
    expect(compressed.sharedProcedures).toHaveLength(1);
    expect(compressed.sharedProcedures[0].steps).toEqual(['validate source', 'normalize schema', 'write receipt']);
    expect(compressed.residuals.find((item) => item.patchId === 'earth-ingest')?.obligations).toContain('preserve source time');
    expect(compressed.residuals.find((item) => item.patchId === 'planet-ingest')?.obligations).toContain('preserve reference frame');
    expect(compressed.coverage.complete).toBe(true);
  });

  it('preserves a rare exception even when it cannot be shared', () => {
    const patch: SkillPatch = {
      id: 'restricted-source',
      trigger: 'restricted source appears',
      workflow: ['quarantine source'],
      toolRequirements: ['policy-gate'],
      obligations: ['never enter autonomous training loop'],
      outputFields: ['decisionReceipt'],
    };
    const compressed = zipSkillPatchOnWrite(compressSkillPatches(basePatches), patch);
    const residual = compressed.residuals.find((item) => item.patchId === 'restricted-source');
    expect(residual?.obligations).toContain('never enter autonomous training loop');
    expect(residual?.workflow).toEqual(['quarantine source']);
    expect(compressed.coverage.complete).toBe(true);
  });
});
