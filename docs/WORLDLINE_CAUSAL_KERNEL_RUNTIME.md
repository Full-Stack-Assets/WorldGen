# Worldline 4D Causal Kernel Runtime Status

Date: 2026-08-27  
Status: implementation slice on `impl/worldline-4d-causal-kernel`  
Governing design: `docs/superpowers/specs/2026-08-27-worldline-4d-causal-kernel-design.md`

## Implemented causal-kernel boundary

This implementation introduces the pure TypeScript causal-kernel foundation without changing production database persistence.

Implemented primitives include:

- `CanonicalWorldState` and `WorldlineSessionState` with a compatibility split from legacy `WorldlineState`;
- deterministic canonical JSON serialization and SHA-256 content commitments;
- content-addressed `CanonicalRevision` objects and an append-only in-memory `RevisionStore`;
- deterministic, bounded Transition IR v1 with explicit read/write sets;
- trusted mechanism-approval, producer-identity, verifier-independence, and Human Authority verification dependencies;
- deterministic candidate execution and independently configurable replay verification;
- fail-closed promotion decisions: `ACCEPTED`, `REJECTED`, or `HUMAN_REQUIRED`;
- deterministic producer identity derived from model/harness/memory/tool/skill/runtime provenance;
- deterministic transition-receipt core hashing and tamper verification;
- immutable renderer-facing `RenderEnvelope` objects and downstream `RenderReceipt` provenance.

The unused legacy `commitSnapshot(state, snapshot)` direct-write API has been removed. No replacement unchecked canonical-state setter is exposed by `src/worldline/kernel/`.

## Authority model

Proposal producers do not receive canonical write capability. A mechanism that merely claims `APPROVED_EXECUTABLE` is insufficient: `admitTransition` requires an external trusted mechanism-approval verifier. Producer identities are also resolved through a trusted identity boundary, and the verifier must be independently resolved from the proposal producer.

Execution-level Human Authority is separate from mechanism approval. A human-gated execution remains outside canonical truth until a trusted execution-approval verifier accepts the specific approval reference for the mechanism, proposal, and base revision.

Generic Transition IR cannot promote `OBSERVED` or `RECONSTRUCTED` truth. Those classes remain reserved for the dedicated evidence-ingest path described by the governing design.

## Renderer boundary

Renderers receive only immutable, hash-bound projections of canonical state. The rendering contract contains no `RevisionStore`, admission callback, database credential, or state-mutation capability. Render receipts bind outputs to the source revision, source-state hash, projection digest, renderer identity/version, prompt/config digest, and optional render seed.

A renderer output is a derived artifact. It cannot become canonical evidence or state without re-entering the governed proposal/evidence pipeline.

## Current migration limitation: Futures branch creation

The current Worldline Futures UI still calls the legacy deterministic `createBranch(state, ...)` compatibility helper over `WorldlineState`. That function is explicitly **not** a causal-kernel canonical-admission API.

This means the present branch implements the causal-kernel foundation, state/session adapter, direct-snapshot-commit closure, and renderer boundary, but it is **not yet the final application-wide single-write-path migration**.

The next Stage C implementation must migrate the Futures UI so `createBranch` becomes either:

1. an approved built-in branch-creation mechanism admitted through `admitTransition`; or
2. a compatibility wrapper that emits a branch-creation `TransitionProposal` and materializes the admitted revision back into the current UI state adapter.

Until that migration lands, claims that every durable Worldline UI mutation is already kernel-mediated would be incorrect.

## Persistence boundary

Production Studio persistence remains unchanged in this implementation slice. Dedicated append-only revision, mechanism, proposal, approval, transition-receipt, and render-receipt persistence remains Stage E and requires a separate database design, migration verification, rollback plan, and Human Authority approval.

## Verification expectations

This slice is expected to satisfy:

- deterministic genesis and revision hashing;
- deterministic mechanism hashing;
- deterministic producer identity, including harness-change sensitivity;
- fail-closed stale-base, authority, identity, read/write-set, replay, epistemic-uplift, and receipt-integrity checks;
- renderer non-mutation;
- session/view changes leaving canonical state hashes unchanged;
- removal of the unused unchecked snapshot-commit API;
- repository typecheck, test, and build gates when the GitHub Actions runner is available.

The governing rule remains: **proposal producers propose, the trusted kernel admits, renderers depict, verifiers prove, and Canon preserves authority and receipts.**
