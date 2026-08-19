import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { main } from "./migrate-config.js"
import { git, gitOk, initBareRemote, initRepo, addRemote } from "../platform/__tests__/git-repo.js"

interface RunResult {
  code: number
  out: string
  err: string
}

async function run(argv: string[]): Promise<RunResult> {
  const lines: string[] = []
  const errs: string[] = []
  const code = await main(argv, {
    log: (line) => lines.push(line),
    error: (line) => errs.push(line),
  })
  return { code, out: lines.join("\n"), err: errs.join("\n") }
}

function writeLegacy(dir: string, files: Record<string, string>): void {
  mkdirSync(`${dir}/.maestra`, { recursive: true })
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(`${dir}/.maestra/${name}`, content, "utf-8")
  }
}

async function commitAll(dir: string, message: string): Promise<void> {
  await git(dir, ["add", "-A"])
  await git(dir, ["commit", "-qm", message])
}

const CONFIG = "- platform: github\n- host: github.com\n- project: acme/loja\n"

describe("maestra-config migrate", () => {
  it("moves the 3 legacy files into ONE commit on a TRUE orphan branch and prints removal commands", async () => {
    const dir = await initRepo("maestra-migrate-full-")
    writeLegacy(dir, { "config.md": CONFIG, "team.md": "# Team\n", "labels.md": "# Labels\n" })
    await commitAll(dir, "chore: legacy maestra config")

    const mainBefore = (await git(dir, ["rev-parse", "main"])).trim()
    const { code, out } = await run(["migrate", "--directory", dir])

    expect(code).toBe(0)
    expect(out).toContain("legacy .maestra/ found: config.md, team.md, labels.md")
    expect(out).toContain("branch born ORPHAN")
    expect(out).toContain("git rm -r .maestra")

    // ONE commit, files at the branch ROOT, no merge-base with main.
    expect((await git(dir, ["rev-list", "--count", "__maestra_config__"])).trim()).toBe("1")
    expect(await git(dir, ["show", "__maestra_config__:config.md"])).toBe(CONFIG)
    expect(await git(dir, ["show", "__maestra_config__:team.md"])).toBe("# Team\n")
    expect(await gitOk(dir, ["merge-base", "main", "__maestra_config__"])).toBeNull()

    // Printed, never executed: legacy folder intact, zero new commits on main.
    expect(existsSync(`${dir}/.maestra/config.md`)).toBe(true)
    expect((await git(dir, ["rev-parse", "main"])).trim()).toBe(mainBefore)
  })

  it("second run is a no-op (idempotent — RF-38)", async () => {
    const dir = await initRepo("maestra-migrate-idem-")
    writeLegacy(dir, { "config.md": CONFIG })
    await commitAll(dir, "chore: legacy maestra config")
    await run(["migrate", "--directory", dir])

    const second = await run(["migrate", "--directory", dir])
    expect(second.code).toBe(0)
    expect(second.out).toContain("nothing to commit")
    expect((await git(dir, ["rev-list", "--count", "__maestra_config__"])).trim()).toBe("1")
    // removal commands still offered while the legacy folder remains
    expect(second.out).toContain("git rm -r .maestra")
  })

  it("appends to an existing branch born earlier (bootstrap case) instead of re-orphaning", async () => {
    const dir = await initRepo("maestra-migrate-append-")
    // bootstrap already created the branch with config.md
    const { } = await run(["migrate", "--directory", dir]) // no legacy yet, no branch → pure no-op
    writeLegacy(dir, { "team.md": "# Team\n" })
    const res = await run(["migrate", "--directory", dir])
    // branch did not exist on the first no-op run, so this run BIRTHS it
    expect(res.out).toContain("branch born ORPHAN")
    expect((await git(dir, ["rev-list", "--count", "__maestra_config__"])).trim()).toBe("1")

    // now a third run with a NEW file must APPEND (parent set, not orphan birth)
    writeLegacy(dir, { "labels.md": "# Labels\n" })
    const third = await run(["migrate", "--directory", dir])
    expect(third.code).toBe(0)
    expect(third.out).not.toContain("branch born ORPHAN")
    expect((await git(dir, ["rev-list", "--count", "__maestra_config__"])).trim()).toBe("2")
    const parent = (await git(dir, ["log", "--format=%P", "-1", "__maestra_config__"])).trim()
    expect(parent).toMatch(/^[0-9a-f]{40}$/)
  })

  it("no legacy files and no branch → informational no-op, exit 0", async () => {
    const dir = await initRepo("maestra-migrate-empty-")
    const { code, out } = await run(["migrate", "--directory", dir])
    expect(code).toBe(0)
    expect(out).toContain("nothing to migrate")
    expect(out).toContain("first triage")
    expect(await gitOk(dir, ["rev-parse", "--verify", "--quiet", "refs/heads/__maestra_config__"])).toBeNull()
  })

  it("legacy folder with only stray files still prints removal commands", async () => {
    const dir = await initRepo("maestra-migrate-stray-")
    writeLegacy(dir, {})
    writeFileSync(`${dir}/.maestra/notes.txt`, "stray\n", "utf-8")
    const { code, out } = await run(["migrate", "--directory", dir])
    expect(code).toBe(0)
    expect(out).toContain("legacy .maestra/ not found")
    expect(out).toContain("git rm -r .maestra")
  })

  it("pushes to a real remote when one exists (and reports degradation without failing)", async () => {
    const dir = await initRepo("maestra-migrate-push-")
    const bare = await initBareRemote()
    await addRemote(dir, bare)
    writeLegacy(dir, { "config.md": CONFIG })
    await commitAll(dir, "chore: legacy maestra config")

    const { code, out } = await run(["migrate", "--directory", dir])
    expect(code).toBe(0)
    expect(out).toContain("pushed to origin/__maestra_config__")
    expect(await gitOk(bare, ["rev-parse", "--verify", "--quiet", "refs/heads/__maestra_config__"])).toBeTruthy()

    // push degradation (unreachable remote) is still exit 0
    const dir2 = await initRepo("maestra-migrate-badpush-")
    await addRemote(dir2, "/nonexistent/remote.git")
    writeLegacy(dir2, { "config.md": CONFIG })
    await commitAll(dir2, "chore: legacy maestra config")
    const degraded = await run(["migrate", "--directory", dir2])
    expect(degraded.code).toBe(0)
    expect(degraded.out).toContain("push degraded")
  })

  it("fails with exit 1 outside a git repository", async () => {
    const { code, err } = await run(["migrate", "--directory", "/tmp/maestra-not-a-repo"])
    expect(code).toBe(1)
    expect(err).toContain("not a git repository")
  })

  it("help usage renders and unknown subcommands exit 1", async () => {
    const help = await run(["--help"])
    expect(help.code).toBe(0)
    expect(help.out).toContain("Usage: maestra-config migrate")
    const bad = await run(["frobnicate"])
    expect(bad.code).toBe(1)
    expect(bad.out).toContain("Usage: maestra-config migrate")
  })

  it("keeps the legacy config.md parser byte-compatible end to end", async () => {
    const dir = await initRepo("maestra-migrate-parser-")
    writeLegacy(dir, { "config.md": CONFIG })
    await commitAll(dir, "chore: legacy maestra config")
    await run(["migrate", "--directory", dir])

    // the platform/config.ts facade must read the migrated file unchanged
    const { readFluxoConfig } = await import("../platform/config.js")
    expect(await readFluxoConfig(dir)).toEqual({ platform: "github", host: "github.com", project: "acme/loja" })
    // legacy folder content itself was not modified by the tool
    expect(readFileSync(`${dir}/.maestra/config.md`, "utf-8")).toBe(CONFIG)
  })
})
