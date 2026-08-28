# ADR-006 — Topologia de branch por épico: PRs de tarefas filhas apontam para a branch do épico

**Status:** Current
**Date:** 2026-08-28
**Round:** R18

## Contexto

O fluxo não prescreve topologia de branch: cada tarefa filha de um épico abria
PR/MR direto para a branch de integração (`develop`, `main` — convenção do
repo). O efeito observado: o trabalho de um épico entra em pedaços na linha
principal, sem um ponto onde o conjunto seja integrado e validado como
unidade antes — a iniciativa chega pela metade ao tronco.

Já existia o veículo de configuração: `workflow.md` na branch órfã
`__maestra_config__` (ADR-004), lido/gravado via `maestra-config`, com a chave
`post-pr-acceptance` cobrindo o destino **pós-aceitação**. Faltava o **alvo**
do PR/MR — a topologia.

Duas alternativas de adoção foram consideradas na descoberta:

- **Norma para todos os times** — mudança no doc normativo, sem chave de
  configuração. Descartada: impõe uma prática de git a times que podem não
  querê-la (repos pequenos, single-task, integração contínua agressiva).
- **Configurável com padrão preservando o comportamento atual** (padrão
  `direct`, à maneira da zero-migração da ADR-004). Descartada por decisão
  humana em descoberta (2026-08-28): "a adoção pode ser configurável mas o
  padrão deve ser epic-branch" — o fluxo recomenda a prática por default.

## Decisão

Nova chave **`pr-topology: epic-branch | direct`** em `workflow.md` na raiz da
branch órfã `__maestra_config__` (mesmo veículo da ADR-004; template
`templates/workflow.md`; nada em `config.md` por ADR-002, nada na árvore por
ADR-003). **Padrão `epic-branch`** — arquivo ou chave ausente = `epic-branch`;
quem não quer a topologia opta por `direct` explicitamente. **A assimetria de
defaults é intencional e declarada**: `post-pr-acceptance` preserva o
comportamento antigo por padrão; `pr-topology` muda por padrão.

Semântica do modo `epic-branch`:

- **Nascimento lazy** (D2): a branch `epic/<n>-<slug>` nasce no consent gate
  da primeira tarefa de implementação, somente quando o épico tem **≥2
  tarefas de implementação abertas** (contagem derivada do digest — nenhum
  estado novo); nunca no nascimento do épico (J1 intocada — épico que estiola
  nas Etapas 1–2 não deixa branch morta). Branch ausente/morta + nova onda →
  recria da branch de integração.
- **Naming** (D3): `epic/<n>-<slug>`, `<n>` = número da issue épica.
- **Isenção Minimal** (D4): issue única nunca ganha branch de épico — a
  branch da tarefa É a integração do épico.
- **PRs das tarefas** apontam para a branch do épico (`--base`/`--target-
  branch` explícitos — gotcha: sem a flag, o CLI mira a branch default do
  repo); a branch do épico é que mira a branch de integração.
- **PR de integração do épico** (D5): abre **no ato do aceite da última
  filha** (atomicidade P6 7a) → substate `awaiting-integration` (novo no
  vocabulário P1.1) + card do épico em review; merge → `awaiting-
  reconciliation` (P6 7b) + a branch morre no mesmo ato.
- **Modo `qa`** (D6, ADR-004): compatível sem mudança de semântica — QA
  valida por tarefa; o PR do épico só abre com todas as filhas fechadas
  (QA-approved quando `qa`); o ambiente de testes roda a branch do épico.
- **Teardown** (D7): a branch morre no merge do PR do épico ou no
  abandono/reclassificação — análogo ao teardown do worktree; trabalho não
  mergeado dentro dela vira desvio declarado ou descarte explícito, nunca
  remoção silenciosa.

A topologia vive inteira na camada de instruções (J5 Stage 3, protocols
P1.1/P6, template, J12, cookbooks GH/GL) — nenhuma mudança em `src/`
(a chave é lida pelo facilitador, não parseada por código; a allowlist do
`maestra-config` já cobre `workflow.md` desde a ADR-004).

## Consequências

- **Positiva:** a branch de integração só recebe épico completo, como
  unidade validável; épico ganha ponto de integração próprio; recomendação
  adotada por default; zero estado novo no plugin (contagem via digest).
- **Custo:** upgrade muda comportamento por padrão — times que não querem a
  topologia precisam de opt-out explícito (`pr-topology: direct`), inversão
  consciente da zero-migração da ADR-004 (decisão humana registrada acima);
  vocabulário P1.1 cresce +1 (`awaiting-integration`); branch longa pode
  derivar da integração — a política de rebase/sync fica como convenção de
  time (fora de escopo da round), risco aceito.
- **Risco:** facilitador esquecer o `--base`/`--target-branch` explícito e o
  PR mirar a branch default do repo — mitigado pelo gotcha pinado nos dois
  cookbooks (seção 4.5) e pela regra "sempre explícito" na J5.
