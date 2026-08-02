# Scope of round R09 — publicação delegada (incremento da #35)

## Variant

Minimal

## Problem (summary)

Após a confirmação do rascunho, a publicação da issue (J11 Stage 3) roda na
sessão principal: localizar o projeto na plataforma, descobrir a coluna certa
do board, executar os comandos e retentar quando falham. Essa mecânica de
plataforma polui a thread principal — só o resultado interessa (issue
publicada, número, coluna).

## Requirements introduced

- **RF-22** — A J11 Stage 3 (Publish) deve ser **delegada** a um subagente
  operacional via ferramenta de subagente do host. O subagente recebe título e
  summary confirmados (+ decisão de relate, quando houver) e executa toda a
  mecânica: criar a issue com `stage-0`, adicionar ao board na coluna correta,
  postar o comentário de aguardando triagem, relacionar quando escolhido.
  **Retentativas acontecem dentro do subagente** — a sessão principal recebe
  apenas o contrato destilado: número + URL da issue, ou erro claro e final
  (reportado ao autor, nunca escondido). O gate de confirmação permanece na
  sessão principal e é **sempre anterior** à delegação — publicar sem
  confirmação explícita continua proibido.

## Requirements changed

- _Nenhum requisito existente alterado._

## Requirements discontinued

_Nenhum._

## Out of scope for this round

- Mudar rascunho curado, confirmação ou enriquecimento (R07/R08).
- Mudar a estrutura/colunas do board.
- Relacionamento automático sem decisão do autor.

## Origin

Epic: #35 (incremento das R07/R08 — decisão de @rafaelchavesfreitas em
2026-08-02). Feedback sobre o comportamento observado em uso: publicação
poluindo a sessão principal com mecânica de plataforma e retentativas.
Classificado Minimal em modo direto.

## Resolution (closing — 2026-08-02)

- **RF-22:** Implemented — J11 v4 Stage 3 "Publish (delegated)": operations subagent spawned only after the confirmation gate; retries confined; distilled return (issue number + URL + column, or final error surfaced to the author); issue-writer kernel v4 + builder sentence extended (one line, issue-writer only); confirmation gate verbatim.
- PR: #39 (commit `fb59eda`, merge `5c8a1bb`).
