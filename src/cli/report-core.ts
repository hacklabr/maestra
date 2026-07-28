import type { CommentFacts, IssueFacts } from "../platform/types.js"
import { classifyLabels } from "../tools/digest-parse.js"
import { parseEventComments, type ParsedEvent } from "./report-parse.js"

/**
 * maestra-report audit core — pure, I/O-free. Every check compares EVENT × STATE
 * (never event × event): each presence check has an independently observable
 * state leg (label applied, rodada closed, demand issue exists).
 *
 * The report is the provisional reader of signals A–F (G-15): instrumentation
 * without a reader is decorative. Loud failure = non-zero exit with a PT-BR
 * report; thresholds are encoded here, not configured (D7).
 */

export const THRESHOLDS = {
  /** Derivable questions asked anyway — target zero (jornadas §2). */
  derivableQuestionsMax: 0,
  /** E parity: |recusas − demandas criadas| / recusas above this → audit (silent bypass). */
  eDivergenceMax: 0.2,
  /** F: deviations declared during execution / total below this → late-declaration failure. */
  fDeclaredDuringMin: 0.5,
} as const

export type Severity = "gap" | "threshold" | "signal"

export interface Finding {
  severity: Severity
  code: string
  message: string
}

export interface EpicSnapshot {
  issue: IssueFacts
  comments: CommentFacts[]
  /** Reconciliation task state (children scan — same rule as the digest). */
  reconciliation: { exists: boolean; state: "open" | "closed" | null; number: number | null }
  boardColumn: string | null
  /** Demand issue number → exists on the platform (for E parity, state leg). */
  demandsExist: Map<number, boolean>
}

export interface EpicAudit {
  number: number
  title: string
  variant: string | null
  findings: Finding[]
  eStats: { refusals: number; created: number }
}

export interface ReportResult {
  epics: EpicAudit[]
  global: Finding[]
  summary: { epics: number; gaps: number; thresholds: number; signals: number }
  exitCode: 0 | 1
}

const BOARD_DONE = /delivered|done/i

function eventsOfType<T extends ParsedEvent["type"]>(events: ParsedEvent[], type: T) {
  return events.filter((e): e is Extract<ParsedEvent, { type: T }> => e.type === type)
}

/** Audits one epic snapshot. Pure. */
export function auditEpic(snap: EpicSnapshot): EpicAudit {
  const { issue, comments, reconciliation, boardColumn, demandsExist } = snap
  const labels = classifyLabels(issue.labels)
  const { events, drift } = parseEventComments(comments)
  const findings: Finding[] = []
  const isMinimal = labels.variant === "variant-minimal"
  const hasF = eventsOfType(events, "F").length > 0

  // --- Format drift (layer 3: unparseable marked comments) ---
  for (const line of drift) {
    findings.push({
      severity: "gap",
      code: "DRIFT",
      message: `unparseable event/override line (format drift): "${line}"`,
    })
  }

  // --- Presence-gap: variant label → event A (triage instrumented) ---
  if (labels.variant && eventsOfType(events, "A").length === 0) {
    findings.push({
      severity: "gap",
      code: "PRESENCE-A",
      message: `epic has label ${labels.variant} but no Event A — triage was not instrumented (or happened outside the plugin).`,
    })
  }

  // --- FM-13: epic closed without reconciliation (the two-click bypass) ---
  // reconciliationDone: task closed (all variants with children) or, on Minimal
  // (single issue, checkbox reconciliation), the F event as the executed verdict.
  const reconciliationDone = reconciliation.exists ? reconciliation.state === "closed" : isMinimal && hasF
  if (issue.state === "closed" && !reconciliationDone) {
    const boardNote = boardColumn && BOARD_DONE.test(boardColumn)
      ? ` — and the board already shows "${boardColumn}": the bypass was fully executed`
      : ""
    findings.push({
      severity: "gap",
      code: "FM-13",
      message:
        `epic CLOSED without reconciliation (${reconciliation.exists ? `task #${reconciliation.number} still open` : "no reconciliation task/event"}).${boardNote} ` +
        `Round "delivered" via UI, not via the rule — open retroactive reconciliation (J2 branch B6).`,
    })
  }

  // --- Presence-gap: round closed → event F ---
  // Closed round legs: reconciliation task closed (any variant) or Minimal closed
  // WITH reconciliation done (hasF covers it; if missing, FM-13 above already
  // names the anomaly — no double finding).
  const roundClosed = reconciliation.exists && reconciliation.state === "closed"
  if (roundClosed && !hasF) {
    findings.push({
      severity: "gap",
      code: "PRESENCE-F",
      message: `reconciliation task #${reconciliation.number} closed, but no Event F — closure not instrumented.`,
    })
  }

  // --- Presence-gap: label override-registered → event D ---
  if (labels.markers.includes("override-registered") && eventsOfType(events, "D").length === 0) {
    findings.push({
      severity: "gap",
      code: "PRESENCE-D",
      message: `label override-registered present but no Event D — override without direction/criterion instrumentation.`,
    })
  }

  // --- Threshold A: derivable questions asked anyway — target ZERO ---
  for (const a of eventsOfType(events, "A")) {
    if (a.derivable > THRESHOLDS.derivableQuestionsMax) {
      findings.push({
        severity: "threshold",
        code: "A-DERIVABLE",
        message: `Event A records ${a.derivable} derivable question(s) asked anyway — target zero. Derivation failure: review triage instructions.`,
      })
    }
    const cap = isMinimal ? 3 : 5
    if (a.elicitation > cap) {
      findings.push({
        severity: "signal",
        code: "SIGNAL-A-CAP",
        message: `triage with ${a.elicitation} elicitation questions (backstop: ≤${cap}${isMinimal ? " on Minimal" : ""}). Interrogation creep?`,
      })
    }
  }

  // --- Signal B: correction rounds > 1 = comprehension-failure proxy ---
  for (const b of eventsOfType(events, "B")) {
    if (b.correctionRounds > 1) {
      findings.push({
        severity: "signal",
        code: "SIGNAL-B",
        message: `understanding confirmed after ${b.correctionRounds} correction rounds (>1 = comprehension-failure proxy).`,
      })
    }
  }

  // --- Threshold F: late-declaration ratio per round ---
  for (const f of eventsOfType(events, "F")) {
    const total = f.during + f.atReconciliation
    if (total > 0 && f.during / total < THRESHOLDS.fDeclaredDuringMin) {
      findings.push({
        severity: "threshold",
        code: "F-LATE",
        message:
          `round ${f.round}: ${f.during} deviation(s) declared during execution × ${f.atReconciliation} discovered at reconciliation ` +
          `(${Math.round((100 * f.during) / total)}% during — target ≥80%, floor 50%). ` +
          `Late declaration: the execution touchpoint (J5 Stage 2) is failing.`,
      })
    }
  }

  // --- E parity inputs (aggregate computed at report level) + broken links ---
  const eEvents = eventsOfType(events, "E")
  let created = 0
  for (const e of eEvents) {
    if (e.demand === "pending") continue
    if (demandsExist.get(e.demand) === false) {
      findings.push({
        severity: "gap",
        code: "E-LINK",
        message: `Event E points to demand created #${e.demand}, but the issue does not exist — refusal registered, demand lost.`,
      })
    } else if (demandsExist.get(e.demand) === true) {
      created++
    }
  }

  return {
    number: issue.number,
    title: issue.title,
    variant: labels.variant,
    findings,
    eStats: { refusals: eEvents.length, created },
  }
}

/** Aggregates epic audits into the report (E parity is cross-epic). Pure. */
export function buildReport(audits: EpicAudit[]): ReportResult {
  const global: Finding[] = []

  const refusals = audits.reduce((n, a) => n + a.eStats.refusals, 0)
  const created = audits.reduce((n, a) => n + a.eStats.created, 0)
  if (refusals > 0) {
    const divergence = (refusals - created) / refusals
    if (divergence > THRESHOLDS.eDivergenceMax) {
      global.push({
        severity: "threshold",
        code: "E-DIVERGENCE",
        message:
          `E parity broken: ${refusals} J8 refusal(s) × ${created} demand(s) created ` +
          `(divergence ${Math.round(divergence * 100)}% > ${THRESHOLDS.eDivergenceMax * 100}%). ` +
          `Suspected silent bypass — audit task diffs against original scope.`,
      })
    }
  }

  const all = [...audits.flatMap((a) => a.findings), ...global]
  const summary = {
    epics: audits.length,
    gaps: all.filter((f) => f.severity === "gap").length,
    thresholds: all.filter((f) => f.severity === "threshold").length,
    signals: all.filter((f) => f.severity === "signal").length,
  }
  return { epics: audits, global, summary, exitCode: summary.gaps + summary.thresholds > 0 ? 1 : 0 }
}

const SEVERITY_MARK: Record<Severity, string> = { gap: "✗ GAP", threshold: "✗ THRESHOLD", signal: "○ signal" }

/** Renders the report. Pure. */
export function renderReport(result: ReportResult, platform: string): string {
  const lines: string[] = [
    `maestra-report — A–F instrumentation audit (${platform})`,
    `Provisional signal reader (G-15): instrumentation without a defined reader is decorative.`,
    "",
  ]

  if (result.epics.length === 0) {
    lines.push("No epic with a variant label found — nothing to audit.", "")
  }

  for (const epic of result.epics) {
    lines.push(`EPIC #${epic.number} — ${epic.variant ?? "no variant"} — "${epic.title}"`)
    if (epic.findings.length === 0) {
      lines.push("  ✓ no gaps")
    }
    for (const f of epic.findings) {
      lines.push(`  ${SEVERITY_MARK[f.severity]} [${f.code}] ${f.message}`)
    }
    lines.push("")
  }

  for (const f of result.global) {
    lines.push(`${SEVERITY_MARK[f.severity]} [${f.code}] ${f.message}`)
  }
  if (result.global.length > 0) lines.push("")

  const { epics, gaps, thresholds, signals } = result.summary
  lines.push(`SUMMARY: ${epics} epic(s) audited · ${gaps} gap(s) · ${thresholds} threshold(s) · ${signals} signal(s)`)
  lines.push(
    result.exitCode === 0
      ? "Result: OK — instrumentation intact."
      : "Result: FAILED — presence-gaps/thresholds exceeded. Review before the next dogfood.",
  )
  return lines.join("\n")
}
