# Template — Round scope (`docs/rounds/Rnn-yyyy-mm-name/scope.md`)

> Source: fluxo-de-desenvolvimento.md §11.3 · Module version: 1 — 2026-07-28
> Anti-drift: verbatim from the source. Class: RECORD — immutable after the round closes; updated in place DURING the round if the RFs change.

```markdown
# Scope of round Rnn — <name>

## Variant
<!-- full | condensed | minimal | technical -->

## Requirements introduced
<!-- New RFs/RNFs created in this round -->
- RF-12 — ...

## Requirements changed
<!-- Existing RFs/RNFs modified in this round, with a summary of the change -->
- RF-03 — before: ... | now: ...

## Requirements discontinued
<!-- RFs/RNFs removed from the reference PRD, with reason -->

## Out of scope for this round
<!-- What was explicitly left out — NEVER empty:
     empty out of scope is a smell of unconsidered scope -->
```

**Usage rules:**
- Born in Stage 1 (sub-stage 1.5 of the flow) and enters the DoR package.
- Reconciliation (J5 Stage 5) goes through the RFs/RNFs listed here one by one, each pointing to the section of the living document (evidence: commit/section link).
