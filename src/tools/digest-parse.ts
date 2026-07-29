/**
 * Pure parsers for the Fluxo conventions (P1, P3, events, artifacts).
 * FROZEN SCOPE (consensus): labels ∩ fluxo vocabulary, P1 metadata line,
 * P3/event/facilitador comments, tasklist, declared artifact paths.
 * New conventions are read raw — they do NOT enter here.
 * Golden-file tests are the enforcement of this scope.
 */

import { VARIANTE_LABELS } from "../platform/types.js"

const VARIANTES: ReadonlySet<string> = new Set(VARIANTE_LABELS)
const ETAPAS = new Set(["stage-1", "stage-2", "stage-3"])
const MARCADORES = new Set(["override-registered", "doc-bug", "product-feedback", "stage-0"])

export interface LabelFacts {
  variant: string | null
  stages: string[]
  markers: string[]
}

export function classifyLabels(labels: string[]): LabelFacts {
  return {
    variant: labels.find((l) => VARIANTES.has(l)) ?? null,
    stages: labels.filter((l) => ETAPAS.has(l)),
    markers: labels.filter((l) => MARCADORES.has(l)),
  }
}

export interface P1Metadata {
  variant: string | null
  currentStage: string | null
  epic: number | null
  round: string | null
  substate: string | null
}

const P1_FIELD = /\*\*([^:*]+):\*\*\s*([^·\n]+)/g

/**
 * Parses the P1 metadata line:
 *   **Variant:** X · **Current stage:** Y · **Epic:** #N · **Round:** Rnn · **Substate:** Z
 * Returns null when the issue has no metadata line (fact for the J2 B1 branch).
 */
export function parseMetadataLine(body: string): P1Metadata | null {
  const line = body.split("\n").find((l) => l.includes("**Variant:**"))
  if (!line) return null

  const fields = new Map<string, string>()
  for (const match of line.matchAll(P1_FIELD)) {
    fields.set(match[1].trim(), match[2].trim())
  }

  const epicMatch = fields.get("Epic")?.match(/#(\d+)/)
  return {
    variant: fields.get("Variant") ?? null,
    currentStage: fields.get("Current stage") ?? null,
    epic: epicMatch ? Number.parseInt(epicMatch[1], 10) : null,
    round: fields.get("Round") ?? null,
    substate: fields.get("Substate") ?? null,
  }
}

export type MarkedCommentKind = "override" | "event" | "facilitator"

/**
 * Classifies comments by our frozen markers:
 *  - override: P3 register (`**Override register**`)
 *  - event: instrumentation event (`**Event A–F**`)
 *  - facilitator: any other comment signed "— facilitator" (gate comments etc.)
 * Plain human comments return null (excluded from the digest).
 */
export function classifyComment(body: string): MarkedCommentKind | null {
  if (/^\*\*Override register\*\*/m.test(body)) return "override"
  if (/^\*\*Event [A-F]\*\*/m.test(body)) return "event"
  if (/— facilitator\s*$/m.test(body)) return "facilitator"
  return null
}

export interface TasklistItem {
  number: number
  checked: boolean
}

const TASK_ITEM = /^\s*[-*]\s*\[([ xX])\]\s*#(\d+)/gm

/** Parses the GitLab epic tasklist (ADR-011 roll-up mechanism). */
export function parseTasklist(body: string): TasklistItem[] {
  return [...body.matchAll(TASK_ITEM)].map((m) => ({
    number: Number.parseInt(m[2], 10),
    checked: m[1] !== " ",
  }))
}

const ARTIFACT_PATH = /docs\/(?:reference|rounds|decisions)\/[^\s)`*"']+?\.md/

/**
 * Extracts the declared delivery path from an artifact task body
 * (template 11.2 "Type and delivery location"). First match wins.
 */
export function extractDeclaredArtifactPath(body: string): string | null {
  const match = ARTIFACT_PATH.exec(body)
  return match ? match[0] : null
}
