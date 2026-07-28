import type { CommentFacts } from "../platform/types.js"

/**
 * Pure parsers for instrumentation event comments (A–F) and P3 override
 * registers. The formats are a CONTRACT — the source of truth is
 * src/tools/emit-event.ts (buildEventBody). These regexes mirror it exactly;
 * a comment that carries an event/override marker but does not parse is
 * reported as DRIFT (format drift = silent data loss, spec D1).
 */

export type ParsedEvent =
  | { type: "A"; elicitacao: number; derivaveis: number }
  | { type: "B"; rodadas: number }
  | { type: "C"; criterio: string }
  | { type: "D"; de: string; para: string; criterio: string }
  | { type: "E"; demanda: number | "pendente" }
  | { type: "F"; rodada: string; durante: number; naReconciliacao: number }
  | { type: "override" }

const EVENT_MARKER = /^\*\*(Evento [A-F]|Registro de override)\*\*/m

const PARSERS: Array<{ type: ParsedEvent["type"]; re: RegExp; map: (m: RegExpMatchArray) => ParsedEvent }> = [
  {
    type: "A",
    re: /^\*\*Evento A\*\* — triagem: (\d+) perguntas de elicitação; deriváveis perguntadas: (\d+) — facilitador\s*$/m,
    map: (m) => ({ type: "A", elicitacao: Number(m[1]), derivaveis: Number(m[2]) }),
  },
  {
    type: "B",
    re: /^\*\*Evento B\*\* — entendimento: (\d+) rodada\(s\) de correção até a confirmação — facilitador\s*$/m,
    map: (m) => ({ type: "B", rodadas: Number(m[1]) }),
  },
  {
    type: "C",
    re: /^\*\*Evento C\*\* — "não sei" no critério: (\S+) — facilitador\s*$/m,
    map: (m) => ({ type: "C", criterio: m[1] }),
  },
  {
    type: "D",
    re: /^\*\*Evento D\*\* — override: (.+?) → (.+?); critério contestado: "(.+?)" — facilitador\s*$/m,
    map: (m) => ({ type: "D", de: m[1], para: m[2], criterio: m[3] }),
  },
  {
    type: "E",
    re: /^\*\*Evento E\*\* — recusa J8 \(requisito novo\); demanda criada: (#\d+|pendente) — facilitador\s*$/m,
    map: (m) => ({ type: "E", demanda: m[1] === "pendente" ? "pendente" : Number(m[1].slice(1)) }),
  },
  {
    type: "F",
    re: /^\*\*Evento F\*\* — rodada (\S+): desvios durante=(\d+), na-reconciliação=(\d+) — facilitador\s*$/m,
    map: (m) => ({ type: "F", rodada: m[1], durante: Number(m[2]), naReconciliacao: Number(m[3]) }),
  },
]

function parseOne(body: string): ParsedEvent | null {
  for (const p of PARSERS) {
    const m = p.re.exec(body)
    if (m) return p.map(m)
  }
  if (/^\*\*Registro de override\*\* — facilitador\s*$/m.test(body)) return { type: "override" }
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
