# Template — Motivação de refatoração (`docs/rodadas/Rnn-aaaa-mm-nome/motivacao.md`)

> Source: fluxo-de-desenvolvimento.md §11.6 (+ §3.4 variante Técnica) + docs/referencia/jornadas.md J6 (v2.1) · Module version: 1 — 2026-07-28
> Anti-drift: verbatim da fonte §11.6. Classe: REGISTRO — imutável após o fechamento; na variante Técnica, **a pasta da rodada nasce aqui** (J6 Etapa 1).

```markdown
# Refatoração: <nome da região/funcionalidade>

## Problema
<!-- O que está ruim hoje, com evidência: métricas, histórico de bugs,
     custo de tarefas na região -->

## Meta mensurável
<!-- Ex.: reduzir tempo de resposta de X para Y; desacoplar módulo Z
     para permitir a feature W. Esta meta é também o ponto de parada. -->

## Análise de impacto
<!-- O que será tocado; quais funcionalidades dependem desta região -->

## Baseline
<!-- Métricas medidas ANTES da mudança, para comparação posterior —
     detalhes em baseline.md (mesma pasta) -->

## Caracterização do comportamento atual
<!-- Referência aos testes de caracterização que documentam o
     comportamento de hoje, incluindo quirks -->

## O que pode mudar de propósito
<!-- Comportamentos que a Etapa 1 autorizou alterar; todo o resto
     deve permanecer idêntico. Lista vazia é válida; ausência de lista não é. -->

## Aprovação da Etapa 1
<!-- Quem aprovou o custo de oportunidade e quando — com CITAÇÃO LITERAL
     da mensagem humana (evidência, não paráfrase) -->
```

**Regras duras (J6 — trava anti-auto-aprovação, anti-bypass #3):**
1. **"Melhorar a arquitetura" é rejeitado como meta** — meta exige valor-alvo mensurável; sem ela, refatoração vira reescrita infinita. O agente bloqueia a passagem até a meta existir.
2. **Aprovação = ato humano explícito em TURNO DISTINTO** — o agente apresenta a tradução e encerra o turno aguardando. **Default NÃO aprovado:** silêncio, ausência de objeção ou a síntese do agente nunca são aprovação.
3. **Citação literal** da mensagem humana no campo "Aprovação da Etapa 1" — e ela vive em documento que não pode ser reescrito (a imutabilidade do REGISTRO reforça a trava).
4. Métricas finais vs. baseline vão em `resultados.md` (mesma pasta — G-14): o `baseline.md` é a medida "antes", os resultados são a medida "depois"; nunca misturados.
