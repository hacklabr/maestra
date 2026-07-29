# J11 — Quick Capture (stage-0)

> Source: fluxo-de-desenvolvimento.md (stage-0 quick capture) + kernel entry router (R03) · Module version: 1 — 2026-07-29
> Anti-drift: module derived from the source; divergence is a finding, never a silent adjustment.
> Changelog: v1 (R03) — initial version: capture-intent journey, stage-0 label, confirmation gate, promotion via J1.

**Trigger:** capture intent detected by the kernel entry router — the person wants to REGISTER something for later, not classify or process it now. **Promise:** the demand reaches the board in ≤2 exchanges, without triage interrogation.

## STAGE 1 — Intent confirmation + draft

From the user's message, generate a draft issue:

- **Title:** ≤60 chars, verb + object, business language (no technical diagnosis).
- **Summary** (`## Summary`): 2–4 sentences in the **author's words** — paraphrase what the person said, never add your diagnosis or classification.

Present the draft in chat (microcopy §7.12). Ask for confirmation or correction. If the user corrects, apply corrections and re-confirm.

**Confirmation gate:** no issue published without explicit confirmation. Silence or absence of objection is NOT confirmation (same default as kernel trigger #3).

## STAGE 2 — Publish

After confirmation:

1. Create the issue with label `stage-0`. Add it to the board.
2. Post a comment noting it is awaiting triage (stage-0).
3. Use microcopy §7.12 (published).

**Do NOT create:** epic, round folder, wave, daughter tasks, metadata line (P1), variant label — this is **pre-flow**. The round folder is NOT born here; it is born at the first J1 artifact commit (J3/J6 Stage 1).

**Emit NO events (A–F)** — capture is pre-flow. Triage events fire when J1 runs later (promotion).

## STAGE 3 — Promotion (when prioritized)

When the user says "triage issue #N" (or similar) about a stage-0 issue, OR when J2 resume encounters a stage-0 issue (branch B1a):

- Run **J1 normally** over the issue.
- **Remove the `stage-0` label** as part of classification.
- The issue transitions from pre-flow into the normal flow.

## Rules

- **Author's words:** the draft quotes the human's intent, never the facilitator's diagnosis.
- **Confirmation gate:** no issue published without explicit confirmation.
- **`stage-0` ≠ Minimal:** stage-0 is unclassified pre-flow; Minimal is a classified variant. A stage-0 issue has no variant — only after J1 promotion does it receive one.
- **No round folder born here** — born at the first J1 artifact commit (J3/J6 Stage 1), as in every variant.

## Journey success criteria

- Issue published with `stage-0` label in ≤2 exchanges.
- Draft in the author's words; no triage interrogation.
- No epic, round folder, wave, or events created — pre-flow only.
