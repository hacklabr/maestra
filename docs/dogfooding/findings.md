# Dogfooding findings — falhas do fluxo observadas em uso

> Registro append-only de inconsistências, falhas e atritos do **próprio fluxo
> Maestra** detectados durante o uso (dogfooding). Cada entrada é uma candidata
> a scope de uma futura round do Maestra sobre si mesmo.
>
> **Não confundir com `doc-bug`:** aquele é contradição **documentação × código
> do produto** (trigger #16, entra no funil como Minimal). **Este arquivo**
> captura falhas do **fluxo/plugin Maestra** — ferramenta que falhou, instrução
> ignorada, board divergente, atrito ergonômico. Origem diferente, destino
> diferente.

## Como usar

- **Append-only.** Nunca reescreva ou remova entrada existente; atualize
  `Status` quando resolver/triar.
- **ID incremental:** `F001`, `F002`, … (próximo ID livre no cabeçalho de cada
  entrada nova).
- **Quando registrar:** ao detectar a falha, **antes de prosseguir** — nunca
  consertar inline sem registro (orientação consolidada em `AGENTS.md` →
  "Dogfooding").
- **Categorias:**
  - `tool-retry` — ferramenta (`maestra_status`/`maestra_issue_digest`/
    `maestra_emit_event`/`ask_peer`) falhou ou exigiu ≥2 tentativas
  - `board-state` — card/label/variante/etapa divergente do esperado
  - `instruction-ambiguous` — facilitador desobedeceu ou interpretou errado
    instrução do kernel/jornada/cookbook
  - `doc-contradiction` — comportamento real do plugin divergente de
    `fluxo-de-senvolvimento.md` / `jornadas.md` / `README.md`
  - `ergonomic-friction` — funciona, mas é custoso/lento/confuso (melhoria de
    UX do próprio fluxo, não bug estrito)
- **Ciclo:** na próxima triagem do Maestra sobre o próprio Maestra, entradas
  `Status: open` são candidatos a scope (`docs/rounds/Rnn-…/scope.md`). Ao
  virar scope, marcar `Status: triaged→Rnn`.

## Template de entrada

```
## Fnnn — <título curto>
- Data: YYYY-MM-DD
- Categoria: tool-retry | board-state | instruction-ambiguous | doc-contradiction | ergonomic-friction
- Origem: sessão/round/issue onde ocorreu (ex: R01, #12, sessão ad-hoc)
- Sintoma: o que foi observado (factual, sem juízo)
- Tentativas/workaround: quantas, o que finalmente funcionou
- Status: open | triaged→Rnn | resolved
```

---

## F001 — Baton-pass (tasks filhas) aplicado em variante Minimal
- Data: 2026-07-28
- Categoria: instruction-ambiguous
- Origem: R01, issue #1, sessão de condução Stage 1 (J3)
- Sintoma: Após concluir a avaliação de viabilidade do pacote Stage 1, o Facilitador propôs criar task de Stage 3 como filha da issue, oferecendo como alternativa "implementação direta nesta sessão". Na variante Minimal o fluxo corre inteiro numa única issue — não há onda de tasks filhas de Stage 2/3. O Facilitador aplicou a lógica de baton-pass do Full/Condensed numa variante que não a usa.
- Tentativas/workaround: O humano corrigiu ("não deveria ter uma nova issue, certo? O fluxo todo segue em uma única issue?"); o Facilitador reconheceu o erro e corrigiu o encaminhamento para implementação direta na mesma issue.
- Status: open

<!-- Próximo ID: F006. Registre novas entradas abaixo, em ordem cronológica. -->

## F002 — Facilitador pulou gate de entrada do kernel ao receber demanda em texto livre
- Data: 2026-07-28
- Categoria: instruction-ambiguous
- Origem: R01, sessão inicial, primeira mensagem do humano ("Quero que seja feita uma orientação…")
- Sintoma: Ao receber texto livre descrevendo uma demanda, o Facilitador NÃO executou `maestro_status` nem carregou o módulo J1 de triagem. Partiu direto para `read`/`bash`/`grep` explorando o codebase. O kernel é explícito: "First action of every session: `maestro_status`" e "Free text describing a demand → read journeys/j1-triage.md, follow J1". O gatilho anti-bypass #1 cobre contestação de variante em triagem, mas NÃO cobre o caso de a triagem ser inteiramente pulada.
- Tentativas/workaround: O humano interpelou ("Você está seguindo o fluxo da maestra? Você não deveria estar fazendo uma triagem?"). O Facilitador reconheceu a falha de adesão, diagnosticou as 3 violações encadeadas (status, entry router, persona assistente) e reiniciou o fluxo corretamente. Esta falha é a origem da própria issue #1.
- Status: open

## F003 — maestra_emit_event rejeita payload em todos os formatos (3 tentativas)
- Data: 2026-07-28
- Categoria: tool-retry
- Origem: R01, triagem das issues #1 e #2 (tentativa de emissão dos eventos A e B)
- Sintoma: O tool `maestra_emit_event` retornou "Error: Invalid payload for event type 'A': : Expected object, received string" em 3 chamadas consecutivas, com payload passado como objeto JSON em formatos variados. Causa-raiz: o host (opencode/mimocode) não re-parseia args via zod — o schema serve apenas para geração de JSON Schema. Argumentos objeto chegam como string JSON serializada no runtime, e o `z.object()` interno de `buildEventBody` rejeita. Apenas `emit-event` tinha argumento objeto (`payload`), daí o bug ser específico a ele. Os testes unitários não capturavam pois chamam `execute` diretamente com objetos, sem passar pelo host.
- Tentativas/workaround: 3 tentativas falharam; nenhuma funcionou na sessão. A correção foi implementada e mergeada como issue #2 (commit `d13d99e`): `JSON.parse()` no `execute` quando payload chega como string. Validada em sessão posterior após reload do plugin.
- Status: resolved (issue #2)

## F004 — Metadata da issue divergente do estado real (board/label)
- Data: 2026-07-28
- Categoria: board-state
- Origem: R01, issue #2, sessão de retomada (J2)
- Sintoma: Após o merge da implementação da #2, o campo de metadata da issue (`Substate: triage`, `Current stage: 1`) permaneceu defasado em relação ao estado real (label `stage-3`, board `in review`). O Facilitador não atualizou a metadata no ato do merge/transição — só atualizou label e board, não o campo P1 de metadata. O J2 detectou a divergência no digest da sessão seguinte (facts win over field, trigger #6).
- Tentativas/workaround: Detectado via `maestro_issue_digest` na retomada. Correção do campo pendente (narrada na derivação).
- Status: open

## F005 — Round folder R01 não foi criado no primeiro commit de artefato
- Data: 2026-07-28
- Categoria: instruction-ambiguous
- Origem: R01, issues #1 e #2
- Sintoma: O Facilitador conduziu triagem e execução da #2 sem nunca criar `docs/rounds/R01-…/scope.md` nem `deviations.md`. O J1 Stage 5 é explícito: "The round folder is NOT born here — it is born at the first artifact commit (J3/J6 Stage 1), **always, in all variants**". Sem esses documentos, a reconciliação (J5 Stage 5) não tem como verificar paridade nem onde registrar desvios. O Facilitador passou direto da triagem para a execução.
- Tentativas/workaround: O humano interpelou ("depois me explique pq nenhum arquivo foi criado na pasta docs/specs"). O Facilitador reconheceu a falha (mesma natureza do desvio do gate de entrada — viés de execução). Regularização pendente.
- Status: open
