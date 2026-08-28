# Deviations — R15 (Fluxo de QA pós-aceitação)

> Round: R15 · Epic: [#49](https://github.com/hacklabr/maestra/issues/49) · Reconciliação: 2026-08-19
> Formato P3: planned → implemented → reason → decisão registrada → documento de referência atualizado.

## D1 — Local da configuração

- **Planned:** briefing aprovado e RF-39 original localizavam a configuração em `.maestra/config.md` (chave `workflow.post_pr_acceptance`).
- **Implemented:** `workflow.md` na raiz da branch órfã `__maestra_config__`, lido/gravado via `maestra-config read/write workflow.md` (chaves `post-pr-acceptance`, `qa-approval-column`).
- **Reason:** em duas camadas — (1) ADR-002: o parser do `config.md` aceita apenas as 4 chaves do ADR-014 e ignora silenciosamente o resto (configuração invisível); (2) ADR-003 (R14, mergeada entre o design e a verificação): toda a configuração do repositório vive na branch órfã — a primeira implementação usou `.maestra/workflow.md` na árvore e foi corrigida na mesma sessão (commit `0085b49`).
- **Decision registered at:** ADR-004 (`docs/decisions/adr/ADR-004-fluxo-pos-aceitacao-workflow-md.md`) + transparência no comentário técnico da #49 (2026-08-18).
- **Reference document updated:** ADR-004 + `src/instructions/templates/workflow.md` + P6 (`protocols.md`) + J12 (`j12-setup.md`) — merge `e3c1692` (PR #51).

## D2 — Mudanças em `src/` contra o fora-de-escopo da round

- **Planned:** "Mudanças em `src/` (tools, hooks) — round de instruções/config" (scope, Out of scope).
- **Implemented:** `src/platform/config-store.ts` (allowlist `CONFIG_FILE_NAMES` +`workflow.md`), `src/cli/migrate-config.ts` (`migrate` escopado aos 3 arquivos legados; `workflow.md` nasce só na branch), `src/cli/migrate-config.test.ts` (+2 testes).
- **Reason:** consistência com a doutrina ADR-003 exigia o arquivo no store da branch órfã; sem a extensão da allowlist, `maestra-config write workflow.md` rejeitaria o arquivo. Extensão mínima (1 linha + escopo), nenhum critério de escala da árvore J1 aplicável — variante Minimal mantida, sem registro de override.
- **Decision registered at:** comentário de aceite da #49 (veredicto por critério, desvios declarados no ato, 2026-08-19) + ADR-004 §Consequências.
- **Reference document updated:** ADR-004 + copy de uso do `maestra-config` — merge `e3c1692`.

## D3 — Correção in-round do RF-39

- **Planned:** RF-39 como registrado no nascimento da round (config.md na árvore).
- **Implemented:** RF-39 reescrito (2026-08-19) com nota datada, citando branch órfã/ADR-003.
- **Reason:** round ainda aberta — scope é documento vivo até o fechamento; correção datada no próprio texto, nunca reescrita a seco (doutrina P1/AGENTS).
- **Decision registered at:** commits `524b41e` (primeira emenda) e `0085b49` (segunda, branch órfã) — trilha no git diff.
- **Reference document updated:** `docs/rounds/R15-2026-08-fluxo-qa-pos-aceitacao/scope.md` (nota datada no próprio RF-39).

## D4 — Enumeração de arquivos da branch órfã incompleta (descoberta NA reconciliação)

- **Planned:** nenhum toque em README/AGENTS (a implementação os deixou intocados).
- **Implemented:** README.md (tabela de ferramentas) e AGENTS.md (estrutura + referências) atualizados para listar `workflow.md` na branch órfã.
- **Reason:** a correção D1 (extensão da allowlist) tornou as enumerações existentes incompletas — contradição doc×código detectada no checklist de reconciliação (item 3) e corrigida no ato (J5 F2).
- **Decision registered at:** esta entrada (D4) + commit de reconciliação da R15.
- **Reference document updated:** `README.md` + `AGENTS.md` (commit de reconciliação da R15).
