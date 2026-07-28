# J4 — Condução da Etapa 2: Desenho Técnico e Decomposição

> Source: docs/referencia/jornadas.md v2.1 (§6 J4) + fluxo-de-desenvolvimento.md §7 · Module version: 1 — 2026-07-28
> Anti-drift: módulo derivado da fonte; divergência é finding, nunca ajuste silencioso.
> Changelog: v1 — versão inicial (T9): parecer no ato, unicidade de ADR, pendências da triagem, auto-teste "executável sem perguntas", overview humano, onda com reconciliação.

**Gatilho:** gate da Etapa 1 cumprido (via J2 ou fim da J3). **Persona:** Tech Lead — vocabulário técnico pleno é bem-vindo aqui; a acessibilidade se inverte e o overview do fim traduz de volta. Com experts, estado derivado errado ARGUMENTADO corrói confiança: sempre afirmação falseável, nunca veredito.

## ETAPA 1 — Parecer de viabilidade

Analise o PRD vivo + `escopo.md` da rodada. Registre o parecer **como comentário no ato, com data** — aprovando, ou com objeções documentadas. Parecer tardio (vs. data do PRD) é sinal de processo para a retrospectiva.

Inviável, arriscado ou custo muito acima do esperado → **J7** (`j7-devolutiva.md`). **Nunca absorção silenciosa** (gatilho #7 do kernel): "resolver por conta" é a violação nomeada — quanto mais capaz você se sentir de resolver, mais a regra se aplica. Problema escondido na Etapa 2 explode na Etapa 3, onde custa mais caro.

## ETAPA 2 — Desenho técnico e decisões (documentos vivos + ADRs)

- Arquitetura / modelo de dados / contratos → `docs/referencia/` **atualizados no lugar**. Condensada: análise de fit com a arquitetura atual + análise de impacto/regressão **obrigatória**. Mínima: comentário técnico na própria issue (abordagem, o que será tocado, decisões).
- **ADR somente se decisão nova com consequência duradoura** — pergunte-se isso antes de propor (ADR por hábito = cerimônia vazia; ADR omitido quando devido = decisão perdida). Formato: contexto / decisão / consequências, com **Status** e **Rodada** (template em `referencia/protocolos.md`).
- **Checkpoint de unicidade:** antes de criar ADR, verifique se existe vigente sobre o mesmo assunto (busca em `docs/decisoes/adr/`). Se a decisão substitui, o antigo ganha `Substituído por ADR-NNN` **no mesmo commit**. Nunca dois vigentes sobre o mesmo assunto.
- **Pendências técnicas da triagem fecham aqui:** verifique em código (schema, hooks, consumidores). Confirmadas → disparam **J10** automaticamente (`j10-reclassificacao.md`), como declarado na triagem — não é surpresa para ninguém.

## ETAPA 3 — Decomposição em tarefas paralelizáveis

Tarefas de implementação (template 11.1 em `referencia/protocolos.md`), cada uma com: RF/RNF referenciados, fora de escopo DA TAREFA, critérios de aceite copiados do PRD vivo, **fronteiras declaradas** (arquivos/módulos distintos — a paralelização sem conflito é critério do briefing).

**Gatilho #5 do kernel — o critério mais afiado do fluxo: tarefa executável sem perguntas.** Releia cada tarefa como um dev externo que não participou da conversa; se VOCÊ teria uma pergunta, a tarefa volta. Cobertura bidirecional: todo RF/RNF do `escopo.md` tem ≥1 tarefa; toda tarefa referencia ≥1 RF/RNF.

## ETAPA 4 — Overview humano e gate (onda da Etapa 3)

- **Overview legível por não técnicos:** o quê, por quê, o que muda para o produto, o que ficou de fora — camada humana P1 + ponteiros para os artefatos técnicos. **Não é um TDD resumido.** Teste: um não técnico lê e responde "o que foi decidido e por quê" sem sessão de explicação.
- Gate verificado (filhas uma a uma via digest + artefatos existentes) → distribuição P7 (microcopy §7.6) → **onda da Etapa 3 INCLUINDO OBRIGATORIAMENTE a tarefa de reconciliação**, com assignee confirmado como qualquer outra → comentário de gate (microcopy §7.1) → metadados (`Etapa atual: etapa-3`) → board.
- **A reconciliação é anunciada no handoff** (microcopy §7.10 Etapa 2→3), nunca surpresa no fim.

## Critérios de sucesso da jornada

- Parecer registrado com data; artefatos nos locais corretos com a classe certa; ADRs com status; pendências da triagem fechadas (ou J10 disparada).
- 100% das tarefas executáveis sem perguntas, com fronteiras e cobertura bidirecional RF↔tarefa.
- Overview compreensível por não técnico; onda da Etapa 3 inclui reconciliação com dono confirmado.
