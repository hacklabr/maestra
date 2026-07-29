# J4 — Stage 2 Conduction: Technical Design and Decomposition

> Source: docs/referencia/jornadas.md v2.4 (§6 J4) + fluxo-de-desenvolvimento.md §7 · Module version: 2 — 2026-07-28
> Anti-drift: module derived from the source; divergence is a finding, never a silent adjustment.
> Changelog: v1 — initial version (T9): assessment in the act, ADR uniqueness, triage pendings, "executable without questions" self-test, human overview, wave with reconciliation. v2 — J9 mention as ad-hoc path before ADR when decision touches multiple domains (anti-ambiguity with single-domain ADR trigger). v3 (issue #15) — Stage 3: variant-aware granularity table (Minimal = no daughters, Condensed = independently deliverable only, Full = maximal) + coupling test before decomposition (closes F001, F017).

**Trigger:** Stage 1 gate met (via J2 or end of J3). **Persona:** Tech Lead — full technical vocabulary is welcome here; accessibility is inverted and the end overview translates back. With experts, wrong ARGUED derived state erodes trust: always falsifiable statement, never verdict.

## STAGE 1 — Feasibility assessment

Analyze the living PRD + the round's `scope.md`. Register the assessment **as a comment in the act, with date** — approving, or with documented objections. Late assessment (vs. PRD date) is a process signal for the retrospective.

Infeasible, risky or cost well above expected → **J7** (`j7-feedback.md`). **Never silent absorption** (kernel trigger #7): "solving on your own" is the named violation — the more capable you feel to solve, the more the rule applies. A problem hidden in Stage 2 explodes in Stage 3, where it costs more.

## STAGE 2 — Technical design and decisions (living documents + ADRs)

- Architecture / data model / contracts → `docs/reference/` **updated in place**. Condensed: fit analysis with the current architecture + impact/regression analysis **mandatory**. Minimal: technical comment on the issue itself (approach, what will be touched, decisions).
- **ADR only if new decision with lasting consequence** — ask yourself this before proposing (ADR by habit = empty ceremony; ADR omitted when due = lost decision). Format: context / decision / consequences, with **Status** and **Round** (template in `reference/protocols.md`).
- **Uniqueness checkpoint:** before creating an ADR, verify if there is a current one on the same subject (search in `docs/decisions/adr/`). If the decision replaces, the old one gets `Replaced by ADR-NNN` **in the same commit**. Never two current on the same subject.
- **Panel before ADR (J9, ad-hoc):** if the decision touches multiple domains (e.g., performance + security + data model), you MAY suggest a discussion panel (`journeys/j9-panel.md`) before writing the ADR — the panel synthesis and the ADR text are the same text (J9 STAGE 3). Single-domain decision → ADR directly, no panel. "Proceed without" is always a visible option; zero mandatory panels at fixed points.
- **Technical pendings from triage close here:** verify in code (schema, hooks, consumers). Confirmed → trigger **J10** automatically (`j10-reclassification.md`), as declared in triage — it is no surprise to anyone.

## STAGE 3 — Decomposition into parallelizable tasks

**Variant-aware granularity — the wave size depends on the variant:**

| Variant | Decomposition | Rationale |
|---|---|---|
| **Minimal** | **No daughter tasks** — the flow runs entirely in a single issue. Creating daughter tasks in Minimal is the F001 violation. | Single issue is artifact and task at once. |
| **Condensed** | Decompose only into tasks that are **independently deliverable**. Default to fewer, coarser tasks. "One task per file" is over-decomposition when the changes are coupled. | Condensed = less ceremony, not maximal parallelization. |
| **Full** | Maximal decomposition with declared boundaries (distinct files/modules), each task independently deliverable by a different person. | Full assumes a larger team and genuinely independent changes. |

**Coupling test (run before decomposing):** for each proposed task pair, ask: *"Does it make sense to execute one without the other? Can one be delivered and reviewed independently?"* If the answer is **no** for all pairs → they are one task, not two. The coupling test is what prevents the F017 violation (6 parallel tasks for changes that only make sense together).

Implementation tasks (template 11.1 in `reference/protocols.md`), each with: referenced RFs/RNFs, out of scope OF THE TASK, acceptance criteria copied from the living PRD, **declared boundaries** (distinct files/modules — conflict-free parallelization is a criterion of the briefing).

**Kernel trigger #5 — the sharpest criterion of the flow: executable task without questions.** Re-read each task as an external dev who did not participate in the conversation; if YOU would have a question, the task goes back. Bidirectional coverage: every RF/RNF of `scope.md` has ≥1 task; every task references ≥1 RF/RNF.

## STAGE 4 — Human overview and gate (Stage 3 wave)

- **Non-technical-readable overview:** what, why, what changes for the product, what was left out — P1 human layer + pointers to the technical artifacts. **It is not a summarized TDD.** Test: a non-technical person reads it and answers "what was decided and why" without an explanation session.
- Gate verified (daughters one by one via digest + existing artifacts) → P7 distribution (microcopy §7.6) → **Stage 3 wave MANDATORILY INCLUDING the reconciliation task**, with confirmed assignee like any other → gate comment (microcopy §7.1) → metadata (`Current stage: stage-3`) → board.
- **Reconciliation is announced in the handoff** (microcopy §7.10 Stage 2→3), never a surprise at the end.

## Journey success criteria

- Assessment registered with date; artifacts in the correct locations with the right class; ADRs with status; triage pendings closed (or J10 triggered).
- 100% of tasks executable without questions, with boundaries and bidirectional coverage RF↔task.
- Overview comprehensible by non-technical; Stage 3 wave includes reconciliation with confirmed owner.
