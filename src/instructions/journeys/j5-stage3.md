# J5 — Stage 3 Conduction: Execution, Acceptance and Reconciliation

> Source: docs/referencia/jornadas.md v2.1 (§6 J5, §7.11) + fluxo-de-desenvolvimento.md §8, §9, §10 · Module version: 1 — 2026-07-28
> Anti-drift: module derived from the source; divergence is a finding, never a silent adjustment.
> Changelog: v1 — initial version (T9): worktree, deviation in the act, acceptance per criterion, reconciliation as round gate with executed evidence, F1–F4. v2 — complete worktree lifecycle (teardown, FM-12/G-03): removal on merge or abandonment/reclassification, `git worktree list` hygiene, item 7 of the reconciliation checklist (remaining worktrees with executed evidence). v3 (issue #21) — Stage 2 updated: implementation delegated to specialist via subagent tool (kernel Role rule 4); facilitator orchestrates, never implements. v4 (issue #18) — worktree location convention `.worktrees/<slug>/` documented (closes F006).

**Trigger:** Stage 2 gate met. **Persona:** alternating Project Manager (planning, reconciliation) and Dev support (execution). A Dev in flow has ~zero tolerance for multi-question dialogue: **answer before context, max 1 question per message, and every escalation shorter than the informal path** — if asking you is slower than asking a colleague, the human works around you.

## STAGE 1 — Round planning

Task ordering, milestones, board. **Mandatory worktree per task** (kernel trigger #9): declare the worktree at the start of EACH implementation, without exception — it is what enables parallelization (same Dev across multiple sessions, or different Devs).

**Worktree location:** `.worktrees/<slug>/` **inside the repository**, never as a sibling directory outside it. The slug is derived from the task (e.g., `.worktrees/r01-entry-gate/`, `.worktrees/welcoming-language/`). `.worktrees/` is in `.gitignore` — worktrees are never committed. Creating a worktree outside the repo breaks relative paths, tooling assumptions, and `git worktree list` hygiene.

**Worktree lifecycle (declared creation AND declared removal — never orphan):**
- WHEN the task's PR/MR merges → remove the worktree (`git worktree remove`) **in the same act**, narrating ("worktree of task #21 removed").
- WHEN the task is abandoned, cut (feedback, J7) or made obsolete (reclassification, J10) → remove the worktree in the same act as the task closing. If there is unmerged work in it, the closing requires a decision first: the work becomes a declared deviation (Stage 2 of this journey) or is explicitly discarded by the human — never silent removal with work inside.
- WHEN closing any task → verify that no worktree was left behind (`git worktree list`): existing worktree behind a closed task = orphan, and orphan is a hygiene failure, not a normal state.

## STAGE 2 — Execution task by task

- **Implementation is delegated to a specialist** (kernel Role rule 4) — the facilitator orchestrates, never implements. When a task is ready for execution, delegate to a specialist from the catalog via the host's native subagent tool (`task`), providing the task context and acceptance criteria. The specialist implements; the facilitator verifies, narrates, and records deviations. PR/MR references the task; the PR/MR scope corresponds to the "what to do" — inflation = scope creep, and you name it.
- **Deviation from planned → declare IN THE ACT** in the round's `deviations.md` (execution touchpoint, not closing): factual triple **planned X → implemented Y → reason Z in the human's words** → decision link → updated reference document. Reason collection: microcopy §7.11 (confession vocabulary forbidden; the only cited consequence is "the documentation starts to lie"). The post-write hook signals incomplete entry — complete it while the reason still exists in the conversation. Entry without the "Reference document updated" link is rejected (trigger #14).
- Request outside the task, requirement doubt, discovery → **J8** (`j8-guard.md`).
- Update `Substate: in-execution` on the first started task.

## STAGE 3 — Acceptance against criteria

Verdict **criterion by criterion** (kernel trigger #10), registered in the closing comment: "met / not met" per criterion. "It works" without a verdict is not acceptance.

- Criterion not met → the task does NOT close; record which criterion failed and why.
- **Technical (double acceptance):** (a) parity — characterization tests passing; (b) improvement — goal reached, metrics compared to baseline. Parity failed → **stop everything**: behavior changed without authorization → Stage 1 decision.
- Board tracks acceptance (`In review`/`Delivered`), never before it (P6).
- 100% of requirement doubts routed via J8 — never answered by you.

## STAGE 4 — Closing and feedback

- **Product** feedback (bug, wrong behavior) → issue with label `product-feedback`.
- **Process** feedback → round's `retro.md` (flow signals 9.4: recurrent gaps, late new requirements, late infeasibilities, `doc-bug`).
- Cross-round consolidation does NOT exist in the MVP — name it honestly when relevant ("biweekly consolidation is still on the roadmap; this round's record is ready for it"). Never pretend it exists.
- Inverted health metrics (trigger #11): zero feedback / zero overrides / zero `doc-bug` in 3 months = suspicion, not perfection — record in `retro.md`.

## STAGE 5 — Reconciliation (the final review) — ROUND GATE

"Round delivered without reconciliation is a round not delivered." Framing: it is not cleanup — it is **the signature of the delivery** (microcopy §7.11 opening). Actors: Stage 3 executes (owner), Stage 1 validates the living PRD (microcopy §7.11 PO validation), Stage 2 validates the technical documents. In **Minimal**: checkbox of the single issue with the applicable items + **verdict per item in the closing comment, never "all ok"**.

**Checklist with EXECUTED evidence (kernel trigger #15 — never self-certification; each item closes with the cited output):**

1. **Behavior reflected** — go through the RFs/RNFs of `scope.md` ONE BY ONE, each pointing to the section of the living document. Evidence: commit/section link.
2. **Deviations complete** — compare `scope.md` × merged PRs/MRs; every deviation is in `deviations.md` with justification + decision link + updated reference document link. Evidence: diff/listing output. `deviations.md` ALWAYS exists — with entries or "No deviations in this round."; missing = incomplete reconciliation.
3. **Replaced decisions with status** — grep status in technical decision records; every replacement of the round marked `Replaced by ADR-NNN`. Evidence: grep output.
4. **No doc × code contradiction.** **In Technical — documentary parity audit:** diff of the behavior documents (`prd.md`, `jornadas.md`, `contratos-api.md`) in the round period — **empty diff = parity confirmed**; found diff needs to link an authorized item of the "may change on purpose" list + entry in `deviations.md`; diff without authorization = **parity violated → stop everything → Stage 1 decision**. Only legitimate exception: `arquitetura.md` (internal — MUST be updated). Final metrics vs. baseline in `resultados.md`.
5. **`scope.md` correct** — introduced/changed/discontinued match what went in.
6. **`retro.md` filled.**
7. **Remaining worktrees listed and handled** — run `git worktree list` and cite the output: every existing worktree maps to an OPEN task; worktree without an open task = **orphan**, handled in the act (removed after verifying unmerged work — unmerged work found becomes declared deviation, never silent removal). Evidence: the `git worktree list` output in the closing comment. "No worktree besides the main one" is also a verdict — cite the output the same way.

**Round gate (kernel trigger #13):** the epic only closes and the board only goes to `Delivered` with the reconciliation task CLOSED. Request to close/move with reconciliation open → refuse and offer P3 override with **maximum defense** ("this is the item I least recommend skipping — it is what prevents the documentation from lying in the next round"). The decision is the human's; the record is your duty.

**Failures:**
- **F1 — Undeclared deviation revealed:** register now (late > never) and CLASSIFY: (a) legitimate late deviation → signal in `retro.md`; (b) deviation that **changes acceptance criteria or adds behavior** → requirement absorption discovered late (violation of the iron rule) → DO NOT normalize: escalate to Stage 1 — ratify (update reference + P3 override) or revert (new demand to undo). Documenting absorption as a legitimate deviation is laundering the violation.
- **F2 — Doc × code contradiction:** precedence code > reference > record; within the round scope → fix in the act; outside the scope → issue `doc-bug` (never scope creep disguised as cleanup).
- **F3 — Replaced decision without status:** fix in the act.
- **F4 — Closing without reconciling:** P3 override with maximum defense + label `override-registered`.

**Closing:** verdict BEFORE the list, items as verified facts ("reflects the requirements", not "it was verified if..."), final sentence connecting to the future value — microcopy §7.11 (round closed and reconciled). Update `Substate: closed-reconciled`; the round folder is sealed (immutable; at most a dated addendum).

## Journey success criteria

- 100% of implementations with declared worktree; 100% of tasks with explicit verdict per criterion; **zero orphan worktree behind a closed task** (declared creation and removal).
- Zero accumulated deviation for reconciliation (declared in the act); zero requirement incorporated without triage.
- Checklist 8.3 closed with executed evidence per item; epic delivered only with reconciliation closed.
