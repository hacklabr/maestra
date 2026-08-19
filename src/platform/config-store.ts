import { execFile } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

/**
 * ADR-003 / RF-34..RF-38: per-repository config lives on the orphan branch
 * `__maestra_config__` (files at the branch ROOT — the branch IS the config
 * folder). No working-tree checkout, no `.maestra/` in the host project.
 *
 * All git access goes through execFile with an args array (never shell
 * strings). Reads resolve local branch → origin remote-tracking → null and
 * NEVER throw. Writes append a commit via plumbing (hash-object → temp index
 * → write-tree → commit-tree → update-ref); when the branch does not exist
 * yet the commit is created WITHOUT `-p`, so the branch is born ORPHAN —
 * this is the core invariant of RF-34. Push is best-effort: any failure
 * degrades to a structured note and never blocks the flow (P6 spirit).
 */

export const ORPHAN_BRANCH = "__maestra_config__"
const ORPHAN_REF = `refs/heads/${ORPHAN_BRANCH}`
const REMOTE = "origin"
const REMOTE_REF = `refs/remotes/${REMOTE}/${ORPHAN_BRANCH}`

/** Branch-root config file names only: flat, no dirs, no leading dot. */
const CONFIG_FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

export type PushFailureReason = "no-remote" | "non-fast-forward" | "error"

export interface PushNote {
  reason: PushFailureReason
  detail: string
  hint?: string
}

export interface ConfigWriteResult {
  branch: string
  /** false when nothing was committed (no-op or plumbing failure). */
  committed: boolean
  sha: string | null
  /** true when this write created the branch (orphan birth). */
  created: boolean
  pushed: boolean
  pushNote: PushNote | null
  /** plumbing failure detail when committed=false due to an error. */
  error: string | null
}

export class ConfigStoreError extends Error {
  constructor(
    message: string,
    readonly detail: string,
  ) {
    super(message)
    this.name = "ConfigStoreError"
  }
}

interface GitResult {
  stdout: string
  stderr: string
  code: number
}

/** Deterministic identity for tool-generated config commits. */
function identityEnv(): Record<string, string> {
  return {
    GIT_AUTHOR_NAME: process.env.GIT_AUTHOR_NAME ?? "maestra",
    GIT_AUTHOR_EMAIL: process.env.GIT_AUTHOR_EMAIL ?? "maestra@users.noreply.local",
    GIT_COMMITTER_NAME: process.env.GIT_COMMITTER_NAME ?? "maestra",
    GIT_COMMITTER_EMAIL: process.env.GIT_COMMITTER_EMAIL ?? "maestra@users.noreply.local",
  }
}

function runGit(directory: string, args: string[], env: Record<string, string> = {}): Promise<GitResult> {
  return new Promise((resolvePromise) => {
    execFile(
      "git",
      ["-C", directory, ...args],
      { timeout: 30_000, maxBuffer: 16 * 1024 * 1024, env: { ...process.env, ...identityEnv(), ...env } },
      (error, stdout, stderr) => {
        resolvePromise({
          stdout: stdout ?? "",
          stderr: stderr ?? "",
          code: error ? (typeof error.code === "number" ? error.code : 1) : 0,
        })
      },
    )
  })
}

/** Cheap sanity probe used by the CLI to fail with a clear message. */
export async function isGitRepo(directory: string): Promise<boolean> {
  const result = await runGit(directory, ["rev-parse", "--git-dir"])
  return result.code === 0
}

export interface ConfigRef {
  sha: string
  source: "local" | "remote"
}

/**
 * Resolve the config branch tip: local `__maestra_config__` first, then the
 * `origin` remote-tracking ref. Null when neither exists — never throws.
 */
export async function resolveConfigRef(directory: string): Promise<ConfigRef | null> {
  const local = await runGit(directory, ["rev-parse", "--verify", "--quiet", ORPHAN_REF])
  if (local.code === 0 && local.stdout.trim()) {
    return { sha: local.stdout.trim(), source: "local" }
  }
  const remote = await runGit(directory, ["rev-parse", "--verify", "--quiet", REMOTE_REF])
  if (remote.code === 0 && remote.stdout.trim()) {
    return { sha: remote.stdout.trim(), source: "remote" }
  }
  return null
}

/**
 * Read one config file from the resolved branch tip. Null when the branch
 * or the file is missing — never throws (missing config is a normal state).
 */
export async function readConfigFile(directory: string, name: string): Promise<string | null> {
  const ref = await resolveConfigRef(directory)
  if (!ref) return null
  const result = await runGit(directory, ["show", `${ref.sha}:${name}`])
  if (result.code !== 0) return null
  return result.stdout
}

/** True when the file exists on the config branch (any resolved tip). */
export async function hasConfigFile(directory: string, name: string): Promise<boolean> {
  return (await readConfigFile(directory, name)) !== null
}

/** RF-37: legacy `.maestra/` present in the host working tree → signal. */
export function hasLegacyDotMaestra(directory: string): boolean {
  try {
    return statSync(join(directory, ".maestra")).isDirectory()
  } catch {
    return false
  }
}

async function tryPush(directory: string): Promise<{ pushed: boolean; pushNote: PushNote | null }> {
  const remoteUrl = await runGit(directory, ["remote", "get-url", REMOTE])
  if (remoteUrl.code !== 0) {
    return {
      pushed: false,
      pushNote: {
        reason: "no-remote",
        detail: `no remote named '${REMOTE}' — config committed on the local branch only`,
        hint: `add a remote and run: git push ${REMOTE} ${ORPHAN_BRANCH}`,
      },
    }
  }
  const push = await runGit(directory, ["push", REMOTE, ORPHAN_BRANCH])
  if (push.code === 0) return { pushed: true, pushNote: null }

  const nonFastForward = /non-fast-forward|fetch first/i.test(push.stderr)
  return {
    pushed: false,
    pushNote: {
      reason: nonFastForward ? "non-fast-forward" : "error",
      detail: push.stderr.trim().slice(0, 300),
      hint: nonFastForward
        ? `run \`git fetch ${REMOTE}\` and resolve manually — last-writer-wins is the accepted policy (config change cadence is low)`
        : undefined,
    },
  }
}

/**
 * Append ONE commit with the given files at the branch root. When the branch
 * does not exist yet, the commit is created WITHOUT a parent — the branch is
 * born orphan (no merge-base with the project's branches; RF-34). Throws
 * ConfigStoreError on plumbing failure; push failures degrade to a note.
 */
export async function writeConfigFiles(
  directory: string,
  files: Record<string, string>,
  message: string,
): Promise<ConfigWriteResult> {
  const entries = Object.entries(files)
  const tip = await resolveConfigRef(directory)

  if (entries.length === 0) {
    return {
      branch: ORPHAN_BRANCH,
      committed: false,
      sha: tip?.sha ?? null,
      created: false,
      pushed: false,
      pushNote: null,
      error: null,
    }
  }
  for (const [name] of entries) {
    if (!CONFIG_FILE_NAME.test(name)) {
      throw new ConfigStoreError(
        `invalid config file name "${name}" — branch-root file names only (flat, no directories)`,
        `name failed ${CONFIG_FILE_NAME}`,
      )
    }
  }

  const staging = mkdtempSync(join(tmpdir(), "maestra-config-"))
  try {
    const indexEnv = { GIT_INDEX_FILE: join(staging, "index") }
    if (tip) {
      const readTree = await runGit(directory, ["read-tree", tip.sha], indexEnv)
      if (readTree.code !== 0) {
        throw new ConfigStoreError("git read-tree failed while seeding the temp index", readTree.stderr)
      }
    }

    for (const [name, content] of entries) {
      const blobPath = join(staging, "blob")
      mkdirSync(staging, { recursive: true })
      writeFileSync(blobPath, content, "utf-8")
      const hashObject = await runGit(directory, ["hash-object", "-w", "--", blobPath])
      if (hashObject.code !== 0) {
        throw new ConfigStoreError(`git hash-object failed for "${name}"`, hashObject.stderr)
      }
      const sha = hashObject.stdout.trim()
      const updateIndex = await runGit(
        directory,
        ["update-index", "--add", "--cacheinfo", `100644,${sha},${name}`],
        indexEnv,
      )
      if (updateIndex.code !== 0) {
        throw new ConfigStoreError(`git update-index failed for "${name}"`, updateIndex.stderr)
      }
    }

    const writeTree = await runGit(directory, ["write-tree"], indexEnv)
    if (writeTree.code !== 0) {
      throw new ConfigStoreError("git write-tree failed", writeTree.stderr)
    }
    const tree = writeTree.stdout.trim()

    // Core invariant (RF-34): NO -p when the branch does not exist yet —
    // a first commit with a parent would silently give the config branch a
    // merge-base with the project's history.
    const commitArgs = ["commit-tree", tree, "-m", message]
    if (tip) commitArgs.push("-p", tip.sha)
    const commitTree = await runGit(directory, commitArgs)
    if (commitTree.code !== 0) {
      throw new ConfigStoreError("git commit-tree failed", commitTree.stderr)
    }
    const sha = commitTree.stdout.trim()

    const updateRef = await runGit(directory, ["update-ref", ORPHAN_REF, sha])
    if (updateRef.code !== 0) {
      throw new ConfigStoreError(`git update-ref failed for ${ORPHAN_REF}`, updateRef.stderr)
    }

    const { pushed, pushNote } = await tryPush(directory)
    return { branch: ORPHAN_BRANCH, committed: true, sha, created: !tip, pushed, pushNote, error: null }
  } finally {
    rmSync(staging, { recursive: true, force: true })
  }
}
