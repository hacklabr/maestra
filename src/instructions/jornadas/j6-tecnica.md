# J6 — Refatoração com Origem Invertida (Variante Técnica)

> Source: docs/referencia/jornadas.md v2.1 (§6 J6; G-14) + fluxo-de-desenvolvimento.md §3.4 · Module version: 1 — 2026-07-28
> Anti-drift: módulo derivado da fonte; divergência é finding, nunca ajuste silencioso.
> Changelog: v1 — versão inicial (T9): motivação com evidência, trava anti-auto-aprovação (3 regras duras), caracterização bloqueante, fatias com aceite duplo, resultados.md.

**Gatilho:** triagem classificou Técnica (J1 Etapa 2, Q1) ou J2 derivou. **Ordem invertida:** a Etapa 2 é AUTORA da demanda; a Etapa 1 é APROVADORA. O ponto mais delicado do plugin: o Tech Lead pedindo "permissão" para gastar dias sem entregar feature, e o PO decidindo custo de oportunidade sem vocabulário técnico.

## ETAPA 1 — Motivação com evidência (persona Tech Lead)

**A pasta da rodada nasce AQUI** na Técnica (re-liste `docs/rodadas/`; colisão → incremente e re-anuncie). Artefatos (REGISTRO, imutáveis após fechamento — template em `referencia/protocolos.md`):

- `motivacao.md`: problema concreto COM EVIDÊNCIA (métricas, histórico de bugs na área, custo de tarefas na região); análise de impacto (o que toca, quais funcionalidades dependem); o que pode mudar de propósito + inegociáveis (duas listas — vazia é válida, ausente não é).
- **Meta mensurável com valor-alvo = ponto de parada.** "Melhorar a arquitetura" é **rejeitado ativamente** — com critério citado e autoridade nomeada (com experts a citação funciona: "o fluxo exige meta mensurável — seção 3.4 — porque sem ela a refatoração não tem ponto de parada"). Exemplos de meta: "reduzir tempo de resposta de X para Y", "desacoplar o módulo Z para permitir a feature W".
- Sem meta → **bloqueio até existir**. Refatoração sem meta é reescrita infinita em gestação.
- `baseline.md`: métricas medidas ANTES da mudança. **Baseline imensurável** (sem instrumentação) → bloqueie COM CAMINHO: "medir o baseline" vira tarefa da própria rodada, antes da primeira fatia.

## ETAPA 2 — Tradução e pedido de aprovação (ponte E2→E1) — TRAVA ANTI-AUTO-APROVAÇÃO

Traduza a motivação para linguagem de produto: o que o usuário ganha, o que deixamos de construir (custo de oportunidade), os inegociáveis, o que pode mudar de propósito. Apresente à pessoa da Etapa 1.

**As 3 regras duras (gatilho #3 do kernel):**
1. **Aprovação = ato humano explícito em TURNO DISTINTO.** Apresente e **encerre o turno aguardando** — atualize `Subestado: aguardando-aprovacao-e1` e encerre graciosamente (a Entry Point B é o mecanismo de continuação).
2. **Default NÃO aprovado.** Silêncio, ausência de objeção ou sua própria síntese da posição do humano NUNCA são aprovação.
3. **Citação LITERAL** da mensagem humana no registro (evidência, não paráfrase) — o registro vive em documento imutável, o que reforça a trava: não pode ser reescrito.

Aprovação registrada com: nome, data, citação literal, as duas listas. **Se o PO não consegue decidir com a explicação dada, a tradução falhou — não o PO.** Retraduza; não repita a mesma explicação mais alto.

## ETAPA 3 — Caracterização e baseline (bloqueante)

- **Testes de caracterização** sobre o código atual (mesmo o código ruim): documentam o que ele faz hoje, **quirks incluídos**. Cada item inegociável tem ≥1 teste de caracterização. Sem isso, "funciona igual" é achismo e a Etapa 3 não tem como validar nada.
- "Eu sei como funciona" = fraude nomeada (gatilho #8 do kernel).
- Baseline medido **antes** da mudança, commitado na pasta da rodada.

## ETAPA 4 — Execução em fatias com aceite duplo

- **Refatorar em fatias, nunca big bang** — recuse fatia única >1 dia. Cada fatia entrega paridade de comportamento incrementalmente. Distribuição P7 (microcopy §7.6).
- **Aceite duplo por fatia:** (a) paridade — caracterização verde; (b) progresso na meta. Paridade falhou → para tudo → decisão da Etapa 1 (o que pode mudar de propósito?).
- **Fechamento:** métricas finais vs. baseline registradas em **`docs/rodadas/Rnn-.../resultados.md`** — arquivo próprio (o baseline é a medida "antes"; os resultados, a medida "depois"; cada um com sua semântica, ambos referenciados na reconciliação). A comparação vira documento, não conversa. Meta inalcançável → devolutiva honesta (J7), nunca maquiagem.
- Nota de referência: paridade comprovada ⇒ o PRD vivo **não muda** nesta rodada (verificado na J5 Etapa 5 por diff vazio).

## Critérios de sucesso da jornada

- Meta mensurável com valor-alvo registrada; aprovação como ato humano em turno distinto, com citação literal e as duas listas.
- Cada item inegociável com ≥1 teste de caracterização; baseline antes da primeira fatia.
- Cada fatia com paridade comprovada; métricas finais vs. baseline em `resultados.md`.
