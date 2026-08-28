# Deviations of round R17 — Instrução sem prompt de leitura
<!-- Every divergence between what was planned and what was implemented.
     An undeclared deviation is the embryo of contradictory documentation. -->

## Deviation 1 — J9 (painéis) mantém leitura de frontmatter via read do host
- **Planned:** RF-47 — todo carregamento de arquivo da árvore `instructions/` passa pela tool (doutrina do kernel v9).
- **Implemented:** kernel/jornadas/reference/templates carregam via `maestra_read_instructions`; a seleção de personas do J9 ("read the frontmatter of the 2–3 main candidates") permanece com leitura de host.
- **Reason:** "a tool devolve o arquivo INTEIRO por chamada — usá-la para ler só frontmatter despejaria personas completas no contexto; um modo frontmatter/seção é extensão de desenho, fora desta round".
- **Decision registered at:** [#52 (technical design comment)](https://github.com/hacklabr/maestra/issues/52#issuecomment-5457185915) — limitação declarada pelo facilitador, sem override (nenhum critério de aceite violado; no repo dev o catálogo é submódulo in-workspace, sem prompt).
- **Reference document updated:** `src/instructions/kernel/maestra-kernel.md` v9 (doutrina lazy loading) + esta entrada; follow-up candidato a round futura (modo parcial na tool OU J9 dedicado).

## Deviation 2 — Eval IL-01 entregue em tier mock (caso real-model exigiria modo kernelless)
- **Planned:** RNF-03 — evals de não-regressão cobrindo o entry gate pela tool.
- **Implemented:** `evals/scenarios/instructions-loading.yaml` (IL-01) determinístico em tier mock em todas as configs; nenhum caso com modelo real buscando o kernel.
- **Reason:** "o harness sempre pré-carrega o kernel no system prompt; um caso real de 'buscar o kernel' precisaria de um provider mode kernelless — mudança de harness que julguei além do escopo mínimo".
- **Decision registered at:** [#52 (specialist report, session R17)](https://github.com/hacklabr/maestra/issues/52) — aceito pelo facilitador.
- **Reference document updated:** [`evals/scenarios/instructions-loading.yaml`](../../../evals/scenarios/instructions-loading.yaml) + `evals/asserts/instructions-via-tool.mjs` + esta entrada.

## Deviation 3 — Superfície do especialista estendida por consequência (smoke.sh, installer)
- **Planned:** plano de execução aprovado (gate de consentimento): tool + testes + `src/index.ts` + evals + pointers em `src/agents/*`.
- **Implemented:** também `scripts/smoke.sh` (asserções que exigiam a PRESENÇA de `external_directory` e caminho absoluto no markdown gerado — invertidas para o contrato novo) e `src/installer/install.ts` (call sites perderam o argumento `instructionsDir` após a mudança de assinatura dos builders).
- **Reason:** "deixá-los como estavam quebraria o `npm run ci` (smoke falharia) e o typecheck (excesso de propriedade nos call sites)".
- **Decision registered at:** [#52 (specialist report, session R17)](https://github.com/hacklabr/maestra/issues/52) — verificado pelo facilitador (CI verde).
- **Reference document updated:** commit desta PR — [`scripts/smoke.sh`](../../../scripts/smoke.sh), [`src/installer/install.ts`](../../../src/installer/install.ts).

## Deviation 4 — package-lock.json sincronizado pelo npm install revertido
- **Planned:** nada (o lockfile não fazia parte do escopo).
- **Implemented:** o `npm install` na worktree sincronizou um drift pré-existente do lockfile (bin `maestra-config` já no `package.json` da main); a mudança foi revertida antes do commit.
- **Reason:** "drift pré-existente, não é desta round — não viaja no diff dela".
- **Decision registered at:** [#52 (sessão direta R17)](https://github.com/hacklabr/maestra/issues/52).
- **Reference document updated:** [esta entrada](#deviation-4--package-lockjson-sincronizado-pelo-npm-install-revertido) (o lockfile da main permanece como está; sync é tarefa de quem tocar o package.json).

## Deviation 5 — Registro de dogfooding escrito contra main desatualizado; numeração reparada na reconciliação
- **Planned:** appends simples ao `docs/dogfooding/findings.md` (F039 na triagem, F040 no nascimento do épico), como qualquer registro de finding.
- **Implemented:** reparo na reconciliação — cabeçalho do F039 restaurado (edição minha engoliu-o), meu F040 renumerado para **F045** (colidia com o F040 do R19, já resolved #53), adendo movido para a entrada correta, marcador corrigido, causa-raiz registrada como **F046**.
- **Reason:** "a sessão leu o findings de um main local atrás do origin — R16/R18/R19 já haviam consumido F040–F044; a regra 'próximo ID livre' não tem guarda contra main desatualizado".
- **Decision registered at:** [F046](../../dogfooding/findings.md) · evento F (at_reconciliation=1).
- **Reference document updated:** [`docs/dogfooding/findings.md`](../../dogfooding/findings.md) (F045 nota de renumeração + F046) · [`retro.md`](retro.md) (seção "O que doiu") · commit `ff32862`.
