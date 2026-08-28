# Protocols P1–P7 — quick reference

> Source: docs/referencia/jornadas.md §4–§5, v2.2 · Module version: 3 — 2026-07-28
> Anti-drift: module derived from the source; divergence is a finding, never a silent adjustment.
> Changelog: v0 scaffold (T6) → v1 (T10): P1–P7 + P1.1 complete in quick-reference format. v2 (journeys v2.2, human decision) — protocol P2 (mirror state file) eliminated: risk of becoming a parallel source of truth and a merge-conflict generator; state is always derived from the platform (digest + docs), every session. `.maestra/team.md` and `.maestra/config.md` remain (configuration, not cache). v3 (R02, ADR-001) — P4: short imperative added at the use point — flow state field names never enumerated to a Stage 1 persona; spoken as consequences. v4 (issues #14, #19) — P6 rewritten: substate→column mapping table added (closes F011); "AFTER confirmed derivation" replaced with explicit transition rules (closes F008, F010); PR/MR-open → In review rule (closes F019); baton-pass → Ready rule (closes F016); execution≠narration rule (closes F018); config.md declared NOT source of truth about board (closes F012). P1: metadata atomicity rule strengthened — three touchpoints, one act (closes F004). v5 (issue #18) — P1: daughter task naming convention `{demand name} — {subtitle}` added (closes F015). v6 (R15, issue #49) — P1.1: substates `awaiting-qa`/`qa-rejected` added (post-acceptance QA mode); P6: substate→column rows for both, acceptance transitions 5a (`close`) / 5b (`qa`) and QA verdict transitions 6a (approve) / 6b (reject), plus the workflow.md provenance note (ADR-004; location on the `__maestra_config__` branch, read via `maestra-config` — ADR-003). v7 (R16, issue #34) — P1: native issue type (set at triage/capture per J1/J11) + dimension labels (applied at triage) added to the issue anatomy — informational, outside the parser vocabulary (ADR-005).

Reading format: each protocol = master rule + operational rules. Artifact templates in `templates/`; wordings in `reference/microcopy.md`.

---

## P1 — Two-layer issue

**Master rule:** every issue created or enriched by the plugin has a human layer (readable by non-technical) and an execution layer (for devs and agents), with a fixed audience boundary.

- **Title:** max ~60 characters, verb + object, business language. Type prefixes only in labels, never in the title.
- **Native issue type + dimension labels (informational classification — ADR-005):** every issue born at triage (J1) or capture (J11) carries the platform's **native issue type** (derived and confirmed at triage; a curated guess at capture, confirmed/corrected at promotion) and, when they fit the work, **dimension labels** (free-form, multiple per issue). Both live in the platform's fields — never in the body — and are outside the digest's parser vocabulary: nothing consumes them.
- **Daughter task title:** `{demand name} — {subtitle}` (e.g., "Conversa mais acolhedora e direta no fluxo — descoberta e escopo"). The demand name communicates which round/epic the task belongs to when read in isolation; the subtitle communicates the specific deliverable. Never prefix with "Stage N —" (the stage is in the label and metadata, repeating it in the title wastes the communication space).
- **`## Summary`:** 2–4 sentences, what/for whom/why, zero jargon, **in the demand author's words** (the facilitator paraphrases, does not invent). **Never rewritten afterwards — only corrected or appended** (the git diff tells the story).
- **Metadata line** (right after the Summary):

```text
**Variant:** {VARIANT} · **Current stage:** {1|2|3} · **Substate:** {SUBSTATE} · **Epic:** #{N} · **Round:** {Rnn}
```

Updated **in the same act** as any transition (board move, label change, substate change). The metadata line, the label, and the board column move together — three touchpoints, one act (P6 §Atomicity). A label change without a metadata update is an incomplete transition: the next session derives state from the digest, which reads all three. Human- and agent-readable redundancy (labels fail, disappear, are misread).
- **`---` + `## Details for execution`:** audience boundary, **always with the same name** (agent parser and human eye use the same marker). Agent layer: context, requirements met (RF/RNF), references, what to do, task out of scope, acceptance criteria.
- **Acceptance criteria:** live in the execution layer, written in human-testable language ("the exported report opens in Excel without breaking accents", not "validate UTF-8 encoding on the stream") — bridge of the two layers.
- **Later comments** (decisions, feedback, overrides): same rule — human sentence first, detail later.

Full template: `templates/two-layer-issue.md`.

### P1.1 — Closed vocabulary of substates (G-06, G-04)

The `**Substate:**` field uses **only** the values below — J2 derivation never depends on inference. Derivation combines the field with the platform facts (daughter tasks, gate comments); **on divergence, facts win and the field is corrected in the act**.

| Substate | Meaning | When to write |
|---|---|---|
| `triage` | Demand in classification, epic without a wave | Epic creation |
| `in-artifacts` | Current stage artifact tasks in progress | Stage wave creation |
| `awaiting-assessment` | DoR complete, feasibility assessment pending | End of asynchronous turn (J3 Stage 3) |
| `awaiting-s1-approval` | (Technical) Motivation presented, S1 approval pending — **default NOT approved** | End of lock turn (J6 Stage 2) |
| `awaiting-feedback-decision` | Objection formalized, cut/pay/defer decision pending | J7 Stage 1 |
| `in-execution` | Stage 3 implementing (k of m tasks) | First implementation task started |
| `awaiting-qa` | PR/MR accepted in `qa` mode; awaiting QA validation in the test environment | Acceptance act when `post-pr-acceptance: qa` (J5 Stage 3, P6 5b) |
| `qa-rejected` | QA found problems; task back with the implementer | QA session verdict: rejected (J2 branch B7, P6 6b) |
| `paused` | Stopped by invalidation or decision dependency (flow 9.3) | J8 (invalidation), J7 |
| `awaiting-reconciliation` | Implementation accepted, final review pending | Closing of the last implementation task |
| `closed-reconciled` | Round closed with reconciliation | J5 Stage 5 concluded |
| `closed-without-reconciliation` | **Anomalous** — epic closed without final review | **Never written** — derived in J2 (branch B6) |

**Board for `paused` (G-04):** no pause column — the card **stays in `In progress`** (does not go back, does not advance), the substate stays in the metadata and the agent posts a comment naming **what unblocks** ("paused until Stage 1's decision on issue #15's feedback"). On resumption, `paused` is always presented WITH the pending unblock.

---

## P2 — _(eliminated in v2.2 — see changelog)_

**There is no state cache.** Every derivation is digest + platform docs, every session (J2 Stage 1). If you feel the need for a state shortcut, the answer is to derive again — never persist state outside the platform.

---

## P3 — Override register × deviations.md

**Override = decision (in the moment, against criterion/state); deviation = result (planned × implemented).** Bidirectional relationship, no duplication.

- **Override** lives in **a parseable comment on the epic**, emitted **only** via `maestra_emit_event` (`type=override`) — the tool builds the format and signs "— facilitator" (exact format: `reference/instrumentation.md`). Never written by hand.
- **Deviation** lives in **the round's `deviations.md`** (template `templates/deviations.md`): planned X → implemented Y → reason Z (in the human's words) → decision registered at → reference document updated.
- **Bidirectional encounter:** an override that results in divergence also appears in `deviations.md` linking the comment (the deviation indexes, the comment evidences); every deviation by human decision links the P3 register. Reconciliation verifies bidirectionality.
- **Timing:** deviations declared **when they occur** (execution touchpoint, J5 Stage 2) — reconciliation verifies completeness, it is not the moment to write.
- **`deviations.md` always exists** — with entries or "No deviations in this round.". Missing file = incomplete reconciliation.
- **Entry without the "Reference document updated" link is rejected** — empty field is where contradiction is born (anti-bypass #14; hook signals on write, the final ruler is the agent).
- **Register-then-act:** the comment is posted BEFORE changing label/creating wave. Override without register is the only forbidden state.
- **Atomicity:** every override touches three places in the same act — label, metadata line, register comment. Without this the redundancy becomes contradiction and erodes J2 derivation.
- **Label `override-registered`** on the epic (future consolidation finds everything with one query).
- **Scaled defense per item:** round scope override = neutral register; override of **acceptance criteria, out of scope or reconciliation** = register + risk warning in one sentence (reconciliation = maximum defense, microcopy §7.4). **Never a block** — human decision is sovereign; the plugin documents.
- **Signature "— facilitator"** on every comment generated by the agent, with the human decider attributed in the "Decided by" field.

---

## P4 — Vocabulary blacklist per persona

Loaded on persona assumption (kernel). Checked **before every message** in Stage 1.

> **State fields are internal, never enumerated to a Stage 1 persona.** The flow's
> field names (`variant`, `stage`, `substate`, `gate`) describe the derivation;
> the human hears the **consequence** of each, not the label. A resume or
> handoff that lists the fields as a sequence is the F009 regression — speak the
> situation (translated via microcopy §7.2 "Substate → situation translation")
> and the next action with the issue number. See `j2-resume.md` STAGE 2 header.

| Term | Stage 1 (PO) | Stage 2/3 |
|---|---|---|
| RF / RNF | Allowed, explained the first time ("numbered requirement, like RF-03") | Free |
| PRD | "Living PRD" / "product requirements document" the first time | Free |
| DoR | **Forbidden** — "the package that needs to be ready for Engineering to start" | Free |
| ADR / ADR status | **Forbidden** — "technical decision record" | Free |
| TDD | **Forbidden** — "technical design" | Free, with the flow's caveat (it is not Test-Driven Development) |
| Modules, API contract, hooks, baseline, characterization, parity, coupling | **Forbidden** — translate to the product's observable world | Free |
| round | **Free** — first time with half a sentence ("a complete pass through the flow, from triage to closing") | Free |
| reconciliation | Gloss on first time ("the final review — the documentation matching what was built"); afterwards **"final review"** in conversation and "reconciliation" when naming the task | Free |
| deviation | **Free** — always as declared difference, never failure | Free |
| reference / record document | Gloss on first time; afterwards **"living PRD"** and **"round record"** | Free |
| "as built" | **Forbidden** — "the documentation matches what was built" | Avoid as well |
| scope.md / deviations.md / retro.md | Refer by function ("the round's deviation register"); file name only in parentheses | Free |
| doc-bug | Human concept first: "documentation error treated as a bug (label `doc-bug`)" | Free |

**Collision resolved:** "round" without qualifier = **the flow round** (triage → reconciliation). Discussion panel never uses "round" alone: "discussion round" or "panel"; the turns of the panel are "turns". **"Cycle" does not exist** in the agent's vocabulary; "slice" remains only for scope.

**Round framing:** single anchor per session (number + theme once, afterwards "in this round"); with the PO the round has a **name**, not a number ("the export round"); positional use, never ceremonial — celebration only at the reconciled closing.

**English terms** (name of the thing on the platform or in the flow): `gate`, `issue`, `label`, `board`, `assignee`, `milestone`, `PR/MR` (first occurrence), `briefing`, `feedback`, `handoff`, `MVP`, `stakeholder`, `worktree`, `scope creep` (inline gloss on first time).
**Domain terms:** `stage`, `variant`, `triage`, `epic` ("parent issue" on first occurrence), `acceptance criteria`, `feedback`, `slice`, `out of scope`, `feasibility assessment`, `journey`, `retrospective`, `requirement`, `round`, `deviation`, `reconciliation` (with gloss).
**Labels:** never spell raw label first — "variant **Condensed** (label `variant-condensed`)". Board columns: `Not started → In progress → In review → Delivered` — exact terms when narrating status.
**Language policy:** adopt the human's language (see kernel § Language policy). Token savings come from the toolset, **never from pruning human-facing clarity**.

---

## P5 — Team map (`team.md` on branch `__maestra_config__`)

- **Content per person:** name, username on the platform, role in the flow (Product/Engineering/Delivery — can be multiple) + **coarse seniority** (junior/mid/senior) + specialty.
- **Birth:** conversational, **at the end of the first triage, before creating any issue**; roles **proposed** by the agent (history signals; without history, marked guess) — the human **corrects, does not build**, in a single collection round (microcopy §7.5).
- **Persistence:** the map lives as `team.md` at the root of the orphan branch `__maestra_config__` (ADR-003) — written via `maestra-config write team.md`, read via `maestra-config read team.md`. Never hand-written in the project tree.
- **Continuous validation:** diff against board collaborators on every triage; new ones → question only about them; departed ones → signal ("@x no longer has access — remove from map?"), **never silently delete** (historical assignees reference the map).
- **Visibility (personal data):** coarse seniority only — never salary, performance review or sensitive data; the minimum for routing and distribution; the mapping conversation **informs that the map is versioned on the `__maestra_config__` branch** and visible to whoever has access to the repository's remote; if the repository ever becomes public, the content becomes public — write the file with that horizon.
- **Low-risk framing:** facilitator's conversation route, not hierarchy — "it's just so I know who to talk to about what". Trivial later edit ("X is now Engineering" → agent updates via `maestra-config write team.md`).

Template: `templates/team.md`.

---

## P6 — Board movement

**Master rule:** the board reflects the real state of work at every moment. Every movement is **executed** in the same act it is **narrated** — narration ("I'll move the card") is never a substitute for execution (the API call must happen in the same turn). If you catch yourself saying "I'll move it after your OK", that is the bug — move it when the OK comes.

**`config.md` (branch `__maestra_config__`, ADR-003) is configuration (detected platform/host), NEVER source of truth about board columns.** When you need to know what columns exist or their option IDs, query the real board via the platform's API (the command is in the platform cookbook). Config can be stale; the API is always current.

### Substate → column mapping

Every `Substate:` value (P1.1) maps to exactly one column. The facilitator never chooses a column by intuition — the substate determines it, and the column is the physical proof of the substate:

| Substate | Column | Rationale |
|---|---|---|
| `triage` | **Todo** | Classified, not yet started |
| `in-artifacts` | **In progress** | Active artifact work |
| `awaiting-assessment` | **Ready** | DoR done, waiting for next stage to pick up |
| `awaiting-s1-approval` | **Ready** | Motivation presented, waiting for S1 decision |
| `awaiting-feedback-decision` | **Ready** | Objection formalized, waiting for cut/pay/defer |
| `in-execution` | **In progress** | Implementation underway |
| `awaiting-qa` | **In review** (stays) | PR/MR accepted in `qa` mode; assignment moves to the QA professional (P6 5b) |
| `qa-rejected` | **Ready** | Reassigned to whoever implemented, for correction (P6 6b) |
| `paused` | **In progress** (stays) | Does not go back, does not advance; comment names the unblock (P1.1) |
| `awaiting-reconciliation` | **In review** | Implementation accepted, final review pending |
| `closed-reconciled` | **Done** | Round closed with reconciliation |
| `closed-without-reconciliation` | **Done** | (anomalous — derived in J2, never written) |

### Explicit transitions (when to move)

1. **Task born in triage** → card goes to **Todo**. The card stays in Todo until actual work begins — confirmed derivation is NOT work start. Moving during triage pollutes the board with false state.
2. **Task born in baton-pass / gate wave** (parent epic already `In progress`) → card goes to **Ready** (ready for the next stage to pick up), not Todo.
3. **Work starts in the session** → **Todo/Ready → In progress**, narrated, in the same act. Worktree creation (kernel #9) is the canonical trigger — if a worktree was created, the card should already be `In progress`.
4. **Handoff for assessment** (end of asynchronous turn: `awaiting-assessment`, `awaiting-s1-approval`, `awaiting-feedback-decision`) → **In progress → Ready**, narrated, with comment naming what unblocks.
5. **PR/MR opened** → **In progress → In review**, in the **same act** as the PR/MR creation command. The board transition is part of the PR command, not a separate step. Opening a PR/MR without moving the card leaves the board saying "executing" when the reality is "awaiting review".
5a. **Acceptance, mode `close`** (default; absent key = `close`): current behavior — the issue is closed with the verdict per criterion.
5b. **Acceptance, mode `qa`**: the verdict comment is registered, the issue is **NOT** closed; substate `awaiting-qa`; the card **stays in In review** (assignment passes to the QA professional — routed from the `team.md` Specialty: a unique candidate is proposed, correctable; absent or ambiguous → ask in the act, never assume).
6a. **QA approves** (session guided by the facilitator — J2 branch B7): the issue is closed with the QA verdict; the card goes to the approval column configured in `workflow.md` on the `__maestra_config__` branch (`qa-approval-column`, read via `maestra-config read workflow.md`; absent = the delivered mapping in `labels.md`); the round enters `awaiting-reconciliation`. Reconciliation closes → **Done** (rule 6 below, unchanged — QA comes BEFORE reconciliation, which remains the final gate).
6b. **QA rejects**: the card goes to **Ready**, reassigned to whoever implemented; substate `qa-rejected`; a comment names what failed (never who failed).
6. **Reconciliation closes** (J5 Stage 5) → **In review → Done** (epic), narrated. The epic only goes to `Done` after reconciliation concludes — never before (round gate, J5 Stage 5).

The post-PR/MR acceptance mode lives in `workflow.md` on the orphan `__maestra_config__` branch (read via `maestra-config read workflow.md` — ADR-003/ADR-004), **never in the working tree** (ADR-003 — config history must not pollute the product branches; a `.maestra/workflow.md` in the checkout is an error to correct) and **never in `config.md`** (ADR-002 — its parser ignores the key, producing invisible configuration); column names are convention, always revalidated against the real board via API in the act.

### Atomicity (three touchpoints, one act)

Every transition touches three places in the **same act**: the board column, the label, and the `Substate:` field in the metadata line (P1). A board move without a metadata update is an incomplete transition — the next session derives state from the digest, which reads all three. See P1.

### Board permission failure

Graceful degradation — inform ("couldn't move the card; move it manually or adjust the permission") and **proceed without blocking**. Board is a touchpoint, not a gate.

---

## P7 — Task distribution

- The facilitator **suggests with visible justification**: specialty/seniority (team.md) + task scope/boundaries + **current load of open tasks per person** (consulted before suggesting — the suggestion must not leak load favoritism).
- The human **confirms or reassigns in ONE consolidated message** — never task by task (microcopy §7.6).
- **No issue is created before confirmation** — criterion: zero task with unconfirmed assignee.
- **Includes the reconciliation task**, which gets an assignee like any other.
- Applies to: first wave (J1 Stage 5), gate waves (J3/J4 Stage 4), slices (J6 Stage 4) and retroactive reconciliation (J2 branch B6).
