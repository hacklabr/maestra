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
  https://github.com/hacklabr/maestra/issues/54#issuecomment-5456322856 —
  renumeração sem contestação de critério (sem override P3); este registro é
  a âncora da correção.
- **Reference document updated:** `scope.md` (critério 6, correção in-round
  datada) e corpo da issue #54 (critério 6 + superfície prevista), no mesmo
  ato do commit da round.

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
  https://github.com/hacklabr/maestra/issues/54#issuecomment-5456322856 —
  extensão declarada no ato, sem mudança de comportamento (sem override P3).
- **Reference document updated:** AGENTS.md (o próprio edit, no mesmo commit
  da round).

<!-- Nota: nenhuma entrada requer override P3 (nenhum critério de aceite,
     out of scope ou gate foi contestado). -->
