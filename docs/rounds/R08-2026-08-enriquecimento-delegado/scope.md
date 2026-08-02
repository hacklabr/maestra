# Scope of round R08 — enriquecimento delegado (incremento da #35)

## Variant

Minimal

## Problem (summary)

O grounding rápido no código e o dedup no board (J11 v2 Stage 1, entregues na
R07) rodam na sessão principal da captura: greps, leituras de arquivo e
listagens de issues poluem o contexto da conversa de captura. O resultado
interessa; o processo, não. Os dois passos devem ser delegados a subagentes,
retornando apenas o destilado.

## Requirements introduced

- **RF-21** — A J11 Stage 1 deve orientar a **delegação** do grounding rápido
  e da checagem de duplicatas a subagentes (ferramenta de subagente do host —
  nome concreto baked no markdown do agente, padrão DIALECT; instruções
  neutras), com **contrato de retorno destilado** de tamanho limitado:
  grounding → uma frase verificada de comportamento atual (ou "pulado");
  dedup → candidata(s) ou "nada encontrado". Subagente genérico de pesquisa,
  não o shell specialist de personas. O rascunho curado e a confirmação
  permanecem na sessão principal.

## Requirements changed

- _Nenhum requisito existente alterado (RF-17..RF-20 permanecem — a mudança é
  de mecânica, não de conteúdo observável)._

## Requirements discontinued

_Nenhum._

## Out of scope for this round

- Mudar os 4 eixos de qualidade da R07 (curadoria, grounding, dedup, perguntas).
- Delegar o rascunho curado ou a confirmação (permanecem na sessão principal).
- Mudar o gate de confirmação.

## Origin

Epic: #35 (incremento da R07 — decisão de @rafaelchavesfreitas em 2026-08-01:
"continuação da tarefa, não mais um épico"). Feedback sobre o escopo
implementado na R07. Classificado Minimal em modo direto.

## Resolution (closing — 2026-08-02)

- **RF-21:** Implemented — J11 v3 Stage 1: grounding and duplicate check delegated to generic research subagents with a distilled-return contract (one verified sentence / ≤3 candidates); quick questions and confirmation gate stay in the main session; issue-writer kernel v3 + one builder sentence linking DIALECT to the delegation (issue-writer only, regression-tested).
- PR: #38 (commit `1a26fd3`, merge `fbb70af`).
