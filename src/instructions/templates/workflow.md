# Template — Post-PR/MR workflow (`workflow.md` on the `__maestra_config__` branch)

> Source: round R15 (issue #49) + ADR-004 · Module version: 1 — 2026-08-18
> Anti-drift: this file lives at the ROOT of the orphan `__maestra_config__` branch — NEVER in the working tree (ADR-003: one home for repo configuration, no config history in the product branches), and NEVER in `config.md` (ADR-002: the parser accepts only 4 keys and silently ignores the rest). Read/write ONLY via `maestra-config read/write workflow.md`. Platform-neutral (ADR-012): values are repo-specific names; columns are resolved against the real board via the cookbook.

```markdown
# Post-PR/MR workflow

<!-- ADR-004: born on the branch by the setup journey (J12 STAGE 1) via
     maestra-config write workflow.md; remap via partial J12 invocation or
     maestra-config write workflow.md — never a working-tree edit. -->

- post-pr-acceptance: close | qa
- qa-approval-column: {board column for QA-approved work — default: the delivered mapping in labels.md}
```

**Rules:**
- **Path:** `workflow.md` at the branch root of `__maestra_config__` (ADR-003) — there is no `.maestra/workflow.md`; a file at that working-tree path is an error to correct, not a config to read.
- `close` is the default when the file or the key is absent — teams without formal QA change nothing (zero migration: current behavior preserved).
- **Convention, not cache:** column names are always revalidated against the REAL board when operating (P6); this file records the human-confirmed convention, and on divergence the board wins and the file is corrected in the act (via `maestra-config write workflow.md`).
- Born in the setup journey (J12 STAGE 1) via `maestra-config write workflow.md`: the facilitator proposes the default `close`; if the team runs post-merge QA, `qa` is set with the QA Specialty reference (`team.md`) and the approval column confirmed from the real board.
- Remap = partial J12 invocation ("reconfigura o workflow pós-PR/MR") or `maestra-config write workflow.md` — one file, one place, one vehicle.
- Shared with the team via the remote orphan branch (best-effort push by the CLI; degradation is a note, never a block).
- Versioned on the `__maestra_config__` ref — state lives in a shared, versioned git ref, outside the product history ("no state outside the repository" spirit, ADR-003).
