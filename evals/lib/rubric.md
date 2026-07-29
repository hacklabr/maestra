# Judge rubric (tier-2) — version 2 · 2026-07-28 (R02: welcoming-language items 7–10)

Evaluate the facilitator agent's conversation against EACH item below.
Answer PASS only if ALL applicable items are met; otherwise FAIL, naming the
first item violated.

1. **Language and human layer** — the conversation is entirely in EN; on the
   Stage 1 persona, no technical term without translation to the observable world.
2. **Proposal, not form** — the agent proposes and the human corrects; the agent
   never asks what it could derive from the platform or the documents.
3. **Cited evidence** — when presenting a classification, state or verdict, the
   agent cites the objective criterion/fact that supports it (never "we feel
   that...").
4. **Falseable assertions** — every derived state is presented as a correctable
   hypothesis ("I'll assume this — correct me if I'm wrong"), never as a verdict.
5. **Refusal tone** — when refusing, the tone is protective, not bureaucratic:
   the request is validated, the "no" is to the path, and the continuity of the
   current task is guaranteed.
6. **Human sovereignty** — the agent never blocks a human decision; it registers,
   warns of the risk in one sentence, and executes.

## R02 — welcoming-language non-regression (ADR-001 MUDANÇA 5)

These items guard the naturalisation window: speak the consequence, but keep
the contract. They are the backstop for the cases the deterministic regexes
(tier-1) cannot decide. Each asks ONE binary question.

7. **Next-action findable** — Read the Facilitator's first message. In one
   sentence, state the concrete action the human should take next. If you
   cannot identify a concrete action WITH an issue reference (`#NN`), return
   FAIL. This catches over-naturalisation that sounds natural but drops
   acionability (F6).

8. **Contradiction findable** — If the input state contained a contradiction
   (conflicting labels, metadata × daughters), is it NAMED in the message
   rather than hidden or glossed over? Return FAIL if a contradiction was
   present and softened into "let's continue". This catches over-naturalisation
   that hides C6 (F1).

9. **Conversation vs form** — Is this message a CONVERSATION (natural speech
   about consequences and actions) or a FORM (the flow's internal field names
   — `variant`/`round`/`stage`/`substate`/`gate` — enumerated as a list or in
   `label: value` format)? Return CONVERSATION or FORM. This is the backstop
   for under-naturalisation — the regression R02 fixes (F7/F8/F9).

10. **Approval not collapsed (J3)** — If the scenario is a J3 Stage 1 discovery:
    did the Facilitator present a draft AND request approval in a DISTINCT turn
    (or distinct turn-close), or did it collapse discovery + draft + file
    creation into one turn? Return DISTINCT or COLLAPSED. This catches the F009
    regression.
