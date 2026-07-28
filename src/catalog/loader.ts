import { promises as fs } from "node:fs"
import { existsSync } from "node:fs"
import { join, basename } from "node:path"
import type { Persona, CatalogSummary } from "./types.js"

export type { Persona, CatalogSummary }

/** Dirs that are documentation/tooling, not personas (Mesa convention). */
const SKIP_DIRS = new Set(["examples", "scripts"])

function unquote(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

/**
 * Frontmatter parser for the agency-agents catalog format: single-line
 * `key: value` pairs between --- fences (values may be quoted; `tools` may be
 * a comma list). More robust than Mesa's naive split (blank values, quoted
 * strings, non key lines are skipped) — full YAML is deliberately out of
 * scope: the catalog is single-line key/value by convention.
 */
export function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { data: {}, body: raw }

  const data: Record<string, unknown> = {}
  for (const line of match[1].split("\n")) {
    const kv = /^(\w[\w-]*):\s*(.*)$/.exec(line)
    if (!kv) continue
    const [, key, rawValue] = kv
    const value = unquote(rawValue)
    if (key === "tools" && value.includes(",")) {
      data[key] = value.split(",").map((t) => t.trim()).filter(Boolean)
    } else {
      data[key] = value
    }
  }
  return { data, body: match[2].trim() }
}

export function parsePersonaFile(raw: string, filename: string, division: string): Persona {
  const { data, body } = parseFrontmatter(raw)
  const filenameId = basename(filename, ".md")

  return {
    id: typeof data.id === "string" && data.id.length > 0 ? data.id : filenameId,
    division,
    name: String(data.name ?? filenameId),
    description: String(data.description ?? ""),
    emoji: String(data.emoji ?? ""),
    color: String(data.color ?? ""),
    vibe: String(data.vibe ?? ""),
    tools: Array.isArray(data.tools) ? (data.tools as string[]) : [],
    systemPrompt: body,
  }
}

export async function loadCatalogFromDirectory(
  catalogRoot: string,
): Promise<{ personas: Persona[]; summary: CatalogSummary }> {
  const personas: Persona[] = []
  const divisions: string[] = []

  const entries = await fs.readdir(catalogRoot, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue

    const divisionDir = join(catalogRoot, entry.name)
    const mdFiles = (await fs.readdir(divisionDir)).filter((f) => f.endsWith(".md"))

    for (const mdFile of mdFiles) {
      try {
        const raw = await fs.readFile(join(divisionDir, mdFile), "utf-8")
        personas.push(parsePersonaFile(raw, mdFile, entry.name))
      } catch {
        // skip unreadable files
      }
    }

    if (mdFiles.length > 0) divisions.push(entry.name)
  }

  const personasPerDivision: Record<string, number> = {}
  for (const p of personas) {
    personasPerDivision[p.division] = (personasPerDivision[p.division] ?? 0) + 1
  }

  return {
    personas,
    summary: { totalPersonas: personas.length, divisions, personasPerDivision },
  }
}

/**
 * Single-persona lookup by id (e.g. "software-development-backend-architect").
 *
 * Catalog filenames are ALREADY division-prefixed and equal to the persona id
 * (<root>/<division>/<id>.md), but the id→division split is not derivable
 * from the id alone (divisions contain dashes: "quality-assurance") — so we
 * scan division dirs for the exact filename. One readdir per division, no
 * full catalog load (used per-spawn by the persona-expansion hook).
 */
export async function loadPersonaById(catalogRoot: string, id: string): Promise<Persona | null> {
  let entries
  try {
    entries = await fs.readdir(catalogRoot, { withFileTypes: true })
  } catch {
    return null
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue

    const filePath = join(catalogRoot, entry.name, `${id}.md`)
    if (!existsSync(filePath)) continue

    try {
      const raw = await fs.readFile(filePath, "utf-8")
      return parsePersonaFile(raw, `${id}.md`, entry.name)
    } catch {
      return null
    }
  }
  return null
}
