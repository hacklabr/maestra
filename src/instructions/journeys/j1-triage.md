# J1 — Triage and Birth of the Epic

> Source: docs/referencia/jornadas.md v2.1 (§2 calibração, §3 tabela de perguntas, §6 J1) + fluxo-de-desenvolvimento.md §3 · Module version: 2 — 2026-07-28
> Anti-drift: module derived from the source; divergence is a finding, never a silent adjustment.
> Changelog: v1 — initial version (T8): tree 3.2, hierarchy derive>confirm>ask, limits, disguise, dedup (G-10), team.md + config.md, P7, first wave. v2 (issue #16) — Stage 5: structural parent-child link made mandatory (not just textual metadata); wave completeness rule added ("born complete, never incremental") (closes F014, F020). v3 (R16, issue #34) — issue classification: native type + dimension labels at triage (RF-45..48). v4 (R19, issue #53) — Step 0 declared an instance of the universal dedup gate (kernel trigger #19): references `search-similar` (cookbook §3) and extends the search to closed epics (demands already delivered). · Module version: 5 — 2026-09-02 v2 (R17, issue #52) — instruction loads (microcopy/protocols) switched to `maestra_read_instructions` (closes F039). v5 (R21, issue #60) — Stage 2 scale criteria recalibrated: structural size axis (amount of new functionality) as the PRIMARY criterion; the five scale criteria become secondary signals that weigh but never trigger alone; PO question becomes structural; calibration ladder added (closes F050). v6 (R22, issue #59) — free-text provenance marker `Born from: free text` in the epic execution layer at birth (RF-67; feeds J3's deep-discovery gate; closes F048).

**Trigger:** free text describing a demand. **Target:** 5 minutes. **Outcome:** variant classified by objective criteria + epic registered — triage without a register did not happen.

## STAGE 0 — Pre-flight

`maestra_status` fresh (skip if already run this session and nothing changed). Write on the platform confirmed → proceed. Only MCP configured → parity table in the platform cookbook. Neither → run the triage conversationally and deliver ready-to-run commands to the human; **never a half-done epic**.

## STAGE 1 — Understanding

Formulate in 2–3 sentences what you understood (the PROBLEM, not the solution) + propose the origin (product × technical) as confirmation.

- Confirmation with ≤1 round of correction → proceed. **>1 round → emit event B** (`maestra_emit_event`).
- Vague description → 1 focal question ("what problem does this solve for who uses it?"). Persisting vague after 2 rounds → Minimal hypothesis + ambiguity recorded **in the human's words** ("original description: '...'"), never as your diagnosis.

## STAGE 2 — Objective classification

Hierarchy of operation per criterion: **1st derive** (demand text, repo structure, linked issues, history), **2nd confirm** (correctable proposal — confirmation does NOT count as a question), **3rd ask** only the irreducible (what only the human can know).

**Tree:**

1. **Technical origin?** Derive from the text + repo signals; confirm. Real discriminator: *if it works, does the user notice a difference?* — preserved behavior points to technical origin. YES → **TECHNICAL variant**: load microcopy §7.7 (persona switch) via `maestra_read_instructions` before announcing, and dispatch to `j6-technical.md`.
2. **Large initiative?** Life of its own — success metric only of it, multiple journeys affected, dedicated budget/deadline — **or a very complex feature with several capabilities/sub-features** (e.g., an exporter covering many report types). Legitimate question (only the PO knows): "Does this have a life of its own... or does it fit inside the product that already exists?" YES → **FULL**.
3. **Size of the development (structural axis — PRIMARY).** What is being built, in amount of new functionality? Derive from the demand text + repo; confirm with the PO. The PO sees the shape of the demand, never the calendar — when irreducible, the structural question: "Is this an adjustment in one spot, or a feature with several parts/behaviors?"
   - **One point behavior** — an adjustment or single, well-delimited addition (e.g., a checkbox in a modal + a default via environment variable; a plugin that exports one fixed report) → **MINIMAL**
   - **One coherent capability with several behaviors/parameters** — a whole feature of medium size (e.g., an export plugin with phase/format/column parameters) → **CONDENSED**
   - **Several capabilities/sub-features** → **FULL** (step 2).

   **The structural count is the final tie-breaker against every other signal:** a one-behavior change never becomes Condensed because it looks slow; a many-capability feature never becomes Minimal because "the AI writes it fast".
4. **Secondary signals — they weigh, they NEVER trigger alone.** In a small demand (one point behavior), none of them elevates the variant:

| Signal | Strategy | Wording for PO persona |
|---|---|---|
| AI-assisted effort estimate | **Derive, do not ask** — development here is AI-assisted; estimate in assisted days (~1 assisted day weighs Minimal; several assisted days weigh Condensed). Confirm in consequence, never in calendar math | "I'll treat this as a small job — correct me if it's actually several days of work." |
| ≥ 3 parts of the product | **Confirm, do not ask** — the PO enumerates the world they see; you do the arithmetic against the repo. **Counts only with substantial work in each part** — a thin crossing (a checkbox here, an env var there) does not count | "I'll treat this as a localized change. Correct me if it affects other parts of the product you know — if you can name the parts, even better." |
| Data model / something others consume | **NEVER ask the PO** — dependency is verifiable in code, not by the PO → **tracked pending from Stage 2**. In a small demand it does not elevate: it becomes care inside the Minimal itself (technical comment on the issue) | (does not exist in your voice to the PO) |
| Lasting technical decision | **NEVER ask the PO** → **tracked pending from Stage 2** (same rule: care inside the Minimal, not elevation) | (same) |
| Behavior in use | Legitimate question — the PO is the authority. In a small demand it does not elevate: the acceptance criteria must cover the existing behavior, and reclassification is declared if the Stage 2 analysis reveals real size | "Is anyone using this today? If it breaks, does anyone notice?" |

**Calibration ladder (objective anchor — extend with new calibrated examples):**
- Exporter of multiple report types (opportunities, projects, registrations, user data) → **FULL**
- Export plugin with parameters (phase, file format, columns) → **CONDENSED**
- Plugin exporting one specific report (e.g., first-phase submissions in CSV) → **MINIMAL**
- Checkbox in a modal + default via environment variable → **MINIMAL**

**Golden rule: the PO is never asked about what they cannot observe.** Engineering criterion becomes verifiable pending — never a translated question, however well written it may seem.

**Limits (backstop, not target):** ≤3 questions per grouped turn (answered "1: yes, 2: no"); ≤5 elicitation questions in the total of the triage; ≤3 in the fast path of Minimal; **one human decision per turn** (homogeneous collection can go in a batch). **Keep the count of elicitation questions DURING the triage** — confirmations do not count — for the event A at closing. >3 in a single turn = derivation failure; event A records it (field `derivable_questions` — target zero).

**"I don't know" has an explicit destination:**
- Product criterion → 1 repetition with an embedded example; persisting, safest hypothesis (the one that raises the variant) + assumption registered in the issue: "classified with X assumed — if Y, reclassify".
- Engineering criterion → tracked pending from the Stage 2 wave, with automatic reclassification declared already in triage (load microcopy §7.8 via `maestra_read_instructions` before announcing).
- On every "I don't know" → emit event C with the criterion.

**Variant proposal:** cite the structural count first ("I propose Condensed because: one capability with several behaviors — export with phase/format/columns parameters") OR declare explicitly "one point behavior → Minimal". Secondary signals may be cited as weight, never as the sole trigger. Justify in consequence ("what changes for you: short document, impact analysis on what already exists, no new design"). The proposal is confirmable — the human corrects.

**Disguise** (description ≠ real scope: "fix X" that in practice rewrites the region) → kernel trigger #12: load microcopy §7.10 (disguise detection) via `maestra_read_instructions` and name the conflict with care before re-classifying.

## STAGE 3 — Confirmation or contestation

Confirmation in one message. Contestation → kernel trigger #1: **evidence re-presented → persistence → register → action**; NEVER pushback → yielding. Override → register via `maestra_emit_event type=override` BEFORE acting (the direction and the contested criterion are recorded — event D in the same emission). Deadlock (neither confirms nor contests with argument) → classify by the criteria and offer the registered override path — **never automatic default-up**.

## STAGE 4 — Team and configuration (conditional)

- **Team map (`team.md` on branch `__maestra_config__`)** missing or outdated (diff against board collaborators): load microcopy §7.5 and `reference/protocols.md` §P5 via `maestra_read_instructions`. One message with PROPOSED roles (history signals; without history, guess marked as guess) — the human corrects, does not build, in a single response. Visibility note included; persisted via `maestra-config write team.md` (commit on the orphan branch, push best-effort — ADR-003). Without listing permission → minimal roles for the current wave, map marked as partial — **never blocks the epic**. Valid map → stage skipped in silence.
- **`config.md` (branch `__maestra_config__`) missing** → persist platform/host/board here (tool detection already derived what it could; ask ONCE only what is missing). Once per repository. Read with `maestra-config read config.md`; legacy `.maestra/` folder in the tree → run `maestra-config migrate` (RF-37 cutover — legacy files are NOT read).

## STAGE 5 — Dedup, distribution, birth of the epic and first wave

**Step 0 — Demand dedup (instance of the universal gate, kernel trigger #19):** before creating anything, run `search-similar` (cookbook §3) — title/summary of the understood demand × open epics with variant label, plus closed epics that may have already delivered it. Candidate found → present BEFORE creating: "I found epic #X (round Rnn) that looks like the same demand — is it an increment of it or a new demand?" Increment = **new round linked to the same epic**, never a duplicated epic. Success criterion: zero duplicated epic created without the human having seen the candidate and confirmed "it is new".

**Distribution (P7):** load microcopy §7.6 via `maestra_read_instructions`. Suggest with visible justification per task: specialty/seniority from team.md + scope/boundaries of the task + **current load of open tasks per person** (consult before suggesting — operation in the cookbook). The human confirms or reassigns in **ONE consolidated message**. **No issue is created before confirmation.**

**Creation, in the mandatory order:** epic (variant label + native issue type + two P1 layers with `Substate: triage` — format in `reference/protocols.md` §P1) → daughter tasks of the first wave with confirmed assignees and native issue type → **structural parent-child link** (the platform's native hierarchy relationship — the operation is in the cookbook; NEVER rely on textual metadata like `epic: #N` in the body alone — the gate arithmetic and the digest enumerate daughters via the structural link, not via body parsing) → board. Each artifact task declares the **artifact class** (REFERENCE or RECORD + delivery location). The epic of a free-text born demand also carries `Born from: free text` in its execution layer — the provenance marker J3's deep discovery gate reads (RF-67; without it, discovery runs standard mode).

**Type + dimension labels (classification, informational — ADR-005):** every issue born here carries the **native issue type** (derived from the demand text, confirmable like the other criteria; one per issue) and **dimension labels** when they fit the work described (free-form, multiple per issue; initial set: `gestão`, `melhoria`, `performance`, `devops`, `documentação`). Missing dimension labels are created on demand, idempotently (operation in the cookbook). Platform without a native type field or permission failure → create WITHOUT type and narrate in 1 line — classification NEVER blocks the flow.

**The wave is born complete:** all daughter tasks of the wave are created in the same act — never incrementally ("one more task appeared as we went"). If the wave includes discovery + scope + feasibility assessment (Stage 1) or implementation + evals + reconciliation (Stage 3), ALL are created together. Incremental creation is the F014 violation: it delays board visibility and breaks gate arithmetic (the gate checks for daughters that don't exist yet).

**Wave per variant:** Full/Condensed → Stage 1 artifact tasks. Technical → Stage 2 tasks (motivation, baseline, characterization, obtaining Stage 1 approval). Minimal → **single issue** (it is artifact and task at the same time; empty wave by design).

**The round folder is NOT born here** — it is born at the first artifact commit (J3/J6 Stage 1), always, in all variants.

**Triage closing:** emit **event A** (`maestra_emit_event`): elicitation count + `derivable_questions` (derivables made anyway — target zero). Detailed triggers: `reference/instrumentation.md`.

**Partial creation failure:** exact report of what exists and what is missing + **idempotent resumption** (verify existence before recreating — the digest shows what was already created; labels are idempotent).

## Journey success criteria

- Final variant explicit with the structural count cited (or "one point behavior → Minimal" declared); divergences recorded in P3 format.
- Epic with variant label, two layers, daughter tasks with confirmed assignee, cross-reference — zero task without an owner.
- Question limits respected; events A (always), B/C (when applicable) emitted.
