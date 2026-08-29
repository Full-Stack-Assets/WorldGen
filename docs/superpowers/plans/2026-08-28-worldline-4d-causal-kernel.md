# Worldline 4D Causal Kernel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic, append-only causal kernel that is the only path for admitting canonical Worldline state revisions, while keeping AI-generated mechanisms and renderers outside the canonical authority boundary.

**Architecture:** Add a pure TypeScript causal-kernel package under `src/worldline/causal/`. Canonical JSON hashing, producer/mechanism identity, Transition IR execution, replay verification, epistemic/promotion gates, and render envelopes remain deterministic and independently testable. Existing Worldline state is migrated incrementally so session/view state cannot affect canonical revision identity and durable changes cannot bypass the admission gate.

**Tech Stack:** TypeScript 5.7, Vitest 2.1, React 19 / Vite 6 repository runtime; Node/Web Crypto-compatible SHA-256 implementation without adding a production dependency.

**Spec:** `docs/superpowers/specs/2026-08-27-worldline-4d-causal-kernel-design.md`

## Global Constraints

- Canonical history is append-only and content-addressed.
- There is exactly one mechanically enforced canonical admission path.
- Agent-generated mechanisms begin as `CANDIDATE` and cannot self-promote.
- Proposal producer and verifier identities must remain independently attributable.
- Generated or simulated artifacts cannot self-upgrade to `OBSERVED`.
- Renderers and projection adapters receive no canonical write capability.
- Session/view changes cannot change canonical revision identity.
- Production persistence, database RPCs, credentials, and deployment remain unchanged in this implementation slice.
- Arbitrary generated TypeScript, JavaScript, Python, shell, dynamic `eval`, network access, wall clock, filesystem access, environment access, and system randomness are forbidden inside Transition IR v1 execution.
- Canonical digests use `sha256:<lowercase hex>` and exclude wall-clock envelope metadata.
- Repository completion evidence requires `npm run typecheck`, `npm test`, and `npm run build` to pass.

---

## File Structure

Create focused causal-kernel modules rather than expanding `state.ts` into a second authority layer:

- `src/worldline/causal/canonicalJson.ts` — RFC-8785-compatible canonical JSON normalization and SHA-256 hashing.
- `src/worldline/causal/types.ts` — canonical revision, mechanism, proposal, receipt, producer, causal-reference, render-envelope, and render-receipt contracts.
- `src/worldline/causal/producerIdentity.ts` — deterministic producer and harness identity derivation.
- `src/worldline/causal/transitionIr.ts` — Transition IR v1 validation and deterministic executor.
- `src/worldline/causal/store.ts` — append-only in-memory canonical revision/state/mechanism/receipt store used by tests and the first runtime slice.
- `src/worldline/causal/policy.ts` — epistemic and mechanism/execution admission rules layered over existing `promotionPolicy.ts`.
- `src/worldline/causal/kernel.ts` — genesis, proposal execution, independent replay, receipt creation, and canonical admission orchestration.
- `src/worldline/causal/renderBoundary.ts` — immutable renderer envelope and receipt creation with no admission capability.
- `src/worldline/causal/builtinMechanisms.ts` — built-in approved deterministic mechanisms, beginning with branch creation.
- `src/worldline/types.ts` — add `CanonicalWorldState` and `WorldlineSessionState` while retaining compatibility aliases during migration.
- `src/worldline/state.ts` — split durable state from session selections and remove unchecked application-level snapshot commitment.
- `src/worldline/__tests__/causal*.test.ts` — direct tests for every authority invariant.
- `docs/WORLDLINE_RUNTIME.md` — document the mechanically enforced causal admission path after tests pass.

---

### Task 1: Canonical JSON and SHA-256 commitments

**Files:**
- Create: `src/worldline/causal/canonicalJson.ts`
- Create: `src/worldline/__tests__/causalCanonicalJson.test.ts`

**Interfaces:**
- Produces: `canonicalize(value: unknown): string`
- Produces: `hashCanonical(value: unknown): Promise<`sha256:${string}`>`
- Produces: `normalizeCanonical(value: unknown): unknown`

- [ ] **Step 1: Write failing canonicalization tests**

```ts
import { describe, expect, it } from 'vitest';
import { canonicalize, hashCanonical } from '../causal/canonicalJson';

describe('canonical JSON', () => {
  it('sorts object keys and normalizes negative zero deterministically', async () => {
    expect(canonicalize({ z: -0, a: { d: 2, c: 1 } }))
      .toBe('{"a":{"c":1,"d":2},"z":0}');
    expect(await hashCanonical({ b: 2, a: 1 }))
      .toBe(await hashCanonical({ a: 1, b: 2 }));
  });

  it('rejects values outside the canonical JSON domain', () => {
    expect(() => canonicalize({ value: Number.NaN })).toThrow('Non-finite number');
    expect(() => canonicalize({ value: undefined })).toThrow('Unsupported canonical value');
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/worldline/__tests__/causalCanonicalJson.test.ts`

Expected: FAIL because `../causal/canonicalJson` does not exist.

- [ ] **Step 3: Implement canonical normalization and hashing**

```ts
export type Sha256Digest = `sha256:${string}`;

export function normalizeCanonical(value: unknown): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Non-finite number');
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) return value.map(normalizeCanonical);
  if (typeof value === 'object') {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) throw new Error('Unsupported canonical object');
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => {
        if (item === undefined || typeof item === 'function' || typeof item === 'symbol') {
          throw new Error('Unsupported canonical value');
        }
        return [key, normalizeCanonical(item)];
      }));
  }
  throw new Error('Unsupported canonical value');
}

export function canonicalize(value: unknown): string {
  return JSON.stringify(normalizeCanonical(value));
}

export async function hashCanonical(value: unknown): Promise<Sha256Digest> {
  const bytes = new TextEncoder().encode(canonicalize(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `sha256:${hex}`;
}
```

- [ ] **Step 4: Run focused test and typecheck**

Run: `npm test -- src/worldline/__tests__/causalCanonicalJson.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/worldline/causal/canonicalJson.ts src/worldline/__tests__/causalCanonicalJson.test.ts
git commit -m "feat(worldline): add canonical state hashing"
```

---

### Task 2: Canonical contracts and producer/harness identity

**Files:**
- Create: `src/worldline/causal/types.ts`
- Create: `src/worldline/causal/producerIdentity.ts`
- Create: `src/worldline/__tests__/causalProducerIdentity.test.ts`

**Interfaces:**
- Consumes: `hashCanonical()` from Task 1.
- Produces: `CanonicalRevision`, `TransitionMechanismArtifact`, `TransitionProposal`, `TransitionReceiptCore`, `TransitionReceiptEnvelope`, `ProducerIdentityInput`, `CausalReference`, `RenderEnvelope`, and `RenderReceipt`.
- Produces: `deriveProducerId(input: ProducerIdentityInput): Promise<string>`.

- [ ] **Step 1: Write the failing producer-identity test**

```ts
import { describe, expect, it } from 'vitest';
import { deriveProducerId } from '../causal/producerIdentity';

const BASE = {
  model: { provider: 'example', model: 'coder-v1', version: '1' },
  promptBundleDigest: 'sha256:prompt',
  harnessDigest: 'sha256:harness-a',
  memoryDigest: 'sha256:memory',
  toolRegistryDigest: 'sha256:tools',
  skillRegistryDigest: 'sha256:skills',
  runtimeDigest: 'sha256:runtime',
  decoding: { temperature: 0 },
};

describe('producer identity', () => {
  it('changes when the generated harness changes', async () => {
    const first = await deriveProducerId(BASE);
    const second = await deriveProducerId({ ...BASE, harnessDigest: 'sha256:harness-b' });
    expect(first).not.toBe(second);
  });
});
```

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- src/worldline/__tests__/causalProducerIdentity.test.ts`

Expected: FAIL because producer identity contracts do not exist.

- [ ] **Step 3: Add exact v1 contracts**

In `src/worldline/causal/types.ts`, define the contracts used throughout later tasks, including these exact discriminants:

```ts
import type { EpistemicClass } from '../types';
import type { Sha256Digest } from './canonicalJson';

export type MechanismSourceType = 'HUMAN_AUTHORED' | 'AGENT_GENERATED' | 'IMPORTED';
export type MechanismPromotionStatus = 'CANDIDATE' | 'APPROVED_EXECUTABLE' | 'RETIRED' | 'REJECTED';
export type TransitionDecision = 'ACCEPTED' | 'REJECTED' | 'HUMAN_REQUIRED';

export interface ProducerIdentityInput {
  model: { provider: string; model: string; version: string };
  promptBundleDigest: string;
  harnessDigest: string;
  memoryDigest: string;
  toolRegistryDigest: string;
  skillRegistryDigest: string;
  runtimeDigest: string;
  decoding: Record<string, string | number | boolean>;
  harnessGenerator?: { modelId: string; artifactDigest: string; lineageDigest: string; archiveDigest: string };
}

export interface CanonicalRevision {
  schema: 'worldline-canonical-revision-v1';
  revisionId: string;
  parentRevisionId: string | null;
  worldId: string;
  branchId: string;
  sequence: number;
  simulationTime: number;
  stateSchema: string;
  stateHash: Sha256Digest;
  transitionReceiptCoreHash: Sha256Digest | null;
  epistemicClass: EpistemicClass;
  kernelVersion: string;
}

export interface CausalReference {
  sourceType: 'ENTITY' | 'EVENT' | 'EVIDENCE' | 'ACTION' | 'INTERVENTION' | 'REVISION';
  sourceId: string;
  sourceRevisionId: string;
  relation: 'TRIGGERED_BY' | 'CONSTRAINED_BY' | 'DERIVED_FROM' | 'COUNTERFACTUAL_TO' | 'EVIDENCED_BY';
  explanationCode?: string;
  provenanceDigest: Sha256Digest;
}
```

Also define the remaining mechanism/proposal/receipt/render contracts from the approved spec with readonly arrays where practical.

- [ ] **Step 4: Implement `deriveProducerId()`**

```ts
import { hashCanonical } from './canonicalJson';
import type { ProducerIdentityInput } from './types';

export async function deriveProducerId(input: ProducerIdentityInput): Promise<string> {
  const digest = await hashCanonical({ schema: 'worldline-producer-identity-v1', ...input });
  return `producer:${digest.slice('sha256:'.length)}`;
}
```

- [ ] **Step 5: Run focused test and typecheck**

Run: `npm test -- src/worldline/__tests__/causalProducerIdentity.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/worldline/causal/types.ts src/worldline/causal/producerIdentity.ts src/worldline/__tests__/causalProducerIdentity.test.ts
git commit -m "feat(worldline): define causal kernel contracts"
```

---

### Task 3: Transition IR v1 validator and deterministic executor

**Files:**
- Create: `src/worldline/causal/transitionIr.ts`
- Create: `src/worldline/__tests__/causalTransitionIr.test.ts`

**Interfaces:**
- Consumes: canonical JSON-compatible values from Task 1.
- Produces: `TransitionIrOperation`, `TransitionIrProgram`, `validateTransitionIr(program, mechanism)`, and `executeTransitionIr(baseState, program, inputs)`.
- Produces no network, filesystem, clock, environment, or arbitrary-code capabilities.

- [ ] **Step 1: Write adverse and deterministic tests**

```ts
import { describe, expect, it } from 'vitest';
import { executeTransitionIr, validateTransitionIr } from '../causal/transitionIr';

const mechanism = {
  readSet: ['/metrics/population'],
  writeSet: ['/metrics/population'],
};

const program = {
  version: 'TRANSITION_IR_V1' as const,
  operations: [
    { op: 'ASSERT' as const, path: '/metrics/population', comparator: 'GTE' as const, value: 0 },
    { op: 'INCREMENT' as const, path: '/metrics/population', value: { input: 'delta' } },
  ],
};

describe('Transition IR v1', () => {
  it('executes the same input deterministically without mutating the base state', () => {
    const base = { metrics: { population: 100 } };
    validateTransitionIr(program, mechanism);
    const first = executeTransitionIr(base, program, { delta: 5 });
    const second = executeTransitionIr(base, program, { delta: 5 });
    expect(first).toEqual({ metrics: { population: 105 } });
    expect(second).toEqual(first);
    expect(base).toEqual({ metrics: { population: 100 } });
  });

  it('rejects undeclared writes', () => {
    expect(() => validateTransitionIr({
      version: 'TRANSITION_IR_V1',
      operations: [{ op: 'SET', path: '/secret', value: 1 }],
    }, mechanism)).toThrow('Undeclared write path');
  });
});
```

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- src/worldline/__tests__/causalTransitionIr.test.ts`

Expected: FAIL because Transition IR is not implemented.

- [ ] **Step 3: Implement the data-only operation grammar**

Support only `SET`, `INCREMENT`, `APPEND_UNIQUE`, `TOMBSTONE`, `ASSERT`, and `LINK_CAUSE`. Resolve JSON Pointer paths with a small internal helper that rejects prototype-pollution segments `__proto__`, `prototype`, and `constructor`.

Use a recursively evaluated expression type limited to literals, `{ input: string }`, `{ state: string }`, and explicit deterministic arithmetic/comparison/boolean nodes. Reject division by zero and any non-finite result.

- [ ] **Step 4: Implement copy-on-write execution**

Start execution from `structuredClone(baseState)`. Every operation must pass read/write validation before execution. `APPEND_UNIQUE` compares canonicalized item strings; `TOMBSTONE` sets `{ tombstoned: true }` rather than deleting prior information; `LINK_CAUSE` appends a structurally validated causal reference to `/causalReferences` or another declared path.

- [ ] **Step 5: Run focused test and typecheck**

Run: `npm test -- src/worldline/__tests__/causalTransitionIr.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/worldline/causal/transitionIr.ts src/worldline/__tests__/causalTransitionIr.test.ts
git commit -m "feat(worldline): add deterministic transition IR"
```

---

### Task 4: Append-only in-memory canonical store and genesis revisions

**Files:**
- Create: `src/worldline/causal/store.ts`
- Create: `src/worldline/__tests__/causalStore.test.ts`

**Interfaces:**
- Consumes: `CanonicalRevision`, mechanism and receipt types from Task 2.
- Produces: `createInMemoryCanonicalStore()` with `putGenesis`, `appendRevision`, `putMechanism`, `putReceipt`, `getRevision`, `getStateByHash`, `getBranchHead`, `getMechanism`, and `getReceipt`.
- Produces: `createGenesisRevision(input)`.

- [ ] **Step 1: Write immutability and content-address tests**

```ts
import { describe, expect, it } from 'vitest';
import { createGenesisRevision, createInMemoryCanonicalStore } from '../causal/store';

it('stores immutable genesis state by content hash', async () => {
  const store = createInMemoryCanonicalStore();
  const state = { worlds: [], branches: {} };
  const revision = await createGenesisRevision({
    worldId: 'worldgen-prime', branchId: 'root', simulationTime: 2026,
    stateSchema: 'worldline-state-v1', epistemicClass: 'GENERATED', kernelVersion: 'causal-kernel-v1', state,
  });
  store.putGenesis(revision, state);
  state.worlds.push({ id: 'external-mutation' } as never);
  expect(store.getStateByHash(revision.stateHash)).toEqual({ worlds: [], branches: {} });
  expect(store.getBranchHead('root')?.revisionId).toBe(revision.revisionId);
});
```

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- src/worldline/__tests__/causalStore.test.ts`

Expected: FAIL because the store does not exist.

- [ ] **Step 3: Implement genesis hashing**

`createGenesisRevision()` must hash the state first, then derive `revisionId` from all deterministic revision fields except `revisionId`. Genesis uses `parentRevisionId: null` and `transitionReceiptCoreHash: null`.

- [ ] **Step 4: Implement append-only store checks**

Reject duplicate revision IDs with different content, reject replacement of an existing state hash, reject a child whose parent is missing, and reject branch-head replacement unless the new revision names the current head as parent. Return structured clones from all getters.

- [ ] **Step 5: Run focused test and typecheck**

Run: `npm test -- src/worldline/__tests__/causalStore.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/worldline/causal/store.ts src/worldline/__tests__/causalStore.test.ts
git commit -m "feat(worldline): add append-only canonical store"
```

---

### Task 5: Epistemic and mechanism promotion policy

**Files:**
- Create: `src/worldline/causal/policy.ts`
- Modify: `src/worldline/promotionPolicy.ts`
- Create: `src/worldline/__tests__/causalPolicy.test.ts`

**Interfaces:**
- Consumes: existing `isAutoPromoteEligible()` and human-gated kinds.
- Produces: `evaluateMechanismExecutionPolicy(input): TransitionDecision`.
- Produces: `validateEpistemicTransition(input): void`.

- [ ] **Step 1: Write fail-closed policy tests**

```ts
import { describe, expect, it } from 'vitest';
import { evaluateMechanismExecutionPolicy, validateEpistemicTransition } from '../causal/policy';

it('blocks an unapproved agent-generated mechanism', () => {
  expect(evaluateMechanismExecutionPolicy({
    sourceType: 'AGENT_GENERATED', promotionStatus: 'CANDIDATE', riskClass: 'LOW_RISK_RENDERING',
    reversible: true, machineVerifiable: true, independentVerificationPassed: true,
  })).toBe('HUMAN_REQUIRED');
});

it('blocks generated output from becoming observed truth', () => {
  expect(() => validateEpistemicTransition({ from: 'GENERATED', to: 'OBSERVED', evidenceIngestAuthorized: false }))
    .toThrow('Epistemic uplift requires authorized evidence ingest');
});
```

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- src/worldline/__tests__/causalPolicy.test.ts`

Expected: FAIL because causal policy functions do not exist.

- [ ] **Step 3: Extend promotion semantics without weakening existing gates**

Keep the current `AUTO_PROMOTE_KINDS` and `HUMAN_GATED_KINDS`. Add a causal helper that returns `HUMAN_REQUIRED` for every mechanism not in `APPROVED_EXECUTABLE`, for ambiguous inputs, and for human-gated categories. Return `ACCEPTED` only when an approved execution independently satisfies the existing low-risk eligibility predicate.

- [ ] **Step 4: Add epistemic ordering rules**

Do not implement a naïve numeric ranking because `SIMULATED`, `GENERATED`, and `SPECULATIVE` are semantic classes rather than a single confidence scale. Explicitly allow same-class transitions and approved simulated/generated/speculative outputs; require `evidenceIngestAuthorized` for transitions to `OBSERVED`; require an explicit reconstruction authorization for transitions to `RECONSTRUCTED`.

- [ ] **Step 5: Run policy tests plus existing promotion tests**

Run: `npm test -- src/worldline/__tests__/causalPolicy.test.ts src/worldline/__tests__/promotionPolicy.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/worldline/causal/policy.ts src/worldline/promotionPolicy.ts src/worldline/__tests__/causalPolicy.test.ts
git commit -m "feat(worldline): enforce causal admission policy"
```

---

### Task 6: Proposal execution, independent replay, receipt hashing, and canonical admission

**Files:**
- Create: `src/worldline/causal/kernel.ts`
- Create: `src/worldline/__tests__/causalKernel.test.ts`

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces: `createTransitionProposal(input)`.
- Produces: `executeCandidate(store, proposal, verifier)`.
- Produces: `admitTransition(store, proposal, verifier)` returning `{ decision, receipt, revision? }`.
- Produces: `verifyReceiptCoreHash(receiptCore, expectedHash)`.

- [ ] **Step 1: Write the core deterministic replay test**

```ts
it('admits only a replay-identical transition and preserves lineage', async () => {
  const fixture = await createCausalKernelFixture();
  const proposal = await fixture.proposePopulationDelta(5);
  const result = await admitTransition(fixture.store, proposal, fixture.verifier);
  expect(result.decision).toBe('ACCEPTED');
  expect(result.receipt.core.candidateStateHash).toBe(result.receipt.core.independentReplayStateHash);
  expect(result.revision?.parentRevisionId).toBe(fixture.genesis.revisionId);
  expect(result.revision?.transitionReceiptCoreHash).toBe(result.receipt.coreHash);
});
```

Add tests in the same file for stale base, replay mismatch, receipt-core tampering, missing verifier identity, and producer/verifier forbidden identity collision.

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- src/worldline/__tests__/causalKernel.test.ts`

Expected: FAIL because kernel orchestration does not exist.

- [ ] **Step 3: Implement proposal creation and normalized input hashing**

`createTransitionProposal()` must hash normalized inputs, bind the proposal to `baseRevisionId` and `mechanismId`, and derive `proposalId` from its deterministic content.

- [ ] **Step 4: Implement candidate execution and frozen verifier contract**

Read the immutable base state and mechanism from the store. Reject stale branch heads, retired/unknown/unapproved mechanisms, undeclared accesses, missing identities, and producer/verifier collisions before execution. Execute Transition IR once for the candidate and once through the independently supplied verifier path. The two canonical state hashes must match exactly.

- [ ] **Step 5: Build and hash the deterministic receipt core**

Keep `recordedAt` and storage/CI metadata in the envelope only. Include gate results, invariant results, base/mechanism/proposal/producer/verifier hashes, candidate hash, replay hash, decision, seed/PRNG metadata, and any required Human Authority approval reference in the deterministic core.

- [ ] **Step 6: Admit accepted revisions append-only**

Only `ACCEPTED` results may call the store's `appendRevision()`. `REJECTED` and `HUMAN_REQUIRED` receipts are stored for audit but create no revision. Derive the child revision ID from deterministic revision fields after the receipt core hash exists.

- [ ] **Step 7: Run kernel tests and typecheck**

Run: `npm test -- src/worldline/__tests__/causalKernel.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/worldline/causal/kernel.ts src/worldline/__tests__/causalKernel.test.ts
git commit -m "feat(worldline): gate canonical transitions through replay"
```

---

### Task 7: Split canonical world state from session/view state

**Files:**
- Modify: `src/worldline/types.ts`
- Modify: `src/worldline/state.ts`
- Modify: `src/worldline/__tests__/state.test.ts`
- Create: `src/worldline/__tests__/causalSessionIsolation.test.ts`

**Interfaces:**
- Produces: `CanonicalWorldState` containing durable `worlds` and `branches` only.
- Produces: `WorldlineSessionState` containing `activeWorldId`, `activeBranchId`, `selectedYear`, and `timeMode`.
- Produces: `createInitialCanonicalWorldState()` and `createInitialWorldlineSessionState(canonical)`.
- Retains: `createInitialWorldlineState()` temporarily as a compatibility composition helper.

- [ ] **Step 1: Write the session-isolation hash test**

```ts
import { hashCanonical } from '../causal/canonicalJson';
import { createInitialCanonicalWorldState, createInitialWorldlineSessionState, selectSessionYear } from '../state';

it('session view changes do not alter canonical state identity', async () => {
  const canonical = createInitialCanonicalWorldState();
  const session = createInitialWorldlineSessionState(canonical);
  const before = await hashCanonical(canonical);
  const changed = selectSessionYear(session, 2040);
  expect(changed.selectedYear).toBe(2040);
  expect(await hashCanonical(canonical)).toBe(before);
});
```

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- src/worldline/__tests__/causalSessionIsolation.test.ts`

Expected: FAIL because canonical/session constructors do not exist.

- [ ] **Step 3: Add explicit state interfaces**

In `types.ts`:

```ts
export interface CanonicalWorldState {
  worlds: WorldRecord[];
  branches: Record<string, BranchRecord>;
}

export interface WorldlineSessionState {
  activeWorldId: string;
  activeBranchId: string;
  selectedYear: number;
  timeMode: TimeMode;
}
```

Keep the old `WorldlineState` compatibility shape only while callers are migrated; mark it with a comment that it is not a canonical-authority type.

- [ ] **Step 4: Implement pure canonical/session constructors and selectors**

Make world/branch/year/time selectors operate on session state where possible. `activeWorld` becomes a derived lookup rather than durable canonical truth. Ensure current UI-facing compatibility helpers still return the existing shape until callers are migrated.

- [ ] **Step 5: Run state and isolation tests**

Run: `npm test -- src/worldline/__tests__/state.test.ts src/worldline/__tests__/causalSessionIsolation.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/worldline/types.ts src/worldline/state.ts src/worldline/__tests__/state.test.ts src/worldline/__tests__/causalSessionIsolation.test.ts
git commit -m "refactor(worldline): separate canonical and session state"
```

---

### Task 8: Close the unchecked snapshot-commit path and route branch creation through an approved built-in mechanism

**Files:**
- Modify: `src/worldline/state.ts`
- Create: `src/worldline/causal/builtinMechanisms.ts`
- Modify: `src/worldline/__tests__/state.test.ts`
- Create: `src/worldline/__tests__/causalAuthorityBoundary.test.ts`

**Interfaces:**
- Produces: `BUILTIN_BRANCH_MECHANISM` with source type `HUMAN_AUTHORED`, fixed digestable Transition IR contract, and `APPROVED_EXECUTABLE` status.
- Produces: `proposeBranchCreation(input)`.
- Removes the exported unchecked `commitSnapshot` canonical-authority function from `src/worldline/state.ts`.

- [ ] **Step 1: Write the authority-boundary test**

```ts
it('does not expose an unchecked canonical snapshot commit function', async () => {
  const stateModule = await import('../state');
  expect('commitSnapshot' in stateModule).toBe(false);
});

it('branch creation preserves the parent revision hash', async () => {
  const fixture = await createCausalKernelFixture();
  const parentState = fixture.store.getStateByHash(fixture.genesis.stateHash);
  const parentBefore = JSON.stringify(parentState);
  const result = await fixture.createBranchThroughKernel('alternate', 2030);
  expect(result.decision).toBe('ACCEPTED');
  expect(JSON.stringify(fixture.store.getStateByHash(fixture.genesis.stateHash))).toBe(parentBefore);
});
```

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- src/worldline/__tests__/causalAuthorityBoundary.test.ts`

Expected: FAIL while `commitSnapshot` remains exported and branch creation bypasses the kernel.

- [ ] **Step 3: Add the approved built-in branch mechanism**

Represent branch creation as deterministic operations over the canonical branches collection. Preserve the existing seed derivation `parent.seed + branchIndex * 7919`, branch ID normalization, snapshot fork selection, and parent immutability semantics from `src/worldline/state.ts`; version those rules inside `BUILTIN_BRANCH_MECHANISM` so replay remains stable.

- [ ] **Step 4: Remove the unchecked commit export and migrate the existing state tests**

Delete the exported `commitSnapshot()` function from `src/worldline/state.ts`. Update `src/worldline/__tests__/state.test.ts` so durable branch changes use the built-in causal mechanism fixture, while `replayBranch()` and `compareSnapshots()` remain pure read-only projections. The current GitHub code-search index reports no additional `commitSnapshot` call sites outside the defining module; `npm run typecheck` in Step 5 is the authoritative check for any unindexed imports.

- [ ] **Step 5: Run authority, state, and replay tests**

Run: `npm test -- src/worldline/__tests__/causalAuthorityBoundary.test.ts src/worldline/__tests__/state.test.ts src/worldline/__tests__/releaseSmoke.test.ts && npm run typecheck`

Expected: PASS. Any compiler-reported import of removed `commitSnapshot` is a blocking failure and must be migrated before this task can commit.

- [ ] **Step 6: Commit**

```bash
git add src/worldline/state.ts src/worldline/causal/builtinMechanisms.ts src/worldline/__tests__/state.test.ts src/worldline/__tests__/causalAuthorityBoundary.test.ts
git commit -m "refactor(worldline): close direct canonical commit bypass"
```

---

### Task 9: Renderer envelope and non-mutation boundary

**Files:**
- Create: `src/worldline/causal/renderBoundary.ts`
- Create: `src/worldline/__tests__/causalRenderBoundary.test.ts`

**Interfaces:**
- Consumes: admitted `CanonicalRevision` and immutable canonical projection.
- Produces: `createRenderEnvelope(input): Promise<RenderEnvelope>`.
- Produces: `createRenderReceipt(input): Promise<RenderReceipt>`.
- Exposes no store, admission, or transition function to renderer adapters.

- [ ] **Step 1: Write renderer-isolation tests**

```ts
it('renderer input is a detached immutable projection with no admission capability', async () => {
  const fixture = await createCausalKernelFixture();
  const envelope = await createRenderEnvelope({
    revision: fixture.genesis,
    projection: fixture.store.getStateByHash(fixture.genesis.stateHash),
    spatialConstraints: {}, temporalConstraints: { simulationTime: 2026 },
    epistemicLabels: ['GENERATED'], renderingIntent: 'world-preview',
    rendererPolicy: { provider: 'procedural-worldgen' }, seed: 'render-1',
  });
  expect('admitTransition' in (envelope as unknown as Record<string, unknown>)).toBe(false);
  expect(envelope.sourceStateHash).toBe(fixture.genesis.stateHash);
});
```

Also add a test that mutating the original projection after envelope construction does not change the envelope's projection digest.

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- src/worldline/__tests__/causalRenderBoundary.test.ts`

Expected: FAIL because render-boundary helpers do not exist.

- [ ] **Step 3: Implement render-envelope construction**

Structured-clone and deep-freeze the renderer projection, hash the projection/proxy independently, and include source revision/state hashes, constraints, epistemic labels, rendering intent, provider policy, and optional seed. Do not import `store.ts` or `kernel.ts` into this module.

- [ ] **Step 4: Implement render receipts**

Hash prompt/configuration separately from the output artifact digest. Preserve executed benchmark receipt IDs as evidence references only; never call causal admission from render receipt creation.

- [ ] **Step 5: Run render and world-model tests**

Run: `npm test -- src/worldline/__tests__/causalRenderBoundary.test.ts src/worldline/__tests__/worldModelRegistry.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/worldline/causal/renderBoundary.ts src/worldline/__tests__/causalRenderBoundary.test.ts
git commit -m "feat(worldline): isolate renderers from canonical authority"
```

---

### Task 10: Full invariant suite, runtime documentation, and verification receipt

**Files:**
- Create: `src/worldline/__tests__/causalKernelAdverse.test.ts`
- Modify: `docs/WORLDLINE_RUNTIME.md`
- Create: `docs/verification/worldline-4d-causal-kernel-v1.md`

**Interfaces:**
- Consumes all preceding tasks.
- Produces a single adverse-test suite mapping directly to spec section 25.
- Produces verification documentation containing exact commands and resulting commit SHA/CI links after execution.

- [ ] **Step 1: Add the complete adverse matrix**

Create one table-driven Vitest suite that explicitly covers these spec requirements:

```ts
const cases = [
  'identical genesis inputs hash identically',
  'identical approved transition inputs replay identically',
  'mechanism content changes its digest',
  'harness content changes producer identity',
  'parent revision remains immutable',
  'stale base fails closed',
  'undeclared write fails closed',
  'unapproved generated mechanism cannot canonically execute',
  'replay mismatch blocks admission',
  'receipt-core tampering is detected',
  'generated state cannot self-promote to observed',
  'renderer output cannot mutate canonical state',
  'session changes do not change canonical hashes',
  'accepted revision preserves receipt-mechanism-producer lineage',
  'benchmark evidence cannot substitute for admission',
] as const;
```

Implement each requirement as an actual `it(...)` using the shared causal fixture; the array is the review checklist, not the assertion body.

- [ ] **Step 2: Run the complete causal suite**

Run: `npm test -- src/worldline/__tests__/causalCanonicalJson.test.ts src/worldline/__tests__/causalProducerIdentity.test.ts src/worldline/__tests__/causalTransitionIr.test.ts src/worldline/__tests__/causalStore.test.ts src/worldline/__tests__/causalPolicy.test.ts src/worldline/__tests__/causalKernel.test.ts src/worldline/__tests__/causalSessionIsolation.test.ts src/worldline/__tests__/causalAuthorityBoundary.test.ts src/worldline/__tests__/causalRenderBoundary.test.ts src/worldline/__tests__/causalKernelAdverse.test.ts`

Expected: PASS.

- [ ] **Step 3: Run existing Worldline regression tests**

Run: `npm test -- src/worldline/__tests__`

Expected: PASS with no regression in epistemic labeling, research-ledger behavior, world-model evaluation semantics, deterministic branching, or release smoke behavior.

- [ ] **Step 4: Run repository verification**

Run:

```bash
npm run typecheck
npm test
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 5: Update runtime documentation only after verification passes**

Add a `4D Causal Kernel` section to `docs/WORLDLINE_RUNTIME.md` stating:

- the canonical kernel is the sole admission path;
- Transition IR v1 is data-only and deterministic;
- agent-generated mechanisms require explicit promotion before execution;
- independent replay must match before admission;
- canonical and session state are separate;
- renderers operate from immutable envelopes and cannot promote truth;
- production append-only database migration is still not included in this release slice.

- [ ] **Step 6: Record verification evidence**

Create `docs/verification/worldline-4d-causal-kernel-v1.md` with the implementation commit SHA, exact commands from Steps 2–4, pass/fail results, and any known limitations. Do not describe production persistence or deployment as complete.

- [ ] **Step 7: Commit**

```bash
git add src/worldline/__tests__/causalKernelAdverse.test.ts docs/WORLDLINE_RUNTIME.md docs/verification/worldline-4d-causal-kernel-v1.md
git commit -m "test(worldline): verify causal kernel authority boundary"
```

---

## Plan Self-Review

### Spec coverage

- Canonical serialization and SHA-256 commitments: Task 1.
- Canonical contracts and revision lineage: Tasks 2 and 4.
- Harness/JIT producer provenance: Task 2.
- Typed Transition IR and bounded executor: Task 3.
- Append-only storage interface: Task 4; production persistence intentionally remains gated.
- Epistemic and promotion gates: Task 5.
- Transition proposals, independent verifier, deterministic receipts, admission: Task 6.
- Canonical/session state split: Task 7.
- Direct commit-path closure and built-in branch mechanism: Task 8.
- Renderer/projection isolation and render receipts: Task 9.
- Threat-model/adverse verification and documentation: Task 10.

### Deliberate exclusions

This plan does not modify Supabase schemas/RPCs, production persistence, credentials, repository protection, public deployment, or merge authority. Those remain separate Human Authority-gated Work Items under the approved specification.

### Type consistency

The plan uses the same v1 names throughout: `CanonicalRevision`, `TransitionMechanismArtifact`, `TransitionProposal`, `TransitionReceiptCore`, `ProducerIdentityInput`, `CanonicalWorldState`, `WorldlineSessionState`, `RenderEnvelope`, `RenderReceipt`, `deriveProducerId`, `createGenesisRevision`, `createInMemoryCanonicalStore`, `validateTransitionIr`, `executeTransitionIr`, `evaluateMechanismExecutionPolicy`, `validateEpistemicTransition`, `createTransitionProposal`, `admitTransition`, and `createRenderEnvelope`.

### Placeholder and exact-file scan

No `TBD`, `TODO`, `implement later`, or generic "write tests" steps remain. Task 8 is limited to the exact defining module and existing state test because the current GitHub code-search index reports zero indexed `commitSnapshot` call sites; compiler failure is explicitly treated as a blocking verification signal rather than silently broadening scope.

### Execution order

Tasks 1–6 establish a pure causal kernel before touching current application state. Tasks 7–9 migrate authority boundaries only after the kernel exists and is tested. Task 10 verifies the full specification and produces the evidence needed for any later merge decision.
