# Scope of round R16 — Classificação de issues: tipo nativo + dimensão

> Epic: [#34](https://github.com/hacklabr/maestra/issues/34) · Variant: Minimal (modo direto)
> Briefing: a própria issue #34 (Minimal — a issue é o briefing), aprovado em sessão direta em 2026-08-28.
> Nota: Rnn = 15+1, sem colisão (re-lista antes do nascimento). RF-45.. = máximo existente (44) + 1.

## Variant

minimal

## Requirements introduced

- RF-45 — Toda issue criada pela triagem (J1) nasce com **tipo** no campo nativo do GitHub (`bug`/`feature`/`task`), definido pelo facilitador no ato da classificação (derivado do texto da demanda, confirmável como os demais critérios).
- RF-46 — Toda issue criada pela captura rápida (J11 / maestra-issue-writer) nasce com tipo = palpite curado do texto da demanda, sem perguntas adicionais (teto de ≤2 perguntas da captura preservado); a promoção via J1 confirma ou corrige o tipo no ato da classificação.
- RF-47 — Labels de **dimensão** (múltiplas por issue; lista inicial: `gestão`, `melhoria`, `performance`, `devops`, `documentação` — nomes conforme autor da demanda) aplicadas na triagem J1 quando fizer sentido ao trabalho descrito.
- RF-48 — Convenção documentada para issues criadas manualmente por humanos: usar o campo nativo de tipo + dimensão opcional (local exato da documentação definido no design técnico).

## Requirements changed

(nenhum — hoje não existe tipo nem dimensão; adição de convenção nova)

## Requirements discontinued

(nenhum)

## Out of scope for this round

- Parsing de tipo/dimensão pelo digest ou `maestra-report` — vocabulário do parser congelado por consenso (`src/tools/digest-parse.ts`), convenções novas são lidas raw.
- Mapeamento de tipo/dimensão para colunas do board (labels.md/ADR-002 permanece mapeando apenas labels de fluxo).
- Qualquer consumo automatizado (queries, estatísticas, relatórios por tipo) — puramente informativo neste round.
- Implementação específica GitLab: tipo nativo do GitHub agora; adaptação GL fica como pendência documentada (piloto futuro, conforme ROADMAP).
- Mudanças em `src/` (tools/hooks/adapter) não esperadas — round de instruções + convenção + labels do repo. Se o design técnico exigir código (ex.: gh CLI sem suporte ao campo nativo de tipo), registrar em deviations e reclassificar a variante se necessário.

## Acceptance criteria (do briefing aprovado)

1. Issue criada pela triagem J1 (épico ou tarefa-filha) nasce com tipo definido no campo nativo — visível na listagem do board sem abrir o corpo.
2. Issue criada pela captura rápida nasce com tipo (palpite curado do texto), sem aumento do teto de ≤2 perguntas; a promoção J1 confirma/corrige o tipo.
3. A lista inicial de 5 labels de dimensão existe no repo; na triagem o facilitador as aplica quando fizer sentido.
4. Digest, `maestra-report`, colunas do board e vocabulário do parser intocados (verificado por testes existentes verdes).
5. Convenção para issues manuais documentada nos arquivos de referência do plugin.
6. `npm run check:vocab` e `npm run eval:dry` verdes (jornadas em uso diário de dogfooding).
