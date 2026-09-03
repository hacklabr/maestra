# Deviations of round R22 — Descoberta profunda para demandas em texto livre

## Deviation 1 — Fechamento por merge local em vez de merge pela plataforma

- **Planned:** PR #63 mergeada pela plataforma após a aceitação (fluxo padrão de PR).
- **Implemented:** branch `r21-descoberta-texto-livre` mergeada localmente na `main` (`--no-ff`, commit `f776552`) com push direto; a PR #63 foi marcada como merged por detecção da plataforma.
- **Reason:** "faça o merge localmente" (decisão do humano no ato da aceitação, 2026-09-02).
- **Decision registered at:** override register na issue #59 (comentário "Override register — Type: gate", 2026-09-02) + Event D no mesmo ato.
- **Reference document updated:** issue #59 — override register + veredito de aceitação (comentário de fechamento).

## Deviation 2 — Round renumerada R21 → R22 no fechamento

- **Planned:** round R21 — pasta `docs/rounds/R21-2026-09-descoberta-texto-livre/`, RFs 64–68, ADR-007 `Round: R21`, microcopy §7.15 (deep discovery), changelogs citando R21.
- **Implemented:** round R22 — pasta renomeada, `scope.md` com adendo de colisão dupla, microcopy resecionada §7.15→§7.16, versões rebumped (j1→v6, kernel→v8, microcopy→v11), fixture de eval renomeada `r21-`→`r22-`, metadata da #59 `Round: R22`, título da PR #63 atualizado.
- **Reason:** dupla colisão com sessões paralelas no mesmo dia — a pasta R20 já existia ao nascer (→ nasceu R21) e a `main` já continha `R21-2026-09-calibracao-variante-tamanho` (épico #60) no momento do merge (→ R22). A regra de colisão da jornada manda incrementar e re-anunciar; foi o que se fez no ato.
- **Decision registered at:** adendo no cabeçalho de `docs/rounds/R22-2026-09-descoberta-texto-livre/scope.md` + comentário na PR #63 + metadata da #59.
- **Reference document updated:** `docs/rounds/R22-2026-09-descoberta-texto-livre/scope.md` (commit `8417f74`, dentro do merge `f776552`).
