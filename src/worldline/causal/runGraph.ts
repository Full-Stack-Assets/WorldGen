import { canonicalize, hashCanonical, normalizeCanonical, type Sha256Digest } from './canonicalJson';
import { createInMemoryCanonicalStore } from './store';
import type { CanonicalRevision, TransitionReceiptCore } from './types';

type CanonicalStore = ReturnType<typeof createInMemoryCanonicalStore>;

export interface CanonicalRunGraph {
  schema: 'worldline-canonical-run-graph-v1';
  graphId: string;
  revision: number;
  previousGraphHash: Sha256Digest | null;
  rootRevisionId: string;
  branchHeads: Readonly<Record<string, string>>;
  revisions: Readonly<Record<string, CanonicalRevision>>;
  states: Readonly<Record<string, unknown>>;
  receiptCores: Readonly<Record<string, TransitionReceiptCore>>;
  graphHash: Sha256Digest;
}

export interface RunGraphVerificationReport {
  ok: boolean;
  verifiedRevisionCount: number;
  graphId: string | null;
  graphHash: Sha256Digest | null;
  errorCode: string | null;
  firstMismatch: string | null;
}

class RunGraphError extends Error {
  constructor(readonly code: string, readonly path: string, message: string) {
    super(message);
  }
}

function fail(code: string, path: string, message: string): never {
  throw new RunGraphError(code, path, message);
}

function graphCore(graph: Omit<CanonicalRunGraph, 'graphHash'> | CanonicalRunGraph) {
  const { graphHash: _graphHash, ...core } = graph as CanonicalRunGraph;
  return core;
}

function revisionCore(revision: CanonicalRevision) {
  const { revisionId: _revisionId, ...core } = revision;
  return core;
}

async function deriveGraphId(root: CanonicalRevision): Promise<string> {
  const digest = await hashCanonical({
    schema: 'worldline-run-graph-identity-v1',
    rootRevisionId: root.revisionId,
    rootStateHash: root.stateHash,
    kernelVersion: root.kernelVersion,
  });
  return `graph:${digest.slice('sha256:'.length)}`;
}

function parseGraph(input: unknown): CanonicalRunGraph {
  let value = input;
  if (typeof input === 'string') {
    try {
      value = JSON.parse(input);
    } catch {
      fail('E_GRAPH_SCHEMA', 'graph', 'RunGraph is not valid JSON');
    }
  }
  try {
    return normalizeCanonical(value) as CanonicalRunGraph;
  } catch (error) {
    fail('E_GRAPH_SCHEMA', 'graph', error instanceof Error ? error.message : 'RunGraph is not canonical');
  }
}

export async function buildCanonicalRunGraph(store: CanonicalStore): Promise<CanonicalRunGraph> {
  const snapshot = store.exportSnapshot();
  const roots = Object.values(snapshot.revisions)
    .filter((revision) => revision.parentRevisionId === null)
    .sort((left, right) => left.revisionId.localeCompare(right.revisionId));
  if (roots.length !== 1) fail('E_GRAPH_ROOT', 'revisions', 'RunGraph requires exactly one genesis revision');
  const root = roots[0];
  const receiptCores = Object.fromEntries(Object.entries(snapshot.receipts).map(([hash, receipt]) => [hash, receipt.core]));
  const core = {
    schema: 'worldline-canonical-run-graph-v1' as const,
    graphId: await deriveGraphId(root),
    revision: Object.keys(snapshot.revisions).length - 1,
    previousGraphHash: null,
    rootRevisionId: root.revisionId,
    branchHeads: snapshot.branchHeads,
    revisions: snapshot.revisions,
    states: snapshot.states,
    receiptCores,
  };
  return structuredClone({ ...core, graphHash: await hashCanonical(core) });
}

export function exportCanonicalRunGraph(graph: CanonicalRunGraph): string {
  return canonicalize(graph);
}

async function verifyOrThrow(input: unknown): Promise<CanonicalRunGraph> {
  const graph = parseGraph(input);
  if (graph.schema !== 'worldline-canonical-run-graph-v1') fail('E_GRAPH_SCHEMA', 'schema', 'Unsupported RunGraph schema');
  if (!graph.revisions || !graph.states || !graph.branchHeads || !graph.receiptCores) fail('E_GRAPH_SCHEMA', 'graph', 'RunGraph collections are missing');
  const revisionIds = Object.keys(graph.revisions).sort();
  if (revisionIds.length === 0 || graph.revision !== revisionIds.length - 1) fail('E_GRAPH_REVISION', 'revision', 'RunGraph revision does not match append-only membership');
  const expectedGraphHash = await hashCanonical(graphCore(graph));
  if (expectedGraphHash !== graph.graphHash) fail('E_GRAPH_HASH', 'graphHash', 'RunGraph hash mismatch');
  const root = graph.revisions[graph.rootRevisionId];
  if (!root || root.parentRevisionId !== null || root.sequence !== 0) fail('E_GRAPH_ROOT', 'rootRevisionId', 'Invalid root revision');
  if (await deriveGraphId(root) !== graph.graphId) fail('E_GRAPH_HASH', 'graphId', 'RunGraph identity mismatch');

  for (const [stateHash, state] of Object.entries(graph.states)) {
    if (await hashCanonical(state) !== stateHash) fail('E_STATE_HASH', `states.${stateHash}`, 'Materialized state hash mismatch');
  }

  for (const [receiptHash, receipt] of Object.entries(graph.receiptCores)) {
    if (await hashCanonical(receipt) !== receiptHash) fail('E_RECEIPT_HASH', `receiptCores.${receiptHash}`, 'Receipt hash mismatch');
    const base = graph.revisions[receipt.baseRevisionId];
    if (!base || receipt.baseStateHash !== base.stateHash) fail('E_RECEIPT_LINK', `receiptCores.${receiptHash}.baseRevisionId`, 'Receipt base revision binding is invalid');
    if (receipt.previousReceiptCoreHash !== base.transitionReceiptCoreHash) fail('E_RECEIPT_LINK', `receiptCores.${receiptHash}.previousReceiptCoreHash`, 'Receipt predecessor does not match its base revision');
    if (receipt.previousReceiptCoreHash !== null && !(receipt.previousReceiptCoreHash in graph.receiptCores)) {
      fail('E_RECEIPT_LINK', `receiptCores.${receiptHash}.previousReceiptCoreHash`, 'Receipt predecessor evidence is missing');
    }
  }

  for (const revisionId of revisionIds) {
    const revision = graph.revisions[revisionId];
    const expectedRevisionHash = await hashCanonical(revisionCore(revision));
    const expectedRevisionId = `revision:${expectedRevisionHash.slice('sha256:'.length)}`;
    if (revision.revisionId !== revisionId || revisionId !== expectedRevisionId) fail('E_REVISION_HASH', `revisions.${revisionId}`, 'Revision identity mismatch');
    if (!(revision.stateHash in graph.states)) fail('E_STATE_HASH', `revisions.${revisionId}.stateHash`, 'Revision state is missing');
    if (revision.parentRevisionId === null) {
      if (revisionId !== graph.rootRevisionId || revision.transitionReceiptCoreHash !== null) fail('E_GRAPH_ROOT', `revisions.${revisionId}`, 'Unexpected genesis revision');
      continue;
    }
    const parent = graph.revisions[revision.parentRevisionId];
    if (!parent) fail('E_GRAPH_PARENT', `revisions.${revisionId}.parentRevisionId`, 'Parent revision is missing');
    if (revision.sequence !== parent.sequence + 1) fail('E_GRAPH_SEQUENCE', `revisions.${revisionId}.sequence`, 'Revision sequence is not contiguous');
    const receiptHash = revision.transitionReceiptCoreHash;
    if (!receiptHash) fail('E_RECEIPT_HASH', `revisions.${revisionId}.transitionReceiptCoreHash`, 'Child revision receipt is missing');
    const receipt = graph.receiptCores[receiptHash];
    if (!receipt || await hashCanonical(receipt) !== receiptHash) fail('E_RECEIPT_HASH', `receiptCores.${receiptHash}`, 'Receipt hash mismatch');
    if (receipt.decision !== 'ACCEPTED'
      || receipt.baseRevisionId !== parent.revisionId
      || receipt.baseStateHash !== parent.stateHash
      || receipt.previousReceiptCoreHash !== parent.transitionReceiptCoreHash
      || receipt.candidateStateHash !== revision.stateHash
      || receipt.independentReplayStateHash !== revision.stateHash) {
      fail('E_RECEIPT_LINK', `receiptCores.${receiptHash}`, 'Receipt does not bind the parent and candidate states');
    }
  }

  for (const [branchId, headId] of Object.entries(graph.branchHeads)) {
    const head = graph.revisions[headId];
    if (!head || head.branchId !== branchId) fail('E_BRANCH_HEAD', `branchHeads.${branchId}`, 'Branch head is missing or mislabeled');
  }

  for (const revisionId of revisionIds) {
    const seen = new Set<string>();
    let current: string | null = revisionId;
    while (current !== null) {
      if (seen.has(current)) fail('E_GRAPH_CYCLE', `revisions.${revisionId}.parentRevisionId`, 'Revision ancestry contains a cycle');
      seen.add(current);
      const revision: CanonicalRevision | undefined = graph.revisions[current];
      if (!revision) fail('E_GRAPH_PARENT', `revisions.${revisionId}.parentRevisionId`, 'Revision ancestry is orphaned');
      current = revision.parentRevisionId;
    }
    if (!seen.has(graph.rootRevisionId)) fail('E_GRAPH_ROOT', `revisions.${revisionId}`, 'Revision is not reachable from the root');
  }
  return graph;
}

export async function verifyCanonicalRunGraph(input: unknown): Promise<RunGraphVerificationReport> {
  try {
    const graph = await verifyOrThrow(input);
    return {
      ok: true,
      verifiedRevisionCount: Object.keys(graph.revisions).length,
      graphId: graph.graphId,
      graphHash: graph.graphHash,
      errorCode: null,
      firstMismatch: null,
    };
  } catch (error) {
    return {
      ok: false,
      verifiedRevisionCount: 0,
      graphId: null,
      graphHash: null,
      errorCode: error instanceof RunGraphError ? error.code : 'E_GRAPH_SCHEMA',
      firstMismatch: error instanceof RunGraphError ? error.path : 'graph',
    };
  }
}

export async function importCanonicalRunGraph(input: unknown): Promise<{
  graph: CanonicalRunGraph;
  store: CanonicalStore;
}> {
  const graph = await verifyOrThrow(input);
  const store = createInMemoryCanonicalStore();
  const root = graph.revisions[graph.rootRevisionId];
  await store.putGenesis(root, graph.states[root.stateHash]);

  const children = Object.values(graph.revisions)
    .filter((revision) => revision.parentRevisionId !== null)
    .sort((left, right) => left.sequence - right.sequence || left.revisionId.localeCompare(right.revisionId));
  const importedReceiptHashes = new Set<string>();
  for (const revision of children) {
    const receiptHash = revision.transitionReceiptCoreHash;
    if (!receiptHash) fail('E_RECEIPT_HASH', `revisions.${revision.revisionId}.transitionReceiptCoreHash`, 'Child receipt is missing');
    const core = graph.receiptCores[receiptHash];
    await store.putReceipt({ core, coreHash: receiptHash });
    importedReceiptHashes.add(receiptHash);
    await store.appendRevision(revision, graph.states[revision.stateHash]);
  }

  const pending = Object.entries(graph.receiptCores)
    .filter(([hash]) => !importedReceiptHashes.has(hash))
    .sort(([left], [right]) => left.localeCompare(right));
  while (pending.length > 0) {
    let progress = false;
    for (let index = pending.length - 1; index >= 0; index -= 1) {
      const [coreHash, core] = pending[index];
      if (core.previousReceiptCoreHash !== null && !store.getReceipt(core.previousReceiptCoreHash)) continue;
      await store.putReceipt({ core, coreHash: coreHash as Sha256Digest });
      pending.splice(index, 1);
      progress = true;
    }
    if (!progress) fail('E_RECEIPT_LINK', 'receiptCores', 'Receipt graph could not be imported in predecessor order');
  }

  const rebuilt = await buildCanonicalRunGraph(store);
  if (canonicalize(rebuilt) !== canonicalize(graph)) fail('E_GRAPH_HASH', 'graph', 'Imported RunGraph did not reconstruct byte-identically');
  return { graph: structuredClone(graph), store };
}
