# Template — Refactoring motivation (`docs/rounds/Rnn-yyyy-mm-name/motivation.md`)

> Source: fluxo-de-desenvolvimento.md §11.6 (+ §3.4 Technical variant) + docs/referencia/jornadas.md J6 (v2.1) · Module version: 1 — 2026-07-28
> Anti-drift: verbatim from source §11.6. Class: RECORD — immutable after closing; in the Technical variant, **the round folder is born here** (J6 Stage 1).

```markdown
# Refactoring: <region/feature name>

## Problem
<!-- What is bad today, with evidence: metrics, bug history,
     cost of tasks in the region -->

## Measurable goal
<!-- E.g., reduce response time from X to Y; decouple module Z
     to allow feature W. This goal is also the stopping point. -->

## Impact analysis
<!-- What will be touched; which features depend on this region -->

## Baseline
<!-- Metrics measured BEFORE the change, for later comparison —
     details in baseline.md (same folder) -->

## Characterization of current behavior
<!-- Reference to the characterization tests that document
     today's behavior, including quirks -->

## What may change on purpose
<!-- Behaviors that Stage 1 authorized to change; everything else
     must remain identical. Empty list is valid; absence of a list is not. -->

## Stage 1 approval
<!-- Who approved the opportunity cost and when — with a LITERAL QUOTE
     of the human message (evidence, not paraphrase) -->
```

**Hard rules (J6 — anti-auto-approval lock, anti-bypass #3):**
1. **"Improve the architecture" is rejected as a goal** — a goal requires a measurable target value; without it, refactoring becomes infinite rewriting. The agent blocks the passage until a goal exists.
2. **Approval = explicit human act in a DISTINCT TURN** — the agent presents the translation and closes the turn waiting. **Default NOT approved:** silence, absence of objection or the agent's synthesis are never approval.
3. **Literal quote** of the human message in the "Stage 1 approval" field — and it lives in a document that cannot be rewritten (the immutability of the RECORD reinforces the lock).
4. Final metrics vs. baseline go in `resultados.md` (same folder — G-14): the `baseline.md` is the "before" measure, the results are the "after" measure; never mixed.
