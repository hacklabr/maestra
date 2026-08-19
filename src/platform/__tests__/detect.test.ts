import { describe, expect, it } from "vitest"
import { detectForge, parseRemoteHost, parseRemoteProject, probeHost } from "../detect.js"
import { readFluxoConfig } from "../config.js"
import { readConfigFile } from "../config-store.js"
import { makeExecStub } from "./helpers.js"
import { initRepo, initRepoWithOrphanConfig } from "./git-repo.js"

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

describe("detectForge hierarchy", () => {
  it("explicit config on the orphan branch wins and never probes the remote or network", async () => {
    const dir = await initRepoWithOrphanConfig(
      { "config.md": "# Config\n\n- platform: gitlab\n- host: gitlab.acme.com\n- project: grupo/loja\n" },
      "maestra-detect-explicit-",
    )
    const { exec, calls } = makeExecStub([])
    const fetchFn = async () => {
      throw new Error("network must not be touched")
    }

    const forge = await detectForge(dir, { exec, fetchFn })
    expect(forge).toEqual({ kind: "gitlab", host: "gitlab.acme.com", project: "grupo/loja" })
    expect(calls).toHaveLength(0)
  })

  it("detects github.com from remote and persists to the orphan branch", async () => {
    const dir = await initRepo("maestra-detect-gh-")
    const { exec } = makeExecStub([[/git -C .* remote get-url origin/, { stdout: "git@github.com:acme/loja.git\n" }]])

    const forge = await detectForge(dir, { exec })
    expect(forge).toEqual({ kind: "github", host: "github.com", project: "acme/loja" })

    expect(await readFluxoConfig(dir)).toEqual({ platform: "github", host: "github.com", project: "acme/loja" })
  })

  it("detects gitlab.com from an https remote with nested groups", async () => {
    const dir = await initRepo("maestra-detect-gl-")
    const { exec } = makeExecStub([
      [/remote get-url origin/, { stdout: "https://gitlab.com/grupo/sub/loja.git\n" }],
    ])
    const forge = await detectForge(dir, { exec })
    expect(forge).toEqual({ kind: "gitlab", host: "gitlab.com", project: "grupo/sub/loja" })
  })

  it("probes unknown hosts once and persists the result on the branch", async () => {
    const dir = await initRepo("maestra-detect-probe-")
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
    expect(await readConfigFile(dir, "config.md")).toContain("- platform: gitlab")
  })

  it("reports push degradation through onWrite without throwing", async () => {
    const dir = await initRepo("maestra-detect-onwrite-")
    const { exec } = makeExecStub([[/remote get-url origin/, { stdout: "git@github.com:acme/loja.git\n" }]])

    const writes: unknown[] = []
    const forge = await detectForge(dir, { exec, onWrite: (r) => writes.push(r) })
    expect(forge).toEqual({ kind: "github", host: "github.com", project: "acme/loja" })
    expect(writes).toHaveLength(1)
    // repo has no remote: local commit ok, push degraded with a note
    const result = writes[0] as { committed: boolean; pushed: boolean; pushNote: { reason: string } }
    expect(result.committed).toBe(true)
    expect(result.pushed).toBe(false)
    expect(result.pushNote.reason).toBe("no-remote")
  })

  it("returns null without a remote and writes nothing", async () => {
    const dir = await initRepo("maestra-detect-noremote-")
    const { exec } = makeExecStub([[/remote get-url origin/, { stderr: "not a git repository", code: 128 }]])

    expect(await detectForge(dir, { exec })).toBeNull()
    expect(await readConfigFile(dir, "config.md")).toBeNull()
  })

  it("returns null when the unknown host answers neither probe", async () => {
    const dir = await initRepo("maestra-detect-noprobe-")
    const { exec } = makeExecStub([[/remote get-url origin/, { stdout: "git@git.acme.com:grupo/loja.git\n" }]])
    const fetchFn = async () => ({ status: 404 })

    expect(await detectForge(dir, { exec, fetchFn })).toBeNull()
    expect(await readConfigFile(dir, "config.md")).toBeNull()
  })
})
