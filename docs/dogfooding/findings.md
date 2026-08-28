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
- Status: open (recorrência em R16, 2026-08-28 — mesma divergência `instrumentation.md` × schema zod ao registrar override de merge local; 2ª ocorrência registrada)
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

<!-- Próximo ID: F047. Registre novas entradas abaixo, em ordem cronológica. (Ver F042/F046: IDs duplicados F040/F041/F042 pré-existentes aguardam decisão de renumeração.) -->

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

## F025 — Fluxo bypassado ao receber pedido direto; humano precisa explicitamente "inicia o fluxo da maestra" a cada sessão (recorrência família F002/F021)
- Data: 2026-07-29
- Categoria: instruction-ambiguous
- Origem: sessão ad-hoc, relato do humano sobre padrão recorrente em uso
- Sintoma: O humano relata que, em VÁRIAS sessões iniciadas com o agente maestra ativo, o fluxo é bypassado sistematicamente. Ao receber um pedido direto que carrega um verbo de ação ("leia o documento [com a especificação]"), o agente executa o pedido (lê, e começa a fazer outras coisas) e ignora o gate de entrada (`maestra_status` → identificação do entry door → módulo de jornada) — só "lembrando" que é maestra quando o humano o interpela. O humano tem que explicitamente dizer "inicia o fluxo da maestra" a cada sessão para que o gate dispare. Recorrência da família F002/F021: a instrução que exigiria o gate EXISTE e é robusta (kernel §"Entry gate of every session", cláusula "The human's first message is the demand, not the procedure", trigger #17 que cita textualmente "leia os arquivos"/"explore o código" como casos em que o gate não pode ser pulado), mas a adesão falha mesmo diante de instrução explícita. O ponto-chave: a hipótese do humano ("falta instrução") colide com o fato de a instrução já existir — o problema real é saliência/posição da instrução no ponto de decisão do modelo, não ausência dela.
- Tentativas/workaround: O humano precisa interpelar ("inicia o fluxo da maestra") a cada sessão. A demanda que originou este registro visa resolver a causa-raiz (saliência do gate) nesta round.
- Status: open

## F026 — Capture-intent (J11) não detectado; roteador fez match com J1 em vez de J11
- Data: 2026-07-29
- Categoria: instruction-ambiguous
- Origem: sessão ad-hoc, humano pediu para registrar uma issue
- Sintoma: O humano abriu uma nova sessão e pediu ao facilitador para registrar uma issue (quick capture, intenção de J11). O roteador do kernel identificou como "free text describing a demand" (J1) e iniciou o fluxo de triagem completo em vez de simplesmente cadastrar a issue com agilidade via J11. O J11 e o capture-intent entry door existem (implementados em R03, issue #22), mas o roteador lista J1 primeiro e J11 como caso especial — o modelo faz match com a primeira porta (J1) antes de considerar J11. Os sinais listados ("cria issue rápido", "guarda essa tarefa", etc.) são muito específicos; a linguagem real do humano ("registra uma issue sobre X") não corresponde aos exemplos. O discriminador ("ACT now vs REGISTER for later") está presente mas é sutil demais contra o default J1.
- Tentativas/workaround: O humano precisou corrigir manualmente. A issue foi registrada mas pelo fluxo errado (J1 em vez de J11).
- Status: fixed (2026-07-29, in-session junto com F027; formalizado retroativamente na issue #32 em 2026-08-01) — kernel v5: entry router reordenado ("first match wins", J11 testada ANTES de J1), sinais de captura expandidos (verbos de registro), regra de desempate explícita.

## F027 — Roteador de entry doors duplicado em duas cópias sem guarda; placeholder injetado (código .ts) divergiu do kernel real (.md) e omite J11 (recorrência estrutural de F026)
- Data: 2026-07-29
- Categoria: instruction-ambiguous
- Origem: sessão ad-hoc, humano pediu "Cria essa issue: <descrição do modo direto>"
- Sintoma: Recorrência exata do F026. O humano abriu sessão com "Cria essa issue: ..." — sinal canônico de capture-intent (J11): o próprio kernel real (`maestra-kernel.md` Entry doors §2 lista literalmente o imperativo "cria issue" como sinal de J11, e o changelog v5 documenta que J11 é testado ANTES de J1 justamente para evitar que J1 engula pedidos de captura). Mesmo assim, o facilitador disparou J1 (triagem completa) e não J11. **Causa-raiz estrutural (distinta do F026): o entry router — a peça mais crítica de direcionamento do fluxo — existe em DUAS cópias sem sincronização nem guarda.** (1) Cópia autoritativa: `src/instructions/kernel/maestra-kernel.md` § "Entry doors", 4 portas (J11 antes de J1). (2) Cópia placeholder: `src/agents/maestra-agent.ts`, função `buildAgentMarkdown()`, hardcoded como string em CÓDIGO TypeScript (não instrução .md), com apenas 2 portas (J1 e J2 — J11 ausente). O placeholder é o que tem primazia cognitiva: é injetado no system prompt do agente ANTES de qualquer `read`, então é o roteador que o modelo vê primeiro. A correção do F026 (reordenação J11-antes-de-J1 + expansão de sinais) foi aplicada à cópia autoritativa (.md) mas NÃO propagou para a cópia injetada (.ts), porque (a) é um arquivo de código longe das instruções, (b) não há mecanismo de sincronização/teste/check que conecte "mudei entry doors no kernel" com "existe um .ts que duplica esses entry doors", (c) o mini-roteador no placeholder é ativamente prejudicial — permite ao modelo rotear SEM ler o kernel, competindo com o roteador real. O facilitador seguiu o placeholder que viu primeiro. Três falhas combinadas: duplicação de estado crítico + cópia com primazia cognitiva + ausência total de guarda.
- Tentativas/workaround: O humano corrigiu ("Eu queria que você criasse uma nova issue, não que você entrasse no fluxo da maestra"). Apontada a causa-raiz: o roteador tinha a opção, mas o placeholder injetado não. A issue do "modo direto" ainda não foi criada (pendente).
- Status: fixed (in-session, 2026-07-29; formalizado retroativamente na issue #32 em 2026-08-01) — correção: eliminada a duplicação do entry router do placeholder. `src/agents/maestra-agent.ts` (`buildAgentMarkdown`) deixou de enumerar entry doors; virou lean bootstrap pointer que manda ler o kernel (fonte única do roteador). Anti-regressão: novo teste `src/agents/maestra-agent.test.ts` asserta ausência dos literais stale ("## Entry points", "Free text (new demand)", "Issue number"). Verificado: `npm run typecheck` ✓, `npm test` 848/848 ✓, `npm run build` ✓. Tornado vivo via `node dist/installer/install.js --host opencode` → `~/.config/opencode/agents/maestra.md` reescrito (confirmado: seção "## Entry points" removida). Observação: esta sessão continuou com o system prompt stale carregado; o fix vale para a PRÓXIMA sessão.

## F028 — Instruções do plugin em dois locais sem guarda de sincronização (src/ vs config instalado)
- Data: 2026-08-01
- Categoria: ergonomic-friction
- Origem: R04, issue #29, Stage 3 — edição do J9 Stage 2 (process work)
- Sintoma: As instruções do plugin existem em dois locais: `src/instructions/` (fonte do repo, compilada para `dist/` pelo build) e `~/.config/opencode/maestra/instructions/` (instalada, lida em runtime). Ao editar instruções (process work), o facilitador editou primeiro a cópia instalada (onde lê em runtime), depois precisou aplicar as MESMAS edições na fonte do repo. Não há guarda, teste ou check que conecte "editei a instrução instalada" com "preciso propagar para src/instructions/". Atrapalha especialmente em process work (exceção da Role rule 4), onde o facilitador edita diretamente — o caminho natural é editar onde se lê, e a fonte do repo fica esquecida até o `git status` revelar a divergência.
- Tentativas/workaround: Detectado via `rg "Sequential turns"` que encontrou `src/instructions/journeys/j9-panel.md` ainda com o título antigo. Aplicadas as mesmas 4 edições na fonte do repo; `diff` confirmou paridade. Solução de fundo: ou o `install.sh`/build deveria ser o único caminho (proibir edição manual do config instalado), ou deveria haver um check que detecta divergência src/ ↔ instalado/.
- Status: open

## F029 — `docs/referencia/jornadas.md` citado como Source em múltiplas instruções mas inexistente no repo
- Data: 2026-08-01
- Categoria: doc-contradiction
- Origem: R04, issue #29, Stage 2 — verificação de doc × código (reconciliation checklist item 4)
- Sintoma: Vários arquivos de instrução (kernel, J2, J3, J4, J5, J9, microcopy, protocols, instrumentation) citam `docs/referencia/jornadas.md` como "Source" no cabeçalho ("Source: docs/referencia/jornadas.md v2.x..."). Esse arquivo NÃO existe neste repositório (`glob "**/*jornadas*"` → no results; `maestra_status` reporta `referenceDocs: false`). A referência normativa citada como fonte de verdade anti-drift ("module derived from the source; divergence is a finding") aponta para o vazio. Cada arquivo declara "Anti-drift: module derived from the source" — mas a source não existe, tornando a garantia de anti-drift inverificável. O `fluxo-de-senvolvimento.md` (também citado como fonte normativa) igualmente não existe no repo.
- Tentativas/workaround: Detectado ao tentar ler `docs/referencia/jornadas.md` para alinhar a edição do J9 com a fonte normativa. Os arquivos `src/instructions/` são a fonte operacional de fato. Candidato a issue `doc-bug` (trigger #16: documentary contradiction becomes a bug) — seja para criar os arquivos de referência, seja para remover as citações de Source inexistentes e documentar que `src/instructions/` É a fonte.
- Status: open

## F030 — `git worktree remove` falha quando o worktree contém submódulo inicializado
- Data: 2026-08-01
- Categoria: ergonomic-friction
- Origem: R06, issue #28, Stage 3 (J5) — remoção do worktree após merge do PR #33
- Sintoma: J5 Stage 1 manda remover o worktree com `git worktree remove` no mesmo ato do merge. O comando falhou com "fatal: working trees containing submodules cannot be moved or removed" porque o especialista inicializou o submódulo do catálogo (`git submodule update --init --recursive`) dentro do worktree — passo necessário para a suíte de testes passar (3 testes do loader de catálogo falham sem ele). A instrução do J5 não cobre o caso: neste repo, QUALQUER worktree onde os testes rodam por completo terá o submódulo inicializado, tornando o comando documentado sempre falho na prática.
- Tentativas/workaround: 1 tentativa documentada falhou; workaround conhecido é `rm -rf .worktrees/<slug>` + `git worktree prune` (+ remoção do submódulo em `.git/modules` se aplicável). J5 deveria documentar o fallback para worktrees com submódulo.
- Status: open

## F031 — `maestra_emit_event` type=F exigiu 2 tentativas (nomes de campo do payload) — mesma família de F024
- Data: 2026-08-01
- Categoria: tool-retry
- Origem: R06, issue #28, reconciliação — emissão do Event F
- Sintoma: Primeira tentativa com `deviations_during`/`deviations_at_reconciliation` (nomes inferidos do texto renderizado do evento) falhou com "Invalid payload for event type F: during: Required; at_reconciliation: Required". O schema real exige `during` e `at_reconciliation`. O texto renderizado do evento ("deviations during=0, at-reconciliation=0") induz nomes errados, e o `instrumentation.md` já é sabido divergente do schema (F024) — mesma família, agora confirmada também para o type=F.
- Tentativas/workaround: 2 tentativas; lido o erro de validação e corrigidos os campos. Reforça a urgência de alinhar `instrumentation.md` ao schema zod real (F024, candidato a doc-bug).
- Adendo (2026-08-28, R17 close): terceira confirmação da família — type=F também exige o campo `round` ("Invalid payload for event type F: round: Required"); além de `during`/`at_reconciliation`, o campo `round` é obrigatório e não está documentado no instrumentation.md.
- Status: open

## F032 — Retomada por issue confirma estado e sai implementando, sem alinhamento nem consentimento
- Data: 2026-08-05
- Categoria: instruction-ambiguous
- Origem: sessão ad-hoc (relato do humano em triagem de nova demanda, 2026-08-05) — retomada de issue via número (J2 → J5)
- Sintoma: O humano abriu sessão informando um número de issue. O Facilitador derivou o estado, perguntou apenas se a issue era a correta e, na confirmação, partiu direto para a implementação. O humano esperava (e o fluxo não entregou): (1) explicação detalhada do que é a tarefa; (2) pergunta explícita sobre dúvidas; (3) apresentação do plano de execução/arquitetura; (4) oportunidade de ajustar o plano; (5) consentimento explícito ANTES de implementar. A J2 STAGE 3 manda "assume the persona and dispatch" logo após a confirmação da derivação, e a J5 STAGE 2 delega implementação "when a task is ready for execution" — nenhum dos dois módulos exige gate de consentimento. A confirmação da derivação ("correto?") é tratada como consentimento de execução, mas são coisas distintas (mesma família do F008/F010: confundir "entendimento confirmado" com "trabalho autorizado").
- Tentativas/workaround: Nenhuma na sessão observada — o humano interrompeu e relatou a falha em sessão posterior, convertendo em demanda de mudança de fluxo (triagem J1 na sessão do registro). Comportamento desejado especificado pelo humano em 4 passos: explicar a tarefa → perguntar dúvidas → explicar plano de execução → perguntar se quer ajustar → só implementar com consentimento.
- Status: resolved (R10, PR #42)

## F033 — Worktree criada sem inicializar submódulo (catálogo ausente, testes falham)
- Data: 2026-08-06
- Categoria: ergonomic-friction
- Origem: R12 (#44) — criação de worktree delegada ao `maestra/ops`
- Sintoma: A worktree `.worktrees/r12-rota-setup/` foi criada corretamente na convenção (dentro do repo, gitignored), mas o submódulo `src/catalog/agency-agents` veio vazio. `npm run ci` na worktree falhou com 3 testes do catalog loader (`expected 0 to be greater than or equal to 360`). Nem a convenção de worktree da J5 (`j5-stage3.md`) nem o `ops-kernel.md` mencionam `git submodule update --init` como parte do nascimento da worktree.
- Tentativas/workaround: 1 falha de CI → diagnóstico (diff `ls` main × worktree) → `git submodule update --init` na worktree → CI verde (243/243, smoke 136/136, eval:dry 4/4). Custo: um ciclo inteiro de `npm ci` + testes perdido.
- Status: open

## F034 — `maestra_emit_event` type=override exigiu 2 tentativas (payload schema não documentado) — família F024/F031
- Data: 2026-08-18
- Categoria: tool-retry
- Origem: R14 (#48) — registro do override de variante (Condensed → Minimal) no nascimento do épico
- Sintoma: Primeira tentativa com payload `{contested_criterion, decided_by, declared_reason, direction, type}` falhou com "Invalid payload for event type override: override_type: Required; from: Required; to: Required; disputed_criterion: Required; date: Required". O schema real exige `override_type`/`from`/`to`/`disputed_criterion`/`date` — o texto de P3/instrumentation descreve os conceitos (direção, critério contestado, decisor) mas não os nomes de campo; `instrumentation.md` segue divergente do schema zod (F024, F031), agora confirmado também para type=override.
- Tentativas/workaround: 2 tentativas; lido o erro de validação e corrigidos os campos. Reforça F024: alinhar `instrumentation.md` ao schema zod real de TODOS os tipos.
- Status: open

## F035 — Delegação de implementação dispara aviso `persona::` (caller-identity fails closed)
- Data: 2026-08-19
- Categoria: ergonomic-friction
- Origem: R15 (#49) — delegação de implementação a especialista do catálogo via `task` (subagent_type `maestra/specialist`)
- Sintoma: ao concluir a delegação, o plugin emitiu `[maestra] Shell spawned WITHOUT persona:: marker — this session CANNOT use ask_peer (caller-identity fails closed)`. O formato `persona::<id>@<panelId>` é o protocolo de PAINÉIS (J9); não há caminho documentado para delegação de IMPLEMENTAÇÃO a especialista do catálogo que não gere o aviso. Aviso aparece só ao final (poluição de log) e deixa ambíguo qual formato o delegador deveria ter usado.
- Tentativas/workaround: nenhum necessário (ask_peer não era requerido); aviso ignorado. Não bloqueou.
- Status: open

## F036 — Config legada `.maestra/` pós-cutover R14 induz facilitador a desenhar contra estado obsoleto
- Data: 2026-08-19
- Categoria: board-state
- Origem: R15 (#49) — design técnico da round
- Sintoma: o checkout principal ainda contém `.maestra/config.md` e `.maestra/team.md` (legados — ADR-003 moveu a config para a branch órfã `__maestra_config__`). O facilitador leu esses arquivos via fs direto no Stage 2 e desenhou `workflow.md` como arquivo da árvore de trabalho, contradizendo a doutrina ADR-003 — detectado só na verificação pré-aceite (leitura do ADR-003 no worktree), custando uma rodada de correção inteira (16 arquivos). O passo de remoção impresso pelo `maestra-config migrate` não foi executado neste clone, e a leitura fs direta (sem pasar pelo store) não dispara o aviso "config legada encontrada".
- Tentativas/workaround: correção delegada na mesma sessão (commit 0085b49 — allowlist + instruções + evals alinhados à branch órfã); desvio declarado na round.
- Status: open

## F037 — `npx maestra-config` silenciosamente não faz nada quando o link do bin não existe pós-merge
- Data: 2026-08-19
- Categoria: ergonomic-friction
- Origem: R14 (#48) — teste conjunto pós-instalação (dogfooding da migração)
- Sintoma: No checkout principal pós-merge, `node dist/cli/migrate-config.js` funciona, mas `npx --no-install maestra-config read config.md` retorna **vazio com exit 0** (silêncio total, nem erro). Causa em duas camadas: (1) `npm install` "up to date in 1s" **não recria links de bin do pacote root** quando não há mudanças a instalar — `node_modules/.bin/maestra-config` ficou inexistente após o merge que adicionou o bin ao package.json; (2) `npx --no-install` com bin inexistente faz no-op silencioso com exit 0 em vez de falhar com "command not found". O CLI em si está correto (invocação direta por node retorna os 211 bytes).
- Tentativas/workaround: diagnóstico por instrumentação (chamada direta da store via node: len 211; CLI direto: 211 bytes em pipe, arquivo e chamada de função) → isolou a camada npx/npm. Workaround: invocar por `node dist/cli/migrate-config.js` (caminho usado pelo smoke). Candidato a melhoria: documentar invocação direta no README e/ou criar um runner `scripts/` que resolva o caminho do dist.
- Status: open

## F038 — `Closes #N` no corpo do commit não fecha issues nos merges; 4 cards "In Progress" por 30 dias com trabalho já mergeado
- Data: 2026-08-28
- Categoria: board-state
- Origem: análise manual do board (Project #23) — issues #16, #19, #20, #21
- Sintoma: os merges dos PRs #23–#26 (2026-07-29) implementaram duplas de issues (#14+#19, #17+#21, #18+#20, #15+#16) com `Closes #N` no **corpo do commit**, mas apenas a issue primária de cada dupla foi fechada; as secundárias (#16, #19, #20, #21) permaneceram OPEN com cards "In Progress" por ~30 dias enquanto o trabalho já estava em main (changelogs dos arquivos citam as próprias issues até hoje). Board divergiu da realidade — exatamente a violação de P6 ("três touchpoints, um ato") que a #19 corrige — e a divergência só foi detectada em análise manual do board, não por nenhum gate do fluxo.
- Tentativas/workaround: fechamento manual das 4 issues com comentário apontando o commit implementador (81b94c4, b7a7fa7, 3afed29, a63c406); cards movidos a Done pela automação do Project (item closed → Done) no mesmo ato do close. Candidato a melhoria: (a) enumeração de TODAS as issues fechadas na **descrição do PR** (não só no corpo do commit) na etapa de aceitação (J5); (b) verificação pós-merge de que issues referenciadas por `Closes` foram efetivamente fechadas.
- Status: open

## F039 — Aprovação manual de leitura fora do workspace a cada nova sessão (kernel/jornadas em `~/.config/`)
- Data: 2026-08-28
- Categoria: ergonomic-friction
- Origem: sessão R17 (#52) — uso diário do plugin, todas as sessões
- Sintoma: O gate de entrada e o lazy loading instruem o agente a `read` dos arquivos de instrução em `~/.config/opencode/maestra/instructions/` (kernel, jornadas, reference/), que ficam fora do workspace do projeto. O host (OpenCode/Mimo) solicita aprovação de leitura por arquivo fora do workspace, e a aprovação não persiste entre sessões — o humano precisa aceitar múltiplos prompts no primeiro minuto de TODA sessão maestra. Atrito recorrente e sistemático no entry gate do próprio fluxo.
- Tentativas/workaround: humano aprova manualmente a cada sessão. Demanda aberta nesta data para uma ferramenta do plugin que devolva o conteúdo desses arquivos (leitura via tool do plugin não dispara prompt de permissão do host), eliminando o atrito na raiz.
- Status: resolved (R17, PR #57, merge 33843c0 — tool `maestra_read_instructions` + instruções/pointers rewireados; validação de uso na primeira sessão pós-reinstalação)

## F045 — Recipes de board do cookbook-github divergem do comportamento real do gh CLI 2.97 (jq array-root + item-edit)
- Data: 2026-08-28
- Categoria: doc-contradiction
- Origem: R17 (#52) — nascimento do épico: add-to-board + move-card
- Nota: renumerado de F040→F045 na reconciliação R17 — colidia com o F040 do R19 (issues duplicadas, resolved #53); mesma família de colisão que o meta-registro F042 (R16) documenta.
- Sintoma: (1) `gh project list/item-list --format json --jq '.[]…'/'.items[]…'` falha ou retorna vazio nesta versão do gh (2.97.0) — o JSON raiz é array e o `--jq` do gh reporta "expected an object but got: array" (project list) ou silencia (item-list); os recipes do `reference/cookbook-github.md` §5 (add-to-board, discover-ids, move-card) usam exatamente esses jq. (2) `item-edit --field <nome> --value` exige `--url` + número posicional do projeto; a combinação `--project-id + --id + --field/--value` (análoga ao recipe documentado) é rejeitada — o caminho documentado por IDs (`--field-id` + `--single-select-option-id`) não foi testado nesta sessão. Move-card custou 3 tentativas.
- Tentativas/workaround: `item-add` com `--owner` funcionou (recipe ok); extração de IDs via python sobre JSON bruto funcionou; move final com `gh project item-edit 23 --owner … --url … --field "Status" --value …`. Cookbook precisa de recipes revistos contra o gh vigente (ou de wrapper que não dependa de --jq do gh).
- Adendo (2026-08-28, merge local R17): segunda confirmação na mesma sessão — o `item-list` expõe o Status como campo PLANO no item (`"status": "Todo"`), não sob `fieldValues[]` como o recipe do discover-ids sugere; a lookup do card no merge exigiu 2 tentativas pela mesma causa.
- Status: open

## F040 — Issues duplicadas criadas em desvios de rota: sem busca de similares fora de J1/J11
- Data: 2026-08-28
- Categoria: instruction-ambiguous
- Origem: relato do humano (uso do Maestra em sessões de projetos) — triagem da demanda nesta data
- Sintoma: Durante sessões do Maestra, desvios de rota (doc-bugs, tasks de desvio, novas ondas, revert-demands) exigem criar issues novas; nessas criações o facilitador não busca issues relacionadas/duplicatas antes de criar, e a issue criada às vezes já existe no banco ou há similar. A busca prévia hoje só é exigida em dois pontos: J1 Stage 5 Step 0 (dedup de ÉPICOS na triagem) e J11 (captura rápida — create/relate/discard). Os demais pontos de criação — `create-epic`/`create-task` do cookbook §1, `doc-bug` (trigger #16), baton-pass de ondas (J3 Stage 3/4, J4/J6), desvios do J5 — não têm regra de dedup; e o cookbook não documenta operação de busca de similares (só `read-open-load`/`read-hierarchy`).
- Tentativas/workaround: duplicatas detectadas manualmente depois, pelo humano. Nenhum gate do fluxo detecta a duplicação.
- Status: resolved (#53 — trigger #19, merge 4d21562 / PR #56)

## F041 — Worktree novo não inicializa submódulo (catálogo agency-agents) e quebra a suíte de testes
- Data: 2026-08-28
- Categoria: ergonomic-friction
- Origem: R19, issue #53, Stage 3 (J5) — primeira verificação no worktree recém-criado
- Sintoma: `git worktree add` não inicializa submódulos; no worktree novo, `src/catalog/agency-agents/` ficou vazio e `npm run ci` falhou em `src/catalog/loader.test.ts` (personas não encontradas — 3 testes) antes de qualquer erro real do código em verificação. A declaração de worktree (kernel trigger #9, J5, ops-kernel) não menciona `git submodule update --init`.
- Tentativas/workaround: `git submodule update --init` no worktree resolveu; suíte verde na sequência (300/300, re-run dos arquivos afetados 40/40).
- Status: open

## F042 — vitest no main escaneia `.worktrees/` de sessões paralelas e quebra o `npm run ci` do repo
- Data: 2026-08-28
- Categoria: ergonomic-friction
- Origem: R19, issue #53, reconciliação — verificação no main mergeado (4d21562)
- Sintoma: `npm run ci` na árvore main falhou na etapa de testes com 3 falhas — todas de arquivos sob `.worktrees/r18-branch-do-epico/` (worktree de sessão paralela em andamento, incluindo o mesmo submódulo não inicializado do F041). O vitest não exclui `.worktrees/` por padrão; worktrees aninhados são tratados como testes do repo. A suíte própria do main está verde.
- Tentativas/workaround: `npx vitest run --exclude "**/.worktrees/**"` → 300/300. Candidato: `test.exclude` no vitest config.
- Status: open

## F041 — Shell `maestra/specialist` spawnado sem marcador `persona::` — ask_peer desabilitado e sessão invisível aos pares
- Data: 2026-08-28
- Categoria: instruction-ambiguous
- Origem: R16 (#34) — delegação de implementação (Fase 4, modo direto)
- Sintoma: A delegação ao shell `maestra/specialist` injetou a persona inline no corpo do prompt (padrão "persona is injected on demand in the delegation prompt", documentado no README), mas o plugin emitiu aviso de que o shell foi spawnado SEM o marcador `persona::<id>@<panelId>` na primeira linha — nessa condição a sessão NÃO pode usar `ask_peer` (caller-identity fails closed) e não é encontrada por pares. O formato do marcador não está documentado no kernel (seção Host dialect) nem no README; o facilitador seguiu a instrução documentada e ainda assim ativou a degradação. **Recorrência do F035** (mesmo sintoma em R15) — a raiz (formato do marcador não documentado no ponto de delegação) segue aberta.
- Tentativas/workaround: inofensivo para delegação de implementação (sem necessidade de ask_peer); o trabalho foi concluído. Para trabalho de painel (J9), a mesma delegação silenciaria a voz do especialista no consensus turn.
- Status: open (recorrência de F035)

## F042 — Numeração duplicada no registry: duas entradas distintas com ID F040
- Data: 2026-08-28
- Categoria: doc-contradiction
- Origem: análise do próprio findings.md durante a sessão R16 (#34)
- Sintoma: `grep '^## F0'` mostra DOIS cabeçalhos `## F040` — "Recipes de board do cookbook-github divergem…" e "Issues duplicadas criadas em desvios de rota…". A segunda entrada (triaged→#53) deveria ser F041. A regra "ID incremental: próximo ID livre" falhou na escrita da segunda entrada; entradas posteriores (F041/F042 desta sessão) foram numeradas assumindo a colisão como fato consumado.
- Tentativas/workaround: numeração das entradas novas seguiu o máximo + 1 a partir das existentes; a colisão permanece (arquivo é append-only — renumeração exige decisão de edição pontual autorizada).
- Status: open

## F043 — `npm run ci` vermelho em clone/worktree fresco: submódulo do catálogo não é inicializado pelo npm install
- Data: 2026-08-28
- Categoria: ergonomic-friction
- Origem: R16 (#34) — verificação em primeira pessoa no worktree `.worktrees/r16-…`
- Sintoma: `npm run ci` falha em 3 testes de `src/catalog/loader.test.ts` ("expected undefined to be defined", totalPersonas < 360) em qualquer clone/worktree novo — o submódulo `src/catalog/agency-agents` não vem inicializado e o `npm install` não o inicializa. O mesmo ocorre no checkout principal deste clone (submódulo `-6a3689f` não inicializado). O checklist de comandos do AGENTS.md/README não menciona `git submodule update --init`.
- Tentativas/workaround: `git submodule update --init` no worktree → loader.test.ts 6/6 verde e `npm run ci` verde de ponta a ponta. Candidato a melhoria: init do submódulo no prepare/postinstall do npm, ou nota de pré-requisito no README/AGENTS.md.
- Status: open

## F044 — Hook de validação do deviations.md rejeita rótulos de campo fora do canon EN do template
- Data: 2026-08-28
- Categoria: instruction-ambiguous
- Origem: R18 (#54) — primeiro preenchimento do `deviations.md` da round
- Sintoma: o facilitador escreveu as entradas com rótulos de campo em PT ("**Planejado:**", "**Razão:**") seguindo o idioma da conversa; o hook pós-escrita rejeitou a entrada 2× ("missing Planned, Implemented, Reason…") até que os rótulos canônicos EN do template fossem usados. Segunda rejeição foi por link: URL crua no campo "Decision registered at" não é reconhecida — o hook exige sintaxe markdown `[texto](url)`. O conteúdo estava completo desde a primeira tentativa; só a forma divergiu do canon.
- Tentativas/workaround: releitura do template → rótulos EN; conversão das URLs para links markdown → hook silencia. Candidato a melhoria: mensagem do hook nomear o formato esperado (rótulos canônicos EN + link markdown) para resolver em 1 tentativa.
- Status: open

## F046 — findings.md lido de main local desatualizado: IDs duplicados e marcador defasado (causa-raiz das colisões)
- Data: 2026-08-28
- Categoria: instruction-ambiguous
- Origem: R17 (#52), reconciliação — descoberta ao corrigir dano de edição
- Sintoma: a sessão R17 leu `docs/dogfooding/findings.md` de um checkout main **atrás do origin** (arquivo terminava em F038, marcador dizia F030) enquanto R16/R18/R19 já haviam registrado F040–F044 no origin. A regra "ID incremental: próximo ID livre indicado no cabeçalho" foi seguida contra estado desatualizado → novo F040 colidindo com o do R19 (corrigido para F045 na reconciliação) e apêndice de F039 colidindo com espaço de numeração já consumido. O pull que atualizou o main local aconteceu (via ops, na criação da worktree) DEPOIS dos primeiros registros da sessão, sem re-verificação do arquivo. Família do meta-registro F042 (R16): a regra de numeração não tem guarda contra main desatualizado nem contra registro concorrente.
- Tentativas/workaround: dano da sessão corrigido na reconciliação (cabeçalho F039 restaurado; F040→F045 renumerado com nota; adendo movido). Duplicatas pré-existentes (F040/F041/F042 duplos da era R16/R19) permanecem — renumeração exige decisão autorizada (nota no F042). Candidatos: (a) regra "fetch antes do primeiro registro de finding"; (b) guarda de ID no hook de escrita.
- Status: open
