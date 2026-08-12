# Worldline v0.5 — Discovery Engine

Worldline v0.5 turns the v0.2 recursive research demonstration into durable, inspectable research history.

## Core changes

- Added `worldline-research-ledger-v0.5`, an immutable append-oriented local research ledger.
- A completed source-conflict cycle is persisted as observation, anomaly, hypothesis, frozen experiment/evaluator, verification, promotion, and Reality Wake receipts.
- Generator and verifier identities remain distinct in stored receipts.
- Ledger JSON round-trips deterministically and corrupt stored history fails closed with a visible warning instead of being silently repaired or treated as trustworthy history.
- Local browser persistence uses `localStorage`; no backend is required.
- Research history can be exported/imported as JSON and reset only through an explicit action.
- Added Reality Wake records carrying both previous and incoming evidence values.
- Added explicit reopening records. Reopening a decision appends a new receipt and does not mutate the earlier cycle.
- Added a Model Worldline projection derived only from the research ledger, showing observation → hypotheses → verification → promotion → Reality Wake/reopen ancestry.

## Constitutional boundary

The deciding evaluation contract is frozen before candidate selection. Candidates that attempt evaluator drift fail verification. The candidate generator and verifier are separate identities. Automatic promotion remains limited to reversible machine-verifiable low-risk rendering/data-normalization candidates; architecture, policy, model, benchmark, authority, and scientific-claim changes remain gated.

## Reality Wake

A new accepted observation may change which represented futures remain consistent with current evidence. Worldline records this as:

> The set of futures consistent with current evidence changed.

It does not claim that reality or “the future” was rewritten.

## Failure behavior

Corrupt local ledger JSON is preserved until the user explicitly resets it. Worldline starts a new empty working ledger and surfaces the corruption warning rather than claiming recovery. Import parsing also uses the strict v0.5 schema.

## Release gate

v0.5 is accepted only after the exact branch head passes type-check, the full test suite, production build, merge-to-main CI, and GitHub Pages deployment.