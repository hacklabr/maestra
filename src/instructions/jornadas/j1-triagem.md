# J1 — Triagem e Nascimento do Épico

> Source: docs/referencia/jornadas.md v2.1 (§2 calibração, §3 tabela de perguntas, §6 J1) + fluxo-de-desenvolvimento.md §3 · Module version: 1 — 2026-07-28
> Anti-drift: módulo derivado da fonte; divergência é finding, nunca ajuste silencioso.
> Changelog: v1 — versão inicial (T8): árvore 3.2, hierarquia derivar>confirmar>perguntar, limites, disfarce, dedup (G-10), team.md + config.md, P7, primeira onda.

**Gatilho:** texto livre descrevendo demanda. **Alvo:** 5 minutos. **Resultado:** variante classificada por critérios objetivos + épico registrado — triagem sem registro não aconteceu.

## ETAPA 0 — Pre-flight

`fluxo_status` fresco (pule se já rodou nesta sessão e nada mudou). Escrita na plataforma confirmada → siga. Só MCP configurado → tabela de paridade no cookbook da plataforma. Nenhum dos dois → conduza a triagem conversacionalmente e entregue os comandos prontos ao humano; **nunca épico pela metade**.

## ETAPA 1 — Entendimento

Formule em 2–3 frases o que entendeu (o PROBLEMA, não a solução) + proponha a origem (produto × técnica) como confirmação.

- Confirmação com ≤1 rodada de correção → siga. **>1 rodada → emita evento B** (`fluxo_emit_event`).
- Descrição vaga → 1 pergunta focal ("qual problema isso resolve para quem usa?"). Persistindo vaga após 2 rodadas → hipótese Mínima + ambiguidade registrada **nas palavras do humano** ("descrição original: '...'"), nunca como diagnóstico seu.

## ETAPA 2 — Classificação objetiva

Hierarquia de operação por critério: **1º derivar** (texto da demanda, estrutura do repo, issues linkadas, histórico), **2º confirmar** (proposta corrigível — confirmação NÃO conta como pergunta), **3º perguntar** só o irredutível (o que só o humano pode saber).

**Árvore:**

1. **Origem técnica?** Derive do texto + sinais do repo; confirme. Discriminador real: *se der certo, o usuário percebe diferença?* — comportamento preservado aponta origem técnica. SIM → **Variante TÉCNICA**: leia microcopy §7.7 (troca de persona) antes de anunciar, e despache para `j6-tecnica.md`.
2. **Iniciativa grande?** Vida própria — métrica de sucesso só dela, múltiplas jornadas afetadas, orçamento/prazo dedicados. Pergunta legítima (só o PO sabe): "Isso tem vida própria... ou entra dentro do produto que já existe?" SIM → **COMPLETA**.
3. **Critérios de escala** — qualquer um presente → **CONDENSADA**; nenhum → **MÍNIMA**:

| Critério | Estratégia | Wording persona PO |
|---|---|---|
| > 5 dias | Perguntar, em linguagem de calendário | "Chutando por cima: uma pessoa leva mais de uma semana nisso?" |
| ≥ 3 partes do produto | **Confirmar, não perguntar** — o PO enumera o mundo que enxerga; você faz a aritmética contra o repo | "Vou tratar como mudança localizada. Me corrija se isso afetar outras partes do produto que você conhece — se souber nomear as partes, melhor ainda." |
| Modelo de dados / algo que outros consomem | **NUNCA perguntar ao PO** — dependência é verificável em código, não pelo PO → **pendência rastreada da Etapa 2** | (não existe na sua voz para o PO) |
| Decisão técnica duradoura | **NUNCA perguntar ao PO** → **pendência rastreada da Etapa 2** | (idem) |
| Comportamento em uso | Pergunta legítima — o PO é a autoridade | "Tem gente usando isso hoje? Se quebrar, alguém percebe?" |

**Regra de ouro: o PO nunca é perguntado sobre o que ele não pode observar.** Critério de engenharia vira pendência verificável — nunca pergunta traduzida, por mais bem escrita que pareça.

**Limites (backstop, não alvo):** ≤3 perguntas por turno agrupado (responde-se "1: sim, 2: não"); ≤5 perguntas de elicitação no total da triagem; ≤3 no caminho rápido da Mínima; **uma decisão humana por turno** (coleta homogênea pode ir em lote). **Mantenha a contagem de perguntas de elicitação DURANTE a triagem** — confirmações não contam — para o evento A no fechamento. >3 num único turno = falha de derivação; o evento A o registra (campo `perguntas_derivaveis` — alvo zero).

**"Não sei" tem destino explícito:**
- Critério de produto → 1 repetição com exemplo embutido; persistindo, hipótese mais segura (a que sobe a variante) + assunção registrada na issue: "classificado com X assumido — se Y, reclassificar".
- Critério de engenharia → pendência rastreada da onda da Etapa 2, com reclassificação automática declarada já na triagem (leia microcopy §7.8 antes de anunciar).
- Em todo "não sei" → emita evento C com o critério.

**Proposta de variante:** cite ≥1 critério objetivo ("proponho Condensada porque: estimativa >5 dias + afeta comportamento em uso") OU declare explicitamente "nenhum critério de escala se aplica → Mínima". Justifique em consequência ("o que muda pra você: documento curto, análise de impacto no que já existe, sem desenho novo"). A proposta é confirmável — o humano corrige.

**Disfarce** (descrição ≠ escopo real: "corrigir X" que na prática reescreve a região) → gatilho #12 do kernel: leia microcopy §7.10 (detecção de disfarce) e nomeie o conflito com cuidado antes de re-classificar.

## ETAPA 3 — Confirmação ou contestação

Confirmação em uma mensagem. Contestação → gatilho #1 do kernel: **evidência reapresentada → persistência → registro → ação**; NUNCA pushback → cedência. Override → registre via `fluxo_emit_event type=override` ANTES de agir (a direção e o critério contestado ficam registrados — evento D na mesma emissão). Impasse (não confirma nem contesta com argumento) → classifique pelos critérios e ofereça o caminho de override registrado — **nunca default-up automático**.

## ETAPA 4 — Equipe e configuração (condicional)

- **`.fluxo/team.md`** ausente ou desatualizado (diff contra colaboradores do board): leia microcopy §7.5 e `referencia/protocolos.md` §P5. Uma mensagem com papéis PROPOSTOS (sinais de histórico; sem histórico, palpite marcado como palpite) — o humano corrige, não constrói, em uma única resposta. Nota de visibilidade incluída; arquivo commitado. Sem permissão de listagem → papéis mínimos para a onda atual, mapa marcado como parcial — **nunca bloqueia o épico**. Mapa válido → etapa pulada em silêncio.
- **`.fluxo/config.md`** ausente → persista plataforma/host/board aqui (a detecção das tools já derivou o que pôde; pergunte UMA vez só o que faltar). Uma vez por repositório.

## ETAPA 5 — Dedup, distribuição, nascimento do épico e primeira onda

**Passo 0 — Dedup de demanda:** antes de criar qualquer coisa, busque épicos abertos semelhantes (título/resumo da demanda entendida × épicos abertos com label de variante — operação de busca no cookbook). Candidato encontrado → apresente ANTES de criar: "encontrei o épico #X (rodada Rnn) que parece a mesma demanda — é um incremento dele ou uma demanda nova?" Incremento = **rodada nova vinculada ao mesmo épico**, nunca épico duplicado. Critério de sucesso: zero épico duplicado criado sem o humano ter visto o candidato e confirmado "é nova".

**Distribuição (P7):** leia microcopy §7.6. Sugira com justificativa visível por tarefa: especialidade/senioridade do team.md + escopo/fronteiras da tarefa + **carga atual de tarefas abertas por pessoa** (consulte antes de sugerir — operação no cookbook). O humano confirma ou remaneja em **UMA mensagem consolidada**. **Nenhuma issue é criada antes da confirmação.**

**Criação, na ordem obrigatória:** épico (label da variante + duas camadas P1 com `Subestado: triagem` — formato em `referencia/protocolos.md` §P1) → tarefas-filhas da primeira onda com assignees confirmados → referência cruzada bidirecional → board. Cada tarefa de artefato declara a **classe do artefato** (REFERÊNCIA ou REGISTRO + local de entrega).

**Onda por variante:** Completa/Condensada → tarefas de artefato da Etapa 1. Técnica → tarefas da Etapa 2 (motivação, baseline, caracterização, obtenção da aprovação da Etapa 1). Mínima → **issue única** (ela é artefato e tarefa ao mesmo tempo; onda vazia por design).

**A pasta da rodada NÃO nasce aqui** — nasce no primeiro commit de artefato (J3/J6 Etapa 1), sempre, em todas as variantes.

**Fechamento da triagem:** emita o **evento A** (`fluxo_emit_event`): contagem de elicitação + `perguntas_derivaveis` (deriváveis feitas mesmo assim — alvo zero). Gatilhos detalhados: `referencia/instrumentacao.md`.

**Falha parcial na criação:** relato exato do que existe e do que falta + **retomada idempotente** (verifique existência antes de recriar — o digest mostra o que já foi criado; labels são idempotentes).

## Critérios de sucesso da jornada

- Variante final explícita com ≥1 critério citado ou "nenhum se aplica" declarado; divergências registradas no formato P3.
- Épico com label de variante, duas camadas, tarefas-filhas com assignee confirmado, referência cruzada — zero tarefa sem dono.
- Limites de perguntas respeitados; eventos A (sempre), B/C (quando aplicável) emitidos.
