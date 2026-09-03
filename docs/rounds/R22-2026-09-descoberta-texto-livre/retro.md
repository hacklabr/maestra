# Retro of round R22 — Descoberta profunda para demandas em texto livre

## Round signals

- **Specification gaps:** 0 — nenhuma dúvida de especificação surgiu na implementação. Nota meta: esta round foi o primeiro uso real do método que ela própria entrega — descoberta com magnitude declarada + coverage map aprovada sem rodadas de aprofundamento; o rascunho cobriu o suficiente para o design sair arquivo-a-arquivo sem volta.
- **New requirements discovered in Stage 3:** 0.
- **Late infeasibilities:** 0 — viabilidade confirmada no design (round de instruções + eval, sem código de produto).
- **Documentation contradictions (`doc-bug`):** 0 abertas nesta round. Recorrência conhecida registrada: F024 (instrumentation.md × schema zod dos eventos) — 3ª ocorrência, ao emitir o Evento D (a documentação pede `contested_criterion`, o schema exige `disputed_criterion`; 1 retry).
- **Registered overrides:** 1 — gate: merge local × merge pela plataforma (decisão do humano; override + Evento D registrados na #59).
- **Feedback:** 0.

## Process learnings

- **Colisões de numeração em sessões paralelas são o padrão do dia.** Três rounds nasceram no mesmo dia (R20/#58, R21/#60 calibração, esta R22/#59) e esta precisou de DUAS renumerações em cadeia (→R21 no nascimento, →R22 no merge). O gate "re-listar antes do nascimento + verify-on-commit" funcionou, mas o custo de renumerar em cascata (pasta, scope, ADR, changelogs, fixture de eval, PR, metadata) é real — candidato a finding de ergonomia (ex.: reservar o número de round em arquivo leve no início da sessão, antes de qualquer artefato).
- **Edição de instruções exige âncoras curtas e únicas + revisão de diff antes do commit.** Um bloco inserido no lugar errado (j3, recuperado com `git checkout`) e uma linha duplicada (kernel Phase 2) foram pegos pela revisão de diff — a etapa se pagou. Duas chamadas de ferramenta saíram corrompidas (JSON) e foram refeitas limpas; zero resíduo chegou ao merge.
- **A epic #59 nasceu antes da regra RF-67 existir** — não carrega o marcador `Born from: free text` que ela própria introduziu. A regra vale daqui pra frente; registrado para honestidade do dogfooding.
- Consolidação cross-round segue no roadmap; este registro está pronto para ela.

## Closing without reconciliation?

(não aplicável — reconciliação executada na sessão)
