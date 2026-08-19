# ADR-004 — Fluxo pós-aceitação do PR/MR persiste em `workflow.md` na branch órfã `__maestra_config__`, fora do `config.md`

**Status:** Current
**Date:** 2026-08-19
**Round:** R15

> Nota de correção in-round: a primeira redação desta decisão colocava o
> arquivo em `.maestra/workflow.md` na árvore de trabalho — desenho feito
> contra estado obsoleto do repo, anterior ao merge do R14. Corrigido antes
> do merge do R15: um só endereço para configuração de repositório (ADR-003).

## Contexto

Coexistem dois fluxos reais de empresa para o destino da tarefa após a
aceitação do PR/MR: (a) a aceitação fecha a tarefa — o comportamento atual do
P6, com veredicto por critério registrado no comentário de fechamento; e
(b) times com QA pós-merge em `develop` — o QA valida em **ambiente de
testes** depois do merge, e só então a tarefa fecha. Para o fluxo (b) o
comportamento atual mente no board: a tarefa fecha sem validação e o QA atua
fora do fluxo, sem rastro.

Dois endereços foram considerados e descartados:

- **`config.md`** — o parser real (`src/platform/config.ts`) aceita
  **somente** as chaves `platform`, `host`, `project` e `board`; chave fora
  do padrão é **silenciosamente ignorada** (ADR-002) — configurar lá
  produziria configuração invisível.
- **`.maestra/workflow.md` na árvore de trabalho** — viola a doutrina do
  ADR-003 (merge do R14, anterior à base desta round): a configuração do
  repositório vive na branch órfã `__maestra_config__`, na raiz, lida/escrita
  via `maestra-config`; histórico de configuração não polui as branches do
  produto e a pasta não aparece no checkout.

## Decisão

O fluxo pós-aceitação vive em **`workflow.md` na raiz da branch órfã
`__maestra_config__`** — o único endereço de configuração do repositório
(ADR-003) —, acessado exclusivamente via `maestra-config read/write
workflow.md` (allowlist do CLI estendida: `config.md|team.md|labels.md|workflow.md`;
`migrate` mantém o escopo nos 3 arquivos legados — `workflow.md` nasce na
branch, via J12, sem cópia legada). Template em
`src/instructions/templates/workflow.md`. Chaves:

- `post-pr-acceptance: close | qa` — `close` é o **default** quando o arquivo
  ou a chave está ausente: times sem QA formal não mudam nada (zero migração);
- `qa-approval-column: <nome da coluna>` — destino do card na aprovação do QA;
  ausente = a coluna delivered mapeada em `labels.md`.

Semântica do modo `qa`:

- o vocabulário fechado P1.1 ganha `awaiting-qa` (PR/MR aceito; card
  permanece em review; atribuição passa ao profissional de QA) e `qa-rejected`
  (QA reprovou; card em Ready; reatribuição a quem implementou; comentário
  nomeando a falha), com mapeamento de coluna no P6;
- **QA antes da reconciliação**: a tarefa somente fecha com a aprovação do QA;
  aí a round entra em `awaiting-reconciliation` — o gate final (reconciliação,
  J5 Stage 5) permanece intocado;
- a **sessão de QA é guiada pela Maestra** (J2 branch B7, microcopy §7.14):
  entrada "vou fazer o QA da #N" → apresentação da tarefa (o que foi feito,
  critérios de aceitação um a um, onde validar no ambiente de testes) →
  dúvidas respondidas no chat → veredicto registrado com as transições no
  mesmo ato (aprovação e reprovação);
- o **roteamento do QA** deriva do campo Specialty do `team.md`: candidato
  único é proposto (corrigível); ausência ou ambiguidade → pergunta no ato,
  nunca assume.

Nomes de coluna são convenção confirmada pelo humano — sempre revalidados
contra o board real via API no ato (P6); em divergência, o board vence e o
arquivo é corrigido.

## Consequências

- **Positiva:** o board reflete a vida real do time — a tarefa só fecha quando
  validada; a sessão de QA é conduzida (o profissional não fica abandonado
  diante da issue); zero migração (default `close` preserva o comportamento
  atual); um só endereço de configuração (ADR-003), compartilhado via a branch
  órfã remota — nenhum arquivo novo na árvore do produto.
- **Custo:** o vocabulário P1.1 cresce (+2 substates — custo de derivação pago
  pelo vocabulário fechado, que continua fechado); a allowlist de
  `maestra-config` (`src/platform/config-store.ts` + `src/cli/migrate-config.ts`)
  é estendida — **desvio src-touching declarado da round** (round de
  instruções que toca o CLI para manter a doutrina de um só veículo de
  escrita/leitura de config).
- **Risco:** facilitador gravar o arquivo na árvore de trabalho (`.maestra/`)
  ou no `config.md` por hábito — mitigado pela J12 e pelo template citarem
  ADR-003/ADR-004 explicitamente e prescreverem `maestra-config write
  workflow.md` como único caminho.
