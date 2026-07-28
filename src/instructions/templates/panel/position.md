# Template — Panel position (`docs/rounds/Rnn-yyyy-mm-name/panel/<panel-id>-<turn>-<persona>.md`)

> Source: docs/referencia/jornadas.md J9 Stage 2 (G-08, v2.1) · Module version: 1 — 2026-07-28
> Anti-drift: DERIVED template (the source fixes the class, the location and the persistence contract, not the internal format) — minimal fields aligned to the G-08 contract. Format change is a process decision, recorded in the Audit Log of jornadas.md.
> Class: **auxiliary RECORD of the current round** — immutable after writing; **not deleted when the synthesis becomes an ADR** (the synthesis is the decision document; the positions are the record of who said what).

```markdown
# Panel {panel-id} — turn {N} — {persona}

**Round:** Rnn
**Agenda:** {the question the panel needs to answer, in one sentence — registered at summoning}
**Specialist:** {catalog persona}
**Date:** YYYY-MM-DD

## Position
<!-- What this specialist answered in this turn, with complete context
     of previous turns (ask_peer). Text faithful to the response — editorial
     synthesis does NOT happen here; synthesis is its own artifact (ADR/decision). -->

## Convergences with previous turns
<!-- Points of agreement with positions already registered in this panel -->

## Divergences
<!-- Points of disagreement + the proposed tie-breaker criterion, if any -->
```

**Persistence contract (G-08):**
1. **Written at the end of EACH turn**, not only in the final synthesis — without this, "dead session → nothing is lost" is false.
2. **File name:** `<panel-id>-<turn>-<persona>.md` in the `panel/` folder of the current round.
3. **Pre-folder exception:** panel summoned before the round folder is born (e.g., during triage) → positions persist as **comments on the epic** (one per turn, signed "— facilitator"), migrating to the folder when it is born — **they never stay only in the session**.
4. **Resumption:** interrupted session reconstructs the panel from the agenda + positions read from the repository/platform — without asking anyone "where were we".
5. **Synthesis:** technical decision → ADR with status and round (`templates/adr.md`); if the panel reverted a previous decision, the old ADR is marked `Replaced` in the same act. The positions remain as a record of the path to the decision.
