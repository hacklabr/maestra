import type { CommentFacts } from "../platform/types.js"

/**
 * Pure parsers for instrumentation event comments (A–F) and P3 override
 * registers. The formats are a CONTRACT — the source of truth is
 * src/tools/emit-event.ts (buildEventBody). These regexes mirror it exactly;
 * a comment that carries an event/override marker but does not parse is
 * reported as DRIFT (format drift = silent data loss, spec D1).
 */

export type ParsedEvent =
  | { type: "A"; elicitation: number; derivable: number }
  | { type: "B"; correctionRounds: number }
  | { type: "C"; criterion: string }
  | { type: "D"; from: string; to: string; criterion: string }
  | { type: "E"; demand: number | "pending" }
  | { type: "F"; round: string; during: number; atReconciliation: number }
  | { type: "override" }

const EVENT_MARKER = /^\*\*(Event [A-F]|Override register)\*\*/m

const PARSERS: Array<{ type: ParsedEvent["type"]; re: RegExp; map: (m: RegExpMatchArray) => ParsedEvent }> = [
  {
    type: "A",
    re: /^\*\*Event A\*\* — triage: (\d+) elicitation questions; derivable questions asked: (\d+) — facilitator\s*$/m,
    map: (m) => ({ type: "A", elicitation: Number(m[1]), derivable: Number(m[2]) }),
  },
  {
    type: "B",
    re: /^\*\*Event B\*\* — understanding: (\d+) correction round\(s\) until confirmation — facilitator\s*$/m,
    map: (m) => ({ type: "B", correctionRounds: Number(m[1]) }),
  },
  {
    type: "C",
    re: /^\*\*Event C\*\* — "don't know" on criterion: (\S+) — facilitator\s*$/m,
    map: (m) => ({ type: "C", criterion: m[1] }),
  },
  {
    type: "D",
    re: /^\*\*Event D\*\* — override: (.+?) → (.+?); disputed criterion: "(.+?)" — facilitator\s*$/m,
    map: (m) => ({ type: "D", from: m[1], to: m[2], criterion: m[3] }),
  },
  {
    type: "E",
    re: /^\*\*Event E\*\* — J8 refusal \(new requirement\); demand created: (#\d+|pending) — facilitator\s*$/m,
    map: (m) => ({ type: "E", demand: m[1] === "pending" ? "pending" : Number(m[1].slice(1)) }),
  },
  {
    type: "F",
    re: /^\*\*Event F\*\* — round (\S+): deviations during=(\d+), at-reconciliation=(\d+) — facilitator\s*$/m,
    map: (m) => ({ type: "F", round: m[1], during: Number(m[2]), atReconciliation: Number(m[3]) }),
  },
]

function parseOne(body: string): ParsedEvent | null {
  for (const p of PARSERS) {
    const m = p.re.exec(body)
    if (m) return p.map(m)
  }
  if (/^\*\*Override register\*\* — facilitator\s*$/m.test(body)) return { type: "override" }
  return null
}

export interface ParsedComments {
  events: ParsedEvent[]
  /** First lines of marked comments that failed to parse (format drift). */
  drift: string[]
}

/** Parses all comments of one issue into typed events + drift findings. */
export function parseEventComments(comments: CommentFacts[]): ParsedComments {
  const events: ParsedEvent[] = []
  const drift: string[] = []
  for (const comment of comments) {
    if (!EVENT_MARKER.test(comment.body)) continue
    const parsed = parseOne(comment.body)
    if (parsed) {
      events.push(parsed)
    } else {
      drift.push(comment.body.split("\n")[0].slice(0, 120))
    }
  }
  return { events, drift }
}
