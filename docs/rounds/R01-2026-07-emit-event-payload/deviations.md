# Deviations of round R01 — emit-event payload parsing

## Deviation 1 — Test for catalog/persona submódulo requires submodule init in worktrees
- **Planned:** Tests run green in any git worktree of the repo (standard dev workflow).
- **Implemented:** Three tests (`src/__tests__/persona-expansion.test.ts`, `src/catalog/loader.test.ts`) fail when run in a git worktree without the submodule initialized, because `git worktree add` does not copy submodules automatically.
- **Reason:** O submódulo `src/catalog/agency-agents` (repo `agency-agents`) é inicializado pelo `install.sh` em todos os cenários de instalação, mas não por `git worktree add` — característica conhecida do git, não um bug do Maestra.
- **Decision registered at:** N/A — no decision needed; documented as environmental constraint. Workaround during dev: `git submodule update --init src/catalog/agency-agents` after `git worktree add`.
- **Reference document updated:** `docs/rounds/R01-2026-07-emit-event-payload/deviations.md` (this file)

## Deviation 2 — Round folder created late (not at first artifact commit)
- **Planned:** Round folder `docs/rounds/R01-…/` born at the first artifact commit (J1 Stage 5 / J3 Stage 1), always, in all variants.
- **Implemented:** Round folder created during reconciliation, after the implementation of #2 was already merged — not at the first artifact commit.
- **Reason:** Viés de execução do Facilitador: passou direto da triagem para a implementação sem criar os artefatos do round. Registrado como dogfooding finding F005.
- **Decision registered at:** dogfooding finding F005 in `docs/dogfooding/findings.md`
- **Reference document updated:** `docs/rounds/R01-2026-07-emit-event-payload/scope.md` (this round's scope) + `docs/dogfooding/findings.md` (F005)
