import { existsSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { readFluxoConfig, writeFluxoConfig } from "../config.js"
import { git, gitOk, initRepo, initRepoWithOrphanConfig, seedOrphanBranch } from "./git-repo.js"

describe("config.md on the orphan branch (byte-compatible parser, new address)", () => {
  it("round-trips all keys", async () => {
    const dir = await initRepo("maestra-config-rt-")
    const result = await writeFluxoConfig(dir, {
      platform: "gitlab",
      host: "gitlab.acme.com",
      project: "grupo/loja",
      board: "12",
    })
    expect(result.committed).toBe(true)
    expect(result.created).toBe(true)
    expect(await readFluxoConfig(dir)).toEqual({
      platform: "gitlab",
      host: "gitlab.acme.com",
      project: "grupo/loja",
      board: "12",
    })
  })

  it("returns null when the branch does not exist", async () => {
    const dir = await initRepo("maestra-config-null-")
    expect(await readFluxoConfig(dir)).toBeNull()
  })

  it("parses hand-written config content seeded directly on the branch", async () => {
    const dir = await initRepo("maestra-config-hand-")
    await seedOrphanBranch(dir, {
      "config.md": "# Config\n\n- platform: gitlab\n- host: gitlab.acme.com\n- project: grupo/loja\n- board: 7\njunk line that must be ignored\n",
    })
    expect(await readFluxoConfig(dir)).toEqual({
      platform: "gitlab",
      host: "gitlab.acme.com",
      project: "grupo/loja",
      board: "7",
    })
  })

  it("writes to the branch ROOT — no .maestra/ prefix inside the branch (RF-34)", async () => {
    const dir = await initRepo("maestra-config-root-")
    await writeFluxoConfig(dir, { platform: "github", host: "github.com", project: "acme/loja" })
    expect(await gitOk(dir, ["show", "__maestra_config__:.maestra/config.md"])).toBeNull()
    expect(await git(dir, ["show", "__maestra_config__:config.md"])).toContain("- platform: github")
  })

  it("never materializes .maestra/ in the host working tree (RF-34/RF-36)", async () => {
    const dir = await initRepo("maestra-config-tree-")
    await writeFluxoConfig(dir, { platform: "github", host: "github.com", project: "acme/loja" })
    expect(existsSync(`${dir}/.maestra`)).toBe(false)
    expect((await git(dir, ["rev-list", "--count", "main"])).trim()).toBe("1")
  })

  it("degrades (no throw) when the directory is not a git repository", async () => {
    const result = await writeFluxoConfig("/tmp/definitely-not-a-git-repo-maestra", {
      platform: "github",
      host: "github.com",
      project: "acme/loja",
    })
    expect(result.committed).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it("reads config seeded by the standard fixture helper", async () => {
    const dir = await initRepoWithOrphanConfig(
      { "config.md": "- platform: github\n- host: github.com\n- project: acme/loja\n" },
      "maestra-config-fixture-",
    )
    expect(await readFluxoConfig(dir)).toEqual({
      platform: "github",
      host: "github.com",
      project: "acme/loja",
    })
  })
})
