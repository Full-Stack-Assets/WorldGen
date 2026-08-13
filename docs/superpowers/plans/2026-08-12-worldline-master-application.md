# Worldline Master Application Implementation Plan — Archived

This document is retained as a historical pointer for the original Worldline master-application build that began from the WorldGen React/Three.js runtime.

The original plan has been superseded by the implemented and verified release train:

- `docs/WORLDLINE_RUNTIME.md` — current runtime and evidence contract
- `docs/WORLDLINE_V1.0.md` — Worldline One release boundary
- `docs/WORLDLINE_V2.0.md` — Worldline Studio full-stack production release
- `docs/WORLDLINE_OMPHALIS_SYNTHESIS.md` — source-grounded world-model and recursive-improvement synthesis

Current governing principles remain:

- canonical state is provider-independent;
- visualization never mutates committed simulation state;
- observed, reconstructed, simulated, generated, and speculative state remain distinct;
- world-model and benchmark capability claims require executed evidence receipts;
- recursive improvement uses frozen evaluators, independent verification, bounded promotion, replay, and rollback;
- the application must remain usable when optional external providers are unavailable;
- the canonical public production origin is `https://nowfable.com`.

For implementation status, deployment architecture, schemas, and current acceptance boundaries, use the documents above and the source on `main` rather than this archived planning artifact.
