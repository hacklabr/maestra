import { describe, expect, it } from "vitest"
import { buildShellAgentMarkdown, SHELL_AGENT_FILENAME } from "./specialists.js"

describe("buildShellAgentMarkdown (design A: ONE shell subagent)", () => {
  it("OpenCode: non-hidden, subagent mode, task denied, 1-line description", () => {
    const md = buildShellAgentMarkdown("opencode")

    expect(md).toContain("mode: subagent")
    expect(md).not.toContain("hidden")
    expect(md).toContain("task:")
    expect(md).toContain('"*": deny')
    expect(md).not.toContain("actor:")
    const descLine = md.split("\n").find((l) => l.startsWith("description:"))!
    expect(descLine.split("\n")).toHaveLength(1)
    expect(descLine.length).toBeLessThan(120)
  })

  it("Mimo: actor denied instead of task (per-host dialect)", () => {
    const md = buildShellAgentMarkdown("mimocode")

    expect(md).toContain("actor:")
    expect(md).not.toContain("task:")
    expect(md).not.toContain("hidden")
  })

  it("base prompt declares persona-on-delegation contract", () => {
    const md = buildShellAgentMarkdown("opencode")

    expect(md).toContain("persona é definida integralmente pelo prompt de delegação")
    expect(md).toContain("declare seu nome de persona")
    expect(md).toContain("ask_peer")
  })

  it("generates exactly ONE shell file", () => {
    expect(SHELL_AGENT_FILENAME).toBe("especialista.md")
  })
})
