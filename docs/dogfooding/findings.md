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
- Status: open

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
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

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
- Status: open

## F018 — Movimento de card declarado ("depois do seu OK") não executado; trabalho real já corria
- Data: 2026-07-28
- Categoria: board-state
- Origem: R02, issue #8, sessão de retomada (J2)
- Sintoma: Ao apresentar a derivação de estado, o Facilitador narrou a intenção de mover o card #8 de "Ready" para "In progress" condicionada à confirmação do humano ("vou mover pra 'In progress' depois do seu OK"). O humano confirmou a derivação. Em vez de mover o card em seguida, o Facilitador mergulhou na leitura das descobertas (scope, ADR, painel) e no início da execução (criação de worktree, planejamento de todos) — sinais inequívocos de "trabalho iniciado" — sem executar o movimento declarado. O board permaneceu em "Ready" (estado de `awaiting-assessment`/baton) enquanto a execução já corria. O humano precisou interpelar ("Você não esqueceu de mover a tarefa para em progress?"). Mesma família do F010 (card não movido ao iniciar trabalho), com agravante: aqui o movimento foi *explicitamente declarado* e depois abandonado quando o trabalho profundo começou — o board-touch foi tragado pela imersão na execução.
- Tentativas/workaround: O humano apontou a lacuna. O Facilitador reconheceu e iniciou a regularização (mover o card). Padrão recorrente: a narração do movimento ("vou mover") é tratada pelo Facilitador como se o executasse, quando na verdade é apenas uma intenção — o `gh project item-edit` precisa ser de fato chamado. J2 STAGE 3 / J5 STAGE 1 dizem "move AFTER confirmation, narrating" — falta reforço de que a narração não substitui a execução, e de que a criação de worktree é um gatilho inequívoco (kernel #9) de que o card já deveria estar em "In progress".
- Status: open

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
- Status: open

## F019 — Card não movido para "in review" ao abrir o PR (transição de aceitação ausente)
- Data: 2026-07-28
- Categoria: board-state
- Origem: R02, issue #8, abertura do PR #11
- Sintoma: Após concluir a implementação, commitar, fazer push e criar o PR #11, o Facilitador deixou o card #8 em "In progress". O P6 (protocols) e o J5 STAGE 3 são explícitos: "Board tracks acceptance (`In review`/`Delivered`), never before it". A abertura do PR é a transição de "execução" (In progress) para "aceitação pendente" (in review) — o trabalho está implementado e aguardando review, não mais em execução. O board ficou defasado (dizia "em execução" quando a realidade era "aguardando review") até o humano interpelar ("você não deveria ter colocado a issue em 'in review'?"). Complementa F010 (não moveu ao iniciar) e F018 (declarou mas não executou): aqui a transição inteira foi omitida — não houve nem narração nem execução. O Facilitador tratou a abertura do PR como passo puramente técnico (git push + gh pr create) e desacoplou-a do touchpoint do board, quando são a mesma transição de estado.
- Tentativas/workaround: O humano apontou. O Facilitador moveu o card para "in review" (verificado via GraphQL). Padrão recorrente na família F010/F018/F019: o board é o touchpoint mais frequentemente negligenciado — a execução técnica (worktree, commit, push, PR) é percetida como "o trabalho real", e o movimento do card como overhead. P6/J5 precisam amarrar a abertura de PR/MR à transição "In progress → in review" como ato único, não opcional.
- Status: open

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
- Status: open

<!-- Próximo ID: F025. Registre novas entradas abaixo, em ordem cronológica. -->

## F020 — Onda de Stage 3 (#7, #8, #9) criada com metadado `epic: 3` mas sem link de sub-issue
- Data: 2026-07-28
- Categoria: board-state
- Origem: R02, issue #9, sessão de retomada (J2)
- Sintoma: Ao digerir a issue #9 (título "...reconciliação", metadados `epic: 3`, `round: R02`, `substate: awaiting-reconciliation`), o `maestra_issue_digest(9)` retornou `parent: null`. Digest simétrico do épico #3 listava apenas #4, #5, #6 como children — #9 não aparecia. Verificação subsequente mostrou o mesmo padrão em #7 (implementação) e #8 (evals), ambas fechadas/Done com `parent: null` e metadado textual `epic: 3`. Ou seja: a onda **inteira** de Stage 3 (#7, #8, #9) foi criada com o campo de metadata `epic: 3` preenchido no corpo, mas o link estrutural de sub-issue (fonte de verdade do gate arithmetic) nunca foi estabelecido para nenhuma das três. Consequências: (1) o gate de reconciliation do épico reportava `exists: false` porque a enumeração de filhas não enxergava #9; (2) a aritmética de gate do Stage 3 do épico não computava as tasks de implementação (#7, #8); (3) ao retomar #9, o branch B4 (digest the parent) não era acionado via hierarquia — só via o metadado textual `epic: 3`, que é frágil. Causa-raiz provável: a criação das tasks de Stage 3 (#7, #8, #9) usou apenas o campo de metadata textual (`**Epic:** #3` no corpo) e omitiu a mutation `addSubIssue` (GraphQL) que estabelece a hierarquia estrutural — enquanto as tasks de Stage 1/2 (#4, #5, #6) foram corretamente linkadas.
- Tentativas/workaround: Detectado pela divergência `parent: null` × metadado `epic: 3` em #9, depois confirmado para #7 e #8. Regularização aplicada na mesma sessão: link de sub-issue estabelecido para #7, #8 e #9 (mutation `addSubIssue` em #3). Gate de reconciliation do épico agora reporta `exists: true, state: open, number: 9`; gate de Stage 3 reflete `{closed_: 2, total: 3}` (#7, #8 fechadas; #9 reconciliação aberta).
- Status: resolved (sub-issue links estabelecidos para #7, #8, #9 nesta sessão)

## F002 — Facilitador pulou gate de entrada do kernel ao receber demanda em texto livre
- Data: 2026-07-28
- Categoria: instruction-ambiguous
- Origem: R01, sessão inicial, primeira mensagem do humano ("Quero que seja feita uma orientação…")
- Sintoma: Ao receber texto livre descrevendo uma demanda, o Facilitador NÃO executou `maestro_status` nem carregou o módulo J1 de triagem. Partiu direto para `read`/`bash`/`grep` explorando o codebase. O kernel é explícito: "First action of every session: `maestro_status`" e "Free text describing a demand → read journeys/j1-triage.md, follow J1". O gatilho anti-bypass #1 cobre contestação de variante em triagem, mas NÃO cobre o caso de a triagem ser inteiramente pulada.
- Tentativas/workaround: O humano interpelou ("Você está seguindo o fluxo da maestra? Você não deveria estar fazendo uma triagem?"). O Facilitador reconheceu a falha de adesão, diagnosticou as 3 violações encadeadas (status, entry router, persona assistente) e reiniciou o fluxo corretamente. Esta falha é a origem da própria issue #1.
- Status: open

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
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

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
- Status: open

## F005 — Round folder R01 não foi criado no primeiro commit de artefato
- Data: 2026-07-28
- Categoria: instruction-ambiguous
- Origem: R01, issues #1 e #2
- Sintoma: O Facilitador conduziu triagem e execução da #2 sem nunca criar `docs/rounds/R01-…/scope.md` nem `deviations.md`. O J1 Stage 5 é explícito: "The round folder is NOT born here — it is born at the first artifact commit (J3/J6 Stage 1), **always, in all variants**". Sem esses documentos, a reconciliação (J5 Stage 5) não tem como verificar paridade nem onde registrar desvios. O Facilitador passou direto da triagem para a execução.
- Tentativas/workaround: O humano interpelou ("depois me explique pq nenhum arquivo foi criado na pasta docs/specs"). O Facilitador reconheceu a falha (mesma natureza do desvio do gate de entrada — viés de execução). Regularização pendente.
- Status: open

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
- Status: open

## F007 — Duas pastas de round com número R01 (colisão de numeração)
- Data: 2026-07-28
- Categoria: instruction-ambiguous
- Origem: R02 (triagem), `docs/rounds/`
- Sintoma: Existem duas pastas em `docs/rounds/` com o mesmo número de round: `R01-2026-07-emit-event-payload` e `R01-2026-07-entry-gate-adherence`. O J3 Stage 1 é explícito: "Before writing, re-list `docs/rounds/`: Rnn = count + 1; collision (parallel round) → increment and re-announce." A colisão não foi detectada nem corrigida na criação da segunda pasta R01.
- Tentativas/workaround: Detectado ao listar `docs/rounds/` na triagem da nova demanda. Próximo round seguirá como R02 (máximo existente + 1). A colisão das duas R01 permanece não resolvida.
- Status: open

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
- Status: open

## F008 — Cartões movidos para "In progress" durante a triagem (movimento prematuro)
- Data: 2026-07-28
- Categoria: doc-contradiction
- Origem: R02 (triagem), issues #3 e #4
- Sintoma: Ao criar a epic e a tarefa-filha na triagem, o Facilitador moveu a #3 para "In progress" logo após confirmar a derivação. No entanto, o fluxo correto é: na triagem, todas as issues nascem em "Todo"/"Not started" e só passam para "In progress" quando a pessoa começa o trabalho na sessão seguinte. O P6 (cookbook/protocols) diz "Session start (issue received): Not started → In progress AFTER confirmed derivation", o que induz o movimento prematuro — a derivação confirmada NÃO significa que o trabalho começou, apenas que o entendimento está correto.
- Tentativas/workaround: O humano corrigiu ("você criou a tarefa e a colocou na coluna in progress. Isso não é correto. Nesse momento... fica tudo na primeira coluna, Todo"). O Facilitador moveu a #3 de volta para "Todo". O P6 precisa ser corrigido para distinguir "derivação confirmada" (tarefa criada, fica em Todo) de "trabalho iniciado" (próxima sessão, move para In progress).
- Status: open

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
- Status: open

## F010 — Card não movido para "In progress" ao iniciar trabalho real na sessão
- Data: 2026-07-28
- Categoria: board-state
- Origem: R02, issues #3 e #4, sessão de condução Stage 1 (J3)
- Sintoma: Ao começar a trabalhar de fato na issue #4 (Stage 1 do R02), o Facilitador NÃO moveu nem a #4 nem a #3 (epic mãe) para "In progress". O trabalho ocorreu por vários turnos (descoberta, briefing, scope) com o board ainda em "Todo". O Facilitador chegou a perguntar ao humano se devia mover ("posso mover a #4 para In progress?"), mas a instrução é mover ao iniciar o trabalho — não perguntar. Complementa o F008 (movimento prematuro na triagem): o P6 precisa distinguir claramente "derivação confirmada na triagem" (card fica em Todo) de "trabalho iniciado na sessão seguinte" (move para In progress, narrado, sem perguntar).
- Tentativas/workaround: O humano apontou ("você deveria ter colocado ela na coluna In Progress"). Regularização: card movido para "In progress" na sessão.
- Status: open

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
- Status: open

## F006 — Worktree criado em local fora do repo (convenção não documentada)
- Data: 2026-07-28
- Categoria: ergonomic-friction
- Origem: R01, issue #1, Stage 3 (J5) — implementação do gate de entrada
- Sintoma: O Facilitador criou o worktree em `/home/rafael/devel/Fluxo/maestra-r01-entry-gate` (irmão do repo), por ausência de convenção documentada de local de worktrees. O humano apontou o erro. Nenhum `.worktrees/` existia nem havia menção em `.gitignore`/AGENTS.md/kernel.
- Tentativas/workaround: Criou-se o worktree no local errado → commitou-se o trabalho → removeu-se com `--force` → recriou-se em `.worktrees/r01-entry-gate/` dentro do repo → adicionou-se `.worktrees/` ao `.gitignore`.
- Status: open

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
- Status: open

## F009 — Stage 1 "propose the draft" interpretado como criação de arquivo prematura (sem conversa de descoberta)
- Data: 2026-07-28
- Categoria: instruction-ambiguous
- Origem: R02, issue #4, sessão de condução Stage 1 (J3)
- Sintoma: O J3 Stage 1 diz "You PROPOSE the draft (problem, success metric, constraints) from the triage; the human edits, does not fill from scratch". O Facilitador interpretou "propose the draft" como criar o arquivo `mini-briefing.md` imediatamente e pedir ao humano que editasse o arquivo. O humano corrigiu: a descoberta é uma CONVERSA (perguntas, troca de ideias no chat); quando há informação suficiente, o rascunho é apresentado NO CHAT; só após aprovação o arquivo é criado. A instrução é ambígua quanto ao meio (arquivo vs chat) e omite a fase de conversa de descoberta que precede o rascunho — diz "propose", mas não diz "onde" nem "depois de conversar".
- Tentativas/workaround: O humano corrigiu ("Não quero que a edição seja feita no arquivo do minibriefing… pergunta as coisas, vou respondendo… apresenta rascunho aqui mesmo, aprovando você cria o documento"). O Facilitador removeu o arquivo criado prematuramente e reiniciou a descoberta como conversa.
- Status: open

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
- Status: open

## F012 — Facilitador confiou em config.md desatualizado em vez de verificar board real (coluna "Ready" ausente)
- Data: 2026-07-28
- Categoria: doc-contradiction
- Origem: R02, issues #3 e #4, sessão de condução Stage 1 (J3)
- Sintoma: Ao decidir para qual coluna mover os cards após o handoff (substate `awaiting-assessment`), o Facilitador consultou `.maestra/config.md` para ver as colunas disponíveis. O config listava apenas 4 colunas (Todo, In Progress, in review, Done) — mas o board real tem 5 (existe uma coluna "Ready"). O humano disse "Ready" e o Facilitador o corrigiu erroneamente ("o board não tem uma coluna Ready"), baseado no config desatualizado. Violação do trigger #6 (derivação sempre verificada, nunca inferida): o `maestra_status` reportou board: "read" — era possível e devido consultar as colunas reais via API antes de afirmar algo sobre o board.
- Tentativas/workaround: O humano apontou ("O board tem uma coluna Ready, mas o arquivo de configuração aqui da maestra está desatualizado"). O Facilitador verificou o board real via `gh project field-list`, confirmou a coluna "Ready", moveu os cards para lá e atualizou o config.md in-place.
- Status: open

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
- Status: open

## F011 — Card fica em "In progress" durante awaiting-assessment (P6 não mapeia substate a coluna)
- Data: 2026-07-28
- Categoria: board-state
- Origem: R02, issues #3 e #4, sessão de condução Stage 1 (J3)
- Sintoma: Após concluir os artefatos do Stage 1 e fazer o handoff assíncrono (substate `awaiting-assessment`), o Facilitador deixou a #4 e a #3 em "In progress". O P6 cobre "Session start → In progress" e "Conclusion → In review/Delivered", mas NÃO mapeia o substate `awaiting-assessment` a uma coluna específica. O humano apontou: sem um sinal visual no board, não há como distinguir "alguém está trabalhando" de "está esperando a próxima etapa pegar" — mesmo a mesma pessoa não saberia que precisa voltar à tarefa.
- Tentativas/workaround: O humano apontou ("deveria ter sido colocada na coluna Ready"). Hipótese do Facilitador: a coluna "In review" é a que melhor traduz `awaiting-assessment` (trabalho da etapa feito, aguardando revisão de viabilidade). Regularização: card movido para "Ready" (coluna que indica "pronto para ser pego pela próxima etapa"). P6 precisa mapear substates a colunas (`awaiting-assessment` → Ready; `paused` → In progress com comentário).
- Status: open

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
- Status: open

## F013 — Avaliação de viabilidade tratada como comentário em vez de tarefa separada
- Data: 2026-07-28
- Categoria: instruction-ambiguous
- Origem: R02, issues #3 e #4, sessão de condução Stage 1 (J3)
- Sintoma: Ao concluir os artefatos do Stage 1, o Facilitador registrou o handoff para a avaliação de viabilidade como um COMENTÁRIO na issue #4, em vez de criar uma nova tarefa e fechar a #4. O J3 Stage 3 diz "assign the task + comment mentioning the Engineering person", que é ambíguo — pode significar "atribuir a task atual à Engenharia" ou "criar uma nova task de avaliação". O humano apontou: analisar viabilidade é trabalho diferente de escrever escopo; comentário não é tarefa; a #4 deveria ter sido fechada e uma nova tarefa criada para a avaliação. Sem tarefa separada, o trabalho de avaliação fica invisível no board.
- Tentativas/workaround: O humano corrigiu ("deveria ter sido criada uma nova tarefa para a análise de viabilidade e ter fechado essa #4"). Correção: fechar #4 com veredito, criar nova tarefa de avaliação como filha de #3.
- Status: open

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
- Status: open

## F014 — Tasks filhas de Stage 1 criadas incrementalmente em vez de todas na triagem
- Data: 2026-07-28
- Categoria: instruction-ambiguous
- Origem: R02, issues #3, #4 e #5, sessão de condução Stage 1 (J3)
- Sintoma: Na triagem do Stage 1, o Facilitador criou apenas uma tarefa filha (#4 — descoberta e escopo). A tarefa de análise de viabilidade (#5) só foi criada ao final da condução, depois de o humano apontar o problema (F013). A sequência descoberta+escopo → análise de viabilidade é previsível e estrutural do Stage 1 (J3 cobre ambas); criar incrementalmente gera a impressão de trabalho ad-hoc, atrasa a visibilidade do board e obriga correções no meio da sessão. O humano apontou que dava para prever desde o início que haveria descoberta, escopo e análise de viabilidade — todas deveriam ter nascido na triagem.
- Tentativas/workaround: O humano corrigiu ("já dava para prever inicialmente que teria a descoberta, o escopo, a análise de viabilidade. Todas as issues devem ser criadas já no momento da triagem do stage 1"). Correção: #5 criada depois da correção. J3/J1 precisam definir a onda completa de Stage 1 (descoberta+escopo + análise de viabilidade) como criação única na triagem.
- Status: open

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
- Status: open

## F017 — Onda maximal (6 tasks paralelas) decomposta para variante Condensed onde as tasks são acopladas
- Data: 2026-07-28
- Categoria: instruction-ambiguous
- Origem: R02, issue #6, Stage 2 (J4 STAGE 3) — decomposição da onda de Stage 3
- Sintoma: Ao decompor a onda de Stage 3 do R02, o Facilitador criou 6 tasks paralelas (uma por arquivo: microcopy §7.2, j2 header, j3 três-fases, protocols P4, evals, reconciliação), invocando o critério do J4 STAGE 3 ("tasks paralelizáveis com boundaries declarados, sem sobreposição de arquivos"). O humano contestou: "É necessário mesmo criar tanta issue separada? Não poderia ser uma única issue, porque não é um trabalho assim tão monumental? Não faz sentido executar uma delas e não executar a outra." A fonte normativa (fluxo §4.4) define que Condensed = "igual [à Completa], com menos artefatos (seguindo a matriz da seção 3.5)" — e o critério de paralelização do J4 pressupõe mudanças independentes viabilizando trabalho paralelo de pessoas diferentes. Aqui: as mudanças são acopladas (o ADR-001 desenhou o imperativo curto com referência cruzada entre j2 header e microcopy §7.2; o template bifásico e o imperativo só funcionam juntos; os evals testam a implementação), o time é de 2 engenheiros sênior, e nenhuma das 6 é entregável sozinha. O teste de acoplamento ("não faz sentido executar uma e não a outra") falha para todas. A granularidade "uma task por arquivo" é apropriada à variante Completa com time grande e mudanças independentes — não ao Condensed acoplado. Primo do F001 (baton-pass aplicado ao Minimal): onda maximal aplicada ao Condensed onde as tasks são acopladas.
- Tentativas/workaround: O humano corrigiu. O Facilitador reconheceu o over-decomposição e rederivou a granularidade correta: 3 tasks (implementação do refactor / evals de não-regressão / reconciliação), todas atribuídas ao mesmo responsável. J4 STAGE 3 precisa de um critério explícito de granularidade por variante e de um teste de acoplamento ("esta task é entregável sozinha? faz sentido executá-la sem as outras?") antes de decompor em onda maximal — a paralelização só é critério quando as tasks são efetivamente independentes.
- Status: open

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
- Status: open

## F015 — Nomes de tasks filhas com prefixo "Stage 1" em vez do nome da demanda
- Data: 2026-07-28
- Categoria: ergonomic-friction
- Origem: R02, issues #4 e #5, sessão de condução Stage 1 (J3)
- Sintoma: As tasks filhas foram nomeadas com prefixo "Stage 1 —": "Stage 1 — descoberta e escopo (mini-briefing + scope)" (#4) e "Stage 1 — análise de viabilidade técnica (R02)" (#5). O prefixo "Stage 1" não comunica a qual demanda a tarefa pertence — lendo o título isolado, não se deduz que é do "Conversa mais acolhedora e direta no fluxo". O humano propôs padrão: "{nome da demanda} — {subtítulo}", ex.: "Conversa mais acolhedora e direta no fluxo — descoberta e escopo" e "Conversa mais acolhedora e direta no fluxo — análise de viabilidade técnica". O estágio já está no label (`stage-1`) e na metadata; repeti-lo no título desperdiça o espaço de comunicação.
- Tentativas/workaround: O humano propôs o padrão de nome correto. Correção das issues existentes: renomear #4 e #5 para o padrão. P1/J3 precisam definir o padrão de nome de task filha como "{nome da demanda} — {subtítulo}".
- Status: open

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
- Status: open

## F016 — Task de baton pass criada em "Todo" em vez de "Ready" (epic mãe já em progress)
- Data: 2026-07-28
- Categoria: board-state
- Origem: R02, issue #6, baton pass Stage 1→2 (J3 Stage 4)
- Sintoma: Ao criar a task #6 na onda de Stage 2 (baton pass após gate do Stage 1 verificado), o Facilitador colocou o card na coluna "Todo". Porém a epic mãe #3 já estava em "In progress" (trabalho do round já iniciado). A coluna "Todo" é a primeira coluna, usada quando as tarefas nascem na triagem — antes de o trabalho da epic começar. Quando uma task filha nasce de um baton pass (gate wave) e a epic já está em progress, ela deve ir para "Ready" (pronta para ser pega pela próxima etapa), não "Todo".
- Tentativas/workaround: O humano apontou. Regularização não aplicada nesta sessão (humano já havia iniciado a tarefa; card deixado como está). P6/J3 Stage 4 precisam distinguir "task nascida na triagem" (→ Todo, trabalho ainda não começou) de "task nascida em baton pass / gate wave" (→ Ready, epic já em progress, pronta para a próxima etapa pegar). Complementa F011 (mapeamento substate→coluna).
- Status: open

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
- Status: open

## F021 — Gate de entrada pulado após ler a própria falha (F002); "respeitar o gate" anunciado depois da violação
- Data: 2026-07-29
- Categoria: instruction-ambiguous
- Origem: sessão ad-hoc, demanda de planejamento (findings + ideas)
- Sintoma: Ao receber texto livre ("leia o arquivo de descobertas e o de ideias e planeje"), a primeira ação do Facilitador foi `read findings.md` + `glob` + `read ideas.md` + `read ROADMAP.md` — exploração do codebase sem `maestra_status` e sem carregar J1. Somente DEPOIS de ler cinco arquivos (incluindo o próprio F002, que descreve este exato padrão) é que o Facilitador chamou `maestra_status` e carregou `j1-triage.md`, anunciando com tom de correção: "vou respeitar o gate de entrada do kernel (que é justamente o ponto do F002)". O gate foi violado e a violação foi narrada como virtude processual — fechar o portão depois que o cavalo fugiu. Agravante direta do F002: o Facilitador leu a falha original, descreveu-a e a reproduziu na mesma sessão. O gate de entrada ("First action of every session: `maestro_status`") não é "primeira ação exceto quando o usuário pede leitura" — é incondicional.
- Tentativas/workaround: O humano interpelou ("Me explique então por que você me mandou uma mensagem que nem essa seguir…"). O Facilitador reconheceu a contradição e a causa honesta: priorizou a instrução literal do pedido ("leia os arquivos") sobre o gate inegociável do kernel. Sessão interrompida pelo humano; nova sessão será iniciada.
- Status: open

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
- Status: open

## F022 — Board não movimentado enquanto o facilitador reescrevia o P6 (board movement)
- Data: 2026-07-29
- Categoria: board-state
- Origem: sessão ad-hoc, issues #14, #17, #19, #21
- Sintoma: O Facilitador implementou correções para quatro issues (#14, #19 no Grupo B; #17, #21 no Grupo A), todas com cards em "Todo" no board. Em nenhuma das quatro o card foi movido para "In progress" ao iniciar o trabalho, nem para "In review" ao apresentar o trabalho concluído. O agravante supremo: as correções do Grupo B ERAM a reescrita do protocolo P6 (board movement) — incluindo as regras "execution ≠ narration", "move in the same act", "worktree creation is the canonical trigger". O Facilitador escreveu a regra e a violou na mesma sessão, da mesma forma que em F021 escreveu sobre o gate de entrada enquanto o pulava. Família F010/F018/F019 recorrente: o board-touch é sistematicamente tragado pela imersão na execução, mesmo quando a própria execução é sobre o board.
- Tentativas/workaround: O humano interpelou ("Por que você não movimentou o board?"). O Facilitador reconheceu imediatamente. Regularização pendente.
- Status: open

## F023 — Worktree criado fora de `.worktrees/` (recorrência de F006)
- Data: 2026-07-29
- Categoria: ergonomic-friction
- Origem: R03, issue #22, Stage 3 (J5) — implementação do quick-capture
- Sintoma: O Facilitador criou o worktree em `../maestra-r03-triagem-rapida` (irmão do repo) em vez de `.worktrees/r03-triagem-rapida`. O humano corrigiu ("A pasta está no caminho errado"). Recorrência exata do F006 — a convenção `.worktrees/` foi estabelecida e registrada no F006, mas o Facilitador não a seguiu na sessão seguinte.
- Tentativas/workaround: O humano corrigiu imediatamente. Worktree removido do local errado, branch preservada, recriada em `.worktrees/r03-triagem-rapida/`. A convenção documentada no AGENTS.md/kernel não foi internalizada.
- Status: open

## F024 — `maestra_emit_event` payload diverge da documentação (`override_type` vs `type`)
- Data: 2026-07-29
- Categoria: doc-contradiction
- Origem: R03, issue #22, emissão de override register + Event D
- Sintoma: O `reference/instrumentation.md` documenta os campos do payload de `type=override` como `type`, `contested_criterion`, `stated_reason` (linhas 197-203) e do `type=D` como `contested_criterion` (linhas 114-116). O schema zod real da ferramenta exige `override_type`, `disputed_criterion`, `declared_reason`. O Facilitador tentou primeiro com os nomes documentados e recebeu erro de validação ("Invalid payload for event type override: override_type: Required; disputed_criterion: Required; declared_reason: Required"). Causa 2 chamadas falhas antes de corrigir. O `instrumentation.md` é declarado como cópia do schema da ferramenta ("these formats are a copy of the tool's zod schema — if the tool changes, this file changes with it"), mas divergiu.
- Tentativas/workaround: Lido o erro, corrigidos os nomes dos campos para o schema real, emissão bem-sucedida. A divergência documentação × código (trigger #16) deve ser formalizada como `doc-bug`.
- Status: open
