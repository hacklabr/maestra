import { describe, expect, it } from "vitest"
import { buildAgentMarkdown, buildDirectAgentMarkdown } from "./maestra-agent.js"

describe("buildAgentMarkdown (lean bootstrap scaffold, post-F027)", () => {
  const ctx = { instructionsDir: "/x" }

  it("points to the full kernel and does NOT duplicate the entry router", () => {
    const md = buildAgentMarkdown("opencode", ctx)

    // Points to the full kernel path.
    expect(md).toContain("/x/kernel/maestra-kernel.md")

    // Entry gate bootstrap references maestra_status.
    expect(md).toContain("maestra_status")

    // No stale entry-doors header or literal door strings (F027 anti-regression).
    expect(md).not.toContain("## Entry points")
    expect(md).not.toContain("Free text (new demand)")
    expect(md).not.toContain("Issue number")

    // Title is the clean bootstrap header (old "— placeholder, T8" suffix gone).
    expect(md).toContain("# Workflow Facilitator (kernel L0)")
    expect(md).not.toContain("placeholder, T8")
  })

  it("keeps the entry-gate bootstrap instruction referencing the single-source router", () => {
    const md = buildAgentMarkdown("opencode", ctx)

    expect(md).toContain("entry gate")
    expect(md).toContain("entry router")
    expect(md).toContain("single source")
  })

  it("OpenCode: renders the `task` host dialect", () => {
    const md = buildAgentMarkdown("opencode", ctx)
    expect(md).toContain("task")
    expect(md).toContain("## Host dialect")
  })

  it("Mimo: renders the `actor` host dialect", () => {
    const md = buildAgentMarkdown("mimocode", ctx)
    expect(md).toContain("actor")
    expect(md).toContain("## Host dialect")
  })
})

describe("buildDirectAgentMarkdown (direct mode — modo direto)", () => {
  const ctx = { instructionsDir: "/x" }

  it("OpenCode: mode primary, description mentions direct mode", () => {
    const md = buildDirectAgentMarkdown("opencode", ctx)

    expect(md).toContain("mode: primary")
    const descLine = md.split("\n").find((l) => l.startsWith("description:"))!
    expect(descLine.toLowerCase()).toContain("direct")
  })

  it("references maestra-direct-kernel.md", () => {
    const md = buildDirectAgentMarkdown("opencode", ctx)

    expect(md).toContain("maestra-direct-kernel.md")
  })

  it("does NOT reference the standard kernel", () => {
    const md = buildDirectAgentMarkdown("opencode", ctx)

    expect(md).not.toContain("maestra-kernel.md")
  })

  it("explains single-session Minimal flow", () => {
    const md = buildDirectAgentMarkdown("opencode", ctx)

    expect(md).toContain("single session")
  })

  it("OpenCode: task dialect present", () => {
    const md = buildDirectAgentMarkdown("opencode", ctx)

    expect(md).toContain("`task` tool")
  })

  it("Mimo: mode primary, description mentions direct mode", () => {
    const md = buildDirectAgentMarkdown("mimocode", ctx)

    expect(md).toContain("mode: primary")
    const descLine = md.split("\n").find((l) => l.startsWith("description:"))!
    expect(descLine.toLowerCase()).toContain("direct")
  })

  it("Mimo: actor dialect present", () => {
    const md = buildDirectAgentMarkdown("mimocode", ctx)

    expect(md).toContain("`actor` tool")
  })
})
