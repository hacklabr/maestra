# Deviations of round R18 — branch do épico

> Template: `templates/deviations.md`. Entradas declaradas NO ATO (J5 Stage 2),
> nunca acumuladas para a reconciliação.

## Deviation 1 — Número da ADR (ADR-005 → ADR-006)

- **Planned:** ADR-005 (número citado no briefing aprovado, no comentário
  técnico e no critério de aceite 6 do scope).
- **Implemented:** ADR-006.
- **Reason:** a round paralela R16 (issue #34, classificação de issues) tomou
  o número ADR-005 e já está mergeada em `main` — descoberto na leitura da
  base do worktree (`docs/decisions/adr/ADR-005-classificacao-de-issues-tipo-nativo-dimensao.md`
  existe). Números de ADR são sequenciais e nunca renumerados; a decisão desta
  round registra-se como ADR-006.
- **Decision registered at:** comentário técnico onde ADR-005 foi previsto:
  [#54 (comment)](https://github.com/hacklabr/maestra/issues/54#issuecomment-5456322856) —
  renumeração sem contestação de critério (sem override P3); este registro é
  a âncora da correção.
- **Reference document updated:** [scope.md](../R18-2026-08-branch-do-epico/scope.md)
  (critério 6, correção in-round datada) e corpo da
  [#54](https://github.com/hacklabr/maestra/issues/54) (critério 6 + superfície
  prevista), no mesmo ato do commit da round.

## Deviation 2 — AGENTS.md fora da superfície prevista

- **Planned:** superfície de 9 arquivos (comentário técnico da issue #54);
  AGENTS.md não constava.
- **Implemented:** 10 arquivos — AGENTS.md editado (1 linha do mapa de
  estrutura, sobre `workflow.md`).
- **Reason:** o AGENTS.md é o router do repo e citava `workflow.md` como
  "Fluxo pós-aceitação do PR (ADR-004)" — sem a edição, o router mentiria por
  omissão sobre a nova chave (regra anti-contradição §5.3 do doc normativo).
- **Decision registered at:** comentário técnico com a superfície prevista
  (9 arquivos, sem AGENTS.md):
  [#54 (comment)](https://github.com/hacklabr/maestra/issues/54#issuecomment-5456322856) —
  extensão declarada no ato, sem mudança de comportamento (sem override P3).
- **Reference document updated:** [AGENTS.md](../../../AGENTS.md) (o próprio
  edit, no mesmo commit da round).

## Deviation 3 — Merge `--no-ff` com conflitos de changelog (round paralela R19)

- **Planned:** merge fast-forward do PR #55 em `main` @ 67eec85 (base do
  worktree), sem conflitos.
- **Implemented:** merge `--no-ff` (`71db00d`) — `main` havia avançado para
  `85c1593` com a round paralela R19 (issue #53, dedup universal); 5 arquivos
  com conflito de linha única nos cabeçalhos/changelogs (j2, j5, microcopy,
  cookbook-gh, cookbook-gl), resolvidos por união mecânica (entradas R19
  mantiveram seus números; entradas R18 renumeradas para o slot seguinte);
  correção in-reconciliation dos cabeçalhos `Module version` defasados
  (j5→9, j2→8, microcopy→8).
- **Reason:** duas rounds paralelas anexam entradas à mesma linha de changelog
  dos módulos compartilhados — colisão estrutural de namespaces sequenciais
  (a mesma família da colisão R16/ADR-005 registrada em D001).
- **Decision registered at:** veredito de aceitação da
  [#54](https://github.com/hacklabr/maestra/issues/54) (comentário de
  fechamento 7/7) + este registro; resolução mecânica executada pelo
  `maestra/ops`, verificada pelo facilitador com evidência executada (greps
  de marcadores e headers).
- **Reference document updated:** cabeçalhos corrigidos em
  [j5-stage3.md](../../../src/instructions/journeys/j5-stage3.md),
  [j2-resume.md](../../../src/instructions/journeys/j2-resume.md) e
  [microcopy.md](../../../src/instructions/reference/microcopy.md)
  (commit de fechamento da round).

<!-- Nota: nenhuma entrada requer override P3 (nenhum critério de aceite,
     out of scope ou gate foi contestado). -->
