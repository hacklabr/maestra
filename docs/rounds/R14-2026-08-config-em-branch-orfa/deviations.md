# Deviations of round R14 — configuração em branch órfã
<!-- Every divergence between what was planned and what was implemented.
     An undeclared deviation is the embryo of contradictory documentation. -->

## Deviation 1 — API da store: `ensureOrphanBranch` não exportada
- **Planned:** design técnico (comentário no #48): `config-store.ts` exportaria `ensureOrphanBranch` separado do write.
- **Implemented:** o nascimento órfã (commit sem `-p`) vive exclusivamente dentro de `writeConfigFiles`; não há export separado.
- **Reason:** nenhum consumidor chamaria o ensure isolado (bootstrap e migrate escrevem conteúdo real); invariante crítica protegida em um único lugar é mais segura que duplicada num export morto.
- **Decision registered at:** decisão de engenharia dentro do design (sem override) — comentário técnico #48.
- **Reference document updated:** `docs/decisions/adr/ADR-003-configuracao-em-branch-orfa.md` § Implementation notes, item 2.

## Deviation 2 — Caminho de escrita do facilitador (team/labels) não estava no design
- **Planned:** design técnico cobria persistência da detecção (config.md) e a migração; não especificava como o facilitador grava team.md/labels.md na branch (RF-36 exige commit na branch para TODA escrita).
- **Implemented:** subcomandos `maestra-config read/write <file>` (upsert single-file, allowlist de 3 nomes, push best-effort).
- **Reason:** lacuna encontrada pelo facilitador durante a execução — plumbing cru executado por LLM via bash é frágil; o CLI é o caminho chato e seguro.
- **Decision registered at:** design técnico do round (comentário em #48): https://github.com/hacklabr/maestra/issues/48#issuecomment-5329930732 — lacuna preenchida sem contestar critério (sem override).
- **Reference document updated:** `docs/decisions/adr/ADR-003-configuracao-em-branch-orfa.md` § Implementation notes, item 8.

## Deviation 3 — Evals fixtures/harness: lockstep em dois atos, não no primeiro incremento
- **Planned:** delegação inicial pedia adaptação de `evals/fixtures` + harness junto com o código.
- **Implemented:** primeiro incremento entregou código+testes+smoke e registrou BLOQUEIO (harness é fs virtual sem camada git; mudar fixtures sem mudar instruções alterava semântica dos evals); a adaptação completa (rota padrão `git show __maestra_config__:<file>` no stub + instruções apontando a nova leitura) acontece em lockstep no mesmo round, antes do PR.
- **Reason:** separar os dois lados sem o lockstep quebraria cenários J1/J2/P5 (team map nunca encontrado); a especialista parou o item e reportou em vez de mudar semântica sozinha — conduta correta.
- **Decision registered at:** design técnico do round (comentário em #48): https://github.com/hacklabr/maestra/issues/48#issuecomment-5329930732 + este arquivo (bloqueio reportado pela especialista).
- **Reference document updated:** `docs/decisions/adr/ADR-003-configuracao-em-branch-orfa.md` § Implementation notes + `src/instructions/journeys/j1-triage.md`/`j2-resume.md` (edições lockstep) + `evals/lib/stub-tools.mjs` (rota padrão).

## Deviation 4 — Identidade determinística nos commits de config
- **Planned:** design não especificava identidade de autor/commiter dos commits gerados pela store.
- **Implemented:** `maestra <maestra@users.noreply.local>` (honra env pré-configurado).
- **Reason:** commits herméticos em máquinas sem git identity configurada; commits de ferramenta têm identidade de ferramenta por definição.
- **Decision registered at:** design técnico do round (comentário em #48): https://github.com/hacklabr/maestra/issues/48#issuecomment-5329930732.
- **Reference document updated:** `docs/decisions/adr/ADR-003-configuracao-em-branch-orfa.md` § Implementation notes, item 1.

## Deviation 5 — Semânticas de guarda do `write` (no-op e stdin vazio)
- **Planned:** design pedia upsert simples.
- **Implemented:** conteúdo byte-idêntico ao da branch → no-op exit 0; stdin vazio → rejeitado exit 1.
- **Reason:** no-op por simetria de idempotência com `migrate` (RF-38) e para não gerar commits vazios; stdin vazio é quase sempre redirect esquecido e committaria arquivo vazio que neutra o parser silenciosamente.
- **Decision registered at:** design técnico do round (comentário em #48): https://github.com/hacklabr/maestra/issues/48#issuecomment-5329930732.
- **Reference document updated:** `docs/decisions/adr/ADR-003-configuracao-em-branch-orfa.md` § Implementation notes, item 3.

## Deviation 6 — `writeFluxoConfig` nunca lança; `onWrite` callback aditivo
- **Planned:** design pedia degradação com nota no bootstrap; não fixava contrato de erro da API.
- **Implemented:** `writeFluxoConfig` degrada para campo `error` no resultado (nunca throw); store lança `ConfigStoreError` (CLI mapeia para exit 1); callback opcional `onWrite` em `resolveForge`→`detectForge` leva a nota de degradação de push ao `maestra_status`.
- **Reason:** falha de persistência não pode quebrar detecção/ferramentas; degradação precisa ser VISÍVEL (nota no status), não silenciosa.
- **Decision registered at:** design técnico do round (comentário em #48): https://github.com/hacklabr/maestra/issues/48#issuecomment-5329930732.
- **Reference document updated:** `docs/decisions/adr/ADR-003-configuracao-em-branch-orfa.md` § Implementation notes, itens 5–6.

## Deviation 7 — Taxonomia de erro do `read` e nome `MigrateDeps` mantido
- **Planned:** design não especificava mensagens de erro do CLI nem o nome da interface de deps.
- **Implemented:** fora de repo git → mensagem única "branch não encontrada" (sem probe dedicado); interface de deps estendida com `stdin`/`stdout` mantendo o nome `MigrateDeps`.
- **Reason:** um caminho de erro claro em vez de dois; renomear símbolo exportado no meio da round é churn sem benefício.
- **Decision registered at:** design técnico do round (comentário em #48): https://github.com/hacklabr/maestra/issues/48#issuecomment-5329930732.
- **Reference document updated:** `docs/decisions/adr/ADR-003-configuracao-em-branch-orfa.md` § Implementation notes, itens 4 e 7.
