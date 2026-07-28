# Template — Comentário de registro de override (P3)

> Source: docs/referencia/jornadas.md §5 P3 (v2.1) + src/tools/emit-event.ts (formato real) · Module version: 1 — 2026-07-28
> Anti-drift: este formato é CONTRATO de auditoria (maestra-report). É construído e assinado pela tool `maestra_emit_event` (`type=override`) — **NUNCA escrito à mão**. Este arquivo existe como referência de leitura para humanos e para a revisão de dogfooding.

```text
**Registro de override** — facilitador
- Tipo: {variante|gate|triagem}
- De: {valor indicado pelos critérios/estado} → Para: {valor decidido pelo humano}
- Critério objetivo contestado: {critério}
- Motivo declarado: {motivo, nas palavras do humano — OBRIGATÓRIO}
- Decidido por: @{handle} em {YYYY-MM-DD}
```

**Regras (P3):**
- **Register-then-act:** o comentário é postado ANTES de trocar label/criar onda. Override sem registro é o único estado proibido.
- **Atomicidade:** label + linha de metadados da issue + este comentário no mesmo ato.
- **Label `override-registrado`** no épico.
- A assinatura "— facilitador" é acrescentada pela tool; payload contendo a assinatura é rejeitado.
- Override que resulta em divergência planejado×implementado também aparece em `desvios.md` linkando este comentário (bidirecionalidade verificada na reconciliação).
