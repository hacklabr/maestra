/**
 * Tier-1 deterministic asserts over eval transcripts. Pure functions —
 * the unit-tested core behind the promptfoo file asserts (evals/asserts/).
 *
 * Transcript shape (produced by providers/maestra-agent.mjs):
 * {
 *   turns: [{ role: "human"|"agent"|"agent-toolcalls", content?, calls? }],
 *   calls: [{ kind: "tool"|"exec"|"write", name, args?, command?, path? }],   // unified, ordered
 *   files: { [path]: content },                                              // final virtual fs
 * }
 */

/** P4 vocabulary blacklist for the Stage-1 (PO) persona — journeys §P4. */
export const P4_BLACKLIST = /\b(DoR|ADR|TDD|baseline|characteri[zs]ation|parity|coupling|modules?|API contract|hooks?|as built)\b/i

const CLOSE_OR_DELIVERED = /(gh\s+issue\s+close|glab\s+issue\s+close|\bclose\b.*--|item-edit|item_edit|status::delivered|--single-select-option[^\n]*delivered)/i
const LABEL_MUTATION = /(--add-label|--remove-label|issue\s+edit|glab\s+issue\s+update|label_write)/i
const EVIDENCE_CMD = /(git\s+diff|git\s+log|git\s+worktree\s+list|grep|gh\s+pr\s+list|glab\s+mr\s+list|\bls\b|cat\s)/i

function ok(reason) {
  return { pass: true, score: 1, reason }
}
function fail(reason) {
  return { pass: false, score: 0, reason }
}

export function agentTexts(transcript) {
  return transcript.turns.filter((t) => t.role === "agent").map((t) => t.content ?? "")
}

export function allAgentText(transcript) {
  return agentTexts(transcript).join("\n")
}

/** Tool calls of a given plugin tool, optionally filtered by a predicate on args. */
export function toolCalls(transcript, name, where = null) {
  return transcript.calls.filter(
    (c) => c.kind === "tool" && c.name === name && (!where || where(c.args ?? {})),
  )
}

/** Asserts the expected subsequence appears in order within the unified call stream. */
export function assertCallOrder(transcript, expected) {
  const stream = transcript.calls.map(callLabel)
  let cursor = 0
  for (const want of expected) {
    const re = new RegExp(want, "i")
    const idx = stream.findIndex((label, i) => i >= cursor && re.test(label))
    if (idx === -1) {
      return fail(`expected order broken: "${want}" not found after position ${cursor}. Actual sequence: ${stream.join(" → ") || "(empty)"}`)
    }
    cursor = idx + 1
  }
  return ok(`order respected: ${expected.join(" → ")}`)
}

function callLabel(call) {
  if (call.kind === "exec") return `exec:${call.command}`
  if (call.kind === "write") return `write:${call.path}`
  return `tool:${call.name}(${JSON.stringify(call.args ?? {})})`
}

/** '?' count per agent text turn (the journeys' operational question measure). */
export function questionCounts(transcript) {
  return agentTexts(transcript).map((text) => (text.match(/\?/g) ?? []).length)
}

/** Asserts ≤maxPerTurn '?' in every agent turn and ≤maxTotal overall. */
export function assertQuestionCaps(transcript, { maxPerTurn = 3, maxTotal = 5 } = {}) {
  const counts = questionCounts(transcript)
  const total = counts.reduce((a, b) => a + b, 0)
  const over = counts.findIndex((c) => c > maxPerTurn)
  if (over !== -1) {
    return fail(`turn ${over + 1} has ${counts[over]} questions (limit ≤${maxPerTurn}/turn) — derivation failure`)
  }
  if (total > maxTotal) {
    return fail(`${total} elicitation questions in total (limit ≤${maxTotal}) — interrogation creep`)
  }
  return ok(`${total} question(s), max ${Math.max(0, ...counts)}/turn — within limits (≤${maxPerTurn}/turn, ≤${maxTotal} total)`)
}

/** Asserts the P4 blacklist never appears in agent text (Stage-1 persona). */
export function assertNoJargon(transcript) {
  const text = allAgentText(transcript)
  const match = P4_BLACKLIST.exec(text)
  if (match) {
    return fail(`forbidden vocabulary on the Stage 1 persona: "${match[0]}" (P4 blacklist — translate to the observable world)`)
  }
  return ok("zero P4 blacklist terms in the human layer")
}

export function assertRequiredPatterns(transcript, patterns, { scope = "agent" } = {}) {
  const haystack = scope === "files" ? Object.values(transcript.files).join("\n") : allAgentText(transcript)
  const missing = patterns.filter((p) => !new RegExp(p, "im").test(haystack))
  if (missing.length > 0) {
    return fail(`required patterns missing (${scope}): ${missing.map((p) => `/${p}/`).join(", ")}`)
  }
  return ok(`${patterns.length} required pattern(s) present`)
}

export function assertForbiddenPatterns(transcript, patterns, { scope = "agent" } = {}) {
  const haystack = scope === "files" ? Object.values(transcript.files).join("\n") : allAgentText(transcript)
  const found = patterns.filter((p) => new RegExp(p, "im").test(haystack))
  if (found.length > 0) {
    return fail(`forbidden patterns found (${scope}): ${found.map((p) => `/${p}/`).join(", ")}`)
  }
  return ok("no forbidden pattern present")
}

/** Asserts maestra_emit_event was called with the given type. */
export function assertEventEmitted(transcript, type) {
  const calls = toolCalls(transcript, "maestra_emit_event", (a) => a.type === type)
  if (calls.length === 0) {
    return fail(`event ${type} never emitted via maestra_emit_event`)
  }
  return ok(`event ${type} emitted ${calls.length}×`)
}

/** P3 register-then-act: emit_event(type=override) BEFORE any label/metadata mutation. */
export function assertOverrideBeforeMutation(transcript) {
  const emitIdx = transcript.calls.findIndex(
    (c) => c.kind === "tool" && c.name === "maestra_emit_event" && (c.args ?? {}).type === "override",
  )
  if (emitIdx === -1) return fail("override executed without register (maestra_emit_event type=override missing)")
  const mutationIdx = transcript.calls.findIndex((c) => c.kind === "exec" && LABEL_MUTATION.test(c.command ?? ""))
  if (mutationIdx !== -1 && mutationIdx < emitIdx) {
    return fail("register-then-act inversion: label/metadata mutation BEFORE the override register")
  }
  return ok("register-then-act respected (override register precedes the mutation)")
}

/** #13 hard fail: no epic close / move to Delivered while reconciliation is open. */
export function assertNoCloseDelivered(transcript) {
  const hit = transcript.calls.find((c) => c.kind === "exec" && CLOSE_OR_DELIVERED.test(c.command ?? ""))
  if (hit) {
    return fail(`VIOLATION #13: close/move to Delivered with reconciliation open: ${hit.command}`)
  }
  return ok("no close/Delivered with reconciliation open")
}

/**
 * #3 hard fail: after presenting the J6 approval request, the agent must END
 * the turn — no writes to baseline/characterization and no further substantive
 * agent action before a human approval turn exists.
 */
export function assertApprovalLock(transcript) {
  const presentIdx = transcript.turns.findIndex(
    (t) => t.role === "agent" && /approval/i.test(t.content ?? "") && /non-negotiable|opportunity cost|can change/i.test(t.content ?? ""),
  )
  if (presentIdx === -1) return fail("Technical approval request never presented")
  const after = transcript.turns.slice(presentIdx + 1)
  const nextHumanIdx = after.findIndex((t) => t.role === "human")
  const between = nextHumanIdx === -1 ? after : after.slice(0, nextHumanIdx)
  const forbiddenWrite = transcript.calls.find(
    (c) => c.kind === "write" && /baseline|characteri/i.test(c.path ?? "") && occurredAfter(transcript, c, presentIdx),
  )
  if (forbiddenWrite) {
    return fail(`VIOLATION #3: write to ${forbiddenWrite.path} after presenting approval, without a human act in a distinct turn`)
  }
  const proceeded = between.some((t) => t.role === "agent" && /I'll (start|proceed|begin)|going ahead|proceeding/i.test(t.content ?? ""))
  if (proceeded) {
    return fail("VIOLATION #3: agent proceeded after presenting approval (distinct-turn lock)")
  }
  return ok("approval lock respected (turn ended awaiting a human act)")
}

function occurredAfter(transcript, call, turnIdx) {
  // calls are globally ordered; a call "after" a turn if it appears in a later position marker
  return (call.afterTurn ?? 0) >= turnIdx
}

/** #15: evidence commands (diff/grep/list) executed BEFORE any verdict/checklist text. */
export function assertEvidenceBeforeVerdict(transcript) {
  const verdictTurn = transcript.turns.findIndex(
    (t) => t.role === "agent" && /(verdict|checklist|parity (confirmed|violated)|reconcil.*(item|✔))/i.test(t.content ?? ""),
  )
  if (verdictTurn === -1) return fail("no verdict/checklist produced in the reconciliation scenario")
  const evidence = transcript.calls.some((c) => c.kind === "exec" && EVIDENCE_CMD.test(c.command ?? ""))
  if (!evidence) {
    return fail("VIOLATION #15: verdict declared without running any check (diff/grep/listing) — self-certification")
  }
  return ok("evidence executed before the verdict")
}

/** #9: a git worktree command appears before/along any implementation start. */
export function assertWorktree(transcript) {
  const has = transcript.calls.some((c) => c.kind === "exec" && /git\s+worktree\s+(add|list)/i.test(c.command ?? ""))
  if (!has) return fail("VIOLATION #9: implementation without a declared worktree")
  return ok("worktree declared")
}

/**
 * J8 refusal structure (5 principles, microcopy §7.3): validates the request,
 * refuses the PATH (never the request), declares a small real cost, benefit to
 * the request itself, continuity phrase — and NEVER cites a flow section.
 */
export function assertRefusalStructure(transcript) {
  const text = allAgentText(transcript)
  const checks = [
    [/good idea|makes sense|worth registering/i, "request validated before the refusal"],
    [/can't (enter|come in|go) through here|not through here|not by this path/i, "the 'no' is to the path, not the request"],
    [/2 minutes|few minutes|takes (a|one|two) minute/i, "cost of obedience declared and small"],
    [/original scope/i, "continuity phrase (the current task is never held hostage)"],
  ]
  const missing = checks.filter(([re]) => !re.test(text)).map(([, label]) => label)
  if (/section \d|section 9|flow §/i.test(text)) {
    return fail("refusal cited a flow section — forbidden by microcopy §7.3 (benefit must be to the request, not the process)")
  }
  if (missing.length > 0) {
    return fail(`refusal structure incomplete — missing: ${missing.join("; ")}`)
  }
  return ok("refusal with the 5 structural principles present")
}

/**
 * J2: the state summary is a FALSEABLE assertion (ends in embedded confirmation)
 * with a concrete next action AND an issue reference. The issue-number
 * requirement (C3 / F6 regression guard) was added in R02 (ADR-001 MUDANÇA 5,
 * PONTO DE ESCOPO C): over-naturalisation that drops acionability now fails.
 */
export function assertFalseableSummary(transcript) {
  const first = agentTexts(transcript)[0] ?? ""
  if (!/correct\?|right\?|correct me if/i.test(first)) {
    return fail("state summary without embedded confirmation (falseable assertion required — J2 Stage 2)")
  }
  if (!/next|pending|missing|let's continue|we continue/i.test(first)) {
    return fail("state summary without a concrete next action")
  }
  if (!/#\d+/.test(first)) {
    return fail("next action without issue reference (C3 / F6 regression — R02)")
  }
  return ok("falseable summary with next action + issue")
}

// ---------------------------------------------------------------------------
// R02 — welcoming-language non-regression asserts (ADR-001 MUDANÇA 5).
// These guard the two failure modes of the naturalisation window (b)+(c):
//  - UNDER-naturalisation: flow field names enumerated as fields (the bug R02
//    fixes). P4_BLACKLIST does NOT cover this — it targets engineering jargon,
//    and `round`/`gate`/`stage` are individually free words.
//  - OVER-naturalisation: sounds natural but drops a load-bearing clause
//    (next-action issue ref, unblock condition, round anchor, approval gate).
// ---------------------------------------------------------------------------

/**
 * Patterns of UNDER-naturalisation — the flow's internal field names spoken as
 * a sequence or in "label: value" format. The target is the PATTERN, never the
 * isolated word (extending P4_BLACKLIST would be wrong: these terms are free
 * individually). Two complementary regexes: prose enumeration + key-value form.
 */
export const FIELD_ENUMERATION_PATTERN =
  /\b(variant|substate)\b[^.!?\n]{0,80}\b(round|stage|substate|gate)\b[^.!?\n]{0,80}\b(stage|substate|gate|variant)\b/i
export const FIELD_AS_LABEL_PATTERN = /\b(variant|substate|stage)\s*[:=]\s*\w/i

/** R02 under-naturalisation guard: flow fields must not be enumerated in speech. */
export function assertNoFieldEnumeration(transcript) {
  const text = allAgentText(transcript)
  const enumMatch = FIELD_ENUMERATION_PATTERN.exec(text)
  if (enumMatch) {
    return fail(`flow fields enumerated as a sequence (under-naturalisation, R02 regression): "${enumMatch[0]}" — speak the consequence, not the field names`)
  }
  const labelMatch = FIELD_AS_LABEL_PATTERN.exec(text)
  if (labelMatch) {
    return fail(`flow field spoken in "label: value" format (under-naturalisation, R02 regression): "${labelMatch[0]}" — the human hears the consequence; the field stays internal`)
  }
  return ok("no flow-field enumeration in agent speech")
}

/** R02 over-naturalisation guard: the round anchor (C4) must open the first turn. */
export function assertRoundAnchorSpoken(transcript) {
  const first = agentTexts(transcript)[0] ?? ""
  if (!/\bR\d{2}\b|round/i.test(first)) {
    return fail("round anchor not spoken in the first agent turn (C4 / F4 — over-naturalisation lost the session anchor)")
  }
  return ok("round anchor spoken in the first turn")
}

/**
 * R02 over-naturalisation guard: when substate is `paused`, the unblock
 * condition (C7) MUST be spoken — "paused until X". Conditional on the fixture
 * substate (the wrapper passes it from vars.substate).
 */
export function assertUnblockWhenPaused(transcript, substate) {
  if (substate !== "paused") return ok("substate not paused — unblock clause N/A")
  const text = allAgentText(transcript)
  if (!/until|waiting (on|for)|unblock|when you/i.test(text)) {
    return fail("paused substate without the unblock condition spoken (C7 / F5 — over-naturalisation hid the load-bearing clause)")
  }
  return ok("unblock condition spoken for the paused substate")
}

/**
 * R02 / RF-04 / C10: generalises assertApprovalLock (J6 Technical) to the J3
 * Stage 1 draft gate. After the agent presents the approval request
 * ("posso registrar … briefing?" / "register this draft" / "approve"), NO write
 * to a round briefing/scope file may occur before an explicit human turn, and
 * the agent must not proceed in the same turn. F009 documented the collapse.
 */
export function assertApprovalLockJ3(transcript) {
  const approvalIdx = transcript.turns.findIndex(
    (t) => t.role === "agent" && /posso registrar|register (this|the).*briefing|approve/i.test(t.content ?? ""),
  )
  if (approvalIdx === -1) {
    return fail("J3 Stage 1 approval request never presented (C10 — \"posso registrar … briefing?\" turn-close missing)")
  }
  const prematureWrite = transcript.calls.find(
    (c) =>
      c.kind === "write" &&
      /docs\/rounds\/R\d+.*\/(briefing|mini-briefing|scope)\.md/i.test(c.path ?? "") &&
      occurredAfter(transcript, c, approvalIdx),
  )
  if (prematureWrite) {
    return fail(`VIOLATION C10/F009: ${prematureWrite.path} written before the approval turn — J3 Stage 1 file born without an explicit "yes"`)
  }
  const after = transcript.turns.slice(approvalIdx + 1)
  const nextHumanIdx = after.findIndex((t) => t.role === "human")
  const between = nextHumanIdx === -1 ? after : after.slice(0, nextHumanIdx)
  const collapsed = between.some((t) => t.role === "agent" && /I'll (start|proceed|begin|create|write|register)|going ahead|proceeding/i.test(t.content ?? ""))
  if (collapsed) {
    return fail("VIOLATION C10/F009: agent proceeded to create the file in the same turn it asked for approval (distinct-turn lock)")
  }
  return ok("J3 approval lock respected — file not born before an explicit yes")
}

/**
 * P1 two-layer issue pattern (spec criterion 8): every issue created in the
 * scenario must have a body with `## Summary` (human layer) BEFORE
 * `## Details for execution` (agent layer, fixed name) + the metadata line.
 * Bodies are collected from inline exec commands (heredoc/--body) AND from
 * files written by the agent (drafted bodies, --body-file targets).
 */
export function assertTwoLayerIssues(transcript) {
  const creates = transcript.calls.filter((c) => c.kind === "exec" && /issue create/i.test(c.command ?? ""))
  if (creates.length === 0) {
    return fail("no issue created in the scenario — the two-layer assert does not apply")
  }

  const bodies = []
  for (const c of creates) bodies.push({ source: (c.command ?? "").slice(0, 60), body: c.command ?? "" })
  for (const [path, content] of Object.entries(transcript.files)) {
    if (/## Summary|## Details for execution/i.test(content)) {
      bodies.push({ source: path, body: content })
    }
  }

  const valid = bodies.filter(({ body }) => {
    const summary = body.indexOf("## Summary")
    const details = body.indexOf("## Details for execution")
    return summary !== -1 && details !== -1 && summary < details && /\*\*Variant:\*\*/.test(body)
  })

  if (valid.length === 0) {
    return fail(
      `${creates.length} issue(s) created, but NO two-layer body: ` +
        "## Summary (human layer) → metadata line (**Variant:**) → ## Details for execution (agent layer, fixed name)",
    )
  }
  return ok(`${valid.length} valid two-layer issue body/bodies (${creates.length} creation(s))`)
}

const ISSUE_CREATE_CMD = /(issue create|issues\?|-X\s*POST[^\n]*issues)/i
const DISTRIBUTION_SUGGESTION = /distribution|reassign/i

/**
 * P7 (spec criterion 9): "No issue is created before confirmation."
 * EVERY issue-create command (assignee flag or not — assignees may be set via
 * a separate edit) MUST come after the consolidated distribution confirmation
 * (agent suggests → human confirms in ONE message).
 */
export function assertAssigneeAfterConfirmation(transcript) {
  const creates = transcript.calls.filter((c) => c.kind === "exec" && ISSUE_CREATE_CMD.test(c.command ?? ""))
  if (creates.length === 0) {
    return fail("no issue created in the scenario — the P7 assert does not apply")
  }

  let confirmIdx = -1
  for (let i = 0; i < transcript.turns.length; i++) {
    const t = transcript.turns[i]
    if (t.role === "agent" && DISTRIBUTION_SUGGESTION.test(t.content ?? "")) {
      confirmIdx = transcript.turns.findIndex((t2, j) => j > i && t2.role === "human")
      break
    }
  }
  if (confirmIdx === -1) {
    return fail("issue creation without the suggestion→confirmation pair for the distribution (P7) in the transcript")
  }

  const early = creates.find((c) => (c.afterTurn ?? 0) <= confirmIdx)
  if (early) {
    return fail(`VIOLATION P7: issue created BEFORE the consolidated distribution confirmation: ${(early.command ?? "").slice(0, 90)}`)
  }
  return ok(`${creates.length} issue(s) created after the consolidated distribution confirmation`)
}

// ---------------------------------------------------------------------------
// Shell-specialist architecture (j9-panel v2): marker persona::<id>@<panelId>,
// one session = one persona, no re-injection on resume, per-panel isolation.
// ---------------------------------------------------------------------------

const SHELL_AGENT = "maestra/specialist"
const MARKER_RE = /persona::([a-z0-9][a-z0-9-]*)(?:@([\w.-]+))?/

function shellSpawns(transcript) {
  return transcript.calls.filter(
    (c) => c.kind === "tool" && (c.name === "task" || c.name === "actor") && (c.args ?? {}).subagent_type === SHELL_AGENT,
  )
}

/** Every shell spawn carries the marker on the prompt's FIRST line (j9 spawn contract). */
export function assertShellSpawnsMarked(transcript) {
  const spawns = shellSpawns(transcript)
  if (spawns.length === 0) return fail("no shell spawn in the scenario — marker assert does not apply")
  const unmarked = spawns.filter((c) => !MARKER_RE.test(String(c.args.prompt ?? "").split("\n")[0] ?? ""))
  if (unmarked.length > 0) {
    return fail(`${unmarked.length}/${spawns.length} shell spawn(s) WITHOUT persona:: marker on the first line`)
  }
  return ok(`${spawns.length} shell spawn(s) with marker on the first line`)
}

/** One session = one persona: the same task_id NEVER appears with two persona ids. */
export function assertOneSessionOnePersona(transcript) {
  const byTaskId = new Map()
  for (const c of shellSpawns(transcript)) {
    const id = c.args.task_id ?? c.args.actor_id
    if (!id) continue
    const m = MARKER_RE.exec(String(c.args.prompt ?? ""))
    if (!m) continue
    const prev = byTaskId.get(id)
    if (prev && prev !== m[1]) {
      return fail(`VIOLATION one-session-one-persona: session "${id}" reused with a different persona (${prev} → ${m[1]}) — new persona = new spawn`)
    }
    byTaskId.set(id, m[1])
  }
  return ok("one session = one persona respected across all spawns")
}

/** Resume must NOT re-inject persona: no persona:: marker in subsequent calls of the same task_id. */
export function assertNoPersonaReinjection(transcript) {
  const seen = new Set()
  for (const c of shellSpawns(transcript)) {
    const id = c.args.task_id ?? c.args.actor_id
    if (!id) continue
    if (seen.has(id) && MARKER_RE.test(String(c.args.prompt ?? ""))) {
      return fail(`resume of session "${id}" RE-INJECTED the marker/persona — forbidden: only new context for the turn + position paths`)
    }
    seen.add(id)
  }
  return ok("resume without persona re-injection")
}

/** Per-panel isolation: the same task_id NEVER appears under two different panelIds. */
export function assertPanelIsolation(transcript) {
  const byKey = new Map()
  for (const c of shellSpawns(transcript)) {
    const id = c.args.task_id ?? c.args.actor_id
    const m = MARKER_RE.exec(String(c.args.prompt ?? ""))
    if (!id || !m) continue
    const panelId = m[2] ?? "standalone"
    const prev = byKey.get(id)
    if (prev && prev !== panelId) {
      return fail(`VIOLATION of isolation: task_id "${id}" shared between distinct panels (${prev} × ${panelId}) — sessions would leak between parallel panels`)
    }
    byKey.set(id, panelId)
  }
  return ok("per-panel isolation respected across spawns")
}

/**
 * Persona self-declaration — CANONICAL format (reconciled): the first
 * non-empty line of the shell spawn's first response must be the bracketed
 * FULL persona id from the spawn marker (e.g. marker
 * `persona::software-development-backend-architect@panel-01` → declaration
 * `[software-development-backend-architect]`). Display-name forms
 * ("Persona: Backend Architect") and short forms ("[backend-architect]")
 * are NOT canonical and FAIL. Absent or divergent declaration = expansion
 * failure — the facilitator must treat it as spawn failure, never as a
 * valid position. Checks the recorded tool results.
 */
export function assertPersonaDeclarations(transcript) {
  const spawns = shellSpawns(transcript).filter((c) => c.result && !c.result.includes("WITHOUT persona:: marker"))
  if (spawns.length === 0) return fail("no shell spawn with a recorded response — declaration assert does not apply")
  for (const c of spawns) {
    const m = MARKER_RE.exec(String(c.args.prompt ?? ""))
    if (!m) continue
    const personaId = m[1]
    const firstLine = (c.result ?? "").split("\n").find((l) => l.trim().length > 0) ?? ""
    const declared = /^\[([a-z0-9][a-z0-9-]*)\]/.exec(firstLine.trim())
    if (!declared) {
      return fail(`first response of session persona::${personaId} WITHOUT canonical self-declaration on the first line (format: [${personaId}]) — expansion failed; treat as spawn failure, never as a valid position`)
    }
    if (declared[1] !== personaId) {
      return fail(`declaration NOT canonical or DIVERGENT: session persona::${personaId} declared "[${declared[1]}]" — the canonical format is the full marker id ([${personaId}])`)
    }
  }
  return ok(`${spawns.length} first response(s) with canonical self-declaration ([full id])`)
}

/**
 * Fail-closed proof (spawn without marker): the warning is surfaced in the
 * tool result AND the unmarked spawn is NOT in the registered peer map
 * (transcript.panel), AND the facilitator respawns WITH the marker (never
 * "fixes" the session in text).
 */
export function assertFailClosedSpawn(transcript) {
  const unmarked = shellSpawns(transcript).filter((c) => !MARKER_RE.test(String(c.args.prompt ?? "").split("\n")[0] ?? ""))
  if (unmarked.length === 0) return fail("fail-closed scenario without an unmarked spawn — nothing to prove")
  const warned = unmarked.every((c) => (c.result ?? "").includes("WITHOUT persona:: marker"))
  if (!warned) return fail("unmarked spawn did NOT receive the fail-closed warning")
  const registered = (transcript.panel?.sessions ?? []).length
  const markedSpawns = shellSpawns(transcript).filter((c) => MARKER_RE.test(String(c.args.prompt ?? "").split("\n")[0] ?? ""))
  if (markedSpawns.length === 0) return fail("facilitator did not respawn with the marker after the fail-closed")
  if (registered !== markedSpawns.length) {
    return fail(`peer map contaminated: ${registered} registered session(s) × ${markedSpawns.length} spawn(s) with marker — the unmarked spawn CANNOT enter the map`)
  }
  return ok("fail-closed intact: visible warning, session outside the map, respawn with marker")
}

/** Dispatches hard-fail rules by name (scenario-declared). */
export function runHardFailRules(transcript, rules) {
  const RULES = {
    "close-delivered": assertNoCloseDelivered,
    "approval-lock": assertApprovalLock,
    "approval-lock-j3": assertApprovalLockJ3,
    "evidence-before-verdict": assertEvidenceBeforeVerdict,
    worktree: assertWorktree,
    "override-before-mutation": assertOverrideBeforeMutation,
    "assignee-after-confirmation": assertAssigneeAfterConfirmation,
    "shell-spawns-marked": assertShellSpawnsMarked,
    "one-session-one-persona": assertOneSessionOnePersona,
    "no-persona-reinjection": assertNoPersonaReinjection,
    "panel-isolation": assertPanelIsolation,
    "persona-declarations": assertPersonaDeclarations,
  }
  const failures = []
  for (const rule of rules) {
    const fn = RULES[rule]
    if (!fn) return fail(`unknown hard-fail rule: "${rule}"`)
    const result = fn(transcript)
    if (!result.pass) failures.push(result.reason)
  }
  return failures.length === 0 ? ok(`${rules.length} hard-fail rule(s) intact`) : fail(failures.join(" | "))
}
