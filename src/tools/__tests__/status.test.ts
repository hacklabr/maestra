import { mkdtempSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { fluxoStatusTool } from "../status.js"
import { defaultExec } from "../../platform/exec.js"
import { setExec, setFetch, setHostDetect, setMcpScan } from "../../platform/runtime.js"
import { makeExecStub } from "../../platform/__tests__/helpers.js"

const ctx = (directory: string) => ({ sessionID: "test", directory }) as never

afterEach(() => {
  setExec(defaultExec)
  setFetch(undefined)
  setHostDetect(() => ({ id: "unknown", evidence: [] }))
  setMcpScan(async () => ({ github: "not-found", gitlab: "not-found" }))
})

async function makeRepo(platform: "github" | "gitlab"): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), `fluxo-status-${platform}-`))
  await mkdir(join(dir, ".fluxo"), { recursive: true })
  await mkdir(join(dir, "docs", "referencia"), { recursive: true })
  await mkdir(join(dir, "docs", "rodadas"), { recursive: true })
  await writeFile(
    join(dir, ".fluxo", "config.md"),
    `- plataforma: ${platform}\n- host: ${platform === "github" ? "github.com" : "gitlab.com"}\n- projeto: ${platform === "github" ? "acme/loja" : "grupo/loja"}\n`,
  )
  return dir
}

function parse(result: unknown) {
  return JSON.parse((result as { output: string }).output)
}

describe("fluxo_status", () => {
  it("GitHub: full probe with gh authed, board read, reachability ok", async () => {
    const dir = await makeRepo("github")
    const { exec } = makeExecStub([
      [/^gh --version/, { stdout: "gh version 2.96.0 (2026-07-03)\n" }],
      [/^gh auth status/, { stdout: "github.com\n  ✓ Logged in" }],
      [/^glab --version/, { stderr: "command not found", code: 127 }],
      [/^gh project list --owner acme/, { stdout: "1\tFluxo\t…" }],
    ])
    setExec(exec)
    setFetch(async () => ({ status: 200 }))
    setHostDetect(() => ({ id: "opencode", evidence: ["dir /home/x/.config/opencode"] }))
    setMcpScan(async () => ({ github: "configured", gitlab: "not-found" }))

    const report = parse(await fluxoStatusTool.execute({}, ctx(dir)))

    expect(report.host.id).toBe("opencode")
    expect(report.plataforma).toEqual({ kind: "github", host: "github.com", projeto: "acme/loja" })
    expect(report.cli.gh).toEqual({ present: true, authenticated: true, version: "gh version 2.96.0 (2026-07-03)" })
    expect(report.cli.glab.present).toBe(false)
    expect(report.reachability).toEqual({ url: "https://api.github.com/meta", status: 200 })
    expect(report.mcp).toEqual({ github: "configured", gitlab: "not-found" })
    expect(report.board).toBe("read")
    expect(report.capabilities).toEqual({
      platform: "github",
      cli: true,
      mcp: true,
      board: "read",
      hierarchy: "sub-issues",
    })
    expect(report.repo).toEqual({ referenciaDocs: true, rodadas: true, teamMd: false, fluxoConfig: true })
    expect(report.notes.join(" ")).toContain("ESCRITA")
  })

  it("GitLab self-hosted: glab authed with --hostname, Developer → read-write board", async () => {
    const dir = mkdtempSync(join(tmpdir(), "fluxo-status-gls-"))
    await mkdir(join(dir, ".fluxo"), { recursive: true })
    await writeFile(
      join(dir, ".fluxo", "config.md"),
      "- plataforma: gitlab\n- host: gitlab.acme.com\n- projeto: grupo/loja\n",
    )
    const { exec, calls } = makeExecStub([
      [/^gh --version/, { stderr: "command not found", code: 127 }],
      [/^glab --version/, { stdout: "glab version 1.46.1\n" }],
      [/^glab auth status --hostname gitlab.acme.com/, { stdout: "gitlab.acme.com\n  ✓ Logged in" }],
      [/glab api --hostname gitlab.acme.com projects\//, { stdout: JSON.stringify({ permissions: { project_access: { access_level: 30 } } }) }],
    ])
    setExec(exec)
    setFetch(async (url) => ({ status: url.includes("/api/v4/version") ? 401 : 404 }))

    const report = parse(await fluxoStatusTool.execute({}, ctx(dir)))

    expect(report.plataforma).toEqual({ kind: "gitlab", host: "gitlab.acme.com", projeto: "grupo/loja" })
    expect(report.cli.glab).toEqual({ present: true, authenticated: true, version: "glab version 1.46.1" })
    expect(calls.some((c) => c.args.includes("--hostname") && c.args.includes("gitlab.acme.com"))).toBe(true)
    expect(report.reachability).toEqual({ url: "https://gitlab.acme.com/api/v4/version", status: 401 })
    expect(report.board).toBe("read-write")
    expect(report.capabilities.hierarchy).toBe("links+tasklist")
    expect(report.repo.referenciaDocs).toBe(false)
  })

  it("no platform detected: notes instruct the one-time question", async () => {
    const dir = mkdtempSync(join(tmpdir(), "fluxo-status-none-"))
    const { exec } = makeExecStub([
      [/remote get-url origin/, { stderr: "not a git repo", code: 128 }],
      [/^gh --version/, { stdout: "gh version 2.96.0\n" }],
      [/^gh auth status/, { stdout: "✓ Logged in" }],
      [/^glab --version/, { stderr: "command not found", code: 127 }],
    ])
    setExec(exec)

    const report = parse(await fluxoStatusTool.execute({}, ctx(dir)))
    expect(report.plataforma).toBeNull()
    expect(report.capabilities.platform).toBeNull()
    expect(report.capabilities.hierarchy).toBe("none")
    expect(report.capabilities.cli).toBe(false)
    expect(report.notes.join(" ")).toContain("pergunte UMA vez")
  })

  it("gh present but not authenticated → note + cli capability false", async () => {
    const dir = await makeRepo("github")
    const { exec } = makeExecStub([
      [/^gh --version/, { stdout: "gh version 2.96.0\n" }],
      [/^gh auth status/, { stderr: "You are not logged in", code: 1 }],
      [/^glab --version/, { stderr: "command not found", code: 127 }],
      [/^gh project list/, { stderr: "authentication required", code: 1 }],
    ])
    setExec(exec)

    const report = parse(await fluxoStatusTool.execute({}, ctx(dir)))
    expect(report.cli.gh.authenticated).toBe(false)
    expect(report.capabilities.cli).toBe(false)
    expect(report.notes.join(" ")).toContain("NÃO autenticado")
  })
})
