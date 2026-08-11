# Template — Project skill (`.agents/skills/<nome>/SKILL.md`)

> Source: round R13 scope (issue #46) — J12 STAGEs 5.1–5.3 · Module version: 1 — 2026-08-11
> Anti-drift: the skill format is a contract for agents — the `description` is the ACTIVATION CRITERION (when to use), never marketing. Used to generate the reference `exemplo-skill`, skills refactored out of existing agent configs (STAGE 5.2) and pattern-based candidate skills (STAGE 5.3).
> Payload in the target project's docs language (PT-BR by default).

```markdown
---
name: {nome-da-skill}
description: {O que a skill faz E QUANDO deve ser usada — critério de ativação explícito, ex.: "Use quando for criar um novo módulo neste projeto"}
---

# {Título da skill}

## Pré-requisitos

- {O que deve existir/estar pronto antes de começar — ex.: "branch atualizada", "ADR-0003 lido"}

## Procedimento

1. {Passo numerado, objetivo, verificável.}
2. {…}

## Critérios de pronto

- [ ] Testes passando (`{CMD_TEST}`)
- [ ] Tipos checados (`{CMD_TYPECHECK}`)
- [ ] Documentação atualizada se o contrato mudou
```

**Usage rules:**

- `description` MUST state when the skill activates — a skill whose trigger is
  ambiguous is never loaded or loaded at the wrong time.
- Steps are numbered, imperative and verifiable by a third party.
- The done checklist always carries tests + typecheck (real commands from the
  STAGE 0 inventory) + docs-if-contract-changed; project-specific items are
  appended, never replacing these three.
- The generated `exemplo-skill` keeps the placeholders visible (it IS the
  format reference); refactored/pattern skills are generated fully filled.
