# Scope of round R24 — Setup versionado no maestra_status

> Epic: [#66](https://github.com/hacklabr/maestra/issues/66) · Variant: Minimal (modo direto)
> Briefing: demanda de texto livre aprovada em sessão direta em 2026-09-11 (a issue #66 carrega o registro em duas camadas). Correção de variante Condensed→Minimal pelo PO na triagem — ver F051.
> Origem: o setup da Maestra por projeto roda uma vez, mas a Maestra adiciona etapas de setup entre versões (ex.: #46, organização agêntica). Sem memória de qual versão validou o setup, um projeto configurado com versão antiga fica defasado em silêncio.

## Variant

minimal

## Requirements introduced

- RF-71 — **Carimbo de versão de setup**: `maestra_status` persiste em `config.md` (branch órfã `__maestra_config__`, ADR-003) a linha `- setup-verified: <versão>` com a versão da Maestra que verificou o setup do projeto. Escrita idempotente: somente quando o carimbo muda — nenhum commit por sessão.
- RF-72 — **Drift + etapas pendentes**: registro `SETUP_STEPS` em código (id, label, sinceVersion). Versão atual ≠ carimbo → etapas com `sinceVersion` > carimbo são reportadas como re-setup pendente, nomeadas uma a uma na nota do relatório (`report.setup`).
- RF-73 — **Adoção silenciosa e downgrade**: `config.md` sem carimbo (todos os projetos atuais) → carimba a versão atual sem alerta — detecção de drift é efetiva a partir da adoção. Carimbo > versão atual (downgrade do plugin) → aviso, carimbo mantido, nada escrito.
- RF-74 — **Não-regressão de ruído**: sem drift e setup completo, a saída permanece limpa como hoje (nenhuma nota nova); projetos sem `config.md` seguem o fluxo de primeira triagem sem interferência.

## Requirements changed

- `src/tools/status.ts` — o relatório ganha a seção `setup` (`verifiedWith`, `current`, `pendingSteps`, `stamped`, `downgraded`) e a descrição da ferramenta passa a mencionar o drift de setup. Nenhum outro campo muda.

## Requirements discontinued

- (nenhum)

## Out of scope for this round

- Auto-correção/migração de setups legados além do alerta (a execução do re-setup segue o roteiro existente — J12/J1 Stage 4).
- Entradas futuras no registro `SETUP_STEPS` (cada etapa nova entra no release que a introduz).
- Checagem de conteúdo das etapas (o registro é por versão de nascimento, não por validação de artefatos).

## Acceptance criteria (do briefing aprovado)

1. Numa repo com setup feito, após rodar `maestra_status`, a branch `__maestra_config__` registra a versão da Maestra que verificou o setup (RF-71).
2. Com versão nova que introduziu etapa de setup inexistente no projeto, `maestra_status` alerta nomeando a etapa faltante (RF-72).
3. Rodar `maestra_status` de novo na mesma versão não alerta de novo nem escreve novo commit (RF-71/RF-74).
4. Sem drift e setup completo: saída limpa como hoje, sem ruído novo (RF-74).
5. `npm test` e `npm run ci` verdes.
