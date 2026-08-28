# Deviations — R16 (Classificação de issues: tipo nativo + dimensão)

> Round: R16 · Epic: [#34](https://github.com/hacklabr/maestra/issues/34) · Reconciliação: 2026-08-28
> Formato P3: planned → implemented → reason → decisão registrada → documento de referência atualizado.

Desvios planejado × implementado: **nenhum** — a implementação entregou exatamente o desenho técnico aprovado (10 arquivos de instrução/docs + ADR-005 + dogfood na plataforma; zero mudança em `src/**/*.ts`); `npm run ci` verde ponta a ponta na verificação em 1ª pessoa.

## D1 — Merge local em vez de PR (decisão humana contra o fluxo pós-aceitação — override, cross-referenciado por transparência)

- **Planned:** fluxo pós-aceitação padrão (ADR-004/workflow.md): abertura de PR, aceitação GitHub-side, fechamento da issue.
- **Implemented:** merge local da branch `r16-classificacao-de-issues` em `main` + push, sem PR aberto.
- **Reason:** instrução explícita do humano no aceite ("faça o merge do PR localmente") — decisão legítima (a decisão é do humano); registrada como override ANTES do ato.
- **Decision registered at:** Override register (P3) na issue #34, emitido antes da ação (2026-08-28).
- **Reference document updated:** esta entrada + `retro.md` § "O que doeu" (rota ADR-004 não exercitada nesta round).

---

Observação de ambiente (não é desvio da round): `npm run ci` exige `git submodule update --init` em clones/worktrees frescos — condição pré-existente registrada como F043 em `docs/dogfooding/findings.md`.
