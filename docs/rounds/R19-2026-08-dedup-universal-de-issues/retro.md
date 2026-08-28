# Retro — R19 (Dedup universal antes de criar issue)

> Epic: [#53](https://github.com/hacklabr/maestra/issues/53) · Merge: `4d21562` (PR #56) · Fechamento: 2026-08-28

## O que a round entregou

Anti-bypass trigger #19 — nenhuma issue que representa uma demanda nasce sem busca prévia de duplicatas/relacionadas (abertas + fechadas), com candidato apresentado ao humano antes da criação (create/relate/increment). Superfície: 12 arquivos (kernel standard + direct, J1/J2/J3/J5, cookbooks GH/GL com `search-similar`, microcopy §7.12 journey-agnostic, AB-19 + README, AGENTS.md). Carve-out: filhas de onda confirmada (P7) cobertas pela dedup do plano.

## Calibração e fluxo

- 0 perguntas de elicinação na triagem; 0 rodadas de correção de entendimento (eventos A/B = 0/0).
- Minimal calibrada pelo histórico (#41/#44/#49); confirmada sem contestação.
- **Colisão R16–R18 detectada pela re-lista F007 antes do nascimento** — a metadata nasceu "Round: R16" e foi corrigida para R19 no ato. Ironia produtiva: a demanda nasce de duplicatas (F040), e a própria sessão executou dedup (Step 0) e colisão de numeração ao vivo.
- Sessões paralelas ativas o tempo todo (R16 mergeada, R17 untracked, R18 com worktree aberto): stage cirúrgico por caminho em todos os commits — zero conflito.

## Desvios

- D1 (durante a execução): superfície 11→12 arquivos — AGENTS.md sincronizado (contagem 19). Ver `deviations.md`.

## Findings

- **F040** (origem da round) → resolved (#53).
- **F041** (novo): worktree novo não inicializa submódulo → ci quebra antes de erro real. Workaround: `git submodule update --init`. Candidato: instrução no trigger #9/ops-kernel.
- **F042** (novo): vitest no main escaneia `.worktrees/` de sessões paralelas → `npm run ci` no main falha com testes alheios (3 falhas do r18 durante a reconciliação desta round). Workaround: `--exclude "**/.worktrees/**"`. Candidato: `test.exclude` no vitest config.

## Observações (fora do escopo, candidatas a rounds futuras)

- `evals/README.md`: tabela AB tem buraco pré-existente 17/18 (triggers #17/#18 sem linha).
- `findings.md`: corrupção prévia (F023/F024 repetidos) segue como demanda separada.

## Métricas

- Eventos: A (0/0), B (0), F (during=1, at-reconciliation=0).
- Verificação final no main mergeado (`4d21562`): build ✓ · typecheck ✓ · tests 300/300 ✓ · check:vocab ✓ · check:dist ✓ · smoke 168/168 ✓ · eval:dry 60/60 ✓.
