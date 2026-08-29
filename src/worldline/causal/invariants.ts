import { canonicalize } from './canonicalJson';
import { branchCandidateMatchesRules } from './branchRules';
import type { CanonicalWorldState } from '../types';
import type { InvariantResult, TransitionMechanismArtifact, TransitionProposal } from './types';

export interface InvariantContext {
  baseState: unknown;
  candidateState: unknown;
  proposal: TransitionProposal;
  mechanism: TransitionMechanismArtifact;
}

function objectInputs(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function evaluateOne(ref: string, context: InvariantContext): InvariantResult {
  if (ref === 'branch-parent-immutability-v1') {
    const base = context.baseState as Partial<CanonicalWorldState>;
    const candidate = context.candidateState as Partial<CanonicalWorldState>;
    if (!base.branches || !candidate.branches) return { id: ref, passed: false, detail: 'Branch collections are missing.' };
    const passed = Object.entries(base.branches).every(([id, branch]) => {
      const candidateBranch = candidate.branches?.[id];
      return candidateBranch !== undefined && canonicalize(candidateBranch) === canonicalize(branch);
    });
    return {
      id: ref,
      passed,
      detail: passed ? 'All pre-existing branches remain byte-equivalent.' : 'A pre-existing branch changed.',
    };
  }
  if (ref === 'worldline-branch-rules-v1') {
    const inputs = objectInputs(context.proposal.normalizedInputs);
    if (!inputs) return { id: ref, passed: false, detail: 'Branch proposal inputs are invalid.' };
    try {
      const passed = branchCandidateMatchesRules(
        context.baseState as CanonicalWorldState,
        context.candidateState as CanonicalWorldState,
        inputs,
      );
      return {
        id: ref,
        passed,
        detail: passed ? 'Candidate exactly matches deterministic branch rules.' : 'Candidate does not match deterministic branch rules.',
      };
    } catch (error) {
      return { id: ref, passed: false, detail: error instanceof Error ? error.message : 'Branch invariant failed.' };
    }
  }
  return { id: ref, passed: false, detail: `Unknown invariant suite: ${ref}` };
}

export function evaluateInvariantSuite(refs: readonly string[], context: InvariantContext): InvariantResult[] {
  return refs.map((ref) => evaluateOne(ref, context));
}
