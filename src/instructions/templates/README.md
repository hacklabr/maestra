# Artifact Templates

> Source: fluxo-de-desenvolvimento.md §11 + docs/referencia/jornadas.md §5/J9 (v2.1) · Module version: 2 — 2026-07-28
> Anti-drift: verbatim templates from the source; slots in `{UPPERCASE}`. Divergence is a finding, never a silent adjustment.
> Changelog: v1 (T10-L3): 7 templates of the language layer · v2 (T10 final): 6 remaining templates — complete set.

## Delivered (complete set — T10)

| File | Content | Source |
|---|---|---|
| `two-layer-issue.md` | P1 issue (Summary + metadata + Details for execution) | jornadas §5 P1/P1.1 |
| `implementation-task.md` | Implementation task (Stage 3), two layers | fluxo §11.1 + jornadas P1 |
| `artifact-task.md` | Artifact task (Stages 1/2), REFERENCE×RECORD class declared | fluxo §11.2 + jornadas §4 |
| `adr.md` | ADR with status + uniqueness checkpoint | fluxo §11.5 + jornadas J4 |
| `motivation.md` | Refactoring motivation (Technical variant) + anti-auto-approval lock | fluxo §11.6 + jornadas J6 |
| `dor-summary.md` | DoR: S1 gate checklist + table per variant | fluxo §6 + §11.7 |
| `scope.md` | Round scope (RECORD) | fluxo §11.3 |
| `deviations.md` | Round deviations (RECORD) + P3/#14 rules | fluxo §11.4 + jornadas §5 P3 |
| `retro.md` | Round retro (RECORD) — derived template (Q2) | jornadas J5 Stage 4 + fluxo §9.4/§10 |
| `panel/position.md` | Per-turn panel position (auxiliary RECORD) — derived template | jornadas J9 (G-08) |
| `override-comment.md` | P3 register reference (emitted by the tool, never by hand) | jornadas §5 P3 + emit-event.ts |
| `team.md` | Team map `team.md` on branch `__maestra_config__` (ADR-003) | jornadas §5 P5 |
| `config.md` | Config `config.md` on branch `__maestra_config__` (exact parser format) | src/platform/config.ts (ADR-014 + ADR-003) |

**Derived templates (source does not fix internal format):** `retro.md`, `panel/position.md` — marked as derived in the header; format change requires a register in the Audit Log of jornadas.md.

## Pending

None.
