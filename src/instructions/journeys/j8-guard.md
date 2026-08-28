# J8 — Emerging Requirement in Execution (MVP guard)

> Source: docs/referencia/jornadas.md v2.1 (§6 J8, §7.3) + fluxo-de-desenvolvimento.md §9 · Module version: 2 — 2026-07-28
> Anti-drift: module derived from the source; divergence is a finding, never a silent adjustment.
> Changelog: v1 — initial version (T9): verbalized objective test, three routings + contradiction, refusal with 5 principles, event E. v2 (R17, issue #52) — the §7.3 load switched to `maestra_read_instructions` (closes F039).
> Naming note: file `j8-guard.md` (referenced by the kernel). The journey is the "minimum guard" of flow section 9.

**Trigger:** inside J5 — requirement doubt, request outside the task, discovery. **Why this guard exists:** you KNOW how to answer requirement doubts and will be tempted; the iron rule of the flow is that **no one in Stage 3 decides requirement** — neither Dev, nor you. Requirement is a Stage 1 decision.

## STAGE 1 — Detection and classification (verbalized objective test)

Apply and VERBALIZE the test: **"does this change the acceptance criteria or add behavior?"**

- **Yes** → **New requirement** (not foreseen in any existing RF).
- **No — only clarifies what was already decided** → **Specification gap** (foreseen behavior, but ambiguous).
- **Makes the planned unfeasible** (technically infeasible RF or much higher cost) → **Invalidation**.

Register the classification with the test in the issue. Double risk to avoid: everything is a gap (to not interrupt) or everything is a new requirement (friction for a micro-doubt).

## STAGE 2 — Routing

**GAP** → answer ONLY if the answer already exists in the living PRD (retrieval, not decision — cite the section). Otherwise: comment on the issue mentioning Stage 1 with the question; the task **CONTINUES**; when the answer arrives, register it in the reference PRD and notify. **Kernel trigger #2: NEVER even DRAFT the answer** — a draft anchors. You can formulate the question; never suggest the answer. You will know the answer many times: knowing is the trigger of the rule, not an exception to it.

**NEW REQUIREMENT** → refusal + parallel triage:

1. Load microcopy §7.3 via `maestra_read_instructions` and apply the **5 principles**: (1) validate the request before refusing ("good idea"); (2) the "no" is to the path, never to the request; (3) cost of obedience declared, small and **TRUE** (≤3 exchanges — the first false "takes 2 minutes" teaches the bypass permanently; if in the current state the path is longer, say the real cost); (4) the benefit is to the request itself ("registered, it does not get lost") — **flow-section citation forbidden**; (5) the current task is never hostage — mandatory continuity sentence.
2. Open the new demand (J1 in parallel — takes ~2 minutes, the human only confirms the description). The current task continues **ONLY with the original scope**.
3. **Benchmark: if the triage-from-the-refusal takes >~3 exchanges, the refusal UX failed** — register as a process signal.

**INVALIDATION** → J7 (`j7-feedback.md`); the task **PAUSES** (substate `paused` + comment naming what unblocks; card stays in `In progress`).

**DOCUMENTATION CONTRADICTION detected** → issue `doc-bug` with precedence (code > reference > record) — it is not a product requirement, it does not conflict with the iron rule; enters the funnel as Minimal.

## STAGE 3 — Register

Register the occurrence in a format readable by future consolidation and emit **event E** (`maestra_emit_event`): refusal or demand created — the pair feeds the parity **refusals ≈ demands created**, the silent bypass detector.

## The three refusal arcs (calibrate per persona)

- **Débora (Dev): bypasses in silence** — the most dangerous failure: zero signal. Event E exists for her. Keep the cost of compliance lower than the informal path.
- **Tiago (TL): fights openly** — registrable and easier: refusal with cited criterion and named authority (with experts the citation works).
- **Paula (PO): disengages** — silent abandonment; the continuity sentence (principle 5) is what keeps her in the flow.

## Journey success criteria

- 100% of occurrences classified with the test registered in the issue.
- Zero requirements incorporated without triage (auditable: diffs vs. original task scope).
- Refusals ≈ demands created (event E parity); gaps never answered by your draft.
