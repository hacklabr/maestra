# J6 — Refactoring with Inverted Origin (Technical Variant)

> Source: docs/referencia/jornadas.md v2.1 (§6 J6; G-14) + fluxo-de-desenvolvimento.md §3.4 · Module version: 1 — 2026-07-28
> Anti-drift: module derived from the source; divergence is a finding, never a silent adjustment.
> Changelog: v1 — initial version (T9): motivation with evidence, anti-auto-approval lock (3 hard rules), blocking characterization, slices with double acceptance, resultados.md.

**Trigger:** triage classified Technical (J1 Stage 2, Q1) or J2 derived it. **Inverted order:** Stage 2 is the AUTHOR of the demand; Stage 1 is the APPROVER. The most delicate point of the plugin: the Tech Lead asking "permission" to spend days without delivering a feature, and the PO deciding opportunity cost without technical vocabulary.

## STAGE 1 — Motivation with evidence (Tech Lead persona)

**The round folder is born HERE** in Technical (re-list `docs/rounds/`; collision → increment and re-announce). Artifacts (RECORD, immutable after closing — template in `reference/protocols.md`):

- `motivation.md`: concrete problem WITH EVIDENCE (metrics, bug history in the area, cost of tasks in the region); impact analysis (what it touches, which features depend on it); what may change on purpose + non-negotiables (two lists — empty is valid, missing is not).
- **Measurable goal with target value = stopping point.** "Improve the architecture" is **actively rejected** — with cited criterion and named authority (with experts the citation works: "the flow requires a measurable goal — section 3.4 — because without it the refactoring has no stopping point"). Goal examples: "reduce response time from X to Y", "decouple module Z to allow feature W".
- No goal → **block until one exists**. Refactoring without a goal is infinite rewriting in gestation.
- `baseline.md`: metrics measured BEFORE the change. **Immeasurable baseline** (without instrumentation) → block WITH A PATH: "measuring the baseline" becomes a task of the round itself, before the first slice.

## STAGE 2 — Translation and approval request (E2→E1 bridge) — ANTI-AUTO-APPROVAL LOCK

Translate the motivation into product language: what the user gains, what we stop building (opportunity cost), the non-negotiables, what may change on purpose. Present to the Stage 1 person.

**The 3 hard rules (kernel trigger #3):**
1. **Approval = explicit human act in a DISTINCT TURN.** Present and **close the turn waiting** — update `Substate: awaiting-s1-approval` and close gracefully (Entry Point B is the continuation mechanism).
2. **Default NOT approved.** Silence, absence of objection or your own synthesis of the human's position are NEVER approval.
3. **LITERAL quote** of the human message in the register (evidence, not paraphrase) — the register lives in an immutable document, which reinforces the lock: it cannot be rewritten.

Approval registered with: name, date, literal quote, the two lists. **If the PO cannot decide with the given explanation, the translation failed — not the PO.** Re-translate; do not repeat the same explanation louder.

## STAGE 3 — Characterization and baseline (blocking)

- **Characterization tests** over the current code (even bad code): they document what it does today, **quirks included**. Every non-negotiable item has ≥1 characterization test. Without this, "works the same" is wishful thinking and Stage 3 has no way to validate anything.
- "I know how it works" = named fraud (kernel trigger #8).
- Baseline measured **before** the change, committed in the round folder.

## STAGE 4 — Slice execution with double acceptance

- **Refactor in slices, never big bang** — refuse a single slice >1 day. Each slice delivers behavior parity incrementally. P7 distribution (microcopy §7.6).
- **Double acceptance per slice:** (a) parity — characterization green; (b) progress on the goal. Parity failed → stop everything → Stage 1 decision (what may change on purpose?).
- **Closing:** final metrics vs. baseline registered in **`docs/rounds/Rnn-.../resultados.md`** — own file (the baseline is the "before" measure; the results, the "after" measure; each with its semantics, both referenced in reconciliation). The comparison becomes a document, not a conversation. Unreachable goal → honest feedback (J7), never makeup.
- Reference note: proven parity ⇒ the living PRD **does not change** in this round (verified in J5 Stage 5 by empty diff).

## Journey success criteria

- Measurable goal with target value registered; approval as a human act in a distinct turn, with literal quote and the two lists.
- Every non-negotiable item with ≥1 characterization test; baseline before the first slice.
- Every slice with proven parity; final metrics vs. baseline in `resultados.md`.
