# Scope of round R21 — Calibrar variante pelo tamanho do desenvolvimento

> Epic: [#60](https://github.com/hacklabr/maestra/issues/60) · Variant: Minimal (modo direto)
> Briefing: mini-briefing apresentado no chat e aprovado em sessão direta em 2026-09-02 (a issue #60 carrega o registro em duas camadas).
> Origem: relato do humano registrado como F050 (`docs/dogfooding/findings.md`) — sobreclassificação: demandas pequenas multi-área (ex.: checkbox em modal + default via variável de ambiente) sugeridas como Condensada; burocracia desproporcional. Override manual na mesma direção já registrado antes (R14, issue #48 — ver F034).

## Variant

minimal

## Requirements introduced

- RF-64 — **Eixo estrutural de tamanho como critério principal**: a classificação Mínima × Condensada × Completa passa a ser medida pela quantidade de funcionalidade nova construída — 1 comportamento/adição pontual e delimitada → Mínima; 1 capacidade coerente com vários comportamentos/parâmetros → Condensada; várias capacidades/sub-recursos → Completa (iniciativa com vida própria continua Completa). A contagem estrutural é o desempate final contra qualquer outro sinal.
- RF-65 — **Sinais secundários pesam, nunca gatilham sozinhos**: (a) estimativa de esforço em **dias de trabalho assistido por IA** (~1 dia assistido pesa Mínima) substitui ">5 dias de uma pessoa" como gatilho; (b) "toca ≥3 áreas" só conta quando há trabalho substancial em cada área — atravessamento fino não conta; (c) modelo de dados/contrato público, decisão técnica duradoura e comportamento já usado, em demanda pequena, **não elevam** a variante: viram pendências rastreadas e cuidados dentro da própria Mínima (comentário técnico na issue + critérios de aceite cobrindo o comportamento existente), com reclassificação declarada se a análise revelar porte maior.
- RF-66 — **Pergunta ao PO é estrutural, não cronológica**: em vez de "quanto tempo uma pessoa levaria?" (incalculável com IA no loop e inobservável pelo PO — regra de ouro), pergunta-se/deriva-se "é um ajuste num ponto só, ou uma funcionalidade com várias partes/comportamentos?".
- RF-67 — **Escada de exemplos calibradores escrita**: os 4 exemplos aprovados ficam na instrução de triagem e na fonte normativa como âncora objetiva — exportador multi-relatório → Completa; plugin exportador com parâmetros → Condensada; plugin de relatório único em CSV → Mínima; checkbox + variável de ambiente → Mínima.
- RF-68 — **Não-regressão por eval**: `evals/scenarios/j1-triage.yaml` cobre os 4 casos da escada com as classificações esperadas; cenários existentes revistos contra a nova regra.

## Requirements changed

- Fluxo §3.3 (fonte normativa, em `Fluxo.md` e `../fluxo-de-desenvolvimento.md`) — antes: lista disjuntiva de 5 critérios ("qualquer um" eleva Mínimo→Condensado) | agora: eixo estrutural de tamanho + sinais secundários conforme RF-64..67.
- Fluxo §3.6 risco 1 — antes: só o risco "tudo vira Mínimo por conveniência" | agora: incluído o risco inverso (sobreclassificação por sinal isolado), com a mesma guarda (critérios objetivos escritos).
- `j1-triage.md` Stage 2 (árvore + tabela de critérios + proposta de variante) — derivado de RF-64..66.
- `j10-reclassification.md` — exemplo de critérios citados atualizado para a nova régua (estimativa em dias assistidos / crescimento estrutural).
- `../docs/referencia/jornadas.md` §2–§3 — tabela de perguntas de triagem alinhada (wording PO/Tech Lead estrutural).

## Requirements discontinued

- "Estimativa maior que 5 dias de trabalho (de uma pessoa)" como gatilho isolado de Condensada — substituído pela estimativa em dias assistidos por IA como sinal secundário (RF-65a).

## Out of scope for this round

- Qualquer outra parte do fluxo que não os critérios de escala e seus pontos de citação.
- Thresholds de paralelização/granularidade de tarefas (J4 Stage 3).
- A conduta e a profundidade da descoberta (rodada R20, épico #59, em andamento).
- Limpeza/renumeração do `docs/dogfooding/findings.md` (F042/F046, entradas duplicadas) — demanda separada.
- Tradução das instruções internas do plugin para o português (convenção do repo: instruções em inglês).

## Acceptance criteria (do briefing aprovado)

1. A regra de escala em `src/instructions/journeys/j1-triage.md`, `Fluxo.md` §3.2–3.3 e na fonte normativa do diretório pai (`fluxo-de-desenvolvimento.md`, `docs/referencia/jornadas.md`) usa quantidade de funcionalidade como eixo principal; nenhum sinal secundário eleva sozinho uma demanda pequena.
2. O critério de tempo deixa de ser "5 dias de uma pessoa" e vira estimativa em dias assistidos por IA como sinal secundário; a pergunta ao PO é estrutural ("um ponto só ou várias partes?").
3. Demanda pequena com risco de regressão permanece Mínima — com o cuidado explícito no texto (aceite cobre comportamento existente; comentário técnico na issue; reclassificação declarada se crescer).
4. A escada de 4 exemplos está escrita na instrução de triagem e na fonte normativa.
5. `evals/scenarios/j1-triage.yaml` cobre os 4 casos da escada com as classificações esperadas; `npm run eval:dry` e `npm run ci` verdes.
