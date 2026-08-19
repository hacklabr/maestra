# ADR-003 — Configuração vive na branch órfã `__maestra_config__`

**Status:** Accepted
**Date:** 2026-08-18
**Round:** R14
**Epic:** #48
**Supersedes:** a decisão "config versionada na árvore do repositório-hóspede" (referida como ADR-014 em comentários de código e instruções — série externa, não materializada neste repo; ver F029)

## Context

A configuração por repositório do Maestra (`config.md`, `team.md`, `labels.md`)
é hoje commitada na árvore do projeto-hóspede (`.maestra/`). Consequências
observadas: o histórico de configuração da ferramenta se mistura ao histórico do
produto; a pasta aparece no checkout de todo desenvolvedor; commits da maestra
poluem `git log` do projeto.

A demanda do R14 (#48): a configuração passa a viver numa branch órfã
`__maestra_config__`, sem ancestral comum com as branches do projeto. Decisões
de produto registradas na descoberta: branch **remota** (push — preserva o
compartilhamento com a equipe) e **cutover** com passo de migração (sem
período de fallback duplo).

## Decision

1. **Local:** os 3 arquivos de configuração vivem na **raiz** da branch órfã
   `__maestra_config__` (a branch É a pasta de config — não há prefixo
   `.maestra/` dentro dela).
2. **Leitura:** git plumbing (`git show __maestra_config__:<file>`) — nunca
   toca a working tree, nunca requer checkout. Parser de `config.md` inalterado
   (mesmo conteúdo, novo endereço).
3. **Escrita:** plumbing commit (`hash-object` → índice temporário →
   `write-tree` → `commit-tree -p` → `update-ref`) + `git push origin
   __maestra_config__`. Sem checkout, sem worktree dedicada.
4. **Cutover:** as ferramentas leem exclusivamente da branch órfã; `.maestra/`
   legada na árvore do projeto deixa de ser lida — se presente, as ferramentas
   sinalizam "config legada encontrada — rode a migração".
5. **Migração:** CLI explícita e idempotente (`maestra-config migrate`): move
   os 3 arquivos para a branch (um commit), cria a branch órfã se ausente, e
   **imprime** os comandos de remoção de `.maestra/` da branch do projeto — a
   ferramenta nunca reescreve a branch do produto sem consentimento humano.
6. **Bootstrap:** a primeira triagem (detecção persistida) cria a branch órfã
   local e tenta o push; sem permissão de push → degrada com nota e segue
   (nunca bloqueia o épico — mesmo espírito da degradação de board, P6).

## Consequences

- **Positiva:** histórico do produto limpo (zero commits da maestra nas
  branches do projeto); config continua compartilhada via remote; pasta some
  do checkout.
- **Positiva:** zero dependências novas — git CLI já é requisito do plugin.
- **Custo:** leitura/escrita deixa de ser `fs` direto — novo módulo
  `config-store` e testes com fixtures de repo git real (init + branch órfã);
  harness de evals e `smoke.sh` adaptados.
- **Custo:** novos caminhos de erro (branch ausente, remote ausente, push
  recusado) — todos degradam com nota, nunca bloqueiam.
- **Risco:** último-escritor-vence no ref da branch (cadência de mudança de
  config é baixa; aceito).
- **Nota:** mantém o espírito do kernel "no state outside the repository" — o
  estado continua num ref git versionado e compartilhável, apenas fora da
  história do produto.

## Implementation notes (R14 — recorded at execution)

Decisões de implementação tomadas durante a execução, registradas aqui para
que `deviations.md` tenha referência documental não-vazia (anti-bypass #14):

1. **Identidade determinística dos commits de config:**
   `GIT_AUTHOR/COMMITTER = maestra <maestra@users.noreply.local>` (honra env
   pré-configurado). Commits de ferramenta, identidade de ferramenta — hermético
   em máquinas sem git identity configurada.
2. **Invariante de nascimento órfã em um único lugar:** não há export
   `ensureOrphanBranch` separado — o nascimento sem `-p` vive exclusivamente em
   `writeConfigFiles` (código morto não duplica invariante crítica).
3. **`maestra-config write`:** conteúdo byte-idêntico ao da branch → no-op
   (simetria de idempotência com `migrate`, RF-38); stdin vazio → rejeitado
   (commit de arquivo vazio neutraria o parser silenciosamente).
4. **`maestra-config read`:** fora de repo git degrada para "branch não
   encontrada" — um caminho de erro claro, sem probe extra.
5. **Degradação nunca lança:** `writeFluxoConfig` degrada para campo `error`
   no resultado; a store lança `ConfigStoreError`, mapeada pelo CLI para exit 1.
   Push degradado (sem remote, non-fast-forward, sem credencial) → nota
   estruturada, fluxo segue.
6. **`onWrite` callback** atravessa `resolveForge`→`detectForge` (aditivo,
   opcional) para que a degradação de push no bootstrap apareça nas notas do
   `maestra_status`.
7. **Interface de deps mantida como `MigrateDeps`**, estendida com injetores
   `stdin`/`stdout` (renomear para `CliDeps` seria churn de símbolo exportado
   no meio da round).
8. **Caminho de escrita do facilitador** (team/labels, RF-36): subcomandos
   `maestra-config read/write <file>` — plumbing cru por LLM via bash é frágil;
   o CLI chato e seguro é o veículo.
