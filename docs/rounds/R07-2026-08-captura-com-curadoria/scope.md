# Scope of round R07 — captura com curadoria

## Variant

Minimal

## Problem (summary)

A captura rápida (J11 + microcopy §7.12) manda o rascunho espelhar as palavras
do autor ("paraphrase, never diagnosis"). Isso não agrega valor sobre escrever
direto no board: a issue nasce crua e a triagem herda o trabalho de
interpretação. O issue writer (e a captura via kernel padrão, que usa a mesma
J11) deve elevar a qualidade da captura.

## Requirements introduced

- **RF-17** — A J11 deve produzir rascunho **curado**: título e summary
  reescritos com clareza, preservando a intenção do autor (sem inventar
  escopo). A regra "author's words" é substituída por "author's intent,
  curated text".

- **RF-18** — A J11 deve incluir **grounding rápido no código** (uma passada
  limitada, explicitamente não exaustiva) quando fizer sentido, enriquecendo o
  summary com contexto real — e **checagem de duplicatas no board** antes de
  publicar, apresentando candidatas (criar nova / relacionar / descartar).

- **RF-19** — A J11 deve permitir **1–2 perguntas rápidas** quando a
  ambiguidade for material, usando a ferramenta de pergunta clicável do host
  (tratada por host no agent markdown, padrão DIALECT; instruções neutras).

- **RF-20** — O **gate de confirmação permanece inalterado**: nenhuma issue é
  publicada sem confirmação explícita. A rapidez da captura é preservada
  (perguntas ≤2, grounding limitado).

## Requirements changed

- _Nenhum requisito existente alterado (a J11 é instrução operacional, não
  requisito numerado — a mudança de doutrina fica registrada aqui)._

## Requirements discontinued

_Nenhum._

## Out of scope for this round

- Análise exaustiva de código (o grounding é uma passada rápida e limitada).
- Mudar a promoção/triagem de issues `stage-0` (J1/J2 — permanece no `maestra`).
- Relacionamento automático entre issues sem visibilidade/confirmação do autor.
- Mudar o gate de confirmação da captura.

## Origin

Epic: #35 (relacionado a #28/R06). Classificado Minimal em modo direto;
mudança aplicada à J11 em si (decisão do humano: "mude a J11"), herdada tanto
pelo issue writer quanto pela captura via kernel padrão. Decidido por
@rafaelchavesfreitas em 2026-08-01.

## Resolution (closing — 2026-08-01)

- **RF-17:** Implemented — J11 v2 Stage 2 "curated draft": title/summary rewritten for clarity, faithful to the author's intent; microcopy §7.12 aligned; regression test guards the doctrine.
- **RF-18:** Implemented — J11 v2 Stage 1: bounded code grounding (one fast pass) + mandatory board duplicate check with create new / relate / discard (new microcopy "Duplicate found" template; relate handled in Stage 3 publish).
- **RF-19:** Implemented — ≤2 quick questions when ambiguity is material; per-host `QUESTION` dialect baked into the issue-writer markdown (`question` tool verified built-in on both hosts); instructions stay host-neutral.
- **RF-20:** Implemented — confirmation gate text unchanged in J11 Stage 2; capture speed preserved (bounded enrichment).
- PR: #36 (commit `cfa36a7`, merge `2721baf`).
