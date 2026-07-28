import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { buildSpecialistMarkdown } from "./specialists.js"
import { ROSTER, ROSTER_SUBDIR } from "../catalog/roster.js"
import type { Persona } from "../catalog/types.js"

const PERSONA: Persona = {
  id: "security-security-engineer",
  division: "security",
  name: "Security Engineer",
  description: "AppSec specialist",
  emoji: "🔐",
  color: "#059669",
  vibe: "",
  tools: [],
  systemPrompt: "# Security Engineer\n\nYou are Security Engineer.",
}

const ENTRY = ROSTER.find((e) => e.id === "security-security-engineer")!

describe("buildSpecialistMarkdown", () => {
  it("OpenCode: non-hidden, subagent mode, task denied, roster 1-line description", () => {
    const md = buildSpecialistMarkdown("opencode", PERSONA, ENTRY)

    expect(md).toContain(`description: ${ENTRY.domain}`)
    expect(md).toContain("mode: subagent")
    expect(md).not.toContain("hidden")
    expect(md).toContain("task:")
    expect(md).toContain('"*": deny')
    expect(md).not.toContain("actor:")
    expect(md).toContain(PERSONA.systemPrompt)
    // description is exactly one line
    const descLine = md.split("\n").find((l) => l.startsWith("description:"))!
    expect(descLine.trim()).toBe(`description: ${ENTRY.domain}`)
  })

  it("Mimo: actor denied instead of task (per-host dialect)", () => {
    const md = buildSpecialistMarkdown("mimocode", PERSONA, ENTRY)

    expect(md).toContain("actor:")
    expect(md).not.toContain("task:")
    expect(md).not.toContain("hidden")
  })
})

describe("roster ↔ j9-mesa.md coherence", () => {
  it("every roster id appears in the jornada module the facilitator reads", () => {
    const j9 = readFileSync(join(__dirname, "..", "instructions", "jornadas", "j9-mesa.md"), "utf-8")
    const missing = ROSTER.filter((e) => !j9.includes(`\`${e.id}\``)).map((e) => e.id)
    expect(missing).toEqual([])
  })

  it("roster subdirectory namespacing is fluxo/ (Mesa pattern)", () => {
    expect(ROSTER_SUBDIR).toBe("fluxo")
  })
})
