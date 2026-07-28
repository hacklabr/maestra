/**
 * Pure parsers for the Fluxo conventions (P1, P3, events, artifacts).
 * FROZEN SCOPE (consensus): labels ∩ fluxo vocabulary, P1 metadata line,
 * P3/event/facilitador comments, tasklist, declared artifact paths.
 * New conventions are read raw — they do NOT enter here.
 * Golden-file tests are the enforcement of this scope.
 */

import { VARIANTE_LABELS } from "../platform/types.js"

const VARIANTES: ReadonlySet<string> = new Set(VARIANTE_LABELS)
const ETAPAS = new Set(["etapa-1", "etapa-2", "etapa-3"])
const MARCADORES = new Set(["override-registrado", "bug-documentacao", "feedback-produto"])

export interface LabelFacts {
  variante: string | null
  etapas: string[]
  marcadores: string[]
}

export function classifyLabels(labels: string[]): LabelFacts {
  return {
    variante: labels.find((l) => VARIANTES.has(l)) ?? null,
    etapas: labels.filter((l) => ETAPAS.has(l)),
    marcadores: labels.filter((l) => MARCADORES.has(l)),
  }
}

export interface P1Metadata {
  variante: string | null
  etapaAtual: string | null
  epico: number | null
  rodada: string | null
  subestado: string | null
}

const P1_FIELD = /\*\*([^:*]+):\*\*\s*([^·\n]+)/g

/**
 * Parses the P1 metadata line:
 *   **Variante:** X · **Etapa atual:** Y · **Épico:** #N · **Rodada:** Rnn · **Subestado:** Z
 * Returns null when the issue has no metadata line (fact for the J2 B1 branch).
 */
export function parseMetadataLine(body: string): P1Metadata | null {
  const line = body.split("\n").find((l) => l.includes("**Variante:**"))
  if (!line) return null

  const fields = new Map<string, string>()
  for (const match of line.matchAll(P1_FIELD)) {
    fields.set(match[1].trim(), match[2].trim())
  }

  const epicoMatch = fields.get("Épico")?.match(/#(\d+)/)
  return {
    variante: fields.get("Variante") ?? null,
    etapaAtual: fields.get("Etapa atual") ?? null,
    epico: epicoMatch ? Number.parseInt(epicoMatch[1], 10) : null,
    rodada: fields.get("Rodada") ?? null,
    subestado: fields.get("Subestado") ?? null,
  }
}

export type MarkedCommentKind = "override" | "evento" | "facilitador"

/**
 * Classifies comments by our frozen markers:
 *  - override: P3 register (`**Registro de override**`)
 *  - evento: instrumentation event (`**Evento A–F**`)
 *  - facilitador: any other comment signed "— facilitador" (gate comments etc.)
 * Plain human comments return null (excluded from the digest).
 */
export function classifyComment(body: string): MarkedCommentKind | null {
  if (/^\*\*Registro de override\*\*/m.test(body)) return "override"
  if (/^\*\*Evento [A-F]\*\*/m.test(body)) return "evento"
  if (/— facilitador\s*$/m.test(body)) return "facilitador"
  return null
}

export interface TasklistItem {
  numero: number
  marcado: boolean
}

const TASK_ITEM = /^\s*[-*]\s*\[([ xX])\]\s*#(\d+)/gm

/** Parses the GitLab epic tasklist (ADR-011 roll-up mechanism). */
export function parseTasklist(body: string): TasklistItem[] {
  return [...body.matchAll(TASK_ITEM)].map((m) => ({
    numero: Number.parseInt(m[2], 10),
    marcado: m[1] !== " ",
  }))
}

const ARTIFACT_PATH = /docs\/(?:referencia|rodadas|decisoes)\/[^\s)`*"']+?\.md/

/**
 * Extracts the declared delivery path from an artifact task body
 * (template 11.2 "Tipo e local de entrega"). First match wins.
 */
export function extractDeclaredArtifactPath(body: string): string | null {
  const match = ARTIFACT_PATH.exec(body)
  return match ? match[0] : null
}
