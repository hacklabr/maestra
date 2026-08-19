import { existsSync, mkdirSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  ORPHAN_BRANCH,
  hasConfigFile,
  hasLegacyDotMaestra,
  isGitRepo,
  readConfigFile,
  resolveConfigRef,
  writeConfigFiles,
} from "../config-store.js"
import { addRemote, git, gitOk, initBareRemote, initRepo, initRepoWithOrphanConfig } from "./git-repo.js"

const CONFIG = "# Fluxo Configuration\n\n- platform: github\n- host: github.com\n- project: acme/loja\n"

describe("config-store — read", () => {
  it("returns null when the branch is missing (never throws)", async () => {
    const dir = await initRepo("maestra-store-missing-")
    expect(await readConfigFile(dir, "config.md")).toBeNull()
    expect(await resolveConfigRef(dir)).toBeNull()
  })

  it("returns null when the file is missing on the branch", async () => {
    const dir = await initRepoWithOrphanConfig({ "config.md": CONFIG }, "maestra-store-nofile-")
    expect(await readConfigFile(dir, "team.md")).toBeNull()
    expect(await hasConfigFile(dir, "config.md")).toBe(true)
    expect(await hasConfigFile(dir, "team.md")).toBe(false)
  })

  it("reads files seeded at the branch root", async () => {
    const dir = await initRepoWithOrphanConfig({ "config.md": CONFIG }, "maestra-store-read-")
    expect(await readConfigFile(dir, "config.md")).toBe(CONFIG)
  })

  it("falls back to the origin remote-tracking ref when the local branch is absent", async () => {
    const dir = await initRepo("maestra-store-fallback-")
    const bare = await initBareRemote()
    await addRemote(dir, bare)
    await writeConfigFiles(dir, { "config.md": CONFIG }, "test: bootstrap")
    // push created refs/remotes/origin/__maestra_config__; drop the local ref
    await git(dir, ["update-ref", "-d", `refs/heads/${ORPHAN_BRANCH}`])

    const ref = await resolveConfigRef(dir)
    expect(ref?.source).toBe("remote")
    expect(await readConfigFile(dir, "config.md")).toBe(CONFIG)
  })
})

describe("config-store — write", () => {
  it("creates a TRUE orphan branch (no merge-base with main)", async () => {
    const dir = await initRepo("maestra-store-orphan-")
    const result = await writeConfigFiles(dir, { "config.md": CONFIG }, "test: bootstrap config")

    expect(result.committed).toBe(true)
    expect(result.created).toBe(true)
    expect(result.pushed).toBe(false) // no remote configured
    expect(result.pushNote?.reason).toBe("no-remote")

    // The orphan invariant: merge-base FAILS, branch has exactly one commit.
    expect(await gitOk(dir, ["merge-base", "main", ORPHAN_BRANCH])).toBeNull()
    expect((await git(dir, ["rev-list", "--count", ORPHAN_BRANCH])).trim()).toBe("1")
    expect(await git(dir, [`show`, `${ORPHAN_BRANCH}:config.md`])).toBe(CONFIG)
  })

  it("appends a second write with a parent (no new orphan root)", async () => {
    const dir = await initRepo("maestra-store-append-")
    await writeConfigFiles(dir, { "config.md": CONFIG }, "test: first")
    const second = await writeConfigFiles(dir, { "config.md": CONFIG + "- board: 7\n" }, "test: second")

    expect(second.created).toBe(false)
    expect((await git(dir, ["rev-list", "--count", ORPHAN_BRANCH])).trim()).toBe("2")
    const parent = (await git(dir, ["log", "--format=%P", "-1", ORPHAN_BRANCH])).trim()
    expect(parent).toMatch(/^[0-9a-f]{40}$/)
    expect(await readConfigFile(dir, "config.md")).toContain("- board: 7")
  })

  it("leaves the host working tree untouched (no .maestra/, no checkout)", async () => {
    const dir = await initRepo("maestra-store-tree-")
    await writeConfigFiles(dir, { "config.md": CONFIG, "team.md": "# Team\n" }, "test: write")
    expect(existsSync(`${dir}/.maestra`)).toBe(false)
    expect(existsSync(`${dir}/config.md`)).toBe(false)
    expect((await git(dir, ["status", "--porcelain"])).trim()).toBe("")
    // zero new commits on the project branch
    expect((await git(dir, ["rev-list", "--count", "main"])).trim()).toBe("1")
  })

  it("round-trips multiple files in one commit", async () => {
    const dir = await initRepo("maestra-store-multi-")
    const files = { "config.md": CONFIG, "team.md": "# Team\n", "labels.md": "# Labels\n" }
    await writeConfigFiles(dir, files, "test: three files")
    expect((await git(dir, ["rev-list", "--count", ORPHAN_BRANCH])).trim()).toBe("1")
    for (const [name, content] of Object.entries(files)) {
      expect(await readConfigFile(dir, name)).toBe(content)
    }
  })

  it("no-ops on an empty file map (no empty commit)", async () => {
    const dir = await initRepo("maestra-store-empty-")
    await writeConfigFiles(dir, { "config.md": CONFIG }, "test: first")
    const noOp = await writeConfigFiles(dir, {}, "test: nothing")
    expect(noOp.committed).toBe(false)
    expect((await git(dir, ["rev-list", "--count", ORPHAN_BRANCH])).trim()).toBe("1")
  })

  it("rejects file names that are not branch-root flat names", async () => {
    const dir = await initRepo("maestra-store-name-")
    await expect(
      writeConfigFiles(dir, { ".maestra/config.md": CONFIG }, "test: bad name"),
    ).rejects.toThrow(/invalid config file name/)
    await expect(writeConfigFiles(dir, { "a/b.md": "x" }, "test: bad name")).rejects.toThrow(
      /invalid config file name/,
    )
  })
})

describe("config-store — push", () => {
  it("pushes to a real local bare origin", async () => {
    const dir = await initRepo("maestra-store-push-")
    const bare = await initBareRemote()
    await addRemote(dir, bare)

    const result = await writeConfigFiles(dir, { "config.md": CONFIG }, "test: push me")

    expect(result.pushed).toBe(true)
    expect(result.pushNote).toBeNull()
    // the branch really is on the remote
    const onRemote = await gitOk(bare, ["rev-parse", "--verify", "--quiet", `refs/heads/${ORPHAN_BRANCH}`])
    expect(onRemote?.trim()).toBe(result.sha)
  })

  it("degrades with a note when the push target does not exist (no throw)", async () => {
    const dir = await initRepo("maestra-store-badremote-")
    await addRemote(dir, "/nonexistent/remote.git")

    const result = await writeConfigFiles(dir, { "config.md": CONFIG }, "test: push fail")

    expect(result.committed).toBe(true)
    expect(result.pushed).toBe(false)
    expect(result.pushNote?.reason).toBe("error")
    // the local commit survives the failed push
    expect(await readConfigFile(dir, "config.md")).toBe(CONFIG)
  })

  it("degrades with a fetch hint on non-fast-forward (last-writer-wins policy)", async () => {
    const repoA = await initRepo("maestra-store-ff-a-")
    const bare = await initBareRemote()
    await addRemote(repoA, bare)
    await writeConfigFiles(repoA, { "config.md": "- platform: github\n" }, "test: A first")

    // A second clone advances the remote branch independently.
    const cloneDir = `${repoA}-clone`
    await git(repoA, ["clone", "-q", "--no-checkout", bare, cloneDir])
    await git(cloneDir, ["config", "user.email", "test@maestra.local"])
    await git(cloneDir, ["config", "user.name", "maestra test"])
    await writeConfigFiles(cloneDir, { "config.md": "- platform: gitlab\n" }, "test: B wins")

    // repoA's local branch is now behind origin — its push must be rejected.
    const result = await writeConfigFiles(repoA, { "config.md": "- platform: github\n- board: 1\n" }, "test: A diverges")

    expect(result.pushed).toBe(false)
    expect(result.pushNote?.reason).toBe("non-fast-forward")
    expect(result.pushNote?.hint).toContain("git fetch")
    expect(result.committed).toBe(true) // local append still happened
  })
})

describe("config-store — misc", () => {
  it("isGitRepo distinguishes repos from plain directories", async () => {
    const dir = await initRepo("maestra-store-isrepo-")
    expect(await isGitRepo(dir)).toBe(true)
    expect(await isGitRepo(dir + "-nope")).toBe(false)
  })

  it("hasLegacyDotMaestra detects the legacy folder in the working tree", async () => {
    const dir = await initRepo("maestra-store-legacy-")
    expect(hasLegacyDotMaestra(dir)).toBe(false)
    mkdirSync(`${dir}/.maestra`)
    expect(hasLegacyDotMaestra(dir)).toBe(true)
  })
})
