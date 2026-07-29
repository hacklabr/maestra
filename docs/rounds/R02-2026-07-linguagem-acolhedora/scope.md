# Round R02 scope — conversa mais acolhedora e direta no fluxo

## Variant

Condensed

## Problem (summary)

Quando alguém chega com uma demanda, a conversa sai cheia de termos internos
do próprio Maestra — especialmente na triagem e no Stage 1, onde a pessoa pode
não ser técnica. As instruções já dizem para usar linguagem acolhedora, mas não
estão sendo seguidas na prática, e parte do material de referência reforça o
jargão ao mandar enumerar campos do fluxo de forma literal. Detalhe completo:
`mini-briefing.md`.

## Affected areas

1. `src/instructions/journeys/j2-resume.md` — apresentação de estado (STAGE 2).
2. `src/instructions/journeys/j3-stage1.md` — condução da descoberta (STAGE 1).
3. `src/instructions/reference/microcopy.md` — templates de fala (§7.2 e
   demais que enunciam campos do fluxo literalmente).
4. `src/instructions/reference/protocols.md` — blacklist P4 (já existe;
   questão é o mecanismo de adesão).
5. `src/instructions/kernel/maestra-kernel.md` — possivelmente, dependendo do
   mecanismo escolhido no Stage 2.

## Requirements introduced

- **RF-03** — O Facilitador deve apresentar o estado retomado como uma frase
  natural sobre a próxima ação, terminando com o que se espera da pessoa — sem
  enumerar os campos internos do fluxo (variante, round, stage, substate,
  gate).
- **RF-04** — O Facilitador deve conduzir a descoberta do Stage 1 como
  conversa (perguntas e troca no chat), apresentando o rascunho do briefing no
  chat; o arquivo de briefing só nasce após aprovação explícita da pessoa.
- **RF-05** — Os templates de fala destinados a persona não-técnica não devem
  enunciar campos do fluxo de forma literal; devem orientar o Facilitador a
  traduzir o estado derivado em linguagem natural.
- **RNF-01** — Os termos da blacklist (P4) não aparecem nas mensagens do
  Facilitador quando a persona é de Stage 1; o mecanismo de garantia é
  decidido no Stage 2.

## Acceptance criteria (observable by a third party)

1. Ao retomar uma tarefa, a primeira mensagem do Facilitador descreve a
   situação numa frase, termina com a próxima ação — e uma terceira pessoa não
   encontra "variante", "round", "stage", "substate", "gate" listados como
   campos.
2. Na condução de um Stage 1, o Facilitador faz perguntas de descoberta no
   chat antes de apresentar rascunho de briefing; nenhum arquivo de briefing
   existe antes da aprovação explícita.
3. Lendo os templates de microcopy para persona não-técnica, não há enunciação
   literal de campos do fluxo que produza jargão na boca do Facilitador.

## Out of scope for this round

- O mecanismo exato de reforço (imperativo, gatilho anti-bypass, ajuste de
  template, ou combinação) — decisão de engenharia de prompts, fica para o
  Stage 2, podendo ser examinada num painel de especialistas.
- Reformular o conteúdo das jornadas em si (o quê do fluxo).
- Mudar a estrutura de variantes ou estágios.

## Origin

Dogfooding (R02), levantado pelo mantenedor (@rafaelchavesfreitas). Epic: #3.
