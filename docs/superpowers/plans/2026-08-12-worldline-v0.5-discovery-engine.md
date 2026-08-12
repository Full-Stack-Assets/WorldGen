# Worldline v0.5 Discovery Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing deterministic source-conflict loop into a durable, inspectable Discovery Engine with persistent research receipts, Reality Wake/reopening history, and a Model Worldline visualization.

**Architecture:** Preserve `researchLoop.ts` as the candidate/evaluator core. Add a pure research-ledger schema and parser, then a thin browser storage adapter. Derive model lineage from immutable ledger entries rather than inventing a second graph state. Extend the current recursive UI to save/export/import/reset research history and inspect model ancestry.

**Tech Stack:** React 19, TypeScript 5.7, Vite 6, Vitest, browser localStorage, existing Worldline recursive/provenance modules.

## Global Constraints
- Generator and verifier identities remain distinct.
- A candidate cannot change its deciding evaluation contract.
- Prior source observations cannot be rewritten by Reality Wake or reopening.
- Auto-promotion remains limited to reversible machine-verifiable low-risk classes.
- Architectural/policy/model/scientific-claim changes remain gated.
- Ledger parsing fails closed; corrupt stored JSON cannot silently become canonical history.
- No backend or paid provider required.

---

### Task 1: Durable research ledger

**Files:**
- Create: `src/worldline/researchLedger.ts`
- Create: `src/worldline/__tests__/researchLedger.test.ts`

**Interfaces:**
- `ResearchLedgerEntry` union for `OBSERVATION`, `ANOMALY`, `HYPOTHESIS`, `EXPERIMENT`, `VERIFICATION`, `PROMOTION`, `REALITY_WAKE`, `REOPEN`.
- `ResearchLedger { schemaVersion: 'worldline-research-ledger-v0.5'; entries: ResearchLedgerEntry[] }`.
- `createResearchLedger()`.
- `appendResearchCycle(ledger, cycle)`.
- `serializeResearchLedger(ledger)` / `parseResearchLedger(text)`.

- [ ] Write failing tests for deterministic round-trip, immutable append, distinct generator/verifier receipt, and corrupt JSON rejection.
- [ ] Implement the minimal ledger types/parser/serializer/append functions.
- [ ] Verify focused tests, typecheck, full tests, build.

### Task 2: Reality Wake and reopening records

**Files:**
- Modify: `src/worldline/researchLoop.ts`
- Test: `src/worldline/__tests__/researchLoop.test.ts`

**Interfaces:**
- Add `RealityWakeRecord` carrying previousObservationId, incomingObservationId, affectedCandidateIds, message.
- Add `ReopenRecord` carrying decisionId, reason, triggeringObservationId.
- Add `reopenResearchDecision(cycle, reason, triggeringObservationId)` as a pure function.

- [ ] Write failing tests proving prior observation/source values remain unchanged after Reality Wake and reopening.
- [ ] Implement records and pure reopening helper.
- [ ] Verify focused and full suites.

### Task 3: Browser research storage

**Files:**
- Create: `src/worldline/researchStorage.ts`
- Create: `src/worldline/__tests__/researchStorage.test.ts`

**Interfaces:**
- `RESEARCH_STORAGE_KEY = 'worldline.research-ledger.v0.5'`.
- `loadResearchLedger(storage)` returns `{ ledger, warning }` and falls back to an empty ledger when missing/corrupt while surfacing a warning.
- `saveResearchLedger(storage, ledger)`.
- Storage interface uses only `getItem`, `setItem`, `removeItem` for testability.

- [ ] Write failing in-memory storage tests.
- [ ] Implement safe load/save/reset behavior.
- [ ] Verify focused/full suites.

### Task 4: Model Worldline derivation

**Files:**
- Create: `src/worldline/modelWorldline.ts`
- Create: `src/worldline/__tests__/modelWorldline.test.ts`

**Interfaces:**
- `ModelWorldlineNode { id, kind, label, status, parentIds }`.
- `deriveModelWorldline(ledger)`.
- Result must answer observation origin, failed/promoted candidate, deciding evaluator, verifier, and reopen state using ledger data only.

- [ ] Write failing lineage tests.
- [ ] Implement deterministic node/edge derivation.
- [ ] Verify focused/full suites.

### Task 5: Discovery Engine UI

**Files:**
- Create: `src/components/worldline/ResearchPanel.tsx`
- Create: `src/components/worldline/ModelWorldlinePanel.tsx`
- Modify: `src/components/worldline/RecursiveLoopPanel.tsx`
- Modify: `src/components/worldline/MechanicsPanel.tsx`
- Modify: `src/components/worldline/worldline-v02.css`

**Behavior:**
- Running the source-conflict experiment appends its immutable receipts to the ledger.
- UI shows cycle count, last promotion decision, frozen evaluator, verifier, Reality Wake, and Model Worldline nodes.
- Export downloads ledger JSON; import accepts text/file through browser UI without a server; reset requires explicit click.
- Corrupt stored ledger produces a visible warning and starts a new empty working ledger without claiming history was recovered.

- [ ] Add component/pure-helper tests for exposed research statuses where practical.
- [ ] Implement local state/storage wiring.
- [ ] Preserve the existing recursive-cycle demonstration and evidence copy.
- [ ] Verify accessibility labels and responsive layout.
- [ ] Run full verification.

### Task 6: v0.5 release gate

**Files:**
- Create: `docs/WORLDLINE_V0.5.md`
- Modify: `README.md`

- [ ] Document durable local ledger, Model Worldline, Reality Wake/reopening semantics, and corruption behavior.
- [ ] Run exact-head CI.
- [ ] Inspect PR diff/status and merge only exact green head.
- [ ] Verify main CI.
- [ ] Verify GitHub Pages build/deploy.

## v0.5 acceptance
1. A complete deterministic source-conflict cycle can be stored as immutable research receipts.
2. Ledger JSON round-trips deterministically and corrupt input fails closed.
3. Generator and verifier identities remain distinct in persisted receipts.
4. Reality Wake and reopening never rewrite earlier observation records.
5. Model Worldline exposes observation → candidate → verification → promotion/reopen ancestry.
6. Research history persists locally and can be exported/reset.
7. Exact-head CI, main CI, and Pages deploy complete successfully.