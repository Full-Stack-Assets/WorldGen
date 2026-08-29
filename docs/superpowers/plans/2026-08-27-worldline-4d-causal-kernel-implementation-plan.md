# Worldline 4D Causal Kernel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` for inline execution. Follow test-driven development for every behavior change.

**Goal:** Implement the first Worldline causal kernel so canonical world truth is append-only, deterministic, replay-verifiable, provenance-backed, and structurally isolated from proposal producers and renderers.

**Architecture:** Introduce a narrow-waist causal kernel around a typed Transition IR and append-only canonical revisions. Split durable canonical state from session/render state, route all canonical mutation through a transition-admission pipeline, and keep proposal producers and renderers downstream of that gate. Implement incrementally: contracts and hashing first, then migration shims, then the admission pipeline, renderer isolation, and adverse verification.

**Tech Stack:** TypeScript, Vitest, existing WorldGen/Worldline codebase, local deterministic JSON canonicalization, Web Crypto compatible SHA-256 helpers, existing CI.

**Spec:** `docs/superpowers/specs/2026-08-27-worldline-4d-causal-kernel-design.md`

## Global Constraints

- Canonical truth is admitted only by the deterministic causal kernel.
- AI coding agents may propose versioned Transition IR mechanisms but may not directly mutate canonical state.
- Generated or repaired harnesses are provenance-bearing producer artifacts, not authority.
- Generative renderers consume immutable `RenderEnvelope` objects and cannot write canonical truth.
- Every accepted revision is append-only, content-addressed, causally linked, independently replayed, and receipt-backed.
- `OBSERVED` and `RECONSTRUCTED` truth cannot be promoted from generative output alone.
- Merge revisions are out of scope for v1.
- Arbitrary AI-generated code is not admitted into the canonical executor in v1.
- Transition IR v1 is the only executor kind admitted in v1.
- No production deployment, database migration, or merge to `main` is permitted under this plan without later Human Authority approval.

## Plan correction after repository review

`src/worldline/index.ts` does not exist in the current repository. Do not create a second worldline-wide barrel solely for this feature. The kernel exposes `src/worldline/kernel/index.ts`; existing consumers import from that boundary directly.

## Planned files

Create:
- `src/worldline/kernel/types.ts`
- `src/worldline/kernel/canonicalize.ts`
- `src/worldline/kernel/hash.ts`
- `src/worldline/kernel/prng.ts`
- `src/worldline/kernel/invariants.ts`
- `src/worldline/kernel/transitionIr.ts`
- `src/worldline/kernel/revisionStore.ts`
- `src/worldline/kernel/migrateState.ts`
- `src/worldline/kernel/admission.ts`
- `src/worldline/kernel/projection.ts`
- `src/worldline/kernel/index.ts`
- focused tests under `src/worldline/__tests__/`

Modify:
- `src/worldline/types.ts`
- `src/worldline/state.ts` only where compatibility/migration requires it
- `src/worldline/promotionPolicy.ts`
- `docs/WORLDLINE_RUNTIME.md`

## Task 1 — Canonical kernel contracts

Create the typed contracts for canonical revisions, mechanisms, proposals, producer identity, transition receipts, render envelopes, render receipts, digest types, and promotion/decision enums.

TDD cycle:
1. Add failing contract tests.
2. Verify CI fails because `kernel/types.ts` is absent.
3. Add the minimal types.
4. Verify CI passes.

Commit: `feat: add worldline causal kernel contracts`

## Task 2 — Canonicalization and hashing

Implement deterministic canonical JSON normalization and SHA-256 helpers.

Tests must prove:
- object-key ordering is stable;
- negative zero normalizes to zero;
- unsupported/non-canonical values are rejected;
- semantically identical canonical values hash identically.

Commit: `feat: add canonical serialization and hashing`

## Task 3 — Deterministic PRNG and Transition IR validation

Implement a versioned deterministic PRNG and Transition IR v1 validation.

Allowed operations:
- `SET`
- `INCREMENT`
- `APPEND_UNIQUE`
- `TOMBSTONE`
- `ASSERT`
- `LINK_CAUSE`

Tests must prove same-seed replay and rejection of unsupported operations or undeclared read/write paths.

Commit: `feat: add deterministic prng and transition ir validation`

## Task 4 — Canonical/session split and migration helpers

Introduce `CanonicalWorldState` and `WorldlineSessionState`. Add migration helpers that preserve durable worlds/branches while moving active world/branch, selected year, and time-view state into session state.

Keep current runtime compatibility; do not remove existing `WorldlineState` consumers in this first slice.

Commit: `feat: split canonical and session worldline state`

## Task 5 — Append-only revision store

Implement the v1 in-memory append-only revision store and genesis revision creation.

Tests must prove:
- genesis revisions are content-addressed;
- revisions can be retrieved by revision ID;
- an existing revision ID cannot be replaced;
- branch head updates only advance to admitted descendants.

Commit: `feat: add append-only revision store`

## Task 6 — Invariants and transition approval policy

Implement core invariant checks and causal-kernel promotion policy.

Rules:
- every new mechanism version is human-gated before `APPROVED_EXECUTABLE`;
- ambiguous policy returns `HUMAN_REQUIRED`;
- non-low-risk execution returns `HUMAN_REQUIRED`;
- attempts to auto-promote `OBSERVED` or `RECONSTRUCTED` state return `HUMAN_REQUIRED`;
- low-risk deterministic simulated/generated execution may auto-admit only after every gate passes.

Commit: `feat: add kernel invariants and transition approval policy`

## Task 7 — Transition-admission pipeline

Implement the fixed admission order:
1. base revision lookup and branch-head freshness;
2. mechanism approval and digest checks;
3. proposal/input integrity checks;
4. Transition IR validation;
5. declared read/write-set enforcement;
6. deterministic execution;
7. canonical state hash;
8. invariant checks;
9. independent replay and hash equality;
10. promotion-policy evaluation;
11. receipt creation;
12. append accepted revision or return `REJECTED` / `HUMAN_REQUIRED`.

Commit: `feat: add transition admission pipeline`

## Task 8 — Renderer isolation and render receipts

Implement deterministic projection + immutable renderer-facing envelopes and render receipts tied to source revision/projection digests.

No renderer interface receives a revision-store mutation capability.

Commit: `feat: add renderer isolation envelopes and receipts`

## Task 9 — Adverse fail-closed verification

Add tests proving the kernel fails closed for:
- stale/missing base revision;
- proposal mechanism mismatch;
- invalid input hash;
- undeclared read/write paths;
- unapproved mechanism;
- replay hash mismatch;
- epistemic escalation;
- renderer mutation attempts.

Commit: `test: enforce fail-closed causal kernel adverse cases`

## Task 10 — Documentation and full verification

Export the kernel from `src/worldline/kernel/index.ts`; document append-only revisions, proposal-producer isolation, renderer isolation, and replay verification in `docs/WORLDLINE_RUNTIME.md`.

Required final CI gates:
- `npm run typecheck`
- `npm test`
- `npm run build`
- provider-neutral tracked-state check
- backend persistence-boundary check

Commit: `docs: finalize worldline causal kernel integration`

## Self-review

- Spec coverage is complete for the scoped v1 kernel.
- No unowned `TODO` or `TBD` placeholders remain.
- Database persistence, merge revisions, arbitrary generated code execution, and deployment remain intentionally excluded.
- Implementation remains reversible on a dedicated branch and may not merge without later Human Authority approval.
