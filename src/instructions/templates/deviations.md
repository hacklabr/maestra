# Template — Round deviations (`docs/rounds/Rnn-yyyy-mm-name/deviations.md`)

> Source: fluxo-de-desenvolvimento.md §11.4 + docs/referencia/jornadas.md §5 P3 (v2.1) · Module version: 1 — 2026-07-28
> Anti-drift: verbatim from the source, with the operational rules of P3. Class: RECORD — immutable after the round closes.

```markdown
# Deviations of round Rnn — <name>
<!-- Every divergence between what was planned and what was implemented.
     An undeclared deviation is the embryo of contradictory documentation. -->

## Deviation 1 — <title>
- **Planned:** <!-- what the briefing/scope foreseen -->
- **Implemented:** <!-- what was actually built -->
- **Reason:** <!-- why it changed (feasibility, decision, discovery) —
       IN THE HUMAN'S WORDS -->
- **Decision registered at:** <!-- link: issue, ADR or override comment (P3) -->
- **Reference document updated:** <!-- link of the commit/section — MANDATORY -->
```

**Operational rules (P3, anti-bypass #14):**
- **Always exists** — with entries or with the explicit declaration `No deviations in this round.` Missing file = incomplete reconciliation.
- **Entry without the "Reference document updated" link is rejected** — empty field is where contradiction is born. The post-write hook signals immediately (see `reference/microcopy.md`, hook warning); the final ruler is the agent.
- **Timing:** deviations declared **when they occur** (execution touchpoint, J5 Stage 2) — reconciliation verifies completeness, it is not the moment to write.
- **Bidirectionality:** deviation caused by a human decision links the override comment (P3); override that generates divergence appears here linking the comment. Reconciliation verifies both directions.
- Factual triple **planned → implemented → reason**; confession vocabulary forbidden ("unfortunately", "didn't work out", "we had to").
