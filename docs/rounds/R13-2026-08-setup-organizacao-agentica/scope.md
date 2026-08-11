# Scope of round R13 — Organização agêntica no setup

> Epic: [#46](https://github.com/hacklabr/maestra/issues/46) · Variant: Minimal (modo direto)
> Briefing: a própria issue #46 (Minimal — a issue é o briefing), aprovado em sessão direta em 2026-08-11.

## Variant

minimal

## Requirements introduced

- RF-29 — A jornada de setup (J12) ganha etapa de organização agêntica que gera, de forma idempotente e sem sobrescrever arquivos existentes: AGENTS.md roteador (≤250 linhas, comandos reais da stack detectada instrucionalmente), `.agents/skills/exemplo-skill/` (template de formato), `arquitetura/INDEX.md` (tabela Documento/Conteúdo/Quando ler cobrindo todos os docs de arquitetura), `arquitetura/runbooks/`, `decisions/0000-template-adr.md` (numeração sequencial de 4 dígitos sem conflito; ADRs imutáveis) e `conventions/` (code-style, git-workflow, api-design). Greenfield nasce com placeholders TODO; legado é preenchido pela análise do STAGE 4.
- RF-30 — No caminho legado, a etapa analisa AGENTS.md e configs equivalentes (CLAUDE.md, .cursor/rules, copilot-instructions) e refatora: procedimentos (repetível, multi-etapa ou alto custo de erro) viram skills; divergências são consolidadas; toda reescrita exige checkpoint com diff e aprovação explícita; alias/symlink para fonte única de verdade é sugerido ou criado conforme flag.
- RF-31 — (experimental, só legado) A análise do STAGE 4 propõe skills candidatas a partir de padrões do código, sem teto numérico, com barra de qualidade: >3 recorrências evidenciadas (ou alto custo de erro justificado) e nunca para comportamento óbvio; toda candidata exige aprovação explícita (lote aceito).
- RF-32 — O template do AGENTS.md inclui a regra de evolução contínua: padrões/decisões consolidados que emergem no dia a dia devem ser propostos como skills; regras sempre ativas ficam no AGENTS.md, procedimentos viram skill.
- RF-33 — Ao final da etapa, o setup imprime resumo: arquivos criados, arquivos preservados, gap analysis delimitado à organização agêntica e próximos passos sugeridos.

## Requirements changed

(nenhum)

## Requirements discontinued

(nenhum)

## Out of scope for this round

- Auditoria ampla de boas práticas do projeto (CI, cobertura de testes, pre-commit) — ideia derivada registrada no ROADMAP.
- Biblioteca de arquétipos por ecossistema e evals de qualidade das skills geradas — gatilho de round futura.
- Alterar o comportamento das STAGEs 0–4 atuais da J12 além do necessário para plugar a etapa nova.
- Heurística de detecção de stack codificada em TypeScript — permanece instrucional.
- Mudanças em `src/` (tools, hooks) — round de instruções/templates; se o desenho exigir código, reclassificar com registro.

## Acceptance criteria (do briefing aprovado)

1. setup cria a nova estrutura em projeto novo e em projeto legado.
2. Estrutura existente de docs/reference/ (PRD vivo, jornadas, arquitetura, decisions/) é preservada e referenciada, nunca recriada.
3. AGENTS.md contém comandos reais da stack detectada, não placeholders genéricos (greenfield sem stack detectável usa TODOs explícitos).
4. Nenhum arquivo existente é sobrescrito sem aviso.
5. INDEX.md lista todos os docs de arquitetura com "Quando ler" preenchido.
6. ADRs existentes não são renumerados nem alterados.
7. Segunda execução é inócua (idempotente).
8. Toda reescrita de AGENTS.md/config existente passa por checkpoint com diff e aprovação explícita.
9. Skills candidatas só com >3 recorrências evidenciadas (ou alto custo de erro justificado), nunca para comportamento óbvio, e sempre com aprovação explícita.
