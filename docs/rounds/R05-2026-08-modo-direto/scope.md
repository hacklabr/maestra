# Scope of round R05 — modo direto

## Variant

Minimal

## Problem (summary)

O fluxo atual (kernel L0 + jornadas J1–J11) fragmenta as três etapas (Produto →
Engenharia → Entrega) em sessões separadas, com gates assíncronos entre elas.
Para demandas pequenas (Minimal), essa fragmentação é overhead: o usuário quer
percorrer descoberta → design técnico → implementação numa única sessão
contínua, sem handoffs assíncronos entre etapas.

## Requirements introduced

- **RF-11** — O plugin deve oferecer um "modo direto" como agente selecionável,
  distinto do agente `maestra` (facilitador) atual. Quando acionado, percorre
  descoberta → design técnico → implementação numa única sessão, sem exigir
  handoffs assíncronos entre etapas.

- **RF-12** — O modo direto reaproveita as jornadas e instruções existentes
  (J1–J11, kernel, reference) — não duplica nem reescreve a lógica de fluxo.

- **RF-13** — A documentação de referência (README, docs/) descreve o modo
  direto: o que é, quando usar, e como difere do fluxo padrão fragmentado.

## Requirements changed

- _Nenhum requisito existente alterado._

## Requirements discontinued

_Nenhum._

## Out of scope for this round

- Modificar o roteador do kernel atual para adicionar uma quinta porta de
  entrada (o modo direto é um agente separado, não uma variante no roteador).
- Alterar o comportamento do fluxo existente para Full/Condensed/Technical.

## Origin

Epic: #30. Decidido por @rafaelchavesfreitas em 2026-08-01 (variante Minimal
por decisão humana, override registrado — critério contestado: decisão técnica
duradoura + afeta múltiplas partes do produto).

## Resolution (closing — 2026-08-01)

- **RF-11:** Implemented — `buildDirectAgentMarkdown()` generates `agents/maestra-direct.md` (`mode: primary`); installer generates it alongside the standard agent.
- **RF-12:** Implemented — `maestra-direct-kernel.md` reuses J1/J3/J4/J5 directly; all 18 anti-bypass triggers inherited verbatim; no flow logic duplicated.
- **RF-13:** Implemented — README.md updated with "Direct mode (modo direto)" subsection; install.sh usage info added.
- PR: #31 (commit `59541ea`).
