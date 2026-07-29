# Mini-briefing — R02: conversa mais acolhedora e direta no fluxo

> **Variante Condensed** — selado no fechamento do round; correções posteriores
> = adendo datado, nunca reescrita.

## Problema

Quando alguém chega com uma demanda, a conversa sai cheia de termos internos
do próprio Maestra (variante, round, stage, substate, gate) — especialmente na
triagem e no Stage 1, onde a pessoa pode não ser técnica e só quer ver seu
pedido registrado e se sentir bem-vinda. O efeito é afastar quem chegou pra
resolver um problema.

A raiz é irônica: as instruções **já dizem** pra usar linguagem acolhedora.
Existe uma lista de termos proibidos (P4), existem limites de perguntas,
existe no kernel a cláusula "conversa, não formulário". O problema não é
falta de regra — é que **não estão sendo seguidas na prática**, e parte do
próprio material de referência (os templates de fala) reforça o jargão ao
mandar enumerar campos do fluxo de forma literal.

## O que vamos atacar (escopo)

1. **Apresentação de estado ao retomar uma tarefa** — hoje a instrução manda
   listar variante, round, stage, substate, gate; seguir à risca produz o
   jargão. Precisa virar uma frase natural sobre a próxima ação.
2. **Descoberta do Stage 1** — a instrução diz "proponha o rascunho" sem
   deixar claro que antes há uma conversa de descoberta, e que o arquivo só
   nasce depois da aprovação.
3. **Templates de fala** (a biblioteca de microcopy) — vários mandam enunciar
   campos do fluxo de forma literal; são a fonte do jargão.
4. **A lista de termos proibidos** (blacklist do P4) — existe, mas não está
   sendo checada antes de falar.

## Como vamos resolver (direção, sem detalhar o mecanismo)

O caminho escolhido é uma **camada intermediária**: o facilitador deriva o
estado com precisão (usa os campos do fluxo internamente), mas converte em
linguagem natural antes de falar — uma frase sobre a próxima ação, com apenas
o que for relevante pra pessoa agir. Os campos do fluxo só aparecem se a
pessoa perguntar ou se a decisão exigir.

A decisão sobre o **mecanismo exato** (reforço imperativo, gatilho de
bloqueio, ajuste nos templates, ou combinação) é uma questão de engenharia de
prompts e fica para o Stage 2, podendo ser examinada num painel de
especialistas.

## Métrica de sucesso

Uma pessoa que não conhece o Maestra, ao chegar com uma demanda na triagem ou
Stage 1, entende em uma leitura o que está acontecendo e o que se espera dela
— sem precisar perguntar "o que significa isso?". Para Stage 2 e 3 (público
técnico), vale o mesmo princípio quanto ao vocabulário interno do Maestra:
termos de engenharia são bem-vindos, termos internos do fluxo não.

Critério observável: uma terceira pessoa, lendo a conversa, não encontra
termos proibidos nas falas do facilitador, e o que for dito sobre o processo
serve à decisão da pessoa, num tom de conversa — não de formulário.

## Restrições

- **Não muda o quê do fluxo**, só o como falar — variantes, estágios, gates e
  reconciliação permanecem; o foco é a voz da conversa.
- **Dois públicos distintos**: triagem/Stage 1 (não-técnico, máxima
  acolhida); Stage 2/3 (técnico, mas sem vocabulário interno do Maestra —
  termos de engenharia liberados).
- **Autonomia do facilitador**: resolve e registra o que consegue sozinho;
  procura a pessoa só quando a resposta importa de verdade.

## Origem

Dogfooding (R02), levantado pelo mantenedor (@rafaelchavesfreitas). Epic: #3.
