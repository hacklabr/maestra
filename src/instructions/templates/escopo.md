# Template — Escopo da rodada (`docs/rodadas/Rnn-aaaa-mm-nome/escopo.md`)

> Source: fluxo-de-desenvolvimento.md §11.3 · Module version: 1 — 2026-07-28
> Anti-drift: verbatim da fonte. Classe: REGISTRO — imutável após o fechamento da rodada; atualizado no lugar DURANTE a rodada se os RFs mudarem.

```markdown
# Escopo da rodada Rnn — <nome>

## Variante
<!-- completo | condensado | minimo | tecnica -->

## Requisitos introduzidos
<!-- RFs/RNFs novos criados nesta rodada -->
- RF-12 — ...

## Requisitos alterados
<!-- RFs/RNFs existentes modificados nesta rodada, com resumo da mudança -->
- RF-03 — antes: ... | agora: ...

## Requisitos descontinuados
<!-- RFs/RNFs removidos do PRD de referência, com motivo -->

## Fora de escopo desta rodada
<!-- O que explicitamente ficou de fora — NUNCA vazio:
     fora de escopo vazio é cheiro de escopo não pensado -->
```

**Regras de uso:**
- Nasce na Etapa 1 (sub-etapa 1.5 do fluxo) e entra no pacote DoR.
- A reconciliação (J5 Etapa 5) percorre os RFs/RNFs aqui listados um a um, cada um apontando a seção do documento vivo (evidência: link de commit/seção).
