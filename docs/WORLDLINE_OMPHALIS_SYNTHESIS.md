# Worldline v2 · Omphalis World-Model Synthesis

This document records a source-grounded synthesis of the Omphalis library items most relevant to Worldline v2. It distinguishes **ideas adopted into Worldline architecture** from **external capabilities that are not integrated**.

## Sources reviewed

1. **WorldGen / Worldline 1.0** — https://github.com/Full-Stack-Assets/WorldGen
2. **4DWorldBench** — https://github.com/Full-Stack-Assets/4dworldbench_code
3. **Genie 3** — https://deepmind.google/models/genie/
4. **Develop Physical AI Reasoning, World, and Action Models with NVIDIA Cosmos 3** — https://developer.nvidia.com/blog/develop-physical-ai-reasoning-world-and-action-models-with-nvidia-cosmos-3
5. **SelfLLM: A Recursively Self-Improving Foundation Language Model** — https://github.com/Full-Stack-Assets/SelfLLM
6. **SkillZip: Evaluation-Free Skill Compression for Self-Evolving Agents by Discovering Reusable Structure** — https://arxiv.org/abs/2608.11079
7. **BTTF Temporal Drift** — https://github.com/Full-Stack-Assets/Temporal-Drift

Omphalis' existing graph already connected Worldline with Genie 3, Temporal Drift, and 4DWorldBench; 4DWorldBench was also connected with Genie 3, Cosmos 3, and SelfLLM. The implementation below treats those connections as research relationships, not evidence that the systems interoperate.

## Synthesis

### 1. Genie 3 → interaction and memory target

The saved Genie 3 source describes a general-purpose interactive world model with real-time generation, text-conditioned exploration, photorealistic output, revisited-detail consistency, promptable world events, and Street View grounding. The same source also describes important limits, including minute-scale rather than hour-scale experiences and limitations around exact location accuracy.

Worldline adopts the **interaction contract**, not the model claim:

- a future world-model adapter may expose real-time generation;
- revisited world details require an explicit memory/consistency contract;
- promptable events are modeled as controllable interventions, never hidden mutations;
- grounded and generated state remain separate epistemic classes;
- Genie 3 remains `REFERENCE_ONLY` until a real adapter executes.

### 2. Cosmos 3 → reasoner / generator / action architecture

The saved Cosmos 3 source describes a unified physical-AI model with a reasoner tower and a generator tower, supporting physical reasoning, future observation generation, action-conditioned world modeling, and action generation. It also describes open physical-AI datasets and a human-evaluation framework based on atomic binary fact verification.

Worldline adopts the **adapter decomposition**:

`OBSERVATION → REASON → GENERATE WORLD CANDIDATE → ACTION CANDIDATE → VERIFY → COMMIT / REJECT`

No Cosmos model, checkpoint, NIM, benchmark score, or NVIDIA-reported result is inherited by Worldline. Cosmos 3 remains `REFERENCE_ONLY` until a separate adapter is implemented and executed.

### 3. 4DWorldBench → common evaluation spine

The saved 4DWorldBench source defines four high-level evaluation dimensions:

- Perceptual Quality
- Condition-4D Alignment
- Physical Realism
- 4D Consistency

Worldline now uses those four dimensions as the common schema for future world-model evaluation receipts. This does **not** mean Worldline has executed 4DWorldBench. A receipt remains `NOT_EXECUTED` with `scores = null` until an actual evaluation run produces evidence.

This preserves the v1 rule: **adapter readiness is not benchmark success**.

### 4. SelfLLM → replay and rollback mechanics

The saved SelfLLM source describes recursive self-training with experience replay and automatic rollback when an iteration degrades performance.

Worldline does not adopt unrestricted self-training. It adopts two bounded mechanics inside the existing B+ constitutional loop:

- **champion retention** — a degraded challenger does not replace the current champion;
- **deterministic experience replay** — prior high-value cases can be carried into later evaluations in stable order;
- **rollback receipts** — a failed reversible challenger records the champion to which the system returns.

Architecture, policy, scientific claims, evaluator changes, and non-reversible model changes remain outside automatic promotion.

### 5. SkillZip → recursive procedure compression

The saved SkillZip abstract frames agent skills as typed contracts rather than flat prose and proposes the principle **explain once, reference many**, while preserving rare exceptions under a hard coverage constraint.

Worldline adopts that principle for recursive procedures:

- identical repeated workflows are factored into one shared procedure;
- triggers, tool requirements, obligations, and output fields remain typed residuals;
- rare one-off restrictions remain explicit;
- a coverage check must reconstruct every typed contract before compression is considered valid;
- Zip-on-Write recomputes the compact structure when a new skill patch arrives.

The first Worldline compressed procedure covers repeated `freeze evaluator → generate candidates → independent verification → write immutable receipt` behavior while preserving the restricted-source rule that such material never enters an autonomous training loop.

### 6. Temporal Drift → era/runtime discipline

The saved Temporal Drift source describes a real Unreal vertical-slice scaffold with deterministic world-building, era dressing, time-travel runtime systems, validators, and automation. It is also explicit that some documentation remains forward-looking and that source/runtime code is the best evidence of what actually works.

Worldline adopts this **implementation-evidence discipline** for Chronos and future high-end runtimes:

- era changes should be deterministic state layers, not visual-only storytelling;
- every era/world build should have validators;
- generated content and runtime code must be distinguishable from target-state design docs;
- browser Chronos remains a fictional deterministic interaction layer;
- a future Unreal companion runtime must share Worldline state through an explicit interchange contract rather than being represented as already shipped.

## Implemented in this synthesis branch

- `src/worldline/worldModelRegistry.ts`
  - Genie 3 and Cosmos 3 reference entries;
  - explicit `REFERENCE_ONLY` integration status;
  - shared 4DWorldBench-derived evaluation dimensions;
  - no-score-before-execution receipt semantics.

- `src/worldline/skillCompression.ts`
  - typed skill patches;
  - shared procedure factoring;
  - residual obligations;
  - hard reconstruction coverage;
  - Zip-on-Write update path.

- `src/worldline/improvementMemory.ts`
  - champion/challenger memory;
  - deterministic experience replay;
  - promotion, rollback, and approval-gated decisions.

- `src/worldline/researchLoop.ts`
  - integrates improvement memory into the existing frozen-evaluator research cycle;
  - exposes a compressed recursive procedure topology.

- `src/components/worldline/WorldModelReferencePanel.tsx`
  - exposes reference architectures and the evaluation spine in Mechanics;
  - explicitly states that no external model is connected.

## Not claimed or integrated

This synthesis does **not** claim:

- a Genie 3 API or runtime integration;
- access to Genie 3 weights;
- Cosmos 3 model deployment or NIM execution;
- 4DWorldBench execution or a benchmark score;
- autonomous SelfLLM training inside Worldline;
- validated general physical simulation from generated video;
- a shipped Unreal Chronos runtime;
- real time travel or physical Chronos effects.

The governing invariant remains:

> **Visual and model capability claims may never outrun the executed evidence attached to the active Worldline state.**
