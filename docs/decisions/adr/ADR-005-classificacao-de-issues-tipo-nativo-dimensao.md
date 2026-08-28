# ADR-005 — Classificação de issues: tipo no campo nativo da plataforma + labels de dimensão

**Status:** Current
**Date:** 2026-08-28
**Round:** R16

## Contexto

Issues do fluxo carregam apenas **labels de fluxo** (variante, etapa,
`override-registered`…). O resultado prático: board e backlog comunicam pouco —
para saber se uma demanda é um bug ou uma funcionalidade, ou se é trabalho de
documentação ou de performance, é preciso abrir o corpo da issue. A descoberta
da R16 (issue #34, decisão do autor da demanda) foi usar o **campo nativo de
tipo** da plataforma — e **não** uma label — para o eixo "que tipo de trabalho é
isto", aceitando labels livres apenas para um segundo eixo ortogonal, a
**dimensão** do trabalho.

Dois eixos, portanto:

- **Tipo** — um por issue, no campo nativo (no GitHub: Bug/Feature/Task; os
  valores são da organização, não do plugin).
- **Dimensão** — múltiplas por issue, em labels livres (`gestão`, `melhoria`,
  `performance`, `devops`, `documentação` — lista inicial conforme o autor da
  demanda).

Restrições que moldaram a decisão: o vocabulário do parser do digest
(`src/tools/digest-parse.ts`) está **congelado por consenso** — convenções novas
são lidas raw, sem parsing dedicado; o mapeamento labels→colunas do board vive
em `labels.md` e mapeia **apenas** labels de fluxo (ADR-002); o round é de
instruções + convenção, sem mudanças esperadas em `src/`.

## Decisão

- **Tipo = campo nativo da plataforma** (nunca label). Valores são os da
  organização; org/repo sem o recurso habilitado ou falha de permissão → a
  issue nasce **sem** tipo e o facilitador narra em 1 linha — a classificação
  **nunca bloqueia o fluxo** (degradação graciosa).
- **Dimensão = labels livres**, fora do vocabulário do parser (escopo congelado
  respeitado — convenções novas são lidas raw). Aplicadas na triagem quando
  fizerem sentido ao trabalho descrito; criação **sob demanda e idempotente**
  (só quando necessárias pela primeira vez).
- **Aplicação por jornada:** J1 (triagem) deriva o tipo do texto da demanda —
  confirmável como os demais critérios — e o aplica no nascimento do épico e
  das tarefas-filhas; J11 (captura rápida) registra um **palpite curado** do
  texto da demanda com **zero perguntas adicionais** (teto de ≤2 perguntas da
  captura preservado; corrigir na promoção é barato); issues criadas
  manualmente seguem a convenção **documentada** (campo nativo + dimensão
  opcional).
- **Promoção (J11 → J1)** confirma ou corrige o tipo palpitado no ato da
  classificação.
- **Puramente informativo:** nada consome tipo/dimensão — nem o digest, nem o
  `maestra-report`, nem colunas do board. O ADR-002 **segue como está**:
  `labels.md` mapeia apenas labels de fluxo.
- **GitLab fora do escopo** nesta round — adaptação registrada como pendência
  para o piloto GitLab (conforme ROADMAP).

## Consequências

- **Positiva:** board e backlog comunicam o tipo de trabalho sem abrir o corpo
  da issue — ganho de leitura sem tocar o motor (parser, gates, report
  intocados; round de instruções, zero mudança em `src/`).
- **Custo:** dois eixos ortogonais para aprender (tipo ≠ dimensão ≠ variante);
  nomes de tipos variam entre organizações (o plugin deriva do ambiente, não
  assume lista fixa).
- **Risco:** labels de dimensão divergirem entre repositórios (grafias
  diferentes para a mesma dimensão) — mitigado pela lista inicial documentada
  (§3.2 do Fluxo.md e cookbook) e pela criação idempotente na triagem, que
  tende a convergir para os nomes já existentes no repo.

## Referências

- [ADR-002](ADR-002-mapeamento-labels-fora-do-config.md) — mapeamento
  labels/colunas persiste em `labels.md`, fora do `config.md` (permanece
  mapeando apenas labels de fluxo).
- Issue #34 (epic da R16) · `docs/rounds/R16-2026-08-classificacao-de-issues/scope.md`
  (RF-45..48).
