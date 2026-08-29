import { describe, expect, it } from 'vitest';
import { MultiLayerCausalModel, verifyCrossScaleEquivalence, type CrossLayerMapping, type LayeredCausalState } from '../causalLayers';

const state: LayeredCausalState = {
  schema: 'worldline-layered-causal-state-v1', regimeId: 'normal',
  values: { MICRO: { a: 2, b: 4, hidden: 1 }, MESO: { district: 3 }, MACRO: { city: 3, unrelated: 99 } },
};

const mappings: CrossLayerMapping[] = [
  { schema: 'worldline-cross-layer-mapping-v1', mappingId: 'micro-district', version: '1', sourceLayer: 'MICRO', targetLayer: 'MESO', sources: [{ path: 'a', weight: 1 }, { path: 'b', weight: 1 }], targetPath: 'district', aggregation: 'WEIGHTED_MEAN', supportedRegimes: ['normal'], evidenceRefs: ['synthetic-ground-truth'], requiredObservedVariables: ['a', 'b'], hiddenLatents: [] },
  { schema: 'worldline-cross-layer-mapping-v1', mappingId: 'district-city', version: '1', sourceLayer: 'MESO', targetLayer: 'MACRO', sources: [{ path: 'district', weight: 1 }], targetPath: 'city', aggregation: 'WEIGHTED_MEAN', supportedRegimes: ['normal'], evidenceRefs: ['synthetic-ground-truth'], requiredObservedVariables: ['district'], hiddenLatents: [] },
];

describe('MultiLayerCausalModel', () => {
  it('propagates a fine intervention across layers without unrelated semantic drift', async () => {
    const model = new MultiLayerCausalModel(mappings);
    const receipt = await model.intervene(state, { interventionId: 'fine', layer: 'MICRO', path: 'a', value: 6, semantics: 'DO_SET' }, ['a', 'b', 'district']);
    expect(receipt.output?.values.MESO.district).toBe(5);
    expect(receipt.output?.values.MACRO.city).toBe(5);
    expect(receipt.output?.values.MACRO.unrelated).toBe(99);
    expect(receipt.changedPaths).toEqual(['MACRO:city', 'MESO:district', 'MICRO:a']);
  });

  it('verifies equivalent direct and propagated coarse interventions', async () => {
    const model = new MultiLayerCausalModel(mappings);
    const fine = await model.intervene(state, { interventionId: 'fine', layer: 'MICRO', path: 'a', value: 6, semantics: 'DO_SET' }, ['a', 'b', 'district']);
    const coarse = await model.intervene(state, { interventionId: 'coarse', layer: 'MESO', path: 'district', value: 5, semantics: 'DO_SET' }, ['district']);
    expect((await verifyCrossScaleEquivalence(fine, coarse, 'MACRO', 'city')).passed).toBe(true);
  });

  it('returns UNIDENTIFIED rather than inventing a counterfactual through hidden latents', async () => {
    const model = new MultiLayerCausalModel([{ ...mappings[0], mappingId: 'latent', targetPath: 'district', hiddenLatents: ['unobserved-selection'] }]);
    const result = await model.counterfactual(state, { queryId: 'q', intervention: { interventionId: 'i', layer: 'MICRO', path: 'a', value: 8, semantics: 'DO_SET' }, outcomeLayer: 'MESO', outcomePath: 'district', availableObservedVariables: ['a', 'b'] });
    expect(result).toMatchObject({ status: 'UNIDENTIFIED', value: null });
  });

  it('returns UNKNOWN when no mapping supports the active regime', async () => {
    const model = new MultiLayerCausalModel(mappings);
    const shifted = { ...state, regimeId: 'shock' };
    const result = await model.counterfactual(shifted, { queryId: 'q', intervention: { interventionId: 'i', layer: 'MICRO', path: 'a', value: 8, semantics: 'DO_SET' }, outcomeLayer: 'MESO', outcomePath: 'district', availableObservedVariables: ['a', 'b'] });
    expect(result.status).toBe('UNKNOWN');
  });
});
