import { hashCanonical, type Sha256Digest } from './causal/canonicalJson';

export type CausalLayer = 'MICRO' | 'MESO' | 'MACRO';
export type IdentifiabilityStatus = 'IDENTIFIED' | 'PARTIALLY_IDENTIFIED' | 'UNIDENTIFIED' | 'UNKNOWN';

export interface LayeredCausalState {
  schema: 'worldline-layered-causal-state-v1';
  regimeId: string;
  values: Readonly<Record<CausalLayer, Readonly<Record<string, number>>>>;
}

export interface CrossLayerMapping {
  schema: 'worldline-cross-layer-mapping-v1';
  mappingId: string;
  version: string;
  sourceLayer: CausalLayer;
  targetLayer: CausalLayer;
  sources: readonly Readonly<{ path: string; weight: number }>[];
  targetPath: string;
  aggregation: 'WEIGHTED_SUM' | 'WEIGHTED_MEAN';
  supportedRegimes: readonly string[];
  evidenceRefs: readonly string[];
  requiredObservedVariables: readonly string[];
  hiddenLatents: readonly string[];
}

export interface LayerIntervention {
  interventionId: string;
  layer: CausalLayer;
  path: string;
  value: number;
  semantics: 'DO_SET';
}

export interface LayeredInterventionReceipt {
  schema: 'worldline-layered-intervention-receipt-v1';
  intervention: LayerIntervention;
  regimeId: string;
  beforeHash: Sha256Digest;
  afterHash: Sha256Digest;
  changedPaths: readonly string[];
  appliedMappings: readonly string[];
  identifiability: IdentifiabilityStatus;
  output: LayeredCausalState | null;
  receiptHash: Sha256Digest;
}

export interface CounterfactualQuery {
  queryId: string;
  intervention: LayerIntervention;
  outcomeLayer: CausalLayer;
  outcomePath: string;
  availableObservedVariables: readonly string[];
}

export interface CounterfactualResult {
  queryId: string;
  status: IdentifiabilityStatus;
  value: number | null;
  reason: string;
  interventionReceiptHash: Sha256Digest | null;
}

const LAYER_RANK: Record<CausalLayer, number> = { MICRO: 0, MESO: 1, MACRO: 2 };

function assertPlainNumber(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new Error(`${name} must be finite`);
}

function stateValue(state: LayeredCausalState, layer: CausalLayer, path: string): number {
  const value = state.values[layer][path];
  if (value === undefined) throw new Error(`Missing causal value ${layer}:${path}`);
  return value;
}

function mappingStatus(mapping: CrossLayerMapping, observed: readonly string[]): IdentifiabilityStatus {
  if (mapping.hiddenLatents.length > 0) return 'UNIDENTIFIED';
  const available = new Set(observed);
  const present = mapping.requiredObservedVariables.filter((variable) => available.has(variable)).length;
  if (mapping.requiredObservedVariables.length === 0 || present === mapping.requiredObservedVariables.length) return 'IDENTIFIED';
  return present > 0 ? 'PARTIALLY_IDENTIFIED' : 'UNKNOWN';
}

export class MultiLayerCausalModel {
  private readonly mappings: CrossLayerMapping[];

  constructor(mappings: readonly CrossLayerMapping[]) {
    for (const mapping of mappings) {
      if (LAYER_RANK[mapping.targetLayer] <= LAYER_RANK[mapping.sourceLayer]) throw new Error('Cross-layer mappings must move from finer to coarser layers');
      if (mapping.sources.length === 0) throw new Error('Cross-layer mapping requires sources');
      if (mapping.sources.some(({ weight }) => !Number.isFinite(weight))) throw new Error('Mapping weights must be finite');
      if (mapping.aggregation === 'WEIGHTED_MEAN' && mapping.sources.reduce((sum, source) => sum + source.weight, 0) === 0) throw new Error('Weighted mean requires non-zero total weight');
    }
    this.mappings = mappings.map((mapping) => structuredClone(mapping));
  }

  async intervene(
    state: LayeredCausalState,
    intervention: LayerIntervention,
    availableObservedVariables: readonly string[],
  ): Promise<LayeredInterventionReceipt> {
    assertPlainNumber(intervention.value, 'Intervention value');
    const beforeHash = await hashCanonical(state);
    const values = structuredClone(state.values) as Record<CausalLayer, Record<string, number>>;
    if (!(intervention.path in values[intervention.layer])) throw new Error(`Unknown intervention target ${intervention.layer}:${intervention.path}`);
    values[intervention.layer][intervention.path] = intervention.value;
    const changed = new Set<string>([`${intervention.layer}:${intervention.path}`]);
    const appliedMappings: string[] = [];
    let aggregateStatus: IdentifiabilityStatus = 'IDENTIFIED';

    for (const mapping of [...this.mappings].sort((a, b) => LAYER_RANK[a.targetLayer] - LAYER_RANK[b.targetLayer])) {
      if (!mapping.supportedRegimes.includes(state.regimeId)) continue;
      const sourceKeys = mapping.sources.map(({ path }) => `${mapping.sourceLayer}:${path}`);
      if (!sourceKeys.some((key) => changed.has(key))) continue;
      const status = mappingStatus(mapping, availableObservedVariables);
      if (status === 'UNIDENTIFIED' || status === 'UNKNOWN') {
        aggregateStatus = status;
        continue;
      }
      if (status === 'PARTIALLY_IDENTIFIED') aggregateStatus = 'PARTIALLY_IDENTIFIED';
      const weighted = mapping.sources.reduce((sum, source) => sum + stateValue({ ...state, values }, mapping.sourceLayer, source.path) * source.weight, 0);
      const divisor = mapping.aggregation === 'WEIGHTED_MEAN' ? mapping.sources.reduce((sum, source) => sum + source.weight, 0) : 1;
      values[mapping.targetLayer][mapping.targetPath] = weighted / divisor;
      changed.add(`${mapping.targetLayer}:${mapping.targetPath}`);
      appliedMappings.push(`${mapping.mappingId}@${mapping.version}`);
    }

    const output: LayeredCausalState = { schema: 'worldline-layered-causal-state-v1', regimeId: state.regimeId, values };
    const afterHash = await hashCanonical(output);
    const payload = {
      schema: 'worldline-layered-intervention-receipt-v1' as const,
      intervention: structuredClone(intervention), regimeId: state.regimeId, beforeHash, afterHash,
      changedPaths: [...changed].sort(), appliedMappings, identifiability: aggregateStatus, output,
    };
    return Object.freeze({ ...payload, receiptHash: await hashCanonical(payload) });
  }

  async counterfactual(state: LayeredCausalState, query: CounterfactualQuery): Promise<CounterfactualResult> {
    const relevant = this.mappings.filter((mapping) => mapping.targetLayer === query.outcomeLayer && mapping.targetPath === query.outcomePath && mapping.supportedRegimes.includes(state.regimeId));
    if (relevant.length === 0) return { queryId: query.queryId, status: 'UNKNOWN', value: null, reason: 'NO_SUPPORTED_MECHANISM_FOR_REGIME', interventionReceiptHash: null };
    const statuses = relevant.map((mapping) => mappingStatus(mapping, query.availableObservedVariables));
    if (statuses.includes('UNIDENTIFIED')) return { queryId: query.queryId, status: 'UNIDENTIFIED', value: null, reason: 'HIDDEN_LATENT_PREVENTS_IDENTIFICATION', interventionReceiptHash: null };
    if (statuses.includes('UNKNOWN')) return { queryId: query.queryId, status: 'UNKNOWN', value: null, reason: 'REQUIRED_OBSERVATIONS_MISSING', interventionReceiptHash: null };
    const receipt = await this.intervene(state, query.intervention, query.availableObservedVariables);
    const value = receipt.output?.values[query.outcomeLayer][query.outcomePath] ?? null;
    return { queryId: query.queryId, status: receipt.identifiability, value, reason: 'BOUNDED_STRUCTURAL_COUNTERFACTUAL', interventionReceiptHash: receipt.receiptHash };
  }
}

export async function verifyCrossScaleEquivalence(
  fineReceipt: LayeredInterventionReceipt,
  coarseReceipt: LayeredInterventionReceipt,
  layer: CausalLayer,
  path: string,
  tolerance = 1e-9,
): Promise<{ passed: boolean; delta: number; evidenceHash: Sha256Digest }> {
  const fine = fineReceipt.output?.values[layer][path];
  const coarse = coarseReceipt.output?.values[layer][path];
  const delta = fine === undefined || coarse === undefined ? Number.POSITIVE_INFINITY : Math.abs(fine - coarse);
  const payload = { fineReceiptHash: fineReceipt.receiptHash, coarseReceiptHash: coarseReceipt.receiptHash, layer, path, tolerance, delta: Number.isFinite(delta) ? delta : 'INFINITY' };
  return { passed: delta <= tolerance, delta, evidenceHash: await hashCanonical(payload) };
}
