import type { ResearchLedger, ResearchLedgerEntry } from './researchLedger';

export interface ModelWorldlineNode {
  id: string;
  kind: ResearchLedgerEntry['kind'];
  label: string;
  status: string;
  parentIds: string[];
}

export interface ModelWorldlineEdge {
  from: string;
  to: string;
}

export interface ModelWorldline {
  nodes: ModelWorldlineNode[];
  edges: ModelWorldlineEdge[];
}

function observationNodeId(observationId: string): string {
  return `${observationId}:observation`;
}

function hypothesisNodeId(observationId: string, candidateId: string): string {
  return `${observationId}:hypothesis:${candidateId}`;
}

function promotionNodeId(observationId: string): string {
  return `${observationId}:promotion`;
}

function nodeFromEntry(entry: ResearchLedgerEntry): ModelWorldlineNode {
  switch (entry.kind) {
    case 'OBSERVATION':
      return { id: entry.id, kind: entry.kind, label: entry.observationId, status: entry.conflictDetected ? 'CONFLICT' : 'STABLE', parentIds: [] };
    case 'ANOMALY':
      return { id: entry.id, kind: entry.kind, label: entry.label, status: 'DETECTED', parentIds: [observationNodeId(entry.observationId)] };
    case 'HYPOTHESIS':
      return { id: entry.id, kind: entry.kind, label: entry.label, status: entry.status, parentIds: [observationNodeId(entry.observationId)] };
    case 'EXPERIMENT':
      return { id: entry.id, kind: entry.kind, label: `Frozen evaluator ${entry.evaluationContractId}`, status: 'IMMUTABLE', parentIds: [observationNodeId(entry.observationId)] };
    case 'VERIFICATION':
      return { id: entry.id, kind: entry.kind, label: `Verifier ${entry.verifierId}`, status: entry.passed ? 'PASSED' : 'FAILED', parentIds: entry.candidateId === 'none' ? [observationNodeId(entry.observationId)] : [hypothesisNodeId(entry.observationId, entry.candidateId)] };
    case 'PROMOTION':
      return { id: entry.id, kind: entry.kind, label: entry.reason, status: entry.status, parentIds: entry.candidateId ? [hypothesisNodeId(entry.observationId, entry.candidateId)] : [observationNodeId(entry.observationId)] };
    case 'REALITY_WAKE':
      return { id: entry.id, kind: entry.kind, label: entry.message, status: 'UPDATED', parentIds: [promotionNodeId(entry.observationId)] };
    case 'REOPEN':
      return { id: entry.id, kind: entry.kind, label: entry.reason, status: 'REOPENED', parentIds: [entry.decisionId] };
  }
}

export function deriveModelWorldline(ledger: ResearchLedger): ModelWorldline {
  const nodes = ledger.entries.map(nodeFromEntry);
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: ModelWorldlineEdge[] = [];
  for (const node of nodes) {
    for (const parentId of node.parentIds) {
      if (nodeIds.has(parentId)) edges.push({ from: parentId, to: node.id });
    }
  }
  return { nodes, edges };
}
