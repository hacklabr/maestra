# J2 — Context Resumption by Issue

> Source: docs/referencia/jornadas.md v2.2 (§5 P1.1 subestados, §6 J2; gaps G-04, G-06, G-07, G-12) · Module version: 3 — 2026-07-28
> Anti-drift: module derived from the source; divergence is a finding, never a silent adjustment.
> Changelog: v1 — initial version (T8): digest enumerates → model derives, closed vocabulary P1.1, facts-win-over-field, branches B1–B6, board after confirmation. v2 (journeys v2.2, human decision) — mirror state file eliminated: derivation is ALWAYS digest + platform docs, every session; removed the branch of cache reading. v3 (R02, ADR-001) — STAGE 2 header rewritten: short imperative replaces field enumeration; cross-refs microcopy §7.2 two-phase template; field names stay internal, spoken as consequences.

**Trigger:** issue number. **Promise:** "where we are, what is missing, who I am now" — **zero questions about state present on the platform or in the docs**. Interrogating the human about what the platform already knows destroys the value proposition of this door.

## STAGE 1 — Facts and derivation

1. **`maestra_issue_digest(N)` first.** Enumerated facts: labels ∩ flow vocabulary, metadata line, daughters ONE BY ONE (state, assignee, labels), gate/override/event comments, gate arithmetic per stage, existence of the declared artifact in closed artifact tasks, column on the board, reconciliation field, parent (if daughter). The digest enumerates facts; **the derivation is yours** — verified, never inferred (kernel trigger #6).
2. **Repo reads, in this order:** round folder referenced in the metadata (`scope.md`, `deviations.md` exist? round closed?) → `docs/reference/` (how the product is TODAY) → status of cited technical decision records → `.maestra/team.md` (interlocutor role → persona). **There is no state cache: derivation is always digest + docs, every session** — sessions are ephemeral and the platform is the single source of truth.
3. **Derive the state tuple:**
   - **Variant** ← epic label.
   - **Round** ← metadata + folder presence (number + theme).
   - **Stage** ← lowest stage with open artifact tasks. Stage N gate met ⟺ ALL stage N artifact tasks closed (the arithmetic comes from the digest) — and a closed artifact task whose declared artifact does NOT exist in the repo **does not count for the gate**: use microcopy §7.2 ("artifact not found") and point the way.
   - **Substate** ← closed vocabulary P1.1 (table below).
   - **Persona** ← derived stage + interlocutor role in team.md (Stage 1 = PM/PO; Stage 2 = Tech Lead; Stage 3 = Manager/Dev/QA).
   - **Next action** ← first ordered open daughter, with owner.

**Substates (P1.1 — CLOSED vocabulary; use only these values):**

| Value | Meaning |
|---|---|
| `triage` | classification in progress, epic without a wave |
| `in-artifacts` | current stage artifact tasks in progress |
| `awaiting-assessment` | package ready, Engineering feasibility assessment pending |
| `awaiting-s1-approval` | (Technical) motivation presented, Stage 1 approval pending — default NOT approved |
| `awaiting-feedback-decision` | objection formalized, cut/pay/defer decision pending |
| `in-execution` | Stage 3 implementing (k of m tasks) |
| `paused` | stopped by invalidation or decision dependency — **always presented WITH what unblocks** |
| `awaiting-reconciliation` | implementation accepted, final review pending |
| `closed-reconciled` | round closed with reconciliation |
| `closed-without-reconciliation` | **anomalous** — epic closed without final review (derived, never written by you) |

**Facts win over the field:** derive the substate from the facts (daughters, gate comments); if the `Substate` field of the metadata line diverges, **the facts win and you correct the field in the act**, narrating the correction in 1 sentence.

## Failure branches

- **B1 — No flow labels** → assume NOTHING: never Minimal by default, never persona of an unclassified issue. Read microcopy §7.2 (issue without labels) and offer: (1) classify now (≤2 questions) — you apply the labels and proceed; (2) the human tells you the stage directly; (3) leave it as a standalone issue, outside the flow.
- **B2 — Contradictory state** (label × closed daughters, two variants, metadata × labels) → evidence + most likely hypothesis as a **FALSIFIABLE statement** + correction path in 1 sentence ("By the structure, it is in Stage 3. I'll assume that — correct me if I'm wrong."). Hiding contradiction destroys trust; naming it is process data.
- **B3 — Documentation × code contradiction** → kernel trigger #16: precedence **production code > reference > record**; inform and open issue `doc-bug` (microcopy §7.2). It **enters the funnel as Minimal** (label `variant-minimal`, single issue with reconciliation checkbox, round folder as every Minimal) — documentation contradiction is a bug, and a bug follows the flow. Never standalone, never silent fix.
- **B4 — The issue is a daughter** → digest the parent epic, derive from the parent, anchor the conversation on the daughter as focus.
- **B5 — Orphan** (parent epic closed) → inform; treat as a standalone work focus.
- **B6 — Closed epic WITHOUT reconciliation** (digest: closed epic + reconciliation task missing or open) → derive the anomalous substate `closed-without-reconciliation` and **name the anomaly without drama**: "this epic was closed without the final review — by the flow rule, the round is not delivered". Offer **retroactive reconciliation**: create the reconciliation task with confirmed assignee (P7) → execute it normally (J5 Stage 5 checklist) → record in `retro.md` that the round closed without reconciliation + emit event F (discovered late). **NEVER reopen the epic silently; NEVER leave it closed pretending everything is fine** — the anomaly is presented to the human with the regularization path.

## STAGE 2 — State presentation

Read `reference/protocols.md` §P4 for the persona language, then present the
state as a single, concise reconstitution (one sentence, ~25 words):

> Fill the typed slots internally via digest + repo reads, then emit ONE
> sentence weaving: round anchor (name + theme, once) + current situation (in
> plain words, translated from substate) + next action with issue + unblock
> condition if paused. Close with "correct?". The field names `variant` /
> `stage` / `substate` / `gate` stay internal — the human hears the consequence,
> not the label.

Microcopy §7.2 has the two-phase template (`<derivation>` internal, `<speech>`
emitted) with the substate→situation translation table — fill the slots there
and emit only `<speech>`.

If `.maestra/team.md` is missing: **present the state FIRST**; collect the map afterwards (P5 protocol, a single time per repository) — never block the derivation because of the map.

Success criterion: confirmation or correction in 1 round; next action always present.

## STAGE 3 — Board, persona, dispatch

**ONLY AFTER the derivation confirmation:** move the card to `In progress` **NARRATING** ("moved #47 to In progress") — moving before pollutes the board with false state. Permission failure → graceful degradation: inform ("couldn't move the card; move it manually or adjust the permission") and proceed — board is a touchpoint, not a gate.

Assume the persona and dispatch, reading the corresponding module:

- Stage 1 → `j3-stage1.md`
- Stage 2 → `j4-stage2.md`
- Stage 3 → `j5-stage3.md`
- Technical variant, or substate `awaiting-s1-approval` → `j6-technical.md`
- Substate `awaiting-feedback-decision` → `j7-feedback.md`

**Journey success criteria:** zero re-request of information already present in the artifacts; derivation verified (daughters one by one via digest); board moved after confirmation, never before; every contradiction named, none hidden.
