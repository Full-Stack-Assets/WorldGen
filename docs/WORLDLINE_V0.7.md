# Worldline v0.7 — Chronos + Cosmos

Worldline v0.7 makes the system experiential as well as analytical, while expanding the Cosmos catalog and preserving strict evidence/rendering separation.

## Chronos Paradigm browser slice

A new secondary **CHRONOS** control opens a bounded browser arena driven by a pure deterministic gameplay kernel.

The arena supports:
- recorded movement samples;
- **Anchor**, which commits the current sample boundary;
- **Echo**, which replays the exact post-anchor samples rather than spawning an AI-controlled duplicate;
- deterministic spatial **Convergence** detection;
- fixed-state **Reset**;
- keyboard and onscreen controls;
- distinct current-worldline, anchor, and Echo rendering.

Chronos state is local experiential state and does not mutate the active canonical Worldline branch or snapshots.

The arena permanently labels itself as a **fictional gameplay mechanic inspired by worldline/spacetime concepts**. It does not claim that Anchor/Echo/Convergence abilities are experimentally verified relativity.

## Cosmos expansion

The v0.7 catalog includes:
- WorldGen Prime;
- New Bedford / Earth;
- Moon;
- Mars;
- Venus;
- Europa;
- Titan;
- three explicit Asterion speculative variants: thin, temperate, and dense atmosphere scenarios.

Observed celestial identity and rendered local surface are separate fields. Moon, Mars, Venus, Europa, and Titan remain `OBSERVED` identities while the current browser-local surface class is explicitly `GENERATED`.

Planetary state can now include mass relative to Earth, terrain-source status, rendered-surface class, radius, rotation/orbit periods, atmosphere/pressure descriptions, radiation/illumination context, light-time, reference frame, evidence references, and multiple habitability dimensions.

NASA reference material informs descriptive physical-state metadata for the named Solar System bodies; Worldline does not claim that the current procedural browser scenes are measured planetary terrain.

## Exoworld families

Asterion is intentionally synthetic. Rather than rendering one invented planet as authoritative, Worldline exposes three variants in one `asterion-family`, each explicitly `SPECULATIVE`.

## Chronos Bridge v0.7

The runtime-neutral export schema is now `worldline-chronos-v0.7`. It preserves:
- world identity and epistemic class;
- rendered-surface class;
- family/variant identity;
- spatial/reference-frame metadata;
- terrain-source status;
- selected time;
- branch ancestry;
- events/snapshots/metrics;
- deterministic seeds;
- replay commitment.

The bundle remains provider-independent and does not imply a shipping Unreal/Cesium runtime.

## Release gate

v0.7 is accepted only after the exact branch head passes type-check, full tests, production build, merge-to-main CI, and GitHub Pages deployment.