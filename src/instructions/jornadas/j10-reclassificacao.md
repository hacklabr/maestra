# J10 — Reclassificação de Variante

> Source: docs/referencia/jornadas.md v2.1 (§6 J10) + fluxo-de-desenvolvimento.md §3.6.3 · Module version: 1 — 2026-07-28
> Anti-drift: módulo derivado da fonte; divergência é finding, nunca ajuste silencioso.
> Changelog: v1 — versão inicial (T9): gatilhos, avaliação com critérios, execução atômica, saneamento da onda corrente.

**Origem:** reclassificação é legítima — se durante o trabalho a demanda crescer (ou encolher), qualquer pessoa pode pedir. O que não pode é executar demanda grande com artefatos de demanda pequena. MVP: versão mínima **reativa + gatilhos sistêmicos**.

## Gatilhos

1. **Pedido humano** — qualquer pessoa, a qualquer momento, em qualquer jornada.
2. **Pendência técnica confirmada** pela Etapa 2 (foi declarado na triagem — não surpreende ninguém; ver J4 Etapa 2).
3. **Crescimento detectado por você** (critérios de escala passaram a se aplicar) → sugira **máx. 1 vez por demanda**. A sugestão cita os critérios que passaram a se aplicar; a decisão é humana.

## ETAPA 1 — Avaliação e decisão

- Apresente os **critérios objetivos que mudaram** (ex.: "a estimativa passou de 5 dias e agora toca o que outros consomem — os critérios apontam Condensada").
- **Decisão humana explícita.** Contra os critérios → override P3 via `maestra_emit_event type=override` (direção + critério contestado registrados — evento D na mesma emissão), com aviso de risco em 1 frase quando a reclassificação é para BAIXO contra critério presente. Nunca bloqueio: a decisão é soberana.
- Critério de sucesso: decisão explícita; nunca demanda grande com artefatos de demanda pequena.

## ETAPA 2 — Execução atômica

**No mesmo ato** (register-then-act; falha parcial → relato exato + retomada idempotente):

1. **Comentário de registro** no épico (P3 — já emitido no passo anterior se houve override; se a reclassificação segue os critérios, registre a mudança como comentário simples assinado);
2. **Label** da variante nova na issue-mãe (labels de variante são exclusivas — remova a antiga);
3. **Linha de metadados** atualizada;
4. **Saneamento da onda corrente:** tarefas abertas criadas sob a variante antiga — feche as obsoletas com comentário ("obsoleta pela reclassificação para X"), mantenha as válidas, crie as novas exigidas pela variante nova (distribuição P7 — microcopy §7.6, confirmação consolidada).

**A pasta da rodada já criada NÃO é alterada retroativamente** (registro imutável). A variante nova consta no épico e afeta **os artefatos seguintes** — a rodada corrente registra a mudança no `desvios.md` se ela divergir do planejado.

## Critérios de sucesso da jornada

- Atomicidade: label + metadados + comentário no mesmo ato; onda saneada (zero tarefa obsoleta aberta).
- Tarefas novas com assignee confirmado; pasta da rodada intocada retroativamente.
- Decisão registrada com critérios (ou override P3 com critério contestado nomeado).
