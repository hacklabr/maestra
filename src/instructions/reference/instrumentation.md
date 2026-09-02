# Instrumentation — Events A–F + Override Register

> Source: docs/referencia/jornadas.md §8 (v2.1) + src/tools/emit-event.ts (real contract) · Module version: 1 — 2026-07-28
> Anti-drift: the formats below are a copy of the tool's zod schema — if the tool changes, this file changes with it; divergence is a finding.
> Changelog: v0 scaffold (T6) → v1 (T10): emission triggers, exact schema payloads, verbatim body formats from `buildEventBody`, worked examples, `maestra-report` thresholds.

## Contract (non-negotiable)

- **Single channel:** `maestra_emit_event`. Never write an event line or override register by hand — the tool builds the body, validates the payload (zod) and **signs "— facilitator" by construction**.
- **Signature injection rejected:** any payload string containing "— facilitator" makes the call fail. Never include the signature in the payload.
- **Format is audit contract:** these lines exist FOR the future queries of `maestra-report`. Format drift = silent data loss.
- **Tool args:** `epic` (issue/iid number), `type` (`A` | `B` | `C` | `D` | `E` | `F` | `override`), `payload` (record validated by type).

---

## Event A — Triage question count

**Trigger:** at the end of EVERY triage (J1 Stage 2 concluded), and immediately when a turn exceeds 3 elicitation questions.
**What it detects:** derivation failure (>3 in a turn); interrogation creep. The metric that matters: **derivables asked anyway — target zero.**

**Payload:**

| Field | Type | Rule |
|---|---|---|
| `elicitation_questions` | int ≥ 0 | Elicitation questions asked (**confirmations do not count**). |
| `derivable_questions` | int ≥ 0, **default 0** | Derivables asked anyway. |

**Body (verbatim from the tool):**

```text
**Event A** — triage: {elicitation_questions} elicitation questions; derivables asked: {derivable_questions} — facilitator
```

**Example:**

```json
{ "type": "A", "payload": { "elicitation_questions": 4, "derivable_questions": 1 } }
→ **Event A** — triage: 4 elicitation questions; derivables asked: 1 — facilitator
```

**Procedural counting:** only questions whose goal is to obtain new information from the human count as elicitation. Confirmations of derived criteria ("I'll treat this as a localized change — correct me if...") do NOT count. Homogeneous batch collection (team mapping) counts as 1.

---

## Event B — Understanding correction rounds

**Trigger:** at the end of J1 Stage 1 (human confirmed the understanding proposal).
**What it detects:** comprehension failure (>1 round = proxy).

**Payload:**

| Field | Type | Rule |
|---|---|---|
| `correction_rounds` | int ≥ 0 | Correction rounds until the human confirms. |

**Body (verbatim):**

```text
**Event B** — understanding: {correction_rounds} correction round(s) until confirmation — facilitator
```

**Example:**

```json
{ "type": "B", "payload": { "correction_rounds": 0 } }
→ **Event B** — understanding: 0 correction round(s) until confirmation — facilitator
```

---

## Event C — "I don't know" per criterion

**Trigger:** whenever the human answers "I don't know" (or equivalent) to a triage criterion — one event PER criterion.
**What it detects:** translation-gap (criterion poorly translated to the PO's observable world).

**Payload:**

| Field | Type | Rule |
|---|---|---|
| `criterion` | enum (closed) | One of the values below — exactly as written. |

**Valid values of `criterion` (zod enum, verbatim):**

```text
origem-tecnica · iniciativa-grande · estimativa-5-dias · modulos-3-ou-mais
modelo-dados-ou-contrato · decisao-tecnica-duradoura · comportamento-em-uso · demanda-vaga
```

**Body (verbatim):**

```text
**Event C** — "I don't know" on criterion: {criterion} — facilitator
```

**Example:**

```json
{ "type": "C", "payload": { "criterion": "estimativa-5-dias" } }
→ **Event C** — "I don't know" on criterion: estimativa-5-dias — facilitator
```

---

## Event D — Override with direction + contested criterion

**Trigger:** alongside every override register (see `type=override` below). The override is the formal P3 register; event D is the calibration line of criteria 3.3 — one without the other is a presence gap for `maestra-report`.
**What it detects:** pressure for variant downgrade; calibration dataset of the scale criteria.

**Payload:**

| Field | Type | Rule |
|---|---|---|
| `from` | non-empty string | Value indicated by criteria/state. |
| `to` | non-empty string | Value decided by the human. |
| `contested_criterion` | non-empty string | The disputed objective criterion (e.g., "one capability with several behaviors"). |

**Body (verbatim):**

```text
**Event D** — override: {from} → {to}; contested criterion: "{contested_criterion}" — facilitator
```

**Example:**

```json
{ "type": "D", "payload": { "from": "Condensed", "to": "Minimal", "contested_criterion": "one capability with several behaviors" } }
→ **Event D** — override: Condensed → Minimal; contested criterion: "one capability with several behaviors" — facilitator
```

---

## Event E — J8 refusal × demand created

**Trigger:** on EVERY refusal of a new requirement in Stage 3 (microcopy §7.3) — at the act of refusal (`"pending"`) and again when the demand is opened (with the number).
**What it detects:** **silent bypass** — refusals ≫ demands created = Dev circumventing the agent (Débora arc).

**Payload:**

| Field | Type | Rule |
|---|---|---|
| `demand_created` | positive int **or** literal `"pending"` | Number of the issue opened from the refusal, or `"pending"` at the act of refusal. |

**Body (verbatim):**

```text
**Event E** — J8 refusal (new requirement); demand created: {pending | #N} — facilitator
```

**Examples:**

```json
{ "type": "E", "payload": { "demand_created": "pending" } }
→ **Event E** — J8 refusal (new requirement); demand created: pending — facilitator

{ "type": "E", "payload": { "demand_created": 52 } }
→ **Event E** — J8 refusal (new requirement); demand created: #52 — facilitator
```

---

## Event F — Deviations: during × at reconciliation

**Trigger:** (a) at the close of the round reconciliation (final count); (b) when detecting a close without reconciliation late (J2 branch B6 — `closed-without-reconciliation`).
**What it detects:** **late declaration** — deviations that only appeared in the final review (or after) = degraded governance. Most direct signal of governance health.

**Payload:**

| Field | Type | Rule |
|---|---|---|
| `round` | non-empty string | Round id (e.g., `R02`). |
| `during` | int ≥ 0 | Deviations declared during execution. |
| `at_reconciliation` | int ≥ 0 | Deviations discovered in the final review (or late). |

**Body (verbatim):**

```text
**Event F** — round {round}: deviations during={during}, at-reconciliation={at_reconciliation} — facilitator
```

**Example:**

```json
{ "type": "F", "payload": { "round": "R02", "during": 2, "at_reconciliation": 1 } }
→ **Event F** — round R02: deviations during=2, at-reconciliation=1 — facilitator
```

---

## type=override — P3 override register

**Trigger:** EVERY human decision against objective criterion or state (variant, gate, triage) — **register-then-act**: emitted BEFORE changing label/metadata/creating wave. P3 atomicity: label + metadata + comment in the same act + label `override-registered` on the epic.

**Payload:**

| Field | Type | Rule |
|---|---|---|
| `type` | enum: `variant` \| `gate` \| `triage` | |
| `from` | non-empty string | Value indicated by criteria/state. |
| `to` | non-empty string | Value decided by the human. |
| `contested_criterion` | non-empty string | Objective criterion contested. |
| `stated_reason` | non-empty string — **MANDATORY** | The reason **in the human's words** (it is the payload of the decision). |
| `decided_by` | non-empty string | Handle on the platform (with or without `@` — the tool normalizes). |
| `date` | non-empty string | Decision date, YYYY-MM-DD. |

**Body (verbatim, multiline):**

```text
**Override register** — facilitator
- Type: {type}
- From: {from} → To: {to}
- Objective criterion contested: {contested_criterion}
- Stated reason: {stated_reason}
- Decided by: @{handle} on {date}
```

**Example:**

```json
{ "type": "override", "payload": {
  "type": "variant", "from": "Condensed", "to": "Minimal",
  "contested_criterion": "one capability with several behaviors",
  "stated_reason": "scope is already closed with the client, there is nothing to detail in the PRD",
  "decided_by": "rafael", "date": "2026-07-28" } }
```

```text
**Override register** — facilitator
- Type: variant
- From: Condensed → To: Minimal
- Objective criterion contested: one capability with several behaviors
- Stated reason: scope is already closed with the client, there is nothing to detail in the PRD
- Decided by: @rafael on 2026-07-28
```

---

## Thresholds and reading (`maestra-report`)

The agent does not audit itself — the reader of the signals is the **`maestra-report` (CLI)**, run on demand/CI (G-15). Reference for interpretation in the dogfooding review:

| Signal | Threshold | Reading |
|---|---|---|
| A | >3 elicitation questions in a single turn | Derivation failure — investigate what should have been derived |
| A | `derivable_questions` > 0 | Target zero — each unit is a poorly derived criterion |
| B | >1 correction round | Failure of comprehension of the initial proposal |
| C | recurrence on the same `criterion` | Translation-gap: the wording of that criterion needs review |
| D | dominant direction "variant goes down" | Pressure to downgrade — calibrate criteria 3.3 in the retrospective |
| E | refusals ≫ demands created | **Silent bypass** in progress — the refusal UX is losing to the informal path |
| F | `at_reconciliation` > 0 recurrently | Late declaration — deviations are not being declared in the act |
| All | **zero events in 3 months** | Suspected absorption, not perfection (inverted health metrics, anti-bypass #11) |

Associated requirements (source §8): visibility of team.md (P5); distribution in a single message (P7); variant "validated in use" after **3 real cycles — a cycle only counts if it closes WITH reconciliation**; roadmap with a section "assumptions to validate in dogfooding" inherited from ledgers [A*].
