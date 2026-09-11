# Scope — R23 · AGENTS.md do setup com regras Maestra para issues

> **RECORD** — selado no fechamento da round. Correções posteriores = adendo
> datado, nunca reescrita.
> Variante: **Minimal** (modo direto) · Épico/issue única: **#64** · Nascida de texto livre (descoberta profunda, magnitude SIMPLE)

## Briefing (aprovado em chat em 2026-09-11 — a issue #64 é o briefing)

**Problema.** Projetos com setup da Maestra executado recebem um AGENTS.md sem
nenhuma orientação sobre issues, labels ou board. Qualquer sessão não-Maestra
cria issues fora dos padrões e não move cards — a disciplina do fluxo só existe
dentro das sessões facilitadas (origem: finding F051).

**Para quem / contexto.** Qualquer sessão de desenvolvimento em projetos com a
camada agêntica organizada pela J12 — **inclusive projetos legados** cujo
AGENTS.md já foi gerado antes desta mudança: ao re-rodar o setup (ou o estágio
parcial "organiza a camada agêntica"), a seção nova entra no AGENTS.md
existente por **inserção idempotente**, nunca sobrescrevendo conteúdo
existente.

**Medida de sucesso (manual, pelo PO).** Em projetos reais, antes da criação da
tag de release: uma sessão não-Maestra, lendo apenas o AGENTS.md
gerado/atualizado, cria issue com `stage-0` + tipo nativo, atribui-se e move o
card para "In progress" ao começar e para "In review" ao abrir PR. Falha →
reporte na #64 e iteração. **Sem eval automatizado nesta round** (decisão do
PO no aprofundamento da descoberta — ver seção "Exceção D7" abaixo).

**Restrições.** O bloco referencia as regras da Maestra (P6), nunca as redefine
· idempotente em setup novo e em re-setup de legado · sem brecha nos gates
(cotejo com os 19 triggers anti-bypass) · PT-BR no artefato gerado.

## Requisitos

> Numeração: RF-68 consta em duplicata nos scopes R21/R22 (colisão pré-existente
> registrada como finding F052 — sem renumeração retroativa nesta round).
> Esta round parte de **RF-69**.

- RF-69 — **Seção de regras Maestra para issues no template AGENTS.md**:
  `src/instructions/templates/agents-md.md` passa a incluir uma seção sempre
  ativa cobrindo o ciclo de vida da issue em sessões não-Maestra:
  (a) **criação** — toda issue nasce com label `stage-0` + tipo nativo;
      preferir a captura rápida da Maestra (`/agent maestra-issue-writer`)
      quando disponível; nunca criar estrutura de épico/variante fora de uma
      sessão Maestra;
  (b) **início do trabalho** — atribuir-se como responsável e mover o card
      para `In progress` no mesmo ato;
  (c) **entrega** — abriu PR/MR → card para `In review`, com referência
      cruzada PR ↔ issue;
  (d) **demandas novas no meio do caminho** — registrar como issue `stage-0`,
      nunca implementar fora da issue em curso.
- RF-70 — **Idempotência em setup novo e legado**: a J12 (STAGE 5) instrui a
  inserção da seção também em AGENTS.md já existentes (re-setup), sem
  sobrescrever conteúdo existente e sem duplicar a seção em re-execuções.

## Fora de escopo da round

- Mudanças nas regras P6/kernel da própria Maestra (a seção referencia, não redefine)
- Reescrita de outras seções do template AGENTS.md
- Enforcement automatizado (hooks, validação) — aqui é orientação escrita
- Evals promptfoo para este comportamento (verificação manual do PO, pré-tag)
- Renumeração retroativa do RF-68 duplicado (finding F052 — exige decisão autorizada)

## Exceção D7 (eval como condição de guarda para dogfooding)

O AGENTS.md do projeto declara evals promptfoo como condição de guarda para
qualquer dogfooding (spec D7). **Exceção decidida pelo PO nesta round** (dona
da decisão, registrada aqui): a verificação desta entrega é **manual**, feita
pelo PO em projetos reais antes da tag de release; falha → reporte na #64 e
iteração. Justificativa: o entregável é texto de orientação para sessões
genéricas fora do controle da Maestra — o ambiente de eval atual não simula
"projeto com setup feito + sessão não-Maestra"; montar esse cenário custaria
mais que a mudança. Candidato a round futura: cenário de eval para este sabor
de verificação.

## Critérios de aceite (espelho da issue #64)

- [ ] Um projeto que roda o setup (J12) recebe um AGENTS.md com a seção de regras de issues
- [ ] Uma sessão não-Maestra, lendo apenas o AGENTS.md gerado, consegue: criar issue com label `stage-0`, mover o card para "In progress" ao começar e para "In review" ao abrir PR (verificação manual do PO, pré-tag)
- [ ] O bloco é idempotente (setup re-executado não duplica a seção)
- [ ] Regras cotejadas contra os 19 triggers anti-bypass do kernel, sem brecha de gates
