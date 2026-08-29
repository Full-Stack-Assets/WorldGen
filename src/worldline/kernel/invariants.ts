import type {
  CanonicalWorldState,
  InvariantResult,
  TransitionMechanismArtifact,
  TransitionProposal,
} from './types';

function result(invariantId: string, passed: boolean, detail: string): InvariantResult {
  return { invariantId, passed, detail };
}

export function runCoreInvariants(input: {
  before: CanonicalWorldState;
  after: CanonicalWorldState;
  mechanism: TransitionMechanismArtifact;
  proposal: TransitionProposal;
}): InvariantResult[] {
  const worldIds = input.after.worlds.map((world) => world.id);
  const uniqueWorldIds = new Set(worldIds).size === worldIds.length;
  const branchEntries = Object.entries(input.after.branches);
  const branchKeysMatchIds = branchEntries.every(([key, branch]) => key === branch.id);
  const branchSnapshotsMatch = branchEntries.every(([, branch]) => branch.snapshots.every((snapshot) => snapshot.branchId === branch.id));
  const branchParentsResolvable = branchEntries.every(([, branch]) => branch.parentId === null || Boolean(input.after.branches[branch.parentId]));

  return [
    result(
      'canonical-schema-stable',
      input.before.schema === 'worldline-canonical-state-v1' && input.after.schema === input.before.schema,
      'Before and after states must use the canonical v1 schema.',
    ),
    result(
      'proposal-mechanism-binding',
      input.proposal.mechanismId === input.mechanism.mechanismId,
      'The proposal must reference the exact mechanism being evaluated.',
    ),
    result(
      'unique-world-ids',
      uniqueWorldIds,
      'Canonical world IDs must remain unique.',
    ),
    result(
      'branch-key-identity',
      branchKeysMatchIds,
      'Every branch map key must equal the branch record ID.',
    ),
    result(
      'branch-snapshot-identity',
      branchSnapshotsMatch,
      'Every snapshot branchId must match its containing branch.',
    ),
    result(
      'branch-parent-reference',
      branchParentsResolvable,
      'Every non-root branch parentId must resolve inside canonical branch state.',
    ),
  ];
}

export function allInvariantsPassed(results: InvariantResult[]): boolean {
  return results.every((item) => item.passed);
}
