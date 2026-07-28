# Microcopy Library (L3 — language layer)

> Source: docs/referencia/jornadas.md §7, v2.3 · Module version: 2 — 2026-07-28
> Anti-drift: verbatim templates with typed slots; post-dogfood adjustment HERE, never in code. Divergence between this module and the source is a finding, never a silent adjustment.
> Changelog: v0 scaffold (T6) → v1 (T10): full transcription of §7.1–§7.11 with typed slots; deviations.md hook block preserved verbatim; override comment replaced by reference to the tool contract (`maestra_emit_event`); platform-neutral adaptations marked explicitly. v2 (journeys v2.3, human decision) — block §7.9 W-04 ("specialist outside the installed catalog") DELETED: shell-specialist architecture makes the whole catalog invocable; there is no longer an installed subset or "nearest" specialist.

## Usage conventions

- **Slots** in `{UPPERCASE}`. Fill only the slots — never rewrite the surrounding text.
- **Slot conditions** define when a phrase/clause enters or leaves. A conditional phrase included outside the condition is drift.
- **Global rules** (journeys §7.3, §7.11): never add flow-section citation; confession vocabulary forbidden ("unfortunately", "didn't work out", "we had to"); token savings never prune the clarity of the human layer.
- **Platform-neutral (ADR-012):** where the source said "GitHub", this module uses "issue platform" (adaptation marked in a local note). "PR/MR" on first occurrence when relevant.

### Anchor index (referenced by the journey modules)

| Anchor | Moment |
|---|---|
| §7.1 | Gates (met, blocked, attempt to skip) |
| §7.2 | State reconstitution (J2) + state errors |
| §7.3 | J8 refusal (5 principles + templates) |
| §7.4 | Overrides (variant, gate, reconciliation) |
| §7.5 | Team mapping (J1 Stage 4) |
| §7.6 | Distribution suggestion (P7) |
| §7.7 | Persona switch in co-triage (Technical) |
| §7.8 | Technical pending declaration |
| §7.9 | Discussion panel (invitation, closing) |
| §7.10 | Handoffs (S1→2, S2→3, feedback, disguise) |
| §7.11 | Reconciliation and deviations |

---

## §7.1 Gate moments

### Gate met (wave creation)

```text
Stage {COMPLETED_N} concluded: the artifacts are in the repository and Engineering
validated. I created the tasks for Stage {FOLLOWING_N} ({TASK_LIST}), already assigned.
Next step: {HANDLE} starts with {FIRST_TASK_NAME} ({FIRST_ISSUE}).
```

| Slot | Type | Condition |
|---|---|---|
| `{COMPLETED_N}` / `{FOLLOWING_N}` | `1` or `2` / `2` or `3` | Valid pair: 1→2 or 2→3. |
| `{TASK_LIST}` | list of issue numbers | E.g., `#14, #15, #16`. All already created and assigned (P7 confirmed). |
| `{HANDLE}` | @username | Assignee of the first task of the wave. |
| `{FIRST_TASK_NAME}` | text | Short title of the first task (e.g., "feasibility analysis"). |
| `{FIRST_ISSUE}` | number | E.g., `#14`. |

### Gate blocked

```text
Stage {FOLLOWING_N} still cannot start: {N_ITEMS} items of Stage {CURRENT_N} are missing —
{MISSING_ITEMS}. {NON_NEGOTIABLE_SENTENCE} Want to write now? I help.
```

| Slot | Type | Condition |
|---|---|---|
| `{FOLLOWING_N}` / `{CURRENT_N}` | number | Valid pair: 2/1 or 3/2. |
| `{N_ITEMS}` | integer ≥ 1 | Exact count (verified, daughter tasks one by one — never "still missing stuff"). |
| `{MISSING_ITEMS}` | list of gate items | Named one by one, with assignees when there are any. |
| `{NON_NEGOTIABLE_SENTENCE}` | sentence | **Conditional:** if the items include acceptance criteria/out of scope → "These two can never be cut, in any variant." Otherwise → the reason of the item in one sentence. |

Rule (source §7.1): blocked gate always says **what is missing, why it matters and what to do**.

### Attempt to skip gate (with override registered)

```text
I can open Stage {FOLLOWING_N} even with {N_ITEMS} items of Stage {CURRENT_N} open —
it's your call. Two things first:

1. This gets registered in the issue: gate opened with items {ITEMS}
   pending, by your decision, with the date.
2. {RISK_WARNING}

Do I proceed?
```

| Slot | Type | Condition |
|---|---|---|
| `{ITEMS}` | short list | E.g., "X and Y". |
| `{RISK_WARNING}` | sentence | **Scaled defense (P3):** mandatory when the items include acceptance criteria, out of scope or reconciliation — "An honest warning: acceptance criteria is the item I don't recommend leaving for later — without it, Stage 3 has no way to validate the delivery. The others, you know the risk better than me." Reconciliation override → maximum defense (§7.4). For other items → omit item 2. |

The register is emitted BEFORE the action (register-then-act, P3) via `maestra_emit_event` (type=override) — never by hand. Format: `reference/instrumentation.md`.

---

## §7.2 State reconstitution (visible proof that there is no local state)

### Derived state (J2)

```text
I read the demand state from the issue platform: epic {EPIC}, variant {VARIANT},
round {ROUND_ID} ({ROUND_THEME}), Stage {STAGE} in progress ({K} of {M}
tasks closed). We continue from where it stopped: {NEXT_ACTION}. {BOARD_CLAUSE}
Correct?
```

| Slot | Type | Condition |
|---|---|---|
| `{EPIC}` | number | E.g., `#12`. |
| `{VARIANT}` | Full \| Condensed \| Minimal \| Technical | From the label + metadata (facts win on divergence). |
| `{ROUND_ID}` | Rnn | **Single anchor of the session** — number + theme once; afterwards always "in this round". |
| `{ROUND_THEME}` | text | E.g., "report export". With the PO, the round has a name, not a number. |
| `{STAGE}` | 1 \| 2 \| 3 | Derived, never inferred. |
| `{K}` / `{M}` | integers | Digest arithmetic. |
| `{NEXT_ACTION}` | sentence | Always present, concrete, with issue (e.g., "the cache decision register is missing (#16)"). If substate `paused` (P1.1) → always WITH the pending unblock. |
| `{BOARD_CLAUSE}` | sentence | **Only when the move was already executed** (P6: after derivation confirmation) → "I moved the card to In progress." Otherwise omit. |

*(Platform adaptation: the source says "from GitHub" — ADR-012.)*

### Issue without labels

```text
Issue {ISSUE} has no flow labels, so I can't tell what
stage it's in. Options:
1. Classify now (2 quick questions) — I apply the labels and proceed from there
2. Tell me directly: is it Stage 1, 2 or 3?
3. Leave it as a standalone issue, outside the flow
```

| Slot | Type | Condition |
|---|---|---|
| `{ISSUE}` | number | Never derive persona from an unclassified issue; never Minimal by default (J2, branch B1). |

### Contradictory labels

```text
Issue {ISSUE} has conflicting signals: label {VARIANT_LABEL}, but
Stage {STAGE_SIGNALS} tasks closed. By the structure, it's in Stage {DERIVED_STAGE}.
I'll assume that — correct me if I'm wrong.
```

| Slot | Type | Condition |
|---|---|---|
| `{VARIANT_LABEL}` | variant | The contradiction is evidence, presented as a falsifiable statement — never hidden. |
| `{STAGE_SIGNALS}` | text | E.g., "2 and 3". |
| `{DERIVED_STAGE}` | number | Most likely hypothesis by the facts. |

### Task without assignee

```text
Task {ISSUE} has no owner. A task without an owner goes back to who created it —
who takes it? I can assign it to {HANDLE}, who took the other Stage {STAGE} ones.
```

| Slot | Type | Condition |
|---|---|---|
| `{HANDLE}` | @username | Suggestion justified by history (team.md + stage tasks). |

### Artifact not found

```text
Task {ISSUE} ({ARTIFACT}) is closed, but I didn't find the
change in {PATH}. Was the artifact delivered somewhere
else? Point me the way and I correct the reference.
```

| Slot | Type | Condition |
|---|---|---|
| `{ARTIFACT}` | text | E.g., "PRD update". |
| `{PATH}` | path | E.g., `docs/reference/prd.md`. Closed artifact task whose artifact does not exist **does not count for the gate** (J2). |

### Documentation contradiction (doc-bug)

```text
The living PRD says that {REFERENCE_DESCRIPTION}, but the code
in production {CODE_DESCRIPTION} — and the task that changed this closed without updating
the document. By the flow rule, what counts is what is in production.
I opened issue {NEW_ISSUE} as a documentation bug (label doc-bug)
to fix the document. If the intent was another, tell me and we
treat it as a product decision, not as a register error.
```

| Slot | Type | Condition |
|---|---|---|
| `{REFERENCE_DESCRIPTION}` | sentence | What the reference document asserts (e.g., "the export includes cancelled items"). |
| `{CODE_DESCRIPTION}` | sentence | What the code does (e.g., "does not include"). Precedence: production code > reference > record. |
| `{NEW_ISSUE}` | number | The issue enters the funnel as Minimal (label `variant-minimal`, single issue with reconciliation checkbox) — G-12. |

---

## §7.3 J8 refusal — the 5 principles

1. The request is validated before being refused ("Good idea").
2. The "no" is to the path, never to the request.
3. The cost of obedience is declared, small — and **true** (≤3 exchanges).
4. The benefit is to the request itself ("registered, it does not get lost"). **Flow-section citation forbidden.**
5. The current task is never hostage — mandatory continuity sentence.

### New requirement in Stage 3

```text
Good idea — and it's exactly for that reason that it can't come in through here:
if I implement now, it disappears from traceability, from the estimate
and from the acceptance criteria. Registered, it doesn't get lost.

I'll do this: I open the new demand now (takes 2 minutes, you only
confirm the description), Stage 1 decides the priority, and this task
continues with the original scope. If it's urgent, it can come in
the next round.

Do I open the demand?
```

No content slots — fixed text. **"Takes 2 minutes" is an operational promise:** if the triage-from-the-refusal exceeds ~3 exchanges, the refusal UX failed (J8 benchmark). Emits event E (see `reference/instrumentation.md`).

### Gap (fast routing)

```text
This was already foreseen in {RF}, but the PRD doesn't say whether {GAP_DESCRIPTION}.
I won't decide on my own — I mentioned Stage 1 on issue
{ISSUE} with the question. You proceed normally with the rest; when the answer
arrives, I register it in the reference PRD and notify here.
```

| Slot | Type | Condition |
|---|---|---|
| `{RF}` | RF-NN | The requirement that foresees the behavior. |
| `{GAP_DESCRIPTION}` | sentence | The ambiguity (e.g., "includes cancelled items"). |
| `{ISSUE}` | number | The task in progress — it **continues**. |

**Never even draft the answer** (anti-bypass #2) — formulate the question, never suggest the answer. A gap is only answered if the answer already exists in the living PRD.

---

## §7.4 Overrides

### Variant override (conversation)

```text
No problem — the decision is yours. I just register it in the epic, so
it's on the record later: the criteria pointed to {CRITERIA_VARIANT} ({CITED_CRITERION}),
and you classified it as {DECIDED_VARIANT} on {DATE}.

A practical consequence: if the other criteria appear midway,
I warn once — and we reclassify without ceremony.

Confirm {DECIDED_VARIANT}?
```

| Slot | Type | Condition |
|---|---|---|
| `{CRITERIA_VARIANT}` | variant | The one indicated by objective criteria. |
| `{CITED_CRITERION}` | sentence | E.g., "estimate above 5 days". |
| `{DECIDED_VARIANT}` | variant | The one decided by the human. |
| `{DATE}` | YYYY-MM-DD | Decision date. |

**Register comment:** emitted via `maestra_emit_event` (`type=override`) BEFORE changing label/metadata (register-then-act, P3 atomicity: label + metadata + comment in the same act + label `override-registered`). **Never written by hand** — exact comment format: `reference/instrumentation.md`.

### Gate override

See §7.1 ("Attempt to skip gate").

### Reconciliation override (maximum defense)

```text
This is the item I least recommend skipping: without the final review,
next round's documentation is born lying. I register your decision
and proceed — but the warning stands.
```

Fixed text. Never a block — human decision is sovereign; the register is the facilitator's duty.

---

## §7.5 Team mapping (J1 Stage 4)

```text
Before creating the tasks, I need to know who's who. The project on the
issue platform gives access to {N_PEOPLE} people. My proposal:

{PROPOSAL_LIST}

Confirm or correct? Reply in a single message, like:
"{RESPONSE_EXAMPLE}".

This gets saved in .maestra/team.md in the repository — visible to whoever
has access to the project. From now on, every task is born
assigned. To change later, just say "X is now Engineering".
```

| Slot | Type | Condition |
|---|---|---|
| `{N_PEOPLE}` | integer | Board collaborators (diff against team.md). |
| `{PROPOSAL_LIST}` | numbered list | Format: `1. @{handle} — {Role} ({detail})`. PROPOSED roles by history signals; without history, guess marked as guess. Roles named **Product/Engineering/Delivery** (never "Stage 1/2/3"). |
| `{RESPONSE_EXAMPLE}` | text | E.g., `2: engineering and delivery, 4: delivery junior front dev`. |

*(Platform adaptation: the source says "The project on GitHub" — ADR-012.)*
Rules (P5): a single collection round; visibility note mandatory (already embedded in the template); low-risk framing — "it's just so I know who to talk to about what"; without listing permission → minimal roles for the wave, partial map, **never blocks the epic**.

---

## §7.6 Distribution suggestion (P7)

```text
Distribution suggestion for this wave:

{DISTRIBUTION_LIST}

Confirm this distribution, or want to reassign someone?
```

| Slot | Type | Condition |
|---|---|---|
| `{DISTRIBUTION_LIST}` | list | One line per task: `- #{ISSUE} {TITLE} → @{HANDLE} ({JUSTIFICATION}) — {LOAD}`. Visible justification = specialty/seniority (team.md) + task scope/boundaries; load = person's current open tasks (consulted BEFORE suggesting). **Includes the reconciliation task** with assignee like any other (e.g., `- #27 Final round review → @joao (delivery owner)`). |

Rule: **one consolidated message**; no issue created before confirmation.

---

## §7.7 Persona switch in co-triage (J1, Technical variant)

```text
This is Engineering territory. From here on the conversation gets technical —
if the Tech Lead isn't you, this is the time to bring them in. The next
questions are for them.
```

Fixed text, no slots. Without this sentence: the PO receives technical questions (accessibility failure) or the Tech Lead receives translated questions (condescension).

---

## §7.8 Technical pending declaration (triage closing)

```text
Two checks are technical and stay with Engineering in Stage 2.
If something comes up there that changes the classification, I warn and we
reclassify — {SUBSET_CLAUSE}
```

| Slot | Type | Condition |
|---|---|---|
| `{SUBSET_CLAUSE}` | sentence | **Only when true for the variant pair** (Minimal→Condensed): "without rework, because Minimal's artifacts are a subset of Condensed's." The inverse is never promised; without the condition, close at "reclassify." |

---

## §7.9 Discussion panel

### Invitation (summoned by the facilitator)

```text
This decision ({DECISION}) has lasting consequence and touches
{DOMAINS}. I suggest a discussion round with the
{SPECIALISTS} specialists before closing the register.
Takes a few minutes. Do I summon? Or do you prefer to proceed without the discussion round?
```

| Slot | Type | Condition |
|---|---|---|
| `{DECISION}` | short sentence | The agenda in one sentence (e.g., "cache in the report"). A panel without an agenda = anti-pattern. |
| `{DOMAINS}` | list | E.g., "performance and permissions". |
| `{SPECIALISTS}` | list | E.g., "back-end and security". |

"Proceed without" is always a visible option. "Takes a few minutes" only if true (Pattern 6).

### Closing (synthesis, without voting)

```text
Synthesis of the discussion: {CONSENSUS}; {DIVERGENCE}.
I registered the decision in {ARTIFACT} with the divergence and the
tie-breaker criterion. The final word is yours.
```

| Slot | Type | Condition |
|---|---|---|
| `{CONSENSUS}` | sentence | E.g., "both specialists converge on cache with event invalidation". |
| `{DIVERGENCE}` | sentence | E.g., "they diverge on the TTL (security asks max 15 min)". |
| `{ARTIFACT}` | id | E.g., "ADR-003" (technical decision → ADR with status and round; if the panel reverted a previous decision, the old ADR is marked `Replaced` in the same act). The verbal synthesis text and the artifact text are the same text. |

---

## §7.10 Handoffs

### Stage 1 → 2

```text
Passing to Engineering. What was decided is in two places:
the living PRD (docs/reference/) — how the product looks from now on —
and this round's record ({ROUND_FOLDER}), with the briefing and the
scope we planned. From here the conversation gets more technical;
if something doesn't make sense for the business, I bring it back to you.
```

| Slot | Type | Condition |
|---|---|---|
| `{ROUND_FOLDER}` | path | E.g., `docs/rounds/R02-.../`. |

### Stage 2 → 3 (reconciliation announced since the handoff)

```text
Design closed: {N_TASKS} implementation tasks ({RANGE}) plus the
final round review ({RECONCILIATION_ISSUE}), ordered and without file overlap —
they can run in parallel. Each task references the
requirement it implements. Good execution work.
```

| Slot | Type | Condition |
|---|---|---|
| `{N_TASKS}` | integer | E.g., 6. |
| `{RANGE}` | text | E.g., `#21–#26`. |
| `{RECONCILIATION_ISSUE}` | number | E.g., `#27`. Reconciliation is never a surprise at the end. |

### Feedback 2 → 1 (process success tone)

```text
Engineering returned the PRD: requirement {RF} costs {COST} the estimate
because of {CAUSE}. This is the process
working — better now than at delivery. Your decision: cut,
pay the cost or defer. The details are in the comment on issue {ISSUE}
and stay registered in this round.
```

| Slot | Type | Condition |
|---|---|---|
| `{RF}` | RF-NN | |
| `{COST}` | sentence | E.g., "~3x". |
| `{CAUSE}` | sentence | E.g., "the integration with the legacy gateway". |
| `{ISSUE}` | number | Decision registered in the round folder AND reflected in the living PRD in the same round if it changes behavior (J7). "We'll see as we go" is not a decision. |

### Disguise detection

```text
You described it as {DESCRIPTION}, but by the scope this looks like rewriting
{REGION}. If that's the case, the path is another: we document
the current behavior before touching it. Which of the two is it?
```

| Slot | Type | Condition |
|---|---|---|
| `{DESCRIPTION}` | sentence | How the human described it (e.g., "fix"). |
| `{REGION}` | sentence | E.g., "the payments part". Name with care, never accuse. |

Handoffs rule (source): every handoff closes with **"who talks to me now and about what"** — the persona/tone change is perceptible and named.

---

## §7.11 Reconciliation and deviations

### Reconciliation task opening

```text
Last task of the round — and the one that makes the delivery count: the final
review. I'll compare what went into production with the living documents
(PRD, journeys, architecture) and close the round's deviation register.

At the end, the proof that the round delivered what it promised is not my
word: it's the documentation telling exactly what is in production.
```

Fixed text, no slots.

### Round closed and reconciled

```text
Round closed and reconciled. The review, item by item:

{REVIEW_ITEMS}

The documentation tells exactly what is in production. That's what
makes this delivery exist for the next rounds.
```

| Slot | Type | Condition |
|---|---|---|
| `{REVIEW_ITEMS}` | `✔` list | One item per check of checklist 8.3, written as **verified fact with executed evidence** (never "it was verified if..."). E.g., `✔ Living PRD reflects the implemented requirements (RF-12, RF-13 new; RF-03 changed)` · `✔ 1 deviation declared in the round record (the filter by date was left out — reason registered)` · `✔ No replaced technical decision` · `✔ The round scope matches what went in` · `✔ Round retrospective filled`. |

Rules (source): verdict **before** the list; items as verified facts; final sentence connects to the future value.

### Undeclared deviation found (transparency, without blame)

```text
The review found a difference: the planned foreseen {PLANNED};
only {IMPLEMENTED} went in. This happens — what can't happen is it staying
out of the register, because an undeclared deviation is what turns into contradictory
documentation later.

Confirm the reason in one sentence (time? technical decision?) and I
register it in the round's deviation register and update the living PRD to
what was actually built. Two minutes and the round closes clean.
```

| Slot | Type | Condition |
|---|---|---|
| `{PLANNED}` | sentence | E.g., "CSV and Excel export". |
| `{IMPLEMENTED}` | sentence | E.g., "CSV". |

**Routing exception (J5 F1):** if the deviation changes acceptance criteria or adds behavior → requirement absorption discovered late (violation of the iron rule) → **do not use this template**: escalate to Stage 1 (ratify with P3 override or revert via new demand). Documenting absorption as a legitimate deviation is laundering the violation.

### PO validation in reconciliation

```text
The round is closing. Your part in the final review: the living PRD —
the document that says how the product is today — was updated with what
went in. Take a look at the {SECTION} section: is this how the product
works from now on?
```

| Slot | Type | Condition |
|---|---|---|
| `{SECTION}` | text | The section of the living PRD changed in the round (e.g., "export"). |

### Deviation declaration — first time the persona meets the concept

```text
I'll declare a deviation in this round — and that's a good sign, not failure:
the plan said X, we built Y for reason Z, and it's all written down.
The process treats a declared deviation as transparency; what it doesn't
forgive is a hidden deviation.
```

Fixed text (X/Y/Z illustrative by design — it's the teaching of the format).

### Reason collection (deviation detected during execution)

```text
This came out different from planned: {X} planned → {Y} implemented.
Give me the reason in one sentence, in your words, and I register it
in the round. Without it, in two months nobody knows if it was a decision
or forgetfulness — and the documentation starts to lie.
```

| Slot | Type | Condition |
|---|---|---|
| `{X}` / `{Y}` | sentence | Factual triple planned → implemented → reason. Reason in the human's words. |

Deviation rules (source §7.11): factual triple **planned X → implemented Y → reason Z**; reason in the human's words; **confession vocabulary forbidden** ("unfortunately", "didn't work out", "we had to"); the only cited consequence is "the documentation starts to lie" — concrete, future, impersonal. Deviations are declared **when they occur** (execution touchpoint, J5 Stage 2) — reconciliation verifies completeness.

---

### deviations.md hook warning (anti-bypass #14) — DELIVERED in T6

> Fired automatically by the post-write hook (tool.execute.after) — never by
> agent call. Slot `{FINDINGS}` filled by the hook with the factual list of
> missing fields per entry. Deviation rules honored: factual triple, reason in
> the human's words, confession vocabulary forbidden, only cited consequence =
> "the documentation starts to lie" (journeys §7.11).

```text
⚠ Deviation register — automatic facilitator check:

{FINDINGS}

By the flow rule, every deviation entry takes the factual triple
(planned → implemented → reason) and the updated reference document link.
If you're still composing the entry, complete before proceeding;
if it's final, it will be rejected in the round's final review.
Without the reason registered now, in two months nobody knows if it was
a decision or forgetfulness — and the documentation starts to lie.
```
