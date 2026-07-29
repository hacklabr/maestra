# Ideias de Implementação

Rascunhos informais. Ao virar scope de round, marcar `→ Rnn`.

---

## I001 — Triagem rápida / "cria issue pra mim"

**Status:** idea

O agente da triagem deve poder seguir um novo fluxo: a pessoa pede para criar
uma issue rápida no board, que ainda precisa passar pela triagem. O usuário
escreve uma descrição solta, o facilitador gera um rascunho de issue, pergunta
se está OK, e ao ser confirmado publica no board — sem interrogation de
triagem prévia.

A issue entra no board como "aguarda triagem" e o fluxo normal de triagem
acontece depois.

---

## I002 — Maestra não implementa; ela orquestra

**Status:** idea

O agente maestra não deve implementar. Ele deve sempre delegar a tarefa a um
especialista do catálogo. Ela é a maestra da orquestra — não toca
instrumentos. Em nenhuma etapa do fluxo o facilitador escreve código, edita
arquivos de produto ou executa mutações no repo: ele sempre convoca um
especialista (via `task` / `ask_peer`) para o trabalho de implementação.
