/**
 * validateDesvios — shared pure validator for docs/rodadas/*\/desvios.md
 * (anti-bypass #14, spec D1/T6).
 *
 * ONE régua for #14, consumed by:
 *   - the write-validation hook (hooks/desvios.ts) — early warning at write time
 *   - the phase-2 reconciliation evidence pack — deterministic backstop
 * Sharing this function prevents the two from drifting into two rules.
 *
 * Validates the trinca factual per entry (planejado X → implementado Y →
 * motivo Z, template 11.4) plus the two link fields. "Nenhum desvio nesta
 * rodada" is a VALID file state (spec: desvios.md exists always — with
 * entries or with the explicit declaration).
 *
 * Forge-free (pure string parsing, no fs, no platform coupling).
 */

export type DesvioFinding = {
  /** Entry identifier: the "## Desvio N — título" heading text, or "__file__" for file-level findings. */
  entryId: string
  /** Stable content hash of the entry block (dedup key aid, not crypto). */
  hash: string
  /** Template fields missing/empty (PT-BR names, template 11.4). Empty when `note` is set. */
  missing: string[]
  /** Human-readable finding for file-level issues (replaces `missing`). */
  note?: string
}

export type DesviosValidation = {
  state: "valid" | "no-deviations" | "invalid"
  findings: DesvioFinding[]
}

/** File-level sentinel for findings that are not tied to one entry. */
export const FILE_LEVEL = "__file__"

const ENTRY_HEADING = /^##\s+(.+?)\s*$/gm
const NO_DEVIATIONS_DECLARATION = /nenhum desvio nesta rodada/i

/** Required fields per entry (template 11.4 + jornadas P3). */
const REQUIRED_FIELDS = [
  "Planejado",
  "Implementado",
  "Motivo",
  "Decisão registrada em",
  "Documento de referência atualizado",
] as const

/** Fields that must contain a link (jornadas P3: "entrada sem o link é rejeitada"). */
const LINK_FIELDS: ReadonlySet<string> = new Set([
  "Decisão registrada em",
  "Documento de referência atualizado",
])

/** Values that count as "not filled" even when syntactically present. */
const PLACEHOLDER_VALUES = new Set(["—", "-", "–", "tbd", "(vazio)", "n/a", "...", "…"])

/** djb2 — stable, dependency-free content hash for dedup (not cryptographic). */
export function hashEntry(content: string): string {
  let hash = 5381
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash + content.charCodeAt(i)) | 0
  }
  return (hash >>> 0).toString(36)
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Extracts a field's raw value from an entry block, or null if the field line is absent. */
function fieldRawValue(block: string, field: string): string | null {
  const re = new RegExp(`^\\s*-\\s*\\*\\*${escapeRegExp(field)}:?\\*\\*:?\\s*(.*)$`, "im")
  const match = re.exec(block)
  return match ? match[1] : null
}

/** Strips HTML comments (template placeholders) and whitespace. */
function cleanValue(raw: string): string {
  return raw.replace(/<!--[\s\S]*?-->/g, "").trim()
}

function isPlaceholder(value: string): boolean {
  return value === "" || PLACEHOLDER_VALUES.has(value.toLowerCase())
}

function hasLink(value: string): boolean {
  return /https?:\/\/|\/|\.md|#\d+/.test(value)
}

/**
 * Validates the full content of a desvios.md file.
 *
 * States:
 *  - "no-deviations": no entries and the explicit declaration present → VALID.
 *  - "valid": ≥1 entry, every entry complete (trinca + links).
 *  - "invalid": findings non-empty (entry-level, or file-level when the file
 *    has neither entries nor the declaration).
 */
export function validateDesvios(content: string): DesviosValidation {
  const headings = [...content.matchAll(ENTRY_HEADING)]

  if (headings.length === 0) {
    if (NO_DEVIATIONS_DECLARATION.test(content)) {
      return { state: "no-deviations", findings: [] }
    }
    return {
      state: "invalid",
      findings: [
        {
          entryId: FILE_LEVEL,
          hash: hashEntry(content),
          missing: [],
          note: `O arquivo não tem entradas de desvio nem a declaração "nenhum desvio nesta rodada".`,
        },
      ],
    }
  }

  const findings: DesvioFinding[] = []
  for (let i = 0; i < headings.length; i++) {
    const entryId = headings[i][1]
    const start = headings[i].index ?? 0
    const end = i + 1 < headings.length ? (headings[i + 1].index ?? content.length) : content.length
    const block = content.slice(start, end)

    const missing: string[] = []
    for (const field of REQUIRED_FIELDS) {
      const raw = fieldRawValue(block, field)
      if (raw === null) {
        missing.push(field)
        continue
      }
      const value = cleanValue(raw)
      if (isPlaceholder(value)) {
        missing.push(field)
      } else if (LINK_FIELDS.has(field) && !hasLink(value)) {
        missing.push(`${field} (link ausente)`)
      }
    }

    if (missing.length > 0) {
      findings.push({ entryId, hash: hashEntry(block), missing })
    }
  }

  return { state: findings.length > 0 ? "invalid" : "valid", findings }
}
