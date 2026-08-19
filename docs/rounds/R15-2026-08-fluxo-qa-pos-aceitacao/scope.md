# Scope of round R15 — Fluxo de QA pós-aceitação do PR

> Epic: [#49](https://github.com/hacklabr/maestra/issues/49) · Variant: Minimal (modo direto)
> Briefing: a própria issue #49 (Minimal — a issue é o briefing), aprovado em sessão direta em 2026-08-18.
> Nota: pastas R01 e R14 pré-existentes forçaram Rnn = 15+ (colisão verificada na re-lista antes do nascimento).

## Variant

minimal

## Requirements introduced

- RF-39 — O destino da issue após a aceitação do PR é configurável em `workflow.md` na raiz da branch órfã `__maestra_config__` (arquivo novo, sem cópia legada; template `templates/workflow.md`; lido/gravado via `maestra-config read/write workflow.md`; chaves `post-pr-acceptance: close | qa` e `qa-approval-column: <nome da coluna>`), com `close` como padrão quando ausente (comportamento atual preservado; zero migração). Na branch órfã por ADR-003 (um só endereço de configuração; nada na árvore do produto); fora do `config.md` por ADR-002/ADR-004 (parser aceita só 4 chaves). Nomes de coluna são convenção — sempre revalidados contra o board real via API (P6). *(Correção in-round, 2026-08-19: a redação original citava `.maestra/workflow.md` na árvore — desenho contra estado pré-R14; corrigido.)*
- RF-40 — No modo `qa`: a aceitação do PR registra o veredicto por critério (como hoje) mas NÃO fecha a issue; o substate passa a `awaiting-qa` (novo no vocabulário P1.1), o card permanece na coluna de review e a atribuição passa a um profissional de QA.
- RF-41 — O roteamento do QA deriva do campo Specialty do `team.md`: candidato único é proposto (corrigível); ausência ou ambiguidade → a Maestra pergunta no ato, nunca assume.
- RF-42 — A sessão de QA é guiada pela Maestra: entrada por número da issue ("vou fazer o QA da #N"); a Maestra apresenta a tarefa (o que foi feito, critérios de aceitação, onde validar no ambiente de testes), responde dúvidas pelo chat e registra a validação/invalidação com veredicto.
- RF-43 — QA aprova → a issue é fechada com o veredicto do QA; o card vai ao destino configurado (Done ou coluna de release, ex.: "next release"); a round entra em `awaiting-reconciliation`. QA vem ANTES da reconciliação, que permanece o gate final do fechamento.
- RF-44 — QA reprova → o card volta a Ready, reatribuída a quem implementou, substate `qa-rejected` (novo no vocabulário P1.1), comentário nomeando o que falhou; a retomada da correção segue o fluxo normal.

## Requirements changed

(nenhum)

## Requirements discontinued

(nenhum)

## Out of scope for this round

- Execução dos testes em si — a Maestra conduz a sessão de QA; não roda testes nem acessa o ambiente.
- Automação de deploy/CI para o ambiente de testes.
- Gestão de release além do destino do card na aprovação (freeze, versionamento, notas).
- Mudanças em `src/` (tools, hooks) — verificado: o digest já parseia `Substate` como string livre; round de instruções/config. Se o desenho técnico exigir código, reclassificar a variante com registro.

## Acceptance criteria (do briefing aprovado)

1. Time sem QA formal mantém comportamento idêntico ao atual: sem a chave de configuração, a aceitação do PR fecha a issue como hoje.
2. No modo `qa`, após a aceitação do PR a issue continua aberta, o card permanece na coluna de review e a atribuição vai para o QA derivado do `team.md` (perguntado no ato se ausente ou ambíguo).
3. Um profissional de QA que abre a sessão "vou fazer o QA da #N" é conduzido do início ao fim: tarefa explicada, dúvidas respondidas, veredicto registrado com a issue e o board refletindo o estado real em cada ato.
4. QA aprova → issue fechada com o veredicto, card no destino configurado (Done ou coluna de release); a reconciliação segue como gate final da round.
5. QA reprova → card em Ready, reatribuição para quem implementou, comentário nomeando a falha.
6. Os dois novos substates (`awaiting-qa`, `qa-rejected`) constam do vocabulário fechado P1.1 com mapeamento de coluna; os cookbooks GitHub/GitLab refletem as operações novas em vocabulário neutro.
