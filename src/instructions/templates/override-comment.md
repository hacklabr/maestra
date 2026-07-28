# Template — Override register comment (P3)

> Source: docs/referencia/jornadas.md §5 P3 (v2.1) + src/tools/emit-event.ts (real format) · Module version: 1 — 2026-07-28
> Anti-drift: this format is an audit contract (maestra-report). It is built and signed by the `maestra_emit_event` tool (`type=override`) — **NEVER written by hand**. This file exists as a reading reference for humans and for the dogfooding review.

```text
**Override register** — facilitator
- Type: {variant|gate|triage}
- From: {value indicated by criteria/state} → To: {value decided by the human}
- Objective criterion contested: {criterion}
- Stated reason: {reason, in the human's words — MANDATORY}
- Decided by: @{handle} on {YYYY-MM-DD}
```

**Rules (P3):**
- **Register-then-act:** the comment is posted BEFORE changing label/creating wave. Override without register is the only forbidden state.
- **Atomicity:** label + issue metadata line + this comment in the same act.
- **Label `override-registered`** on the epic.
- The "— facilitator" signature is added by the tool; a payload containing the signature is rejected.
- Override that results in planned×implemented divergence also appears in `deviations.md` linking this comment (bidirectionality verified in reconciliation).
