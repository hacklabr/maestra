# Deviations — R19 (Dedup universal antes de criar issue)

> Round: R19 · Epic: [#53](https://github.com/hacklabr/maestra/issues/53) · Reconciliação: 2026-08-28
> Formato P3: planned → implemented → reason → decisão registrada → documento de referência atualizado.

## D1 — Superfície de 11 para 12 arquivos (AGENTS.md)

- **Planned:** comentário técnico da #53 (2026-08-28) enumerava 11 arquivos: kernel ×2 (standard + direct), jornadas ×4 (J1/J3/J5/J2), cookbooks ×2 (GH/GL), microcopy, `evals/scenarios/anti-bypass.yaml`, `evals/README.md`.
- **Implemented:** 12 arquivos — o `AGENTS.md` da raiz também foi editado: "O kernel define 18 triggers anti-bypass" → "19 triggers".
- **Reason:** o AGENTS.md enumera a contagem de triggers na seção Anti-bypass; atualizar o kernel para 19 sem sincronizar o AGENTS.md criaria contradição entre documentos do repositório (mesma família que o trigger #16 trata para doc × código). Descoberta durante a implementação; extensão mínima de consistência, sem mudança de comportamento.
- **Decision registered at:** comentário de aceitação da #53 (veredicto por critério, desvio declarado no ato, 2026-08-28).
- **Reference document updated:** `AGENTS.md` (seção Anti-bypass) — merge do PR desta round.
