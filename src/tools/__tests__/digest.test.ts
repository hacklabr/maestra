import { mkdtempSync, readFileSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { maestraIssueDigestTool } from "../digest.js"
import { setExec } from "../../platform/runtime.js"
import { defaultExec } from "../../platform/exec.js"
import { makeExecStub } from "../../platform/__tests__/helpers.js"

const FIXTURES = join(__dirname, "fixtures")
const readFixture = (platform: string, name: string) =>
  JSON.parse(readFileSync(join(FIXTURES, platform, name), "utf-8"))

async function makeRepo(platform: "github" | "gitlab"): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), `maestra-digest-${platform}-`))
  await mkdir(join(dir, ".maestra"), { recursive: true })
  await mkdir(join(dir, "docs", "referencia"), { recursive: true })
  // Only prd.md exists — the declared mini-briefing.md is intentionally missing (G-05)
  await writeFile(join(dir, "docs", "referencia", "prd.md"), "# PRD vivo\n")
  await writeFile(
    join(dir, ".maestra", "config.md"),
    `- plataforma: ${platform}\n- host: ${platform === "github" ? "github.com" : "gitlab.com"}\n- projeto: ${platform === "github" ? "acme/loja" : "grupo/loja"}\n`,
  )
  return dir
}

const ctx = (directory: string) => ({ sessionID: "test", directory }) as never

afterEach(() => setExec(defaultExec))

describe("maestra_issue_digest — golden: GitHub", () => {
  it("produces the exact golden digest from API fixtures", async () => {
    const dir = await makeRepo("github")
    const { exec } = makeExecStub([
      [/repos\/acme\/loja\/issues\/42\/sub_issues/, { stdout: readFileSync(join(FIXTURES, "github", "api-subissues.json"), "utf-8") }],
      [/repos\/acme\/loja\/issues\/42\/comments/, { stdout: readFileSync(join(FIXTURES, "github", "api-comments.json"), "utf-8") }],
      [/repos\/acme\/loja\/issues\/42\/parent/, { stderr: "gh: Not Found (HTTP 404)", code: 1 }],
      [/repos\/acme\/loja\/issues\/43$/, { stdout: readFileSync(join(FIXTURES, "github", "api-issue-43.json"), "utf-8") }],
      [/repos\/acme\/loja\/issues\/44$/, { stdout: readFileSync(join(FIXTURES, "github", "api-issue-44.json"), "utf-8") }],
      [/repos\/acme\/loja\/issues\/42$/, { stdout: readFileSync(join(FIXTURES, "github", "api-issue.json"), "utf-8") }],
      [/graphql/, { stdout: readFileSync(join(FIXTURES, "github", "api-graphql-board.json"), "utf-8") }],
    ])
    setExec(exec)

    const result = await maestraIssueDigestTool.execute({ issue: 42 }, ctx(dir))
    const digest = JSON.parse((result as { output: string }).output)
    const golden = readFixture("github", "digest.golden.json")
    expect(digest).toEqual(golden)
  })
})

describe("maestra_issue_digest — golden: GitLab", () => {
  it("produces the exact golden digest from API fixtures (links+tasklist, P1 parent, system notes out)", async () => {
    const dir = await makeRepo("gitlab")
    const { exec } = makeExecStub([
      [/issues\/42\/links/, { stdout: readFileSync(join(FIXTURES, "gitlab", "api-links.json"), "utf-8") }],
      [/issues\/42\/notes/, { stdout: readFileSync(join(FIXTURES, "gitlab", "api-notes.json"), "utf-8") }],
      [/issues\/43$/, { stdout: readFileSync(join(FIXTURES, "gitlab", "api-issue-43.json"), "utf-8") }],
      [/issues\/42$/, { stdout: readFileSync(join(FIXTURES, "gitlab", "api-issue.json"), "utf-8") }],
    ])
    setExec(exec)

    const result = await maestraIssueDigestTool.execute({ issue: 42 }, ctx(dir))
    const digest = JSON.parse((result as { output: string }).output)
    const golden = readFixture("gitlab", "digest.golden.json")
    expect(digest).toEqual(golden)
  })
})

describe("maestra_issue_digest — degradation", () => {
  it("returns an actionable error when the platform is not detected", async () => {
    const dir = mkdtempSync(join(tmpdir(), "maestra-digest-noplatform-"))
    const { exec } = makeExecStub([[/remote get-url origin/, { stderr: "no remote", code: 128 }]])
    setExec(exec)

    const result = await maestraIssueDigestTool.execute({ issue: 1 }, ctx(dir))
    expect(String(result)).toContain("platform not detected")
    expect(String(result)).toContain(".maestra/config.md")
  })

  it("degrades per-primitive: board failure becomes null column + entry in erros[]", async () => {
    const dir = await makeRepo("github")
    const { exec } = makeExecStub([
      [/repos\/acme\/loja\/issues\/42\/sub_issues/, { stdout: readFileSync(join(FIXTURES, "github", "api-subissues.json"), "utf-8") }],
      [/repos\/acme\/loja\/issues\/42\/comments/, { stdout: readFileSync(join(FIXTURES, "github", "api-comments.json"), "utf-8") }],
      [/repos\/acme\/loja\/issues\/42\/parent/, { stderr: "gh: Not Found (HTTP 404)", code: 1 }],
      [/repos\/acme\/loja\/issues\/43$/, { stdout: readFileSync(join(FIXTURES, "github", "api-issue-43.json"), "utf-8") }],
      [/repos\/acme\/loja\/issues\/44$/, { stdout: readFileSync(join(FIXTURES, "github", "api-issue-44.json"), "utf-8") }],
      [/repos\/acme\/loja\/issues\/42$/, { stdout: readFileSync(join(FIXTURES, "github", "api-issue.json"), "utf-8") }],
      [/graphql/, { stderr: "gh: insufficient scopes", code: 1 }],
    ])
    setExec(exec)

    const result = await maestraIssueDigestTool.execute({ issue: 42 }, ctx(dir))
    const digest = JSON.parse((result as { output: string }).output)
    expect(digest.board.coluna).toBeNull()
    expect(digest.erros).toEqual([
      expect.objectContaining({ primitiva: "getBoardColumn" }),
    ])
    // the rest of the digest is intact
    expect(digest.filhos).toHaveLength(4)
    expect(digest.gate.reconciliacao.numero).toBe(46)
  })
})
