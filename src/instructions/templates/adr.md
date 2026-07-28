# Template — ADR (`docs/decisoes/adr/ADR-NNN-titulo.md`)

> Source: fluxo-de-desenvolvimento.md §11.5 (+ glossário ADR) · Module version: 1 — 2026-07-28
> Anti-drift: verbatim da fonte. Classe: REGISTRO — imutável; a única mutação permitida é o campo **Status** (Vigente → Substituído por ADR-NNN), no mesmo commit do ADR que substitui.

```markdown
# ADR-NNN — <título da decisão>

**Status:** Vigente | Substituído por ADR-MMM
**Data:** YYYY-MM-DD
**Rodada:** Rnn

## Contexto
<!-- O que motivou esta decisão -->

## Decisão
<!-- O que foi decidido -->

## Consequências
<!-- O que esta decisão implica, positivas e negativas -->
```

**Checkpoint de unicidade (anti-contradição #5, J4 Etapa 2):**
1. **Antes de criar:** verificar se já existe ADR `Vigente` sobre o mesmo assunto (grep de status). ADR por hábito = touchpoint órfão — só se cria ADR para **decisão nova com consequência duradoura** (matriz 3.5 por variante).
2. **Se a decisão substitui uma anterior:** o ADR antigo ganha `Substituído por ADR-NNN` **no mesmo commit** do novo. **Nunca existem dois ADRs vigentes sobre o mesmo assunto.**
3. **Decisão revertida gera ADR novo** — nunca edição do antigo nem remoção.
4. Decisão saída de mesa de discussão (J9): a síntese verbal e o texto do ADR são **o mesmo texto**; se a mesa reverteu decisão anterior, o ADR antigo é marcado `Substituído` no mesmo ato.
5. A reconciliação (J5 Etapa 5) verifica: todo ADR cuja decisão foi substituída na rodada tem o status atualizado (evidência: grep de status).
