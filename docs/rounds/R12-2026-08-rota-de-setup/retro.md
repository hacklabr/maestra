# Retro of round R12 — Rota de setup no kernel

## Round signals
- **Specification gaps:** 0 — o briefing (issue #44) + 3 respostas de descoberta bastaram; nenhuma pergunta de requisito chegou ao Stage 3.
- **New requirements discovered in Stage 3:** 0 (a correção do README stale foi contradição documental dentro do escopo, não requisito novo — Deviation 2).
- **Late infeasibilities:** 0 — a restrição do parser de `config.md` (ADR-014) foi detectada na descoberta (STAGE 0), não na execução; virou ADR-002 sem retrabalho.
- **Documentation contradictions (`doc-bug`):** 0 abertas (a linha stale do README foi corrigida no ato, dentro do escopo).
- **Registered overrides:** 0.
- **Feedback:** 0. Zero feedback/overrides/doc-bug nesta round — registro honesto (trigger #11): uma round limpa não é prova de absorção, mas a conta continua sendo vigiada nas próximas.

## Process learnings
1. **Worktree precisa nascer com submódulo inicializado.** O `maestra/ops` criou a worktree na convenção correta, mas sem `git submodule update --init` — o catálogo vendorizado veio vazio e o primeiro `npm run ci` falhou (3 testes do catalog loader). Um ciclo inteiro de CI perdido. Registrado como F033; candidato a endurecer a convenção de worktree (J5/ops-kernel) numa round futura.
2. **O gate de consentimento melhorou o desenho.** O ajuste do humano no gate (defaults `Produto`/`Engenharia`/`Entrega`) incorporou uma decisão de UX que o desenho técnico não tinha — o gate funcionou como ponto real de alinhamento, não como carimbo (§7.13).
3. **STAGE 0 da descoberta pagou o custo.** Ler o template `config.md` antes de propor revelou a restrição do parser ("chaves fora do padrão são silenciosamente ignoradas") e evitou o desenho ingênuo de persistir labels no `config.md` — que teria explodido como configuração invisível na execução.
4. **Consolidação cross-round não existe no MVP** — este registro está pronto para ela quando sair do roadmap.
