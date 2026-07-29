# J3 — Stage 1 Conduction: Discovery and PRD

> Source: docs/referencia/jornadas.md v2.4 (§6 J3) + fluxo-de-desenvolvimento.md §6, §9.1 · Module version: 3 — 2026-07-28
> Anti-drift: module derived from the source; divergence is a finding, never a silent adjustment.
> Changelog: v1 — initial version (T9): zero order, birth of the round folder, living documents, gate with artifact existence, asynchronous handoff. v2 — J9 mention as ad-hoc path when discovery reveals multi-domain decision (anti-ambiguity with J4 ADR trigger). v3 (R02, ADR-001) — STAGE 1 split into three phases with turn-boundaries (discovery conversation → draft in chat → approval gate, default NOT approved); round folder born only after the explicit "yes". v4 (issue #20) — Stage 3 feasibility assessment clarified as a SEPARATE task, not a comment on the scope task (closes F013).

**Trigger:** J1 concluded or J2 deriving Stage 1. **Persona:** PM/PO talking with a non-technical peer. **Before any message:** read `reference/protocols.md` §P4 (blacklist) — every message is an accessibility checkpoint. The PO is never asked about what they cannot observe.

## STAGE 0 — Reference reading (zero order)

Read `docs/reference/` BEFORE any proposal — Stage 1 starts from how the product is TODAY, never from old briefings. Every proposal references the documented current state ("today the report works like this — section X of the living PRD"), never the void.

## STAGE 1 — Discovery as conversation, then draft in chat, then approval gate

Discovery is a CONVERSATION, not a file. Three phases, each a distinct turn.
Collapsing them into one turn is the F009 failure mode — do not.

### Phase 1 — Discovery conversation (C8)

Ask the questions you need to draft the briefing (problem, success metric,
constraints, out of scope). Ground every question in the documented current
state read in STAGE 0 — "today the report does X (PRD §Y); do you want to
change that, or add something new?". One question per turn when possible;
never more than three in a single message (P4 elicitation cap). The round
folder is NOT created here. No file is written.

**Panel available (J9, ad-hoc):** if the discovery reveals a decision with
lasting consequence touching multiple domains (e.g., security + UX + data
model), you MAY suggest a discussion panel (`journeys/j9-panel.md`) before
detailing the briefing — "proceed without" is always a visible option. Never
mandatory; zero panels at fixed points remains the rule.

### Phase 2 — Draft in chat (C9)

When discovery gives you enough, present the briefing draft IN THE CHAT — not
as a file. Structure: problem · success metric · constraints · out of scope
(≥1 explicit item). Frame it as a proposal the human edits (from the triage;
the human **edits**, does not fill from scratch), not a form to fill. Reference
the current PRD state where the proposal changes it.

### Phase 3 — Approval gate — turn-close, default NOT approved (C10)

End the draft turn with an EXPLICIT approval request as a distinct turn-close:

> "Posso registrar esse rascunho como o briefing do round?"

Then **STOP**. Do not create the file. Do not proceed to STAGE 2. The default
is NOT approved — silence, or the human editing the chat draft inline, is
NEVER approval. Only an explicit "yes" / "pode" / "approved" in a distinct
human turn authorizes file creation.

**Failure signal (preserved):** if the human totally rewrites the chat draft,
your discovery failed — re-engage with better questions; do not blame the human
and do not create the file anyway.

### Birth of the round folder (after the explicit "yes")

The folder `docs/rounds/Rnn-yyyy-mm-name/` is born only AFTER the approval
"yes" (first artifact commit), in ALL variants:
- Full: `briefing.md` · Condensed: `mini-briefing.md` · Minimal: the issue is the briefing, but the folder is born anyway (with `scope.md`).
- **Before writing, re-list `docs/rounds/`**: Rnn = count + 1; collision (parallel round) → increment and re-announce.
- Announce the identity ("this is round R03") and update the epic metadata line with the round.
- The briefing is a **RECORD**: sealed at the round closing; later corrections = dated addendum, never a rewrite. Framing: the briefing needs to be honest, not perfect — what counts for the present is the living PRD.

Success criterion: artifact with problem + success metric + constraints; human approved with an explicit "yes"; folder exists and is linked in the metadata.

## STAGE 2 — Journeys, stories and acceptance criteria (in the living documents)

- Journeys: Full → complete map; Condensed → only the affected ones; Minimal → none. `docs/reference/jornadas.md` edited **in place**.
- Observable acceptance criteria, verifiable by a third party ("when X, the system does Y"), in human-testable language ("the exported report opens without breaking accents", not "validate encoding on the stream").
- **Kernel trigger #4 (blocking):** acceptance criteria and out of scope NEVER leave the package, in any variant. Pressure to skip → resist with the reason; persisting → P3 override with risk warning in 1 sentence.
- Out of scope with ≥1 explicit item — empty is a smell of unconsidered scope.
- Continuous requirement IDs: RF/RNF = existing maximum + 1; **verify on commit** — collision (parallel rounds) → renumber the most recent and record in `deviations.md`.

## STAGE 3 — Round scope, validation and gate (asynchronous)

- **`scope.md` is born here**: introduced RFs/RNFs, changed (before→now), discontinued + out of scope of the round. Editable within the round; immutable only after closing.
- Living PRD updated **in place** (`docs/reference/prd.md`) — there is no "incremental section". In Minimal, apply the test: **"does this change restore or alter what is specified?"** — restores (bug) → PRD does not change; alters → update in the same round.
- **Feasibility assessment is a SEPARATE task**, not a comment on the scope task. The scope task (discovery + briefing) is closed with a verdict; a new daughter task is created for the feasibility assessment, assigned to the Engineering person. The comment on the scope task mentions the new task; it does not BECOME the assessment. Update `Substate: awaiting-assessment` on the epic. Close the turn gracefully ("Stage 1 is ready; @maria was assigned the feasibility task #N — when she replies, call me with the issue number"). Asynchronous is the default; Entry Point B is the continuation mechanism. Never hold the human waiting nor simulate the assessment.
- **Gate verification (when resuming):** daughters one by one via `maestra_issue_digest` — closed AND declared artifact existing in the repo, modified within the round period (closed task without artifact does NOT count → microcopy §7.2 "artifact not found"). Checklist proportional to the variant, always including `scope.md`.
- Incomplete gate → EXACT list of what is missing + assignees ("no" with a path, never "still missing stuff" — microcopy §7.1 blocked gate). Request to skip gate → microcopy §7.1 (attempt to skip gate) + P3 override with scaled defense.

## STAGE 4 — Baton pass (Stage 2 wave)

Gate verified → P7 distribution (microcopy §7.6 — justified suggestion, consolidated confirmation, no issue before) → Stage 2 daughter tasks (each declaring the REFERENCE/RECORD class + location) → gate comment (microcopy §7.1 gate met) → metadata (`Current stage: stage-2`, `Substate: in-artifacts`) → board → handoff (microcopy §7.10 Stage 1→2).

Lead with the visible value ("I created the 3 Stage 2 tasks, already assigned"), not with bureaucracy. The Stage 1 human leaves knowing that their role now is consulted/approver.

## Journey success criteria

- 100% of packages with acceptance criteria + out of scope (blocking); RF/RNF with continuous ID; out of scope ≥1 item.
- Round folder born and linked; `scope.md` in the package; assessment registered as a comment with date.
- Zero terms from the P4 blacklist in messages; 100% of wave tasks with confirmed assignee.
