# Worldline 2.0 · Worldline Studio

Worldline 2.0 turns the v1 observatory into a persistent full-stack simulation studio while preserving the original evidence boundary: generated and simulated state must never masquerade as observed reality.

## Production

Canonical production domain: **https://nowfable.com**

Full-stack fallback origin: **https://worldline-production.onrender.com**

The Node service on Render is the canonical application runtime. GitHub Pages remains a static fallback artifact rather than the primary production target.

## Major additions

- Versioned Worldline Studio projects with durable local/offline state and remote production persistence.
- Explicit intervention objects and deterministic experiment sessions.
- Future Families and baseline-to-scenario comparison without probability claims.
- Portable, credential-sanitized Worldpacks.
- Full-stack Node production service backed by a dedicated Supabase production database.
- Free-first Earth/provider architecture with procedural fallback and explicit provider status.
- Durable recursive research receipts, Reality Wake/reopen semantics, frozen evaluator identity, and independent verification.
- Champion/challenger improvement memory with deterministic experience replay and rollback receipts.
- Typed recursive skill compression that factors repeated workflows while preserving rare obligations.
- World Model Lab in Mechanics with research-reference entries for Genie 3 and NVIDIA Cosmos 3.
- Shared world-model evaluation receipt schema based on the four top-level 4DWorldBench dimensions: Perceptual Quality, Condition-4D Alignment, Physical Realism, and 4D Consistency.
- Chronos and Cosmos surfaces remain explicit about fictional, generated, reconstructed, observed, and simulated state.

## Persistence security boundary

The browser does not receive database write authority. Studio persistence follows this path:

`browser → same-origin /api/* → Render Node backend → token-authenticated Supabase RPC gateway → Worldline tables`

The public Supabase credential is used only to invoke the gateway through PostgREST. The raw backend authorization token exists only in the Render service environment; the database stores only a cryptographic digest for comparison. Direct anonymous table access is not part of the intended production contract.

CI verifies that `server.mjs` uses the RPC gateway and rejects reintroduction of direct REST access to the Worldline persistence tables. The gateway exposes only the operations required by Studio project persistence: health, project listing, deterministic project synchronization, and project deletion.

## Research-source synthesis

The v2 research architecture was informed by saved Omphalis sources for Worldline, 4DWorldBench, Genie 3, NVIDIA Cosmos 3, SelfLLM, SkillZip, and Temporal Drift. See `docs/WORLDLINE_OMPHALIS_SYNTHESIS.md` for the source-grounded mapping and limitations.

## Evidence boundary

Worldline 2.0 does not claim:

- calibrated forecasting or probability from Future Landscape geometry;
- a validated municipal digital twin;
- a connected Genie 3 or NVIDIA Cosmos 3 runtime;
- a 4DWorldBench score unless an actual benchmark run produces an executed evidence receipt;
- unrestricted autonomous self-training;
- a shipped Unreal Chronos companion runtime;
- real time travel or physical Chronos effects.

The governing invariant is:

> Visual and model capability claims may never outrun the executed evidence attached to the active Worldline state.

## Schemas

- `worldline-state-v1`
- `worldline-project-v2`
- `worldline-experiment-v2`
- `worldline-worldpack-v2`
- `worldline-research-ledger-v0.5`
- `worldline-chronos-v0.7`
- `worldline-skill-compression-v2`
- `worldline-improvement-memory-v2`

## Production architecture

Canonical application source is `Full-Stack-Assets/WorldGen` on `main`.

Production is a Node web service with server-side persistence through the dedicated **Worldline v2 Production** Supabase project. The custom domain `nowfable.com` is the canonical public origin. Static Pages output is retained as a fallback artifact rather than the canonical full-stack target.
