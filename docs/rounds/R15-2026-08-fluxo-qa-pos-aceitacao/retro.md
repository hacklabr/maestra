# Retrospective — R15 (Fluxo de QA pós-aceitação do PR)

> Round: R15 · Epic: [#49](https://github.com/hacklabr/maestra/issues/49) · Fechada em 2026-08-19 · Variant: Minimal (modo direto, sessão única)

## O que a round entregou

Modos configuráveis `close | qa` para o destino da task pós-aceitação do PR/MR: config em `workflow.md` na branch órfã (ADR-004), substates `awaiting-qa`/`qa-rejected` (P1.1/P6), sessão de QA guiada (J2 B7 + microcopy §7.14), item de setup na J12, operação `reassign-issue` nos cookbooks GH/GL, cenário de eval com contrato de ordem (apresentação antes de mutação; veredicto antes de transição). Tag v1.2.0.

## Métricas do fluxo

| Sinal | Valor |
|---|---|
| Evento A — perguntas de elicitação / deriváveis | 0 / 0 |
| Evento B — rodadas de correção do entendimento | 0 |
| Desvios durante × na reconciliação (evento F) | 3 × 1 |
| Testes na branch mergeada | 300/300 · eval:dry 60/60 |
| Verificação independente do facilitador (trigger #15) | bateria re-executada 2× (pré e pós-correção) |

## O que funcionou

- **Modo direto sessão única**: triagem → discovery → design → implementação → verificação → aceite → merge → reconciliação sem handoff assíncrono; gates mantidos como fronteiras de turno (consent gate §7.13 cumprido antes do worktree).
- **Derivação antes de perguntar**: classificação calibrada pelo histórico (#40/#41/#44 todas Minimal); dedup por busca; 0 perguntas deriváveis.
- **Verificação pré-aceite pegou a contradição ADR-003** que o design (feito contra estado legado) introduziu — correção na mesma sessão, 16 arquivos, sem custo de round extra.
- **Eval como guarda do dogfooding**: o cenário novo fixa o contrato de ordem da sessão de QA (nada muta antes do veredicto humano).

## O que doeu

- **F036 — design contra estado obsoleto**: li `.maestra/config.md` legado (pós-cutover R14) via fs direto e desenhei a config na árvore; o custo foi uma correção integral de implementação. Raiz dupla: passo de remoção da migração não executado neste clone + leitura fs sem passar pelo store não dispara aviso de config legada.
- **F035 — aviso `persona::` na delegação de implementação**: caminho de delegação não-painel poluído por aviso de painel; ambíguo para o delegador.
- **Escopo "sem src/" escrito antes da descoberta ADR-003**: desvio D2 necessário, mas evitável se o Stage 2 tivesse lido o ADR-003 no início (li só o ADR-002).

## Encaminhamentos

- F035, F036 → candidatos a scope de futura round (funil de triagem do próprio Maestra).
- Dogfood do modo `qa` fica pendente de pessoa com Specialty QA no `team.md` — quando mapeada, `maestra-config write workflow.md` com `post-pr-acceptance: qa` (não escrever o arquivo: ausência = `close`).
- Família F024 (instrumentation × schema zod) segue aberta — F034 é o caso mais recente.
