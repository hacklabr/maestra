# Scope of round R14 — configuração em branch órfã

## Variant

minimal (override registrado no épico #48 — critérios apontavam condensed; direção humana: minimal em modo direto, sessão única)

## Requirements introduced

- RF-34 — A configuração por repositório do Maestra (`config.md`, `team.md`, `labels.md`) vive na branch órfã `__maestra_config__` — sem ancestral comum com as branches do projeto — e a árvore da branch padrão do projeto-hóspede não contém pasta `.maestra/`.
- RF-35 — A configuração sobrevive entre sessões e é lida da branch órfã pelas ferramentas (`maestra_status`, `issue_digest`, `emit_event`, `maestra-report`); o comportamento observável das ferramentas permanece o mesmo de hoje.
- RF-36 — Toda escrita de configuração (persistência de detecção, team map, mapeamento de labels) é commitada na branch órfã e pushada para o remote — compartilhada com a equipe, zero commits novos da maestra nas branches do projeto.
- RF-37 — Cutover sem fallback: a nova versão lê exclusivamente da branch órfã; `.maestra/` legada na árvore do projeto deixa de ser lida.
- RF-38 — Um passo de migração move os arquivos existentes de `.maestra/` (config/team/labels) para a branch órfã e os remove da branch do projeto; o próprio repo do Maestra migra como primeiro caso (dogfooding).

## Requirements changed

- RF-26 — before: mapeamento de labels/colunas persistido em `.maestra/labels.md` na árvore do projeto | now: mesmo arquivo `labels.md`, agora na branch órfã `__maestra_config__` (conteúdo e parser inalterados).

## Requirements discontinued

(nenhum)

## Out of scope for this round

- Reescrita do histórico passado do repo-hóspede (commits antigos que tocaram `.maestra/` permanecem como estão).
- Proteção de branch / permissões da `__maestra_config__` no remote.
- Qualquer outro arquivo de estado: docs de round (`docs/rounds/`), PRD vivo e ADRs continuam versionados no repo do projeto.
- Período de transição com fallback duplo (decidido contra na descoberta: cutover + migração).

## Decisões de produto registradas na descoberta (2026-08-18)

1. Branch órfã **remota** (push) — preserva o compartilhamento da configuração com a equipe que existe hoje via repo versionado.
2. **Cutover** com passo de migração — sem período de leitura dupla (fallback legado) para não criar superfície de teste permanente.
