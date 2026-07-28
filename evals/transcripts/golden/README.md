# Golden transcripts (tier-3)

Baselines de conversas completas, revisadas por humano — o equivalente a
baselines de visual regression.

- **Estrutura** (sequência de chamadas, eventos, nº de turnos) é comparada por
  `npm run eval:golden` — drift estrutural falha.
- **Wording nunca é byte-diffed.** Mudança de microcopy/instructions → o golden
  regenera, um humano revisa o diff da conversa e aceita com `--update`.
- **Baseline NUNCA é aceita automaticamente em CI** (constraint do projeto:
  baselines exigem revisão humana).
- Golden transcripts rodam com o modelo vivo (não com o mock).
