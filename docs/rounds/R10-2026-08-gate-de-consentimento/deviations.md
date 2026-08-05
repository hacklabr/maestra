# Deviations of round R10 — gate de consentimento

<!-- Every divergence between what was planned and what was implemented.
     An undeclared deviation is the embryo of contradictory documentation. -->

## Deviation 1 — Seção do microcopy numerada §7.13 em vez de §7.12
- **Planned:** o desenho técnico (comentário na issue #41) previa o template do gate de consentimento como "§7.12" do `reference/microcopy.md`.
- **Implemented:** o template foi criado como **§7.13** — todas as referências cruzadas (J2, J5, kernel direto, índice de âncoras) apontam para §7.13.
- **Reason:** na implementação, a numeração §7.12 já estava ocupada pela seção "Quick capture (J11)" (criada na R07) — a próxima seção livre era §7.13.
- **Decision registered at:** desenho técnico na issue #41 (comentário "Technical design (Minimal — Stage 2)"); correção aplicada no ato da implementação, sem contestação.
- **Reference document updated:** `src/instructions/reference/microcopy.md` (commit da branch `r10-consent-gate`, PR da issue #41).
