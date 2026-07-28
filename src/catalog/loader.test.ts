import { describe, expect, it } from "vitest"
import { join } from "node:path"
import { loadCatalogFromDirectory, parseFrontmatter, parsePersonaFile } from "./loader.js"
import { ROSTER } from "./roster.js"

const CATALOG_ROOT = join(__dirname, "agency-agents")

describe("parseFrontmatter", () => {
  it("parses single-line key/value with quoted values", () => {
    const raw = [
      "---",
      "id: software-development-cms-developer",
      "name: CMS Developer",
      'emoji: "🧱"',
      "description: Drupal and WordPress specialist for theme development",
      'color: "#3B82F6"',
      "---",
      "",
      "# Body",
    ].join("\n")
    const { data, body } = parseFrontmatter(raw)
    expect(data).toMatchObject({
      id: "software-development-cms-developer",
      name: "CMS Developer",
      emoji: "🧱",
      color: "#3B82F6",
    })
    expect(body).toBe("# Body")
  })

  it("returns the raw body when there is no frontmatter", () => {
    expect(parseFrontmatter("# Sem frontmatter").data).toEqual({})
  })
})

describe("parsePersonaFile", () => {
  it("prefers the explicit frontmatter id over the filename", () => {
    const persona = parsePersonaFile("---\nid: custom-id\nname: X\n---\nbody", "other-file.md", "design")
    expect(persona.id).toBe("custom-id")
  })

  it("falls back to the filename when id is absent", () => {
    const persona = parsePersonaFile("---\nname: X\n---\nbody", "design-ux-writer.md", "design")
    expect(persona.id).toBe("design-ux-writer")
    expect(persona.division).toBe("design")
  })
})

describe("loadCatalogFromDirectory (real vendored catalog)", () => {
  it("loads the full catalog with divisions and no docs/tooling dirs", async () => {
    const { personas, summary } = await loadCatalogFromDirectory(CATALOG_ROOT)

    expect(summary.totalPersonas).toBeGreaterThanOrEqual(360)
    expect(summary.divisions).toContain("software-development")
    expect(summary.divisions).toContain("design")
    expect(summary.divisions).toContain("product")
    expect(summary.divisions).toContain("quality-assurance")
    expect(summary.divisions).toContain("security")
    // docs/tooling dirs are not personas
    expect(summary.divisions).not.toContain("examples")
    expect(summary.divisions).not.toContain("scripts")
    expect(personas.every((p) => p.systemPrompt.length > 0)).toBe(true)
    // ~4 catalog files are docs (README/EXECUTIVE-BRIEF/QUICKSTART) without
    // frontmatter description — personas proper all have one
    expect(personas.filter((p) => p.description.length > 0).length).toBeGreaterThanOrEqual(360)
    expect(ROSTER.every((e) => personas.find((p) => p.id === e.id && p.description.length > 0))).toBe(true)
  })

  it("parses real roster personas with all fields", async () => {
    const { personas } = await loadCatalogFromDirectory(CATALOG_ROOT)
    const cms = personas.find((p) => p.id === "software-development-cms-developer")
    expect(cms).toBeDefined()
    expect(cms!.division).toBe("software-development")
    expect(cms!.description).toContain("WordPress")
    expect(cms!.emoji.length).toBeGreaterThan(0)
  })
})

describe("ROSTER ⊆ catalog (install-time contract, mirrored in tests)", () => {
  it("every curated id exists in the vendored catalog", async () => {
    const { personas } = await loadCatalogFromDirectory(CATALOG_ROOT)
    const ids = new Set(personas.map((p) => p.id))
    const missing = ROSTER.filter((e) => !ids.has(e.id)).map((e) => e.id)
    expect(missing).toEqual([])
  })

  it("roster has exactly 12 entries with one-line domains", () => {
    expect(ROSTER).toHaveLength(12)
    for (const entry of ROSTER) {
      expect(entry.domain.length).toBeGreaterThan(0)
      expect(entry.domain).not.toContain("\n")
    }
  })
})
