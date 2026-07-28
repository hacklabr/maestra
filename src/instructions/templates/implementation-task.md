# Template — Implementation task — Stage 3

> Source: fluxo-de-desenvolvimento.md §11.1 + docs/referencia/jornadas.md §5 P1 (v2.1) · Module version: 1 — 2026-07-28
> Anti-drift: sections verbatim from source §11.1 within the two-layer structure (P1). The human layer (Summary) is mandatory even in Stage 3 — the epic and the board are read by non-technical people.
> Platform-neutral (ADR-012): "PR/MR" on first occurrence.

```markdown
{TITLE — max ~60 characters, verb + object, business language}

## Summary
<!-- 2–4 sentences: what this task delivers and why, in language a
     non-technical person understands. The deliverable is code + tests via PR/MR. -->

**Variant:** {full | condensed | minimal | technical} · **Current stage:** 3 · **Substate:** in-execution · **Epic:** #{N} · **Round:** {Rnn}

---
## Details for execution

### Context
<!-- Where did this task come from? -->

### Epic
<!-- Link to the parent issue — mandatory -->

### Flow variant
<!-- full | condensed | minimal | technical -->

### Requirements met
<!-- E.g., RF-03, RNF-01 — mandatory; in the Technical variant, link the motivation document -->

### References
<!-- Link to the section of the relevant reference document and ADR
     (docs/reference/, docs/decisions/adr/) -->

### What to do
<!-- Objective description of the implementation.
     Quality test (fluxo §7): executable WITHOUT QUESTIONS — re-read as an
     external dev who did not participate in the conversation; if you would have a question,
     the task goes back. Declared boundaries: files/modules this task
     touches (conflict-free parallelization — briefing criterion #7). -->

### Out of scope for this task
<!-- What explicitly should NOT be done here -->

### Acceptance criteria
<!-- Copied/derived from the living PRD — the task only closes with them validated,
     with an explicit verdict per criterion (met/not met).
     In the Technical variant: (a) behavior parity + (b) improvement goal -->
- [ ] ...
```

**Usage rules:**
- Every task references ≥1 RF/RNF; every RF/RNF of the round's `scope.md` has ≥1 task (Stage 2 gate).
- PR/MR with scope inflated beyond the "What to do" = scope creep — the agent names it.
- Worktree declared at the start of each implementation (anti-bypass #9).
