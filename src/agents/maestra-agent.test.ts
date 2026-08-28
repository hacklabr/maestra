import { describe, expect, it } from "vitest"
import { buildAgentMarkdown, buildDirectAgentMarkdown, buildIssueWriterAgentMarkdown } from "./maestra-agent.js"

/** R17: every bootstrap loads instruction files via the plugin tool. */
const TOOL = "maestra_read_instructions"

describe("buildAgentMarkdown (lean bootstrap scaffold, post-F027)", () => {
  it("points to the full kernel and does NOT duplicate the entry router", () => {
    const md = buildAgentMarkdown("opencode")

    // Points to the full kernel — via the plugin tool, relative path (R17).
    expect(md).toContain(TOOL)
    expect(md).toContain('maestra_read_instructions({path: "kernel/maestra-kernel.md"})')

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
    const md = buildAgentMarkdown("opencode")

    expect(md).toContain("entry gate")
    expect(md).toContain("entry router")
    expect(md).toContain("single source")
  })

  it("loads the kernel and journeys via maestra_read_instructions — no host-read pointers (R17)", () => {
    const md = buildAgentMarkdown("opencode")

    expect(md).toContain('maestra_read_instructions({path: "journeys/j1-triage.md"})')
    // No absolute config-dir instruction paths and no out-of-workspace read grant.
    expect(md).not.toContain("external_directory")
    expect(md).not.toContain(".config")
    expect(md).not.toContain("maestra/instructions")
    expect(md).not.toMatch(/^\s*[-*]?\s*read\s+\S+/m)
  })

  it("OpenCode: renders the `task` host dialect", () => {
    const md = buildAgentMarkdown("opencode")
    expect(md).toContain("task")
    expect(md).toContain("## Host dialect")
  })

  it("Mimo: renders the `actor` host dialect", () => {
    const md = buildAgentMarkdown("mimocode")
    expect(md).toContain("actor")
    expect(md).toContain("## Host dialect")
  })
})

describe("buildDirectAgentMarkdown (direct mode — modo direto)", () => {
  it("OpenCode: mode primary, description mentions direct mode", () => {
    const md = buildDirectAgentMarkdown("opencode")

    expect(md).toContain("mode: primary")
    const descLine = md.split("\n").find((l) => l.startsWith("description:"))!
    expect(descLine.toLowerCase()).toContain("direct")
  })

  it("references maestra-direct-kernel.md", () => {
    const md = buildDirectAgentMarkdown("opencode")

    expect(md).toContain("maestra-direct-kernel.md")
  })

  it("does NOT reference the standard kernel", () => {
    const md = buildDirectAgentMarkdown("opencode")

    expect(md).not.toContain("maestra-kernel.md")
  })

  it("explains single-session Minimal flow", () => {
    const md = buildDirectAgentMarkdown("opencode")

    expect(md).toContain("single session")
  })

  it("routes entry points via maestra_read_instructions (R17) — no host-read pointers", () => {
    const md = buildDirectAgentMarkdown("opencode")

    expect(md).toContain('maestra_read_instructions({path: "kernel/maestra-direct-kernel.md"})')
    expect(md).toContain('maestra_read_instructions({path: "journeys/j1-triage.md"})')
    expect(md).toContain('maestra_read_instructions({path: "journeys/j2-resume.md"})')
    expect(md).not.toContain("external_directory")
    expect(md).not.toContain(".config")
    expect(md).not.toContain("maestra/instructions")
    expect(md).not.toMatch(/→\s*read\s+/)
  })

  it("OpenCode: task dialect present", () => {
    const md = buildDirectAgentMarkdown("opencode")

    expect(md).toContain("`task` tool")
  })

  it("Mimo: mode primary, description mentions direct mode", () => {
    const md = buildDirectAgentMarkdown("mimocode")

    expect(md).toContain("mode: primary")
    const descLine = md.split("\n").find((l) => l.startsWith("description:"))!
    expect(descLine.toLowerCase()).toContain("direct")
  })

  it("Mimo: actor dialect present", () => {
    const md = buildDirectAgentMarkdown("mimocode")

    expect(md).toContain("`actor` tool")
  })
})

describe("buildIssueWriterAgentMarkdown (quick capture — stage-0)", () => {
  it("OpenCode: mode primary, description is the quick-capture contract", () => {
    const md = buildIssueWriterAgentMarkdown("opencode")

    expect(md).toContain("mode: primary")
    const descLine = md.split("\n").find((l) => l.startsWith("description:"))!
    expect(descLine).toContain("Quick issue capture (stage-0) without traversing the kernel")
  })

  it("references issue-writer-kernel.md via the plugin tool (R17)", () => {
    const md = buildIssueWriterAgentMarkdown("opencode")

    expect(md).toContain('maestra_read_instructions({path: "kernel/issue-writer-kernel.md"})')
  })

  it("does NOT reference the standard or direct kernels", () => {
    const md = buildIssueWriterAgentMarkdown("opencode")

    expect(md).not.toContain("maestra-kernel.md")
    expect(md).not.toContain("maestra-direct-kernel.md")
  })

  it("routes every message to j11-quick-capture.md via the tool — no entry-router duplication (F027 + R17)", () => {
    const md = buildIssueWriterAgentMarkdown("opencode")

    expect(md).toContain('maestra_read_instructions({path: "journeys/j11-quick-capture.md"})')
    expect(md).not.toContain("j1-triage.md")
    expect(md).not.toContain("j2-resume.md")
  })

  it("states the capture-only NEVER list (no triage, no variant, no events)", () => {
    const md = buildIssueWriterAgentMarkdown("opencode")

    expect(md).toContain("stage-0")
    expect(md).toContain("NEVER triage")
    expect(md).toContain("confirmation gate")
  })

  it("NO external_directory grant — the tool replaces out-of-workspace reads (R17)", () => {
    const md = buildIssueWriterAgentMarkdown("opencode")

    expect(md).not.toContain("external_directory")
    expect(md).not.toContain(".config")
    expect(md).not.toContain("maestra/instructions")
    expect(md).not.toContain('": allow')
  })

  it("OpenCode: task dialect present", () => {
    const md = buildIssueWriterAgentMarkdown("opencode")

    expect(md).toContain("`task` tool")
  })

  it("Mimo: mode primary, actor dialect present", () => {
    const md = buildIssueWriterAgentMarkdown("mimocode")

    expect(md).toContain("mode: primary")
    expect(md).toContain("`actor` tool")
  })

  it("OpenCode: question dialect present — clickable `question` tool (R07)", () => {
    const md = buildIssueWriterAgentMarkdown("opencode")

    expect(md).toContain("## Host question tool")
    expect(md).toContain("`question` tool")
    expect(md).toContain("J11 Stage 1")
  })

  it("Mimo: question dialect present — clickable `question` tool (R07)", () => {
    const md = buildIssueWriterAgentMarkdown("mimocode")

    expect(md).toContain("## Host question tool")
    expect(md).toContain("`question` tool")
  })

  it("states the curated-capture doctrine (author's intent, curated text — R07)", () => {
    const md = buildIssueWriterAgentMarkdown("opencode")

    expect(md).toContain("curated")
    expect(md).toContain("author's intent")
    expect(md).not.toContain("author's words")
  })

  it("question dialect is baked ONLY into the issue-writer markdown", () => {
    expect(buildAgentMarkdown("opencode")).not.toContain("## Host question tool")
    expect(buildDirectAgentMarkdown("opencode")).not.toContain("## Host question tool")
  })

  it("links the DIALECT subagent tool to J11 delegation (R08 enrichment + R09 publish)", () => {
    const oc = buildIssueWriterAgentMarkdown("opencode")
    const mimo = buildIssueWriterAgentMarkdown("mimocode")

    for (const md of [oc, mimo]) {
      expect(md).toContain("Stage 1 enrichment")
      expect(md).toContain("generic research subagent")
      expect(md).toContain("Stage 3 publish")
      expect(md).toContain("generic operations subagent")
      expect(md).toContain("post-confirmation only")
      expect(md).toContain("never the discussion-panel shell")
    }
  })

  it("delegation line is baked ONLY into the issue-writer markdown (R08/R09)", () => {
    expect(buildAgentMarkdown("opencode")).not.toContain("J11 delegation")
    expect(buildDirectAgentMarkdown("opencode")).not.toContain("J11 delegation")
    expect(buildAgentMarkdown("opencode")).not.toContain("Stage 3 publish")
    expect(buildDirectAgentMarkdown("opencode")).not.toContain("Stage 3 publish")
  })
})
