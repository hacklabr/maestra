# Template — `AGENTS.md` do projeto-alvo

> Source: round R13 scope (issue #46) — J12 STAGE 5.1 · Module version: 1 — 2026-08-11
> Anti-drift: the AGENTS.md format is a contract for agents — it points to the docs, never copies their content. Short and dense: max ~250 lines. Payload in the target project's docs language (PT-BR by default); code/commands always real.
> Placeholders in `{BRACES}` are filled from the STAGE 0 inventory (stack manifests) and the STAGE 4 analysis. Stack undetectable → `<!-- TODO: preencher -->`, never an invented generic command.

```markdown
# AGENTS.md — {NOME_DO_PROJETO}

## 1. Contexto do projeto

{O que é o projeto, stack detectada, propósito — 3 a 5 linhas.}
A fonte de verdade do produto é o PRD vivo em `docs/reference/prd.md`.

## 2. Comandos verificáveis

| Ação | Comando |
|---|---|
| Build | `{CMD_BUILD}` |
| Testes | `{CMD_TEST}` |
| Lint | `{CMD_LINT}` |
| Typecheck | `{CMD_TYPECHECK}` |

Rode os comandos relevantes antes de declarar qualquer tarefa pronta.

## 3. Mapa da estrutura

{10–15 linhas descrevendo as pastas principais do código e a regra de onde cada
tipo de código deve viver. Greenfield: `<!-- TODO: preencher -->`.}

## 4. Regras invioláveis

- Nunca commitar sem rodar os testes.
- Nunca criar arquivos sem necessidade.
- Nunca editar migrations já aplicadas.
- Nunca adicionar dependências sem justificar.
- Nunca desativar checks de CI para fazer o build passar.

## 5. Convenções

As convenções vivem em `docs/reference/conventions/` (`code-style.md`,
`git-workflow.md`, `api-design.md`). Leia antes de escrever código — este
arquivo aponta, não duplica.

## 6. Workflow esperado

- Planeje antes de codar.
- Rode os testes antes de declarar pronto.
- Formato de commit e PR/MR conforme `docs/reference/conventions/git-workflow.md`.
- Consulte `docs/reference/jornadas.md` antes de alterar fluxos de usuário.

## 7. Ponteiros

- `docs/reference/prd.md` → produto e requisitos (fonte de verdade)
- `docs/reference/jornadas.md` → fluxos de usuário
- `docs/reference/arquitetura/INDEX.md` → fonte de verdade da arquitetura
  (índice roteador — carregue cada doc só quando relevante)
- `docs/reference/decisions/` → ADRs (registros de decisão técnica)
- `.agents/skills/` → catálogo de procedimentos sob demanda

## Skills — procedimentos sob demanda

Regras sempre ativas ficam neste arquivo; procedimentos vivem em
`.agents/skills/`. Um procedimento só vira skill quando é repetível,
multi-etapa ou de alto custo de erro — e não-óbvio (se qualquer agente acerta
sem orientação, não precisa de skill).

**Evolução contínua:** quando uma decisão consolidada ou padrão recorrente
emergir no dia a dia (ex.: arquitetura de módulos definida, convenção de
widgets estabilizada), proponha uma skill usando
`.agents/skills/exemplo-skill/SKILL.md` como formato — nunca crie sem
aprovação explícita.

## ADRs são imutáveis

Decisão nova = ADR novo em `docs/reference/decisions/` (sequência de 4
dígitos a partir do máximo existente), que referencia o substituído. Nunca
edite um ADR aceito; nunca renumere ADRs existentes. Formato:
`docs/reference/decisions/0000-template-adr.md`.
```

**Usage rules:**

- The seven numbered sections are mandatory and in this order; the two closing
  blocks (skills, ADRs) are standing rules — they never carry project content.
- Filling a section with copied doc content violates the contract — the
  AGENTS.md points; the docs hold the content.
- When the setup's refactor sub-stage (J12 STAGE 5.2) moves a block out of a
  pre-existing AGENTS.md, the diff checkpoint shows the resulting file built
  on THIS template's skeleton, with the human's preserved content in it.
