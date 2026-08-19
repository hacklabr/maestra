import { execFile } from "node:child_process"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { promisify } from "node:util"

/**
 * Real-git fixture helpers (R14): config tests run against actual
 * `git init`-ed temp repositories — the store under test execs real git,
 * so fixtures must be real repos (hermetic: local paths only, no network).
 */

const execFileAsync = promisify(execFile)

export async function git(directory: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", ["-C", directory, ...args], {
    maxBuffer: 16 * 1024 * 1024,
  })
  return stdout
}

/** Like git() but resolves to null on non-zero exit (expected-failure probes). */
export async function gitOk(directory: string, args: string[]): Promise<string | null> {
  try {
    return await git(directory, args)
  } catch {
    return null
  }
}

/** Fresh repo on branch `main` with one empty root commit. */
export async function initRepo(prefix = "maestra-repo-"): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  await git(dir, ["init", "-q", "-b", "main"])
  await git(dir, ["config", "user.email", "test@maestra.local"])
  await git(dir, ["config", "user.name", "maestra test"])
  await git(dir, ["config", "commit.gpgsign", "false"])
  await git(dir, ["commit", "--allow-empty", "-q", "-m", "chore: root"])
  return dir
}

/**
 * Seed `__maestra_config__` through USER-FACING git (checkout --orphan),
 * deliberately NOT through the store under test. Files land at the branch
 * root; switching back to main removes them from the working tree.
 */
export async function seedOrphanBranch(directory: string, files: Record<string, string>): Promise<void> {
  await git(directory, ["checkout", "-q", "--orphan", "__maestra_config__"])
  // Tolerate an empty index (fresh repo): the orphan seed wants it empty anyway.
  await gitOk(directory, ["rm", "-rq", "--cached", "."])
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(directory, name), content, "utf-8")
  }
  await git(directory, ["add", ...Object.keys(files)])
  await git(directory, ["commit", "-q", "-m", "test: seed config branch"])
  await git(directory, ["checkout", "-q", "main"])
}

/** Repo + orphan config branch already seeded (the standard R14 fixture). */
export async function initRepoWithOrphanConfig(
  files: Record<string, string>,
  prefix = "maestra-repo-",
): Promise<string> {
  const dir = await initRepo(prefix)
  await seedOrphanBranch(dir, files)
  return dir
}

/** Local bare repository usable as a real (offline) `origin`. */
export async function initBareRemote(prefix = "maestra-remote-"): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  await git(dir, ["init", "-q", "--bare", "-b", "main"])
  return dir
}

export async function addRemote(directory: string, url: string, name = "origin"): Promise<void> {
  await git(directory, ["remote", "add", name, url])
}
