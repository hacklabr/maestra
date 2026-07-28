# Retro of round R01 — emit-event payload parsing
<!-- Filled at closing (J5 Stage 4/5). The signals below are the
     thermometer of the quality of the previous stages (fluxo 9.4) — and the
     raw material of future consolidation. -->

## Round signals
- **Specification gaps:** 0 — scope was clear (single bug, reproducer described by the facilitator itself during triage).
- **New requirements discovered in Stage 3:** 0 — the fix was as scoped; no behavior added beyond RF-01.
- **Late infeasibilities:** 0.
- **Documentation contradictions (`doc-bug`):** 0 — the fix is defensive normalization; the documented contract (payload validated by zod) is unchanged.
- **Registered overrides:** 1 — variant reclassification (Technical → Minimal) during the triage of #2, on the human's correct observation that a bug with clear scope is Minimal, not a Technical refactoring initiative. Direction: down.
- **Feedback:** 2 process corrections from the human — (a) "Você não deveria estar fazendo uma triagem?" (skipped entry gate, F002); (b) "por que nenhum arquivo foi criado na pasta docs/specs" (missing round folder, F005). Both indicate execution-bias in the facilitator.

## Process learnings
- **Execution-bias is the dominant failure mode observed.** The facilitator skipped the entry gate (F002) AND the round folder creation (F005) for the same root cause: treating a demand as a direct execution command rather than routing it through the flow. Issue #1 (handled in parallel) addresses the entry gate; the round-folder-birth timing needs explicit reinforcement.
- **Tool integration tests miss host serialization.** Unit tests call `execute` directly with objects; the bug (host serializes object args as strings) only surfaces at runtime. Candidate for a future round: integration test tier that simulates the host arg-serialization boundary.
- **`git worktree add` does not init submodules** — known git behavior, but undocumented in the project until now (recorded as deviation 1). Workaround documented.
- **Cross-round consolidation is still on the roadmap** (fluxo 9.5); this round's record is ready for it.

## Closing without reconciliation?
N/A — this round closes WITH reconciliation (normal path). The late round-folder creation is recorded as deviation 2 + dogfooding finding F005, not as closing-without-reconciliation.
