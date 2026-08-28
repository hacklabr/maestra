# Scope of round R18 — Branch do épico como destino dos PRs das tarefas

> Epic: [#54](https://github.com/hacklabr/maestra/issues/54) · Variant: Minimal (modo direto)
> Briefing: a própria issue #54 (Minimal — a issue é o briefing), aprovado em sessão direta em 2026-08-28 ("registre").
> Nota de nascimento: R16 está em uso pela round paralela da issue #34 (worktree `r16-classificacao-de-issues`); R17 pré-existente (`instrucoes-sem-prompt`, RF-45..47) → Rnn = 18, RFs a partir de RF-48. Metadada da issue corrigida no mesmo ato (nasceu com `Round: R16`).
> Nota de vocabulário: a topologia chaveia a **branch de integração do repo** (ex.: `develop`, `main`) — não um nome literal; este repo integra em `main`.

## Variant

minimal

## Requirements introduced

- **RF-48** — Nova chave `pr-topology: epic-branch | direct` em `workflow.md` na raiz da branch órfã `__maestra_config__` (ADR-003/ADR-004; lida via `maestra-config read workflow.md`). **Padrão `epic-branch`** — arquivo ou chave ausente = `epic-branch`. Opt-out explícito por `direct` (inversão consciente da zero-migração da ADR-004, decisão humana em descoberta: "a adoção pode ser configurável mas o padrão deve ser epic-branch").
- **RF-49** — A branch do épico nasce *lazy*: no consent gate da primeira tarefa de implementação, somente quando a onda tem **≥2 tarefas de implementação**; nunca no nascimento do épico (J1 não muda). Convenção de nome: `epic/<n>-<slug>` (`<n>` = número da issue épica). Variante **Minimal nunca ganha branch de épico** (issue única, PR direto para a branch de integração), em qualquer configuração.
- **RF-50** — Com `epic-branch` ativo, os PRs das tarefas filhas apontam para a branch do épico como base. A aceitação da tarefa filha não muda: veredicto por critério no aceite, card → coluna de review na abertura do PR e → Delivered no merge (P6 existente).
- **RF-51** — A branch do épico morre no merge do PR de integração do épico (épico → branch de integração), ou no abandono/reclassificação do épico — teardown análogo ao do worktree, no mesmo ato, narrado.
- **RF-52** — O épico ganha substate **`awaiting-integration`** (P1.1 +1, custo declarado): a abertura do PR do épico acontece **no ato do aceite da última filha** (atomicidade P6) → substate `awaiting-integration` + card do épico para a coluna de review; o merge do PR do épico → `awaiting-reconciliation` (existente) + card em Delivered.
- **RF-53** — Modo `qa` (ADR-004) compatível sem mudança de semântica: QA valida por tarefa; o ambiente de testes roda a branch do épico; o PR do épico somente abre com **todas** as filhas fechadas (QA-approved quando `qa`).

## Requirements changed

(nenhum)

## Requirements discontinued

(nenhum)

## Out of scope for this round

- Automação de CI/CD para a branch do épico (deploy do ambiente de testes fica como hoje).
- Política de rebase/sync da branch do épico contra a branch de integração.
- Gestão de release (freeze, versionamento, notas).
- Mudanças no doc normativo externo `fluxo-de-desenvolvimento.md` — a topologia configurável não o contradiz (ele não prescreve destino de branch hoje).
- Mudanças em `src/` (código do plugin) — guarda: se o desenho técnico exigir, reclassificar a variante com registro (mesma cláusula do R15).

## Acceptance criteria (do briefing aprovado)

1. Repo sem `workflow.md` (ou sem a chave): as instruções prescrevem branch de épico na primeira implementação de onda com ≥2 tarefas, e PRs de tarefas apontando para ela — verificável lendo J5 Stage 3 + cookbooks.
2. `pr-topology: direct` explícito: fluxo idêntico ao atual — nenhuma prescrição de branch de épico em nenhum módulo de execução.
3. Minimal: PR direto para a branch de integração, sem branch de épico, em qualquer configuração — dito sem ambiguidade nas instruções.
4. `awaiting-integration` consta do vocabulário fechado P1.1 com mapeamento de coluna na tabela P6; transições do épico (PR aberto → review; merge → reconciliação) especificadas no mesmo ato da abertura/merge.
5. Cookbooks GitHub e GitLab refletem as operações novas (criar branch de épico, PR com base na branch do épico, PR de integração do épico) em vocabulário neutro (ADR-012).
6. ADR-006 vigente registrando a decisão (incluindo a inversão do padrão e seu custo de upgrade); `templates/workflow.md` e J12 propõem `epic-branch` como padrão. *(Correção in-round, 2026-08-28: redação original citava ADR-005 — número tomado pela round paralela R16/#34 em `main`; ver `deviations.md`.)*
7. Nenhuma mudança em `src/` **fora de `src/instructions/`** (tools/hooks/cli = código do plugin). *(Precisão in-round, 2026-08-28: a redação original dizia "em `src/`" sem qualificar — as instruções do plugin vivem em `src/instructions/` e são a superfície declarada da round; a guarda, herdada do R15, sempre se referiu a código. Verificação: `git diff main...r18-branch-do-epico --stat` sem nenhum path de código.)*
