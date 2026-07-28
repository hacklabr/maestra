# Template — Desvios da rodada (`docs/rodadas/Rnn-aaaa-mm-nome/desvios.md`)

> Source: fluxo-de-desenvolvimento.md §11.4 + docs/referencia/jornadas.md §5 P3 (v2.1) · Module version: 1 — 2026-07-28
> Anti-drift: verbatim da fonte, com as regras operacionais do P3. Classe: REGISTRO — imutável após o fechamento da rodada.

```markdown
# Desvios da rodada Rnn — <nome>
<!-- Toda divergência entre o planejado e o implementado.
     Desvio não declarado é o embrião da documentação contraditória. -->

## Desvio 1 — <título>
- **Planejado:** <!-- o que o briefing/escopo previa -->
- **Implementado:** <!-- o que foi de fato construído -->
- **Motivo:** <!-- por que mudou (viabilidade, decisão, descoberta) —
      NAS PALAVRAS DO HUMANO -->
- **Decisão registrada em:** <!-- link: issue, ADR ou comentário de override (P3) -->
- **Documento de referência atualizado:** <!-- link do commit/seção — OBRIGATÓRIO -->
```

**Regras operacionais (P3, anti-bypass #14):**
- **Existe sempre** — com entradas ou com a declaração explícita `Nenhum desvio nesta rodada.` Arquivo ausente = reconciliação incompleta.
- **Entrada sem o link "Documento de referência atualizado" é rejeitada** — campo vazio é onde a contradição nasce. O hook pós-escrita sinaliza na hora (ver `referencia/microcopy.md`, warning do hook); a régua final é o agente.
- **Timing:** desvios declarados **quando ocorrem** (touchpoint de execução, J5 Etapa 2) — a reconciliação verifica completude, não é o momento de escrever.
- **Bidirecionalidade:** desvio causado por decisão humana linka o comentário de override (P3); override que gera divergência aparece aqui linkando o comentário. A reconciliação verifica os dois sentidos.
- Trinca factual **planejado → implementado → motivo**; proibido vocabulário de confissão ("infelizmente", "não deu", "tivemos que").
