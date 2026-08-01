import { describe, expect, it } from "vitest"
import { buildAgentMarkdown } from "./maestra-agent.js"

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
