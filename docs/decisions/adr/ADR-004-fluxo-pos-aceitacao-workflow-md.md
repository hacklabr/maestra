# ADR-004 — Fluxo pós-aceitação do PR/MR persiste em `.maestra/workflow.md`, fora do `config.md`

**Status:** Current
**Date:** 2026-08-18
**Round:** R15

## Contexto

Coexistem dois fluxos reais de empresa para o destino da tarefa após a
aceitação do PR/MR: (a) a aceitação fecha a tarefa — o comportamento atual do
P6, com veredicto por critério registrado no comentário de fechamento; e
(b) times com QA pós-merge em `develop` — o QA valida em **ambiente de
testes** depois do merge, e só então a tarefa fecha. Para o fluxo (b) o
comportamento atual mente no board: a tarefa fecha sem validação e o QA atua
fora do fluxo, sem rastro.

O candidato óbvio para a configuração era `.maestra/config.md`. Mas o parser
real (`src/platform/config.ts`, ADR-014) aceita **somente** as chaves
`platform`, `host`, `project` e `board`; chave fora do padrão é
**silenciosamente ignorada** (ADR-002) — configurar lá produziria configuração
invisível.

## Decisão

O fluxo pós-aceitação vive em **`.maestra/workflow.md`** (template em
`src/instructions/templates/workflow.md`), com as chaves:

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
  atual).
- **Custo:** o vocabulário P1.1 cresce (+2 substates — custo de derivação pago
  pelo vocabulário fechado, que continua fechado); mais um arquivo de
  convenção em `.maestra/`.
- **Risco:** facilitador gravar a configuração no `config.md` por hábito —
  mitigado pela J12 e pelo template citarem ADR-002/ADR-004 explicitamente.
