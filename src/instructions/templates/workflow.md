# Template — Post-PR/MR workflow (`workflow.md` on the `__maestra_config__` branch)

> Source: round R15 (issue #49) + ADR-004 · round R18 (issue #54) + ADR-006 · Module version: 2 — 2026-08-28
> Anti-drift: this file lives at the ROOT of the orphan `__maestra_config__` branch — NEVER in the working tree (ADR-003: one home for repo configuration, no config history in the product branches), and NEVER in `config.md` (ADR-002: the parser accepts only 4 keys and silently ignores the rest). Read/write ONLY via `maestra-config read/write workflow.md`. Platform-neutral (ADR-012): values are repo-specific names; columns are resolved against the real board via the cookbook.

```markdown
# Post-PR/MR workflow

<!-- ADR-004/ADR-006: born on the branch by the setup journey (J12 STAGE 1) via
     maestra-config write workflow.md; remap via partial J12 invocation or
     maestra-config write workflow.md — never a working-tree edit. -->

- post-pr-acceptance: close | qa
- qa-approval-column: {board column for QA-approved work — default: the delivered mapping in labels.md}
- pr-topology: epic-branch | direct
```

**Rules:**
- **Path:** `workflow.md` at the branch root of `__maestra_config__` (ADR-003) — there is no `.maestra/workflow.md`; a file at that working-tree path is an error to correct, not a config to read.
- `close` is the default for `post-pr-acceptance` when the file or the key is absent — teams without formal QA change nothing (zero migration: current behavior preserved).
- `epic-branch` is the default for `pr-topology` when the file or the key is absent (ADR-006) — daughter task PRs/MRs target an epic integration branch (`epic/<n>-<slug>`, lazy birth at the first consent gate with ≥2 open implementation tasks; the epic PR/MR opens at the last daughter's acceptance, P6 7a/7b). **Note the asymmetry, it is intentional:** post-acceptance preserves the old behavior by default; topology changes it by default — a team that does NOT want epic branches must opt out with `direct`. Scope: the integration branch is the repo's own (`develop`, `main` — per-repo convention, never hard-coded here); the Minimal variant never gets an epic branch in any configuration.
- **Convention, not cache:** column names are always revalidated against the REAL board when operating (P6); this file records the human-confirmed convention, and on divergence the board wins and the file is corrected in the act (via `maestra-config write workflow.md`).
- Born in the setup journey (J12 STAGE 1) via `maestra-config write workflow.md`: the facilitator proposes `close` for post-acceptance (or `qa` with the QA Specialty reference — `team.md` — and the approval column confirmed from the real board) and `epic-branch` for topology (opting out with `direct` confirmed in the same act when the team prefers direct PRs/MRs).
- Remap = partial J12 invocation ("reconfigura o workflow pós-PR/MR") or `maestra-config write workflow.md` — one file, one place, one vehicle.
- Shared with the team via the remote orphan branch (best-effort push by the CLI; degradation is a note, never a block).
- Versioned on the `__maestra_config__` ref — state lives in a shared, versioned git ref, outside the product history ("no state outside the repository" spirit, ADR-003).
