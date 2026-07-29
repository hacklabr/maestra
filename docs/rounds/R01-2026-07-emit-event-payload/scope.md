# Scope of round R01 — emit-event payload parsing

## Variant

minimal

## Requirements introduced

- RF-01 — The `maestra_emit_event` tool must accept its `payload` argument whether it arrives as a JSON object or as a JSON string (host serialization varies and is not under the plugin's control).

## Requirements changed

N/A — no prior round; this is the first round of the Maestra project on itself.

## Requirements discontinued

N/A — first round.

## Out of scope for this round

- Validation that the JSON Schema exposed to the LLM declares `payload` as `type: object` (it does; the LLM sends an object — the host serializes it). Changing the schema declaration is out of scope: the fix is defensive normalization at runtime, not a schema change.
- Auditing other tools for the same string-object mismatch. `maestra_emit_event` is the only tool with an object argument; a broader audit is a candidate for a future round.
- Issue #1 (kernel gate adherence) — handled in a parallel session.
