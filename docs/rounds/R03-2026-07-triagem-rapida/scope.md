# Scope of round R03 — triagem rápida

## Variant

Minimal

## Problem (summary)

Hoje toda demanda precisa atravessar a triagem completa do J1 (entendimento,
classificação, epic, onda) antes de chegar ao board. Não existe captura rápida
— quem tem uma ideia solta ou quer apenas registrar uma tarefa precisa
responder ao processo inteiro ou anotar fora do sistema. A label `stage-0`
(criada ad-hoc) já marca 9 demandas no backlog aguardando triagem, mas o fluxo
que torna esse padrão uma feature de produto ainda não existe.

## Requirements introduced

- **RF-06** — O Facilitador deve detectar a intenção de captura rápida a
  partir da fala do usuário, reconhecendo tanto pedidos explícitos ("cria
  issue rápido: \<descrição\>", "guarda essa tarefa", "salva isso pra mim")
  quanto ideias compartilhadas ("tive uma ideia... e se fizéssemos X?"), e
  oferecer o caminho de publicação no board sem disparar a triagem J1.

- **RF-07** — Ao detectar a intenção, o Facilitador deve gerar um rascunho de
  issue (título + summary nas palavras do autor), confirmar com o usuário e,
  mediante aprovação, publicar no board com a label `stage-0` (aguarda
  triagem).

- **RF-08** — Quando uma issue `stage-0` é priorizada, o Facilitador deve
  rodar a triagem J1 normalmente sobre ela, removendo a label `stage-0` ao
  classificá-la.

## Requirements changed

- _Nenhum requisito existente alterado._

## Requirements discontinued

_Nenhum._

## Out of scope for this round

- Triagem automática de issues `stage-0` (permanece manual: priorizar → rodar
  J1).
- Notificação ou lembrete de que há issues `stage-0` acumuladas no backlog.

## Origin

Ideia I001 (`docs/ideas.md`). Epic: #22. Decidido por @rafaelchavesfreitas
em 2026-07-29 (variante Minimal por decisão humana, override registrado).

## Resolution (closing — 2026-07-29)

- **RF-06:** Implemented — kernel entry router now detects capture intent (act now vs register later).
- **RF-07:** Implemented — journey J11 creates draft → confirm → publish with `stage-0`.
- **RF-08:** Implemented — J2 branch B1a + digest-parse `stage-0` recognition → J1 promotion path.
- Commit: `bc98622` (merged to main as `f950344`).
