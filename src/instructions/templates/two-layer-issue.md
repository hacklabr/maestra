# Template — Two-layer issue (P1)

> Source: docs/referencia/jornadas.md §5 P1 (+ P1.1), v2.1 · Module version: 1 — 2026-07-28
> Anti-drift: human layer immutable in spirit (never rewritten — only corrected/appended); execution layer free. The `## Details for execution` boundary has a FIXED name.
> Platform-neutral (ADR-012): "issue" = issue/ticket of the detected platform.

```markdown
{TITLE — max ~60 characters, verb + object, business language}

## Summary
<!-- 2–4 sentences: what, for whom, why. Zero technical jargon.
     Written in the demand author's words (the facilitator paraphrases,
     does not invent). NEVER rewritten afterwards — only corrected or appended. -->

**Variant:** {Full|Condensed|Minimal|Technical} · **Current stage:** {1|2|3} · **Substate:** {see P1.1 — closed vocabulary} · **Epic:** #{N} · **Round:** {Rnn}

---
## Details for execution
<!-- Agent layer. Everything below the line is written for devs and AI
     agents — precise, referenced, unambiguous. -->

### Context and origin
<!-- Where did this task/demand come from? -->

### Requirements met
<!-- E.g., RF-03, RNF-01 — mandatory; in the Technical variant, link the motivation document -->

### References
<!-- Links: section of the reference document (docs/reference/) and relevant ADRs -->

### What to do
<!-- Objective description -->

### Out of scope for this task
<!-- What explicitly should NOT be done here -->

### Acceptance criteria
<!-- In human-testable language — the bridge of the two layers.
     E.g., "the exported report opens in Excel without breaking accents",
     NOT "validate UTF-8 encoding on the stream".
     In the Technical variant: (a) behavior parity + (b) improvement goal.
     The task only closes with an explicit verdict per criterion. -->
- [ ] ...
```

**Update rules:**
- The metadata line is updated on every transition (variant, stage, substate, round) — in the same act as any override (P3 atomicity).
- `Substate` uses only the P1.1 values (`triage`, `in-artifacts`, `awaiting-assessment`, `awaiting-s1-approval`, `awaiting-feedback-decision`, `in-execution`, `paused`, `awaiting-reconciliation`, `closed-reconciled`). `closed-without-reconciliation` is never written — it is derived (J2, branch B6).
- Later comments (decisions, feedback, overrides) follow the same pattern: human sentence first, technical detail later.
