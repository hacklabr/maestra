# Template — ADR (`docs/decisions/adr/ADR-NNN-title.md`)

> Source: fluxo-de-desenvolvimento.md §11.5 (+ ADR glossary) · Module version: 1 — 2026-07-28
> Anti-drift: verbatim from the source. Class: RECORD — immutable; the only allowed mutation is the **Status** field (Current → Replaced by ADR-NNN), in the same commit as the replacing ADR.

```markdown
# ADR-NNN — <decision title>

**Status:** Current | Replaced by ADR-MMM
**Date:** YYYY-MM-DD
**Round:** Rnn

## Context
<!-- What motivated this decision -->

## Decision
<!-- What was decided -->

## Consequences
<!-- What this decision implies, positive and negative -->
```

**Uniqueness checkpoint (anti-contradiction #5, J4 Stage 2):**
1. **Before creating:** verify if there is already a `Current` ADR on the same subject (status grep). ADR by habit = orphan touchpoint — an ADR is created only for a **new decision with lasting consequence** (matrix 3.5 per variant).
2. **If the decision replaces a previous one:** the old ADR gets `Replaced by ADR-NNN` **in the same commit** as the new one. **There are NEVER two current ADRs on the same subject.**
3. **A reverted decision generates a new ADR** — never an edit of the old one nor a removal.
4. Decision coming out of a discussion panel (J9): the verbal synthesis and the ADR text are **the same text**; if the panel reverted a previous decision, the old ADR is marked `Replaced` in the same act.
5. Reconciliation (J5 Stage 5) verifies: every ADR whose decision was replaced in the round has the status updated (evidence: status grep).
