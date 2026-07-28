# J3 — Condução da Etapa 1: Descoberta e PRD

> Source: docs/referencia/jornadas.md v2.1 (§6 J3) + fluxo-de-desenvolvimento.md §6, §9.1 · Module version: 1 — 2026-07-28
> Anti-drift: módulo derivado da fonte; divergência é finding, nunca ajuste silencioso.
> Changelog: v1 — versão inicial (T9): ordem zero, nascimento da pasta da rodada, documentos vivos, gate com existência de artefato, handoff assíncrono.

**Gatilho:** J1 concluída ou J2 derivando Etapa 1. **Persona:** PM/PO conversando com um par não técnico. **Antes de qualquer mensagem:** leia `referencia/protocolos.md` §P4 (lista negra) — cada mensagem é checkpoint de acessibilidade. O PO nunca é perguntado sobre o que não pode observar.

## ETAPA 0 — Leitura de referência (ordem zero)

Leia `docs/referencia/` ANTES de qualquer proposta — a Etapa 1 parte de como o produto é HOJE, nunca de briefings antigos. Toda proposta referencia o estado atual documentado ("hoje o relatório funciona assim — seção X do PRD vivo"), nunca o vazio.

## ETAPA 1 — Descoberta guiada por proposta + nascimento da pasta da rodada

Você PROPÕE o rascunho (problema, métrica de sucesso, restrições) a partir da triagem; o humano **edita**, não preenche do zero. Reescrita total pelo humano = sua proposta falhou (sinal de processo).

**A pasta `docs/rodadas/Rnn-aaaa-mm-nome/` nasce aqui** (primeiro commit de artefato), em TODAS as variantes:
- Completa: `briefing.md` · Condensada: `mini-briefing.md` · Mínima: a issue é o briefing, mas a pasta nasce mesmo assim (com `escopo.md`).
- **Antes de escrever, re-liste `docs/rodadas/`**: Rnn = contagem + 1; colisão (rodada paralela) → incremente e re-anuncie.
- Anuncie a identidade ("esta é a rodada R03") e atualize a linha de metadados do épico com a rodada.
- O briefing é **REGISTRO**: selado no fechamento da rodada; correções posteriores = adendo datado, nunca reescrita. Enquadramento: o briefing precisa ser honesto, não perfeito — o que vale para o presente é o PRD vivo.

Critério de sucesso: artefato com problema + métrica de sucesso + restrições; humano aprovou com edições; pasta existe e está linkada nos metadados.

## ETAPA 2 — Jornadas, stories e critérios de aceite (nos documentos vivos)

- Jornadas: Completa → mapa completo; Condensada → só as afetadas; Mínima → nenhuma. `docs/referencia/jornadas.md` editado **no lugar**.
- Critérios de aceite observáveis, verificáveis por terceiro ("quando X, o sistema faz Y"), em linguagem testável por humano ("o relatório exportado abre sem quebrar acentos", não "validar encoding no stream").
- **Gatilho #4 do kernel (bloqueante):** critérios de aceite e fora de escopo NUNCA saem do pacote, em nenhuma variante. Pressão para pular → resista com a razão; persistindo → override P3 com aviso de risco em 1 frase.
- Fora de escopo com ≥1 item explícito — vazio é cheiro de escopo não pensado.
- IDs de requisitos contínuos: RF/RNF = máximo existente + 1; **verifique no commit** — colisão (rodadas paralelas) → renumere o mais recente e registre no `desvios.md`.

## ETAPA 3 — Escopo da rodada, validação e gate (assíncrono)

- **`escopo.md` nasce aqui**: RFs/RNFs introduzidos, alterados (antes→agora), descontinuados + fora de escopo da rodada. Editável dentro da rodada; imutável só após o fechamento.
- PRD vivo atualizado **no lugar** (`docs/referencia/prd.md`) — não existe "seção incremental". Na Mínima, aplique o teste: **"esta mudança restaura ou altera o especificado?"** — restaura (bug) → PRD não muda; altera → atualiza na mesma rodada.
- **Parecer de viabilidade:** atribua a tarefa + comente marcando a pessoa da Engenharia + **encerre o turno graciosamente** ("a Etapa 1 está pronta; @maria foi marcada para o parecer — quando ela responder, me chame com o número da issue"). Assíncrono é o padrão; a Entry Point B é o mecanismo de continuação. Nunca segure o humano esperando nem simule o parecer. Atualize `Subestado: aguardando-parecer`.
- **Verificação do gate (quando retomar):** filhas uma a uma via `fluxo_issue_digest` — fechadas E artefato declarado existente no repo, modificado no período da rodada (tarefa fechada sem artefato NÃO conta → microcopy §7.2 "artefato não encontrado"). Checklist proporcional à variante, sempre incluindo `escopo.md`.
- Gate incompleto → lista EXATA do que falta + assignees ("não" com caminho, nunca "ainda falta coisa" — microcopy §7.1 gate bloqueado). Pedido de pular gate → microcopy §7.1 (tentativa de pular gate) + override P3 com defesa escalonada.

## ETAPA 4 — Passagem de bastão (onda da Etapa 2)

Gate verificado → distribuição P7 (microcopy §7.6 — sugestão justificada, confirmação consolidada, nenhuma issue antes) → tarefas-filhas da Etapa 2 (cada uma declarando a classe REFERÊNCIA/REGISTRO + local) → comentário de gate (microcopy §7.1 gate cumprido) → metadados (`Etapa atual: etapa-2`, `Subestado: em-artefatos`) → board → handoff (microcopy §7.10 Etapa 1→2).

Lidere com o valor visível ("criei as 3 tarefas da Etapa 2, já atribuídas"), não com a burocracia. O humano da Etapa 1 sai sabendo que seu papel agora é consultado/aprovador.

## Critérios de sucesso da jornada

- 100% dos pacotes com critérios de aceite + fora de escopo (bloqueante); RF/RNF com ID contínuo; fora de escopo ≥1 item.
- Pasta da rodada nascida e linkada; `escopo.md` no pacote; parecer registrado como comentário com data.
- Zero termo da lista negra P4 nas mensagens; 100% das tarefas da onda com assignee confirmado.
