/**
 * Catalog persona (adapted from Mesa's catalog/types.ts).
 * Persona = markdown file <division>/<division>-<role>.md with YAML-ish
 * frontmatter (id, name, description, emoji, color, vibe) + systemPrompt body.
 */
export interface Persona {
  /** Explicit frontmatter `id` when present; filename (without .md) otherwise. */
  id: string
  division: string
  name: string
  description: string
  emoji: string
  color: string
  vibe: string
  tools: string[]
  systemPrompt: string
}

export interface CatalogSummary {
  totalPersonas: number
  divisions: string[]
  personasPerDivision: Record<string, number>
}
