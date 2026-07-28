# Templates de Artefatos

> Source: fluxo-de-desenvolvimento.md §11 + docs/referencia/jornadas.md §5/J9 (v2.1) · Module version: 2 — 2026-07-28
> Anti-drift: templates verbatim da fonte; slots em `{MAIUSCULO}`. Divergência é finding, nunca ajuste silencioso.
> Changelog: v1 (T10-L3): 7 templates da camada de linguagem · v2 (T10 final): 6 templates restantes — conjunto completo.

## Entregues (conjunto completo — T10)

| Arquivo | Conteúdo | Fonte |
|---|---|---|
| `issue-duas-camadas.md` | Issue P1 (Resumo + metadados + Detalhes para execução) | jornadas §5 P1/P1.1 |
| `tarefa-implementacao.md` | Tarefa de implementação (Etapa 3), duas camadas | fluxo §11.1 + jornadas P1 |
| `tarefa-artefato.md` | Tarefa de artefato (Etapas 1/2), classe REFERÊNCIA×REGISTRO declarada | fluxo §11.2 + jornadas §4 |
| `adr.md` | ADR com status + checkpoint de unicidade | fluxo §11.5 + jornadas J4 |
| `motivacao.md` | Motivação de refatoração (variante Técnica) + trava anti-auto-aprovação | fluxo §11.6 + jornadas J6 |
| `dor-resumo.md` | DoR: checklist do gate E1 + tabela por variante | fluxo §6 + §11.7 |
| `escopo.md` | Escopo da rodada (REGISTRO) | fluxo §11.3 |
| `desvios.md` | Desvios da rodada (REGISTRO) + regras P3/#14 | fluxo §11.4 + jornadas §5 P3 |
| `retro.md` | Retro da rodada (REGISTRO) — template derivado (Q2) | jornadas J5 Etapa 4 + fluxo §9.4/§10 |
| `mesa/posicao.md` | Posição de mesa por turno (REGISTRO auxiliar) — template derivado | jornadas J9 (G-08) |
| `override-comentario.md` | Referência do registro P3 (emitido pela tool, nunca à mão) | jornadas §5 P3 + emit-event.ts |
| `team.md` | Mapa de equipe `.fluxo/team.md` | jornadas §5 P5 |
| `config.md` | Config `.fluxo/config.md` (formato exato do parser) | src/platform/config.ts (ADR-014) |

**Templates derivados (fonte não fixa formato interno):** `retro.md`, `mesa/posicao.md` — marcados como derivados no cabeçalho; ajuste de formato exige registro no Audit Log do jornadas.md.

## Pendentes

Nenhum.
