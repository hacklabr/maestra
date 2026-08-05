import { describe, expect, it } from "vitest"
import { buildOpsAgentMarkdown, OPS_AGENT_FILENAME } from "./ops.js"

describe("buildOpsAgentMarkdown (ops subagent — git + platform CLI mechanics)", () => {
  const ctx = { instructionsDir: "/x" }

  it("OpenCode: subagent mode, 1-line description, task nesting denied", () => {
    const md = buildOpsAgentMarkdown("opencode", ctx)

    expect(md).toContain("mode: subagent")
    expect(md).toContain("task:")
    expect(md).toContain('"*": deny')
    expect(md).not.toContain("actor:")
    const descLine = md.split("\n").find((l) => l.startsWith("description:"))!
    expect(descLine).toBe(
      "description: Executes git and issue-platform CLI mechanics on behalf of a primary session (distilled results only)",
    )
  })

  it("Mimo: actor nesting denied instead of task (per-host dialect)", () => {
    const md = buildOpsAgentMarkdown("mimocode", ctx)

    expect(md).toContain("mode: subagent")
    expect(md).toContain("actor:")
    expect(md).not.toContain("task:")
  })

  it("grants edit/write/bash and external_directory on the instructions dir", () => {
    const md = buildOpsAgentMarkdown("opencode", ctx)

    expect(md).toContain("edit: allow")
    expect(md).toContain("write: allow")
    expect(md).toContain("bash: allow")
    expect(md).toContain("external_directory:")
    expect(md).toContain('"/x/**": allow')
  })

  it("points to the ops kernel without restating it (lean bootstrap)", () => {
    for (const host of ["opencode", "mimocode"] as const) {
      const md = buildOpsAgentMarkdown(host, ctx)
      expect(md).toContain("Full kernel: /x/kernel/ops-kernel.md")
    }
  })

  it("points to the platform cookbooks — commands live ONLY there", () => {
    for (const host of ["opencode", "mimocode"] as const) {
      const md = buildOpsAgentMarkdown(host, ctx)
      expect(md).toContain("/x/reference/cookbook-github.md")
      expect(md).toContain("/x/reference/cookbook-gitlab.md")
      expect(md).toContain("names the operation, never the raw command")
    }
  })

  it("states the distilled-results contract and the NEVER list", () => {
    const md = buildOpsAgentMarkdown("opencode", ctx)

    expect(md).toContain("distilled results")
    expect(md).toContain("NEVER make flow decisions")
    expect(md).toContain("NEVER emit events")
  })

  it("generates exactly ONE ops file", () => {
    expect(OPS_AGENT_FILENAME).toBe("ops.md")
  })
})
