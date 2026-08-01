import { describe, expect, it } from "vitest"
import { buildAgentMarkdown, buildDirectAgentMarkdown } from "./maestra-agent.js"

const CTX = { instructionsDir: "/home/user/.config/opencode/maestra/instructions" }

describe("buildAgentMarkdown (standard facilitator)", () => {
  it("OpenCode: primary mode, references standard kernel", () => {
    const md = buildAgentMarkdown("opencode", CTX)

    expect(md).toContain("mode: primary")
    expect(md).toContain("maestra-kernel.md")
    expect(md).toContain("`task` tool")
  })

  it("Mimo: primary mode, actor dialect", () => {
    const md = buildAgentMarkdown("mimocode", CTX)

    expect(md).toContain("mode: primary")
    expect(md).toContain("`actor` tool")
  })
})

describe("buildDirectAgentMarkdown (direct mode — modo direto)", () => {
  it("OpenCode: mode primary, description mentions direct mode", () => {
    const md = buildDirectAgentMarkdown("opencode", CTX)

    expect(md).toContain("mode: primary")
    const descLine = md.split("\n").find((l) => l.startsWith("description:"))!
    expect(descLine.toLowerCase()).toContain("direct")
  })

  it("references maestra-direct-kernel.md", () => {
    const md = buildDirectAgentMarkdown("opencode", CTX)

    expect(md).toContain("maestra-direct-kernel.md")
  })

  it("does NOT reference the standard kernel", () => {
    const md = buildDirectAgentMarkdown("opencode", CTX)

    expect(md).not.toContain("maestra-kernel.md")
  })

  it("explains single-session Minimal flow", () => {
    const md = buildDirectAgentMarkdown("opencode", CTX)

    expect(md).toContain("single session")
  })

  it("OpenCode: task dialect present", () => {
    const md = buildDirectAgentMarkdown("opencode", CTX)

    expect(md).toContain("`task` tool")
  })

  it("Mimo: mode primary, description mentions direct mode", () => {
    const md = buildDirectAgentMarkdown("mimocode", CTX)

    expect(md).toContain("mode: primary")
    const descLine = md.split("\n").find((l) => l.startsWith("description:"))!
    expect(descLine.toLowerCase()).toContain("direct")
  })

  it("Mimo: actor dialect present", () => {
    const md = buildDirectAgentMarkdown("mimocode", CTX)

    expect(md).toContain("`actor` tool")
  })
})
