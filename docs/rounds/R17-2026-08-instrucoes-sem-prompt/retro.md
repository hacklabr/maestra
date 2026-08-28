# Retrospective — R17 (Instrução sem prompt de leitura)

> Round: R17 · Epic: [#52](https://github.com/hacklabr/maestra/issues/52) · Fechada em 2026-08-28 · Variant: Minimal (modo direto, sessão única)

## O que a round entregou

Tool `maestra_read_instructions`: conteúdo integral de exatamente UM arquivo da árvore `instructions/` instalada, por caminho relativo, com allowlist rígida e contenção fail-closed (absoluto, `..`, escape via symlink rejeitados; raiz resolvida por detecção de host, `MAESTRA_INSTRUCTIONS_ROOT` como seam de teste). Bootstrap pointers dos 3 agentes rewireados para a tool (`external_directory` extinto do markdown gerado); doutrina de carga via tool no kernel v9, direct v6, issue-writer v7, ops v2 e nas jornadas j1/j2/j3/j8; eval IL-01; smoke flippado para o contrato novo. **F039 resolvido** (PR #57, merge `33843c0`).

## Métricas do fluxo

| Sinal | Valor |
|---|---|
| Evento A — perguntas de elicitação / deriváveis | 0 / 0 |
| Evento B — rodadas de correção do entendimento | 0 |
| Desvios durante × na reconciliação (evento F) | 4 × 0 |
| Testes na branch mergeada | 323/323 · eval:dry 62/62 · smoke 176/176 (4 células) |
| Verificação independente do facilitador (trigger #15) | `npm run ci` completo re-executado na worktree pós-edits de instruções |

## O que funcionou

- **Modo direto sessão única com gates como fronteiras de turno**: consent gate §7.13 antes do worktree; veredito por critério com evidência executada; aceitação → PR → merge local → reconciliação sem handoff assíncrono.
- **Derivação antes de perguntar**: escopo técnico derivado do código (registro de tools, layout instalado × worktree, resolução por host) antes das 2 perguntas de descoberta; 0 deriváveis feitas.
- **Lições anteriores aplicadas de fato**: F033 (submodule init na worktree — zero ciclo de CI perdido), F038 (`Closes #52` na descrição do PR), F024-family (schema do evento A lido do código, emissão de primeira), F008/F010/F018 (board movido ao iniciar trabalho e nas transições, executado junto com a narração).
- **Retorno destilado do especialista** com desvios declarados no próprio relatório (smoke.sh/installer por consequência) — verificação do facilitador confirmou em vez de descobrir.
- **Reconciliação pegou doc×código**: AGENTS.md/README/CHANGELOG não listavam a tool nova — corrigidos no ato do fechamento.

## O que doeu

- **F045 — cookbook de board × gh 2.97**: move-card custou 3 tentativas (`--jq` com raiz-array falha; `item-edit` tem 3 sintaxes válidas por combinação de flags; `status` é campo plano no item-list). Registrado antes de prosseguir; cookbook segue desatualizado — candidato a round futura.
- **Gap no primeiro prompt de delegação**: os pointers de `src/agents/*` ficaram fora do escopo do primeiro subtask do especialista — segunda delegação (resume de sessão) necessária. Custo baixo, mas o plano de execução deveria ter listado o arquivo.
- **Header do issue-writer-kernel pré-desfasado** (version 5 × changelog v6) — inconsistência pré-existente, corrigida em passagem com declaração.
- **F046 — findings.md lido de main local desatualizado**: a sessão começou lendo o registro com main atrás do origin (fim em F038, marcador F030) enquanto R16/R18/R19 já tinham registrado F040–F044 — meu F040 colidiu com o do R19 (renumerado F045 na reconciliação) e uma edição minha engoliu o cabeçalho do F039 (detectado e corrigido no ato). Duplicatas pré-existentes (F040/F041/F042 duplos) seguem abertas aguardando decisão de renumeração — ver F042/F046.
- **Prova final adiada**: o dogfood real (sessão nova com zero prompts) exige reinstalação + nova sessão — esta sessão rodou o system prompt antigo. Critério 1 verificado por construção (suítes), validação de uso fica para a primeira sessão pós-update.

## Próxima sessão (validação do critério 1)

Reinstalar (`node dist/installer/install.js` ou `install.sh`) e abrir sessão nova do agente maestra: entry gate completo (`maestra_status` → kernel → jornada) sem nenhum prompt de leitura = F039 dado como fechado na prática.
