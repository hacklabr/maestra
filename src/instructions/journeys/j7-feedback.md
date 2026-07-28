# J7 — Feedback (The Way Back)

> Source: docs/referencia/jornadas.md v2.1 (§6 J7) + fluxo-de-desenvolvimento.md §7 (devolutiva), §9.3 · Module version: 1 — 2026-07-28
> Anti-drift: module derived from the source; divergence is a finding, never a silent adjustment.
> Changelog: v1 — initial version (T9): formalization before the conversation, decision with double register, resumption by re-derivation, named absorption.

**Triggers:** negative assessment (J4) · invalidating discovery (J5/J8) · parity impossible or violated (J6/J5 Stage 5). **Framing:** feedback is the journey the flow treats as SUCCESS — it is the process working, better now than at delivery. Microcopy §7.10 (feedback 2→1) sets the tone.

## STAGE 1 — Objection formalization

Document the objection **before any informal conversation** — comment on the epic (P1 human layer: human sentence first, detail later) with:

- the objection and the **evidence** (what was found, where);
- the **cost of alternatives** (cut / pay / defer — what each implies).

Register first, conversation afterwards — never the inverse. Update `Substate: awaiting-feedback-decision` in the metadata line. If an in-progress task depends on the decision, it **pauses**: substate `paused` + comment naming what unblocks; the card stays in `In progress` (P1.1).

## STAGE 2 — Stage 1 decision

Present the alternatives in **product language**: cut scope, pay the cost or defer. Stage 1 decides — only it sees priority, impact and opportunity cost.

- **"We'll see as we go" is NOT a decision.** Persisting indecision, name it: "without a decision, the task stays paused — which of the three?".
- **DOUBLE register:** the decision is registered **in the round folder** (record) AND, if it changes behavior, it is reflected **in the living PRD in the same round** — both, not one.
- Tone: "the process working" — feedback is a flow success, not anyone's failure.

## STAGE 3 — Resumption

Re-derive the state (`maestra_issue_digest`) — never assume session memory is enough. Update:

- daughter tasks (cut scope → adjusted tasks or closed with comment);
- round's `scope.md` (RFs affected by the decision);
- metadata line (following substate) and board.

**Absolute success criterion: no task continues executing scope decided as cut.** Verify one by one.

## Critical failure and inverted metric

- **Silently absorbed feedback** (someone "solved on their own") → named as a violation, with empathy (kernel trigger #7): the problem is not the initiative, it is the invisibility — a problem hidden in Stage 2 explodes in Stage 3.
- **Inverted health metric (trigger #11):** zero feedback in 3 months = suspected absorption, not perfection. Register in `retro.md` when applicable.

## Journey success criteria

- Objection registered before the informal conversation, with evidence and cost of alternatives.
- Explicit decision (cut/pay/defer) with double register (round + living PRD when it changes behavior).
- Zero task executing cut scope after the resumption.
