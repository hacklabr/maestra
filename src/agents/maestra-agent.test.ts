import { describe, expect, it } from "vitest"
import { buildAgentMarkdown, buildDirectAgentMarkdown, buildIssueWriterAgentMarkdown } from "./maestra-agent.js"

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

describe("buildIssueWriterAgentMarkdown (quick capture — stage-0)", () => {
  const ctx = { instructionsDir: "/x" }

  it("OpenCode: mode primary, description is the quick-capture contract", () => {
    const md = buildIssueWriterAgentMarkdown("opencode", ctx)

    expect(md).toContain("mode: primary")
    const descLine = md.split("\n").find((l) => l.startsWith("description:"))!
    expect(descLine).toContain("Quick issue capture (stage-0) without traversing the kernel")
  })

  it("references issue-writer-kernel.md via instructionsDir", () => {
    const md = buildIssueWriterAgentMarkdown("opencode", ctx)

    expect(md).toContain("/x/kernel/issue-writer-kernel.md")
  })

  it("does NOT reference the standard or direct kernels", () => {
    const md = buildIssueWriterAgentMarkdown("opencode", ctx)

    expect(md).not.toContain("maestra-kernel.md")
    expect(md).not.toContain("maestra-direct-kernel.md")
  })

  it("routes every message to j11-quick-capture.md — no entry-router duplication (F027)", () => {
    const md = buildIssueWriterAgentMarkdown("opencode", ctx)

    expect(md).toContain("/x/journeys/j11-quick-capture.md")
    expect(md).not.toContain("j1-triage.md")
    expect(md).not.toContain("j2-resume.md")
  })

  it("states the capture-only NEVER list (no triage, no variant, no events)", () => {
    const md = buildIssueWriterAgentMarkdown("opencode", ctx)

    expect(md).toContain("stage-0")
    expect(md).toContain("NEVER triage")
    expect(md).toContain("confirmation gate")
  })

  it("grants external_directory permission on the instructions dir", () => {
    const md = buildIssueWriterAgentMarkdown("opencode", ctx)

    expect(md).toContain("external_directory")
    expect(md).toContain('"/x/**": allow')
  })

  it("OpenCode: task dialect present", () => {
    const md = buildIssueWriterAgentMarkdown("opencode", ctx)

    expect(md).toContain("`task` tool")
  })

  it("Mimo: mode primary, actor dialect present", () => {
    const md = buildIssueWriterAgentMarkdown("mimocode", ctx)

    expect(md).toContain("mode: primary")
    expect(md).toContain("`actor` tool")
  })
})
