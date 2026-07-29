# Retrospectiva — R02: conversa mais acolhedora e direta no fluxo

> Process learnings e flow signals do round R02. Foco em o que o fluxo revelou
> sobre si mesmo (dogfooding), não em "o que deu errado".

## O que funcionou bem

1. **Painel de especialistas (J9) resolveu uma decisão com múltiplos domínios.**
   A decisão de como refatorar os templates de fala tocava contrato de workflow
   (qual peça é load-bearing) E engenharia de prompts (qual mecânica de template
   vence drift). Dois especialistas em turnos sequenciais — o Workflow Architect
   estabeleceu o mapa de contrato (C1–C21, janela de aceitação (b)+(c)); o Prompt
   Engineer converteu em mecânica concreta (bloco bifásico, few-shot, três fases
   do J3). O ADR-001 sintetizou sem perda. O painel pagou seu custo.

2. **O insight central era contraintuitivo e o painel o revelou.** A premissa
   implícita era "enumerar campos = rigor". O arquitecto mostrou que é o oposto:
   enumeração destrói a falsificabilidade (o "Correct?" vira carimbo). Sem o
   painel, o refactor poderia ter sido um "softening" que preservava o bug. A
   naturalização dentro dos limites de contrato **fortalece** o workflow.

3. **Evals como defesa estrutural, não después.** O gap da `P4_BLACKLIST` (não
   cobria enumeração de campos do fluxo) foi detectado na fase de design (ADR),
   não na reconciliação. Os 5 novos asserts foram construídos junto com a
   implementação, no mesmo round — não como remendo.

4. **Janela de aceitação (b)+(c) como critério mensurável.** A dualidade
   "naturaliza E mantém acionabilidade" evitou os dois modos de falha
   (over-naturalização que perde contrato; under-naturalização que mantém o bug).
   Os evals testam ambos os lados da janela.

## O que o fluxo revelou sobre si mesmo (flow signals)

### Signal: over-decomposição de tasks no Condensed (F017)

A onda de Stage 3 foi decomposta em 6 tasks paralelas (uma por arquivo),
invocando o critério do J4 ("tasks paralelizáveis com boundaries declarados").
O humano contestou: as mudanças são acopladas — não faz sentido executar uma
sem a outra. A granularidade "uma task por arquivo" é apropriada ao variante
Completa com time grande e mudanças independentes, não ao Condensed acoplado.

**Lição:** J4 STAGE 3 precisa de um critério explícito de granularidade por
variante e de um **teste de acoplamento** ("esta task é entregável sozinha?
faz sentido executá-la sem as outras?") antes de decompor em onda maximal. A
paralelização só é critério quando as tasks são efetivamente independentes.
Registrado como F017.

### Signal: task de baton pass criada em "Todo" em vez de "Ready" (F016)

Ao criar a task #6 (baton pass Stage 1→2), o card foi para "Todo" quando a epic
mãe já estava em "In progress". A coluna "Todo" é para tarefas que nascem na
triagem (antes do trabalho da epic começar); "Ready" é para tasks de baton pass
(epic já em progress, pronta para a próxima etapa pegar).

**Lição:** P6 precisa distinguir "task nascida na triagem" (→ Todo) de "task
nascida em baton pass / gate wave" (→ Ready, epic já em progress). Complementa
F011 (mapeamento substate→coluna). Registrado como F016.

### Signal: família de board-state (F010, F011, F018, F019)

O board continua sendo o touchpoint mais frequentemente negligenciado. A execução
técnica (worktree, commit, push, PR) é percebida como "o trabalho real", e o
movimento do card como overhead. Quatro findings nesta família neste round. P6
precisa amarrar transições técnicas a transições de board como ato único.

## Inverted health metrics (kernel trigger #11)

- **Feedback / correções humanas:** presente e abundante (F016, F017, mais as
  correções de Stage 1/2). Saudável — o humano está engajado e o fluxo está
  sendo exercitado de verdade, não de fachada.
- **Overrides:** zero neste round. Não há suspeição — o round fluiu sem
  necessidade de bypass de gate.
- **`doc-bug`:** zero. As contradições doc×código foram tratadas dentro do
  escopo (os arquivos de instrução são o produto; o refactor os alinhou).

## Métrica de sucesso (do mini-briefing)

> "Uma pessoa que não conhece o Maestra, ao chegar com uma demanda na triagem ou
> Stage 1, entende em uma leitura o que está acontecendo e o que se espera dela."

**Avaliação:** atendido estruturalmente. O template bifásico converte derivação
tipada em fala natural; os 3 few-shot anchors demonstram a conversão; os evals
tier-1 guardam contra regressão. Verificação empírica com modelo real (golden
transcripts, tier-2/tier-3) fica como follow-up no ROADMAP.

## Follow-ups para o ROADMAP

1. **Evals tier-2 (LLM-judge rubrics) e tier-3 (golden transcripts)** — defesa
   contra drift sutil e entre versões de modelo. Prioridade: quando o fluxo
   estiver em uso com modelo real recorrente.
2. **Critério de granularidade de onda por variante (F017)** — instrução no J4
   STAGE 3 com teste de acoplamento.
3. **Mapeamento substate→coluna consolidado (F011/F016)** — P6 com tabela
   completa.
