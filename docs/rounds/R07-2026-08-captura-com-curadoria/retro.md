# Retrospective of round R07 — captura com curadoria

## What went well

- **Doctrine change with full propagation** — the "author's words → author's
  intent, curated text" change touched J11, microcopy §7.12, the issue-writer
  kernel and the agent builder in one coherent pass, with a regression test
  (`not.toContain("author's words")`) guarding against resurrection of the old
  doctrine.
- **Verified, not assumed, host capability** — the specialist checked the
  installed binaries/docs and confirmed the `question` tool exists built-in on
  BOTH hosts (opencode and mimocode), avoiding a fallback that would have been
  dead text.
- **Round lessons applied** — the worktree was created before the round folder
  (R06 friction avoided); the specialist report matched the facilitator's
  independent verification again (build, 234/234, smoke 120/120, eval:dry 4/4).

## Process signals

- **F030 recurrence:** `git worktree remove` failed again on the submodule-
  containing worktree (2nd time, R06 and now R07). The workaround is mechanical
  but undocumented in J5 — F030 stays open and gains evidence.
- **Doctrine boundary surfaced (not changed):** `protocols.md` §P1 and
  `templates/two-layer-issue.md` still prescribe "author's words" for the
  **triage** summary (J1 artifact) — a different moment from capture. Whether
  the curated doctrine should propagate to triage summaries is a product
  decision for a future round; flagged by the specialist, left untouched to
  avoid scope creep.

## Assumptions to validate in dogfooding

- The curated capture has not been exercised in a live session yet — the
  enrichment steps (grounding, dedup, clickable questions) are verified by
  review and tests, not by real use. First live captures should be watched for
  over-questioning or over-grounding (the "bounded" discipline).
