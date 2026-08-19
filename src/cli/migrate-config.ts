#!/usr/bin/env node
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import {
  ORPHAN_BRANCH,
  hasLegacyDotMaestra,
  isGitRepo,
  readConfigFile,
  resolveConfigRef,
  writeConfigFiles,
  type ConfigWriteResult,
} from "../platform/config-store.js"

/**
 * maestra-config — RF-38: explicit, idempotent migration of the legacy
 * `.maestra/` folder to the orphan `__maestra_config__` branch (ADR-003).
 *
 * Moves config.md/team.md/labels.md into ONE commit on the branch (born
 * orphan when absent), best-effort push, then PRINTS the commands that
 * remove `.maestra/` from the project branch — never executes them (the
 * tool never rewrites the product branch without explicit human consent).
 *
 * Exit 0 on success AND on no-op (including push degradation);
 * non-zero only on real failure (not a repo, unreadable files, git plumbing).
 *
 * Usage:
 *   maestra-config migrate [--directory <path>]
 */

const LEGACY_FILES = ["config.md", "team.md", "labels.md"] as const
const LEGACY_DIR = ".maestra"

export interface MigrateDeps {
  log?: (line: string) => void
  error?: (line: string) => void
}

interface CliArgs {
  directory: string
  help: boolean
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { directory: process.cwd(), help: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--help" || arg === "-h") {
      args.help = true
    } else if (arg === "--directory" && argv[i + 1]) {
      args.directory = argv[++i]
    }
  }
  return args
}

const USAGE = `maestra-config — migrate legacy .maestra/ to the ${ORPHAN_BRANCH} branch (ADR-003)

Usage: maestra-config migrate [--directory <path>]

  migrate      Move config.md/team.md/labels.md from ${LEGACY_DIR}/ into ONE
               commit on the orphan ${ORPHAN_BRANCH} branch, push (best-effort),
               then PRINT the removal commands for the project branch.

Exit 0: migrated or nothing to do (push degradation is NOT a failure).
Exit 1: real failure (not a git repository, unreadable files, git plumbing).`

function printPushResult(log: (line: string) => void, result: ConfigWriteResult): void {
  if (result.pushed) {
    log(`  pushed to origin/${ORPHAN_BRANCH}`)
  } else if (result.pushNote) {
    log(`  push degraded (${result.pushNote.reason}): ${result.pushNote.detail}`)
    if (result.pushNote.hint) log(`  hint: ${result.pushNote.hint}`)
  }
}

function printRemovalCommands(log: (line: string) => void): void {
  log("")
  log("Next step — run these yourself (maestra-config NEVER rewrites your project branch):")
  log("  git rm -r .maestra")
  log('  git commit -m "chore: remove legacy maestra config"')
  log("  git push")
}

export async function main(argv: string[], deps: MigrateDeps = {}): Promise<number> {
  const log = deps.log ?? ((line: string) => console.log(line))
  const error = deps.error ?? ((line: string) => console.error(line))
  const args = parseArgs(argv)

  if (args.help || argv[0] !== "migrate") {
    log(USAGE)
    return argv[0] === "migrate" || args.help ? 0 : 1
  }

  if (!(await isGitRepo(args.directory))) {
    error(`maestra-config: ${args.directory} is not a git repository — nothing to migrate.`)
    return 1
  }

  // 1. Scan legacy files (read errors are real failures).
  const legacy: Record<string, string> = {}
  for (const name of LEGACY_FILES) {
    try {
      legacy[name] = await readFile(join(args.directory, LEGACY_DIR, name), "utf-8")
    } catch {
      // absent — normal
    }
  }

  // 2. Idempotency: only files whose branch content differs need a commit.
  const ref = await resolveConfigRef(args.directory)
  const pending: Record<string, string> = {}
  for (const [name, content] of Object.entries(legacy)) {
    const onBranch = await readConfigFile(args.directory, name)
    if (onBranch !== content) pending[name] = content
  }

  log(`maestra-config migrate — ${args.directory}`)
  const found = Object.keys(legacy)
  log(
    found.length > 0
      ? `  legacy ${LEGACY_DIR}/ found: ${found.join(", ")}`
      : `  legacy ${LEGACY_DIR}/ not found`,
  )
  log(ref ? `  branch ${ORPHAN_BRANCH} already exists (${ref.source} tip)` : `  branch ${ORPHAN_BRANCH} does not exist yet`)

  if (found.length === 0) {
    if (!ref) {
      log("  nothing to migrate — the branch will be born at first triage (maestra_status).")
    } else {
      log("  nothing to migrate.")
    }
    // A stray legacy folder (no recognized files) still deserves the cleanup hint.
    if (hasLegacyDotMaestra(args.directory)) printRemovalCommands(log)
    return 0
  }

  if (Object.keys(pending).length === 0) {
    log("  branch content is identical to the legacy files — nothing to commit (idempotent no-op).")
    if (hasLegacyDotMaestra(args.directory)) printRemovalCommands(log)
    return 0
  }

  // 3. ONE commit on the orphan branch (born orphan when absent — RF-34).
  let result: ConfigWriteResult
  try {
    result = await writeConfigFiles(
      args.directory,
      pending,
      "maestra-config: migrate legacy .maestra/ files",
    )
  } catch (e: unknown) {
    error(`maestra-config: migration failed: ${e instanceof Error ? e.message : String(e)}`)
    return 1
  }
  if (!result.committed || !result.sha) {
    error(`maestra-config: migration failed: ${result.error ?? "no commit produced"}`)
    return 1
  }

  log(
    `  committed ${Object.keys(pending).join(", ")} on ${ORPHAN_BRANCH} (${result.sha.slice(0, 12)})` +
      (result.created ? " — branch born ORPHAN (no merge-base with project branches)" : ""),
  )
  printPushResult(log, result)

  // 4. Print (never execute) the project-branch cleanup (RF-38).
  printRemovalCommands(log)
  return 0
}

const invokedAsScript = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (invokedAsScript) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e: unknown) => {
      console.error(`maestra-config: unexpected error: ${e instanceof Error ? e.message : String(e)}`)
      process.exit(1)
    },
  )
}
