# Scope of round R06 — issue writer

## Variant

Minimal

## Problem (summary)

Capturar uma demanda hoje exige atravessar o kernel padrão (entry gate →
roteador de entrada → detecção de intenção de captura → J11) antes da issue
existir. Para quem só quer registrar algo no board, o caminho é longo demais e
atrasa a captura. Falta um agente dedicado que faça a captura direta, seguindo
as regras de labels da maestra, sem atravessar o kernel.

## Requirements introduced

- **RF-14** — O plugin deve oferecer um agente "issue writer" selecionável,
  distinto de `maestra` e `maestra-direct`, que capture demandas diretamente
  para o board com label `stage-0` em ≤2 trocas, sem atravessar o roteador do
  kernel padrão.

- **RF-15** — O issue writer reaproveita a J11 e a microcopy §7.12 (rascunho
  nas palavras do autor, gate de confirmação, publicação com `stage-0`, zero
  eventos) — não duplica nem reescreve a lógica de captura.

- **RF-16** — A documentação de referência (README) descreve o issue writer:
  o que é, quando usá-lo, e como difere de `maestra` e `maestra-direct`.

## Requirements changed

- _Nenhum requisito existente alterado._

## Requirements discontinued

_Nenhum._

## Out of scope for this round

- Alterar a J11 ou o roteador de entrada do kernel padrão.
- Promoção/triagem de issues `stage-0` (permanece no agente `maestra`, via
  "triage #N" / J2 branch B1a).
- Alterar o comportamento dos agentes `maestra` e `maestra-direct`.

## Origin

Epic: #28. Classificado Minimal em modo direto (variante confirmada por
construção; nenhum critério de escala aplicável — decisão técnica duradoura
"agente separado × porta no roteador" já tomada na R05). Decidido por
@rafaelchavesfreitas em 2026-08-01.
