# Retrospective — R16 (Classificação de issues: tipo nativo + dimensão)

> Round: R16 · Epic: [#34](https://github.com/hacklabr/maestra/issues/34) · Fechada em 2026-08-28 · Variant: Minimal (modo direto, sessão única)

## O que a round entregou

Convenção de classificação de issues em dois eixos: **tipo** no campo nativo da plataforma (GitHub `Bug`/`Feature`/`Task` via `--type`, não label — decisão do autor na descoberta) e **dimensão** como labels livres (`gestão`, `melhoria`, `performance`, `devops`, `documentação`), aplicada em três pontos (triagem J1 derivada e confirmável; captura J11 com palpite curado de zero perguntas; convenção documentada para issues manuais). Puramente informativa: parser `digest-parse.ts` intocado (frozen scope), board/relatórios intocados (ADR-002 preservada). ADR-005 nova. Dogfood imediato: as 5 labels existem no repo e a própria #34 recebeu `Feature` + `melhoria`.

## Métricas do fluxo

| Sinal | Valor |
|---|---|
| Evento A — perguntas de elicitação / deriváveis | 0 / 0 |
| Evento B — rodadas de correção do entendimento | 0 |
| Desvios durante × na reconciliação (evento F) | 0 × 0 |
| Testes na branch mergeada | 300/300 · eval:dry 60/60 · `npm run ci` verde ponta a ponta |
| Verificação independente do facilitador (trigger #15) | suíte completa re-executada em 1ª pessoa + spot-check de diffs (J1, J11, cookbook-GH) |

## O que funcionou

- **Modo direto sessão única, de novo**: triagem → descoberta → design → implementação → verificação → aceite → merge → reconciliação sem handoff assíncrono; consent gate §7.13 cumprido antes da delegação (F032 não recorreu).
- **Dogfood da convenção no próprio round**: a #34 nasceu sem tipo e recebeu `Feature` + `melhoria` pelo mecanismo que a round implementa — prova viva no board.
- **A descoberta corrigiu o design barato**: o autor apontou na conversa que o GitHub já tem tipo nativo — a opção "label de tipo" morreu antes de virar código (uma pergunta certa no lugar certo).
- **Verificação em 1ª pessoa pegou o ambiente sem custo de round**: os 3 testes vermelhos do `npm run ci` no worktree eram o submódulo do catálogo não inicializado (F043) — isolado, contornado com `git submodule update --init`, suíte verde.
- **Delegação cirúrgica**: 10 arquivos + ADR-005, 69 inserções / 21 remoções, changelogs das jornadas bumpados no padrão da casa, zero mudança em `src/**/*.ts`.

## O que doeu

- **F041 (recorrência de F035)** — aviso `persona::` na delegação de implementação pela 2ª round seguida; o formato do marcador segue não documentado no ponto de delegação.
- **F024 (recorrência)** — `maestra_emit_event type=override` rejeitou o payload documentado em `instrumentation.md` pela 2ª vez na história do dogfooding; divergência doc × schema zod segue aberta desde R03.
- **F042** — colisão de numeração no findings.md (duas entradas F040) corrompeu a sequência incremental.
- **F043** — `npm run ci` vermelho em clone/worktree fresco até init do submódulo do catálogo; o checkout principal também está nessa condição.
- **Override de fluxo pós-aceitação**: merge local em vez de PR (decisão humana registrada) — a rota ADR-004 (PR + aceitação) não foi exercitada nesta round.
- **Gap de eval J11**: não existe cenário de captura rápida — o palpite de tipo (RF-46) nasce sem cobertura de eval; candidato a round futura.

## Insumos para próximas rounds

- F024 (doc × schema do override) e F041/F035 (marcador `persona::`) — ambos recorrentes, ambos de documentação; um round "documentação × realidade das ferramentas" resolve os dois.
- F043 — init do submódulo no `prepare` do npm ou nota de pré-requisito no README/AGENTS.
- Eval de captura (J11) — cobertura do contrato do palpite de tipo.
