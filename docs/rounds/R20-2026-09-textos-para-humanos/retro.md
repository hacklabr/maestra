# Retro — R20 (Textos que humanos leiam sem esforço)

> Epic: [#58](https://github.com/hacklabr/maestra/issues/58) · Merge: `0f1d029` (PR #61, merge local) · Fechamento: 2026-09-02

## O que a round entregou

microcopy §7.15 "Clear writing rules (every message)": quatro imperativos verificáveis — (1) referência interna glossada na primeira ocorrência; (2) inglês só como nome próprio da coisa; (3) curto sem omitir o relevante (o que aconteceu / o que significa / o que vem depois); (4) toda persona, inclusive técnica. Ponteiros de saliência nos dois kernels (Language policy) e no P4 (protocols.md), adendo datado no ADR-001 (doutrina estendida do tom para a clareza de conteúdo). Não-regressão: `assertInternalRefsExplained` (5 tipos de referência; gloss = pontuação E palavra explicativa numa janela de ±120 chars), cenário `r20-clear-writing` (T1–T4; o texto real do F047 reprova, a versão clara aprova), itens de rubric 11–13. Superfície: 5 arquivos de instrução/decisão + 7 de evals.

## Calibração e fluxo

- 1 pergunta de elicitação (dedup: nova demanda × continuação da R02 — exigida pelo gate, não derivável); 0 rodadas de correção de entendimento (eventos A/B = 1/0).
- Minimal (modo direto) confirmada sem contestação; ciclo inteiro numa sessão: triagem → descoberta → desenho → consentimento → implementação → QA → reconciliação.
- **Modo qa (ADR-004) respeitado pela primeira vez em modo direto**: issue não fechou no aceite; veredito de QA separado (merge + reinstalação + suíte no main mergeado) antes do fechamento.
- Sessão paralela R21 ativa o tempo todo (main avançou 2× durante a sessão). O `maestra/ops` detectou HEAD movido e PAROU antes de criar a worktree — o contrato de parada funcionou como desenhado; re-delegada com a base atual, merge final sem conflito.

## Desvios

- 4, todos declarados na execução (`deviations.md`): semântica do gloss AND (não OR), 2 wrappers de assert além do contratado, 3 configs promptfoo registradas, §7.15 reescrita para vocabulário neutro (check ADR-012).

## Findings

- **F047** (origem da round) → resolved (R20, PR #61).
- **F042** (adendo): recorrência — 3 falhas no `npm test` do main vindas da worktree da sessão paralela R21 (submódulo não inicializado — família F041/F043). Confirmado externo à R20 (worktree R20 standalone 326/326; main com `--exclude "**/.worktrees/**"` 326/326; eval:dry 66/66).

## Observações (fora do escopo, candidatas a rounds futuras)

- P1.1 não tem substate para "épico Minimal com PR aberto aguardando aceite" — usei `in-execution` até o aceite; lacuna leve do vocabulário fechado.
- A R21 paralela ("deep discovery for free-text demands") é adjacente ao tema comunicação — convém coordenar na triagem dela o que a §7.15 já cobre.
- F035/F041 (marcador `persona::`) não ocorreu: a delegação com o marcador na primeira linha do prompt rodou sem aviso — o formato funciona; a raiz (formato não documentado no ponto de delegação) segue aberta.
