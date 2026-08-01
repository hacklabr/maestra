# Scope of round R04 — painéis paralelos

## Variant

Minimal

## Problem (summary)

Os painéis de discussão (J9) hoje são estritamente sequenciais — um
especialista fala de cada vez. Para problemas multidomínio onde as
perspectivas são independentes (ex: segurança + performance + modelo de
dados), isso pode ser mais lento do que o necessário. A demanda é suportar
modos de rodada com paralelismo: análises simultâneas independentes,
re-análise considerando a posição do par, e alinhamento mediado para
consenso.

## Requirements introduced

- **RF-09** — O J9 (Stage 2) deve descrever três modos de rodada:
  `parallel` (N especialistas simultâneos, mesma agenda base, posições
  independentes), `peer-review` (paralelo, mas cada especialista recebe
  também os paths das posições dos pares da rodada anterior para
  re-análise) e `sequential` (turno a turno, o modelo atual). Cada modo
  deve ter regras claras de quando usar.

- **RF-10** — O J9 deve permitir combinar modos entre rodadas de um mesmo
  painel (ex: abrir com `parallel` para posições independentes, avançar
  para `peer-review` para re-análise, fechar com `sequential` para
  consenso), com regras de transição entre rodadas.

## Requirements changed

- _Nenhum requisito existente alterado._ O modo `sequential` formaliza o
  comportamento atual; não introduz mudança de comportamento.

## Requirements discontinued

_Nenhum._

## Out of scope for this round

- Mudanças no `ask_peer` (continua sequencial por construção — rate limit,
  busy-check anti-cycle).
- Suporte a painéis assíncronos persistentes entre sessões (já coberto
  pelo G-08).
- Avaliação de custo de tokens por rodada paralela (fica para a retro).

## Origin

Observação direta do usuário (@rafaelchavesfreitas) durante uso (dogfooding):
o facilitador percebeu a limitação ao discutir o próprio modelo de painéis.
Epic: #29. Variante Minimal por decisão humana (override registrado —
Technical → Minimal).

## Resolution (closing — 2026-08-01)

- **RF-09:** Implemented — J9 Stage 2 now describes three round modes
  (`parallel`, `peer-review`, `sequential`) with "Use when/as/for" rules;
  module version bumped to v5; changelog updated.
- **RF-10:** Implemented — J9 Stage 2 "Transition between rounds" with
  transition rules (`parallel` → `peer-review` → `sequential`) and narration
  template; success criteria updated.
- Files touched: `src/instructions/journeys/j9-panel.md` (Stage 2 rewritten,
  changelog + success criteria updated). Build OK, 848 tests passing,
  `check:vocab` OK, `check:dist` OK.
