# Retro of round R11 — Subagente especializado em git + CLI de plataforma

<!-- Filled at closing (J5 Stage 4/5). The signals below are the
     thermometer of the quality of the previous stages (fluxo 9.4) — and the
     raw material of future consolidation. -->

## Round signals
- **Specification gaps:** 1 — o comentário de desenho técnico não incluiu a superfície de verificação (`scripts/smoke.sh` fixava a contagem de subagentes gerados) nem o README (inventário de agentes); ambos viraram desvios 1 e 2.
- **New requirements discovered in Stage 3:** 0.
- **Late infeasibilities:** 0.
- **Documentation contradictions (`doc-bug`):** 0 — a contradição README × código foi evitada no ato (dentro do PR), sem necessidade de issue `doc-bug`.
- **Registered overrides:** 0.
- **Feedback:** 0.

## Process learnings

1. **Comentário de desenho deve incluir a superfície de verificação.** Mudanças que tocam artefatos gerados no install (agentes) acoplam com asserções de smoke/eval — listar `scripts/smoke.sh` (e evals, quando aplicável) no desenho teria evitado o desvio 1.
2. **Mudança no inventário de agentes = README no desenho.** O README documenta o que o instalador gera; qualquer round que crie/remova agente deve listar o README como superfície desde o desenho (desvio 2).
3. **A própria sessão foi o sintoma da #40:** o facilitador executou diretamente dezenas de comandos `gh`/`git` (edição de issue, board com 3–4 chamadas, worktree, PR). Com o `maestra/ops` instalado, sessões futuras delegam essa mecânica — a round se auto-justifica.
4. Consolidação cross-round segue no roadmap; este registro está pronto para ela.
