import { mkdtempSync, readFileSync, existsSync } from "node:fs"
import { writeFile, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { detectForge, parseRemoteHost, parseRemoteProject, probeHost } from "../detect.js"
import { readFluxoConfig, writeFluxoConfig } from "../config.js"
import { makeExecStub } from "./helpers.js"

function tmpDir(): string {
  return mkdtempSync(join(tmpdir(), "maestra-detect-"))
}

describe("remote parsing", () => {
  it.each([
    ["git@github.com:acme/loja.git", "github.com", "acme/loja"],
    ["https://github.com/acme/loja.git", "github.com", "acme/loja"],
    ["git@gitlab.com:grupo/sub/loja.git", "gitlab.com", "grupo/sub/loja"],
    ["ssh://git@gitlab.acme.com/grupo/loja.git", "gitlab.acme.com", "grupo/loja"],
    ["https://gitlab.acme.com/grupo/loja", "gitlab.acme.com", "grupo/loja"],
  ])("parses %s", (url, host, project) => {
    expect(parseRemoteHost(url)).toBe(host)
    expect(parseRemoteProject(url)).toBe(project)
  })

  it("returns null for unparsable input", () => {
    expect(parseRemoteHost("not-a-url")).toBeNull()
    expect(parseRemoteProject("https://github.com")).toBeNull()
  })
})

describe("host probing", () => {
  it("detects GitLab via /api/v4/metadata (401 proves the instance is alive)", async () => {
    const fetchFn = async (url: string) => ({ status: url.includes("/api/v4/") ? 401 : 404 })
    expect(await probeHost(fetchFn, "gitlab.acme.com")).toBe("gitlab")
  })

  it("detects GHES via /api/v3/meta when GitLab probe fails", async () => {
    const fetchFn = async (url: string) => ({ status: url.includes("/api/v3/") ? 200 : 404 })
    expect(await probeHost(fetchFn, "github.acme.com")).toBe("github")
  })

  it("returns null when neither probe answers", async () => {
    const fetchFn = async () => ({ status: 404 })
    expect(await probeHost(fetchFn, "example.com")).toBeNull()
  })
})

describe(".maestra/config.md", () => {
  it("round-trips all keys", async () => {
    const dir = tmpDir()
    await writeFluxoConfig(dir, {
      plataforma: "gitlab",
      host: "gitlab.acme.com",
      projeto: "grupo/loja",
      board: "12",
    })
    expect(await readFluxoConfig(dir)).toEqual({
      plataforma: "gitlab",
      host: "gitlab.acme.com",
      projeto: "grupo/loja",
      board: "12",
    })
  })

  it("returns null when the file does not exist", async () => {
    expect(await readFluxoConfig(tmpDir())).toBeNull()
  })
})

describe("detectForge hierarchy", () => {
  it("explicit config wins and never touches git/network", async () => {
    const dir = tmpDir()
    await mkdir(join(dir, ".maestra"), { recursive: true })
    await writeFile(
      join(dir, ".maestra", "config.md"),
      "# Config\n\n- plataforma: gitlab\n- host: gitlab.acme.com\n- projeto: grupo/loja\n",
    )
    const { exec, calls } = makeExecStub([])
    const fetchFn = async () => {
      throw new Error("network must not be touched")
    }

    const forge = await detectForge(dir, { exec, fetchFn })
    expect(forge).toEqual({ kind: "gitlab", host: "gitlab.acme.com", project: "grupo/loja" })
    expect(calls).toHaveLength(0)
  })

  it("detects github.com from remote and persists to config.md", async () => {
    const dir = tmpDir()
    const { exec } = makeExecStub([[/git -C .* remote get-url origin/, { stdout: "git@github.com:acme/loja.git\n" }]])

    const forge = await detectForge(dir, { exec })
    expect(forge).toEqual({ kind: "github", host: "github.com", project: "acme/loja" })

    const persisted = readFileSync(join(dir, ".maestra", "config.md"), "utf-8")
    expect(persisted).toContain("- plataforma: github")
    expect(persisted).toContain("- projeto: acme/loja")
  })

  it("detects gitlab.com from an https remote with nested groups", async () => {
    const dir = tmpDir()
    const { exec } = makeExecStub([
      [/remote get-url origin/, { stdout: "https://gitlab.com/grupo/sub/loja.git\n" }],
    ])
    const forge = await detectForge(dir, { exec })
    expect(forge).toEqual({ kind: "gitlab", host: "gitlab.com", project: "grupo/sub/loja" })
  })

  it("probes unknown hosts once and persists the result", async () => {
    const dir = tmpDir()
    const { exec } = makeExecStub([
      [/remote get-url origin/, { stdout: "git@gitlab.acme.com:grupo/loja.git\n" }],
    ])
    const probed: string[] = []
    const fetchFn = async (url: string) => {
      probed.push(url)
      return { status: url.includes("/api/v4/") ? 401 : 404 }
    }

    const forge = await detectForge(dir, { exec, fetchFn })
    expect(forge).toEqual({ kind: "gitlab", host: "gitlab.acme.com", project: "grupo/loja" })
    expect(probed).toEqual(["https://gitlab.acme.com/api/v4/metadata"])
    expect(existsSync(join(dir, ".maestra", "config.md"))).toBe(true)
  })

  it("returns null without a remote and writes nothing", async () => {
    const dir = tmpDir()
    const { exec } = makeExecStub([[/remote get-url origin/, { stderr: "not a git repository", code: 128 }]])

    expect(await detectForge(dir, { exec })).toBeNull()
    expect(existsSync(join(dir, ".maestra", "config.md"))).toBe(false)
  })

  it("returns null when the unknown host answers neither probe", async () => {
    const dir = tmpDir()
    const { exec } = makeExecStub([[/remote get-url origin/, { stdout: "git@git.acme.com:grupo/loja.git\n" }]])
    const fetchFn = async () => ({ status: 404 })

    expect(await detectForge(dir, { exec, fetchFn })).toBeNull()
    expect(existsSync(join(dir, ".maestra", "config.md"))).toBe(false)
  })
})
