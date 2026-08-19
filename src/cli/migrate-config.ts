#!/usr/bin/env node
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import {
  CONFIG_FILE_NAMES,
  ORPHAN_BRANCH,
  hasLegacyDotMaestra,
  isConfigFileName,
  isGitRepo,
  readConfigFile,
  resolveConfigRef,
  writeConfigFiles,
  type ConfigWriteResult,
} from "../platform/config-store.js"

/**
 * maestra-config — manage Fluxo config on the orphan __maestra_config__
 * branch (ADR-003). The boring, safe path for EVERY config write (RF-36):
 * the facilitator never runs raw git plumbing by hand.
 *
 *   migrate       RF-38: idempotent legacy .maestra/ migration — the 3 files
 *                 into ONE commit (branch born orphan when absent),
 *                 best-effort push, then PRINTS the removal commands for the
 *                 project branch — never executes them.
 *   read <file>   Print ONE config file from the resolved branch ref.
 *   write <file>  Upsert ONE config file (content from stdin) as a commit on
 *                 the branch + best-effort push. Same orphan-birth invariant,
 *                 same deterministic identity as every store write.
 *
 * File names are allowlisted to config.md|team.md|labels.md (branch root is
 * the whole config namespace). Exit 0 on success and tolerated degradation
 * (push failure is NOT a failure); non-zero only on usage error or real
 * failure (not a repo, missing branch/file for read, unreadable stdin,
 * git plumbing).
 *
 * Usage:
 *   maestra-config migrate [--directory <path>]
 *   maestra-config read <file> [--directory <path>]
 *   maestra-config write <file> [--directory <path>] < content
 */

const LEGACY_DIR = ".maestra"

const SUBCOMMANDS = ["migrate", "read", "write"] as const
type Subcommand = (typeof SUBCOMMANDS)[number]

function isSubcommand(value: string | undefined): value is Subcommand {
  return value !== undefined && (SUBCOMMANDS as readonly string[]).includes(value)
}

export interface MigrateDeps {
  log?: (line: string) => void
  error?: (line: string) => void
  /** Raw stdout (read subcommand) — default process.stdout.write. */
  stdout?: (data: string) => void
  /** Stdin reader (write subcommand) — default: drain process.stdin. */
  stdin?: () => Promise<string>
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

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk, "utf-8") : chunk)
  }
  return Buffer.concat(chunks).toString("utf-8")
}

const USAGE = `maestra-config — manage Fluxo config on the ${ORPHAN_BRANCH} branch (ADR-003)

Usage: maestra-config <subcommand> [args] [--directory <path>]

Subcommands:
  migrate        Move config.md/team.md/labels.md from ${LEGACY_DIR}/ into ONE
                 commit on the orphan ${ORPHAN_BRANCH} branch, push (best-effort),
                 then PRINT the removal commands for the project branch (RF-38).
  read <file>    Print ONE config file from the resolved branch ref, raw on
                 stdout. <file> is one of: ${CONFIG_FILE_NAMES.join(", ")}.
  write <file>   Upsert ONE config file (content read from stdin) as a commit
                 on the orphan branch + best-effort push (RF-36). The branch
                 birth stays orphan; identical content is a no-op.

  --directory    Target repository (default: cwd)

Exit 0: success or tolerated degradation (push failure is NOT a failure).
Exit 1: usage error or real failure (not a git repository, missing
        branch/file for read, empty/unreadable stdin for write, git plumbing).`

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

function invalidFileError(
  error: (line: string) => void,
  sub: Subcommand,
  fileName: string | undefined,
): number {
  error(
    `maestra-config ${sub}: invalid file "${fileName ?? ""}" — allowed: ${CONFIG_FILE_NAMES.join(", ")} ` +
      "(the branch root is the whole config namespace; no subdirs, no path traversal)",
  )
  return 1
}

/** `read <file>` — raw content on stdout; exit 1 when branch or file is missing. */
async function runRead(
  fileName: string | undefined,
  args: CliArgs,
  deps: { error: (line: string) => void; stdout: (data: string) => void },
): Promise<number> {
  if (fileName === undefined || !isConfigFileName(fileName)) return invalidFileError(deps.error, "read", fileName)

  const ref = await resolveConfigRef(args.directory)
  if (!ref) {
    deps.error(
      `maestra-config read: branch ${ORPHAN_BRANCH} not found (no local branch, no origin/${ORPHAN_BRANCH}) — ` +
        "run `maestra-config migrate` or `maestra-config write` first.",
    )
    return 1
  }
  const content = await readConfigFile(args.directory, fileName)
  if (content === null) {
    deps.error(`maestra-config read: ${fileName} not found on ${ORPHAN_BRANCH} (tip ${ref.source}).`)
    return 1
  }
  deps.stdout(content)
  return 0
}

/** `write <file>` — single-file upsert from stdin (RF-36). */
async function runWrite(
  fileName: string | undefined,
  args: CliArgs,
  deps: {
    log: (line: string) => void
    error: (line: string) => void
    readStdin: () => Promise<string>
  },
): Promise<number> {
  // Validate BEFORE touching stdin/git: usage errors must be cheap and safe.
  if (fileName === undefined || !isConfigFileName(fileName)) return invalidFileError(deps.error, "write", fileName)

  if (!(await isGitRepo(args.directory))) {
    deps.error(`maestra-config write: ${args.directory} is not a git repository.`)
    return 1
  }

  let content: string
  try {
    content = await deps.readStdin()
  } catch (e: unknown) {
    deps.error(`maestra-config write: failed to read stdin: ${e instanceof Error ? e.message : String(e)}`)
    return 1
  }
  if (content.length === 0) {
    deps.error("maestra-config write: stdin is empty — refusing to write an empty file (forgot the redirect?)")
    return 1
  }

  // Same idempotency contract as migrate: identical content → no commit.
  const current = await readConfigFile(args.directory, fileName)
  if (current === content) {
    deps.log(`maestra-config write — ${args.directory}`)
    deps.log(`  ${fileName} unchanged on ${ORPHAN_BRANCH} — nothing to commit (idempotent no-op).`)
    return 0
  }

  let result: ConfigWriteResult
  try {
    result = await writeConfigFiles(args.directory, { [fileName]: content }, `maestra-config: update ${fileName}`)
  } catch (e: unknown) {
    deps.error(`maestra-config write: failed: ${e instanceof Error ? e.message : String(e)}`)
    return 1
  }
  if (!result.committed || !result.sha) {
    deps.error(`maestra-config write: failed: ${result.error ?? "no commit produced"}`)
    return 1
  }

  deps.log(`maestra-config write — ${args.directory}`)
  deps.log(
    `  committed ${fileName} on ${result.branch} (${result.sha.slice(0, 12)})` +
      (result.created ? " — branch born ORPHAN (no merge-base with project branches)" : ""),
  )
  printPushResult(deps.log, result)
  return 0
}

/** `migrate` — RF-38 legacy migration (body unchanged in behavior). */
async function runMigrate(
  args: CliArgs,
  deps: { log: (line: string) => void; error: (line: string) => void },
): Promise<number> {
  const { log, error } = deps

  if (!(await isGitRepo(args.directory))) {
    error(`maestra-config: ${args.directory} is not a git repository — nothing to migrate.`)
    return 1
  }

  // 1. Scan legacy files (read errors are real failures).
  const legacy: Record<string, string> = {}
  for (const name of CONFIG_FILE_NAMES) {
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

export async function main(argv: string[], deps: MigrateDeps = {}): Promise<number> {
  const log = deps.log ?? ((line: string) => console.log(line))
  const error = deps.error ?? ((line: string) => console.error(line))
  const stdout = deps.stdout ?? ((data: string) => process.stdout.write(data))
  const stdin = deps.stdin ?? readStdin
  const args = parseArgs(argv)

  if (args.help) {
    log(USAGE)
    return 0
  }
  const sub = argv[0]
  if (!isSubcommand(sub)) {
    // No args or unknown subcommand: help + exit 1.
    log(USAGE)
    return 1
  }
  if (sub === "read") return runRead(argv[1], args, { error, stdout })
  if (sub === "write") return runWrite(argv[1], args, { log, error, readStdin: stdin })
  return runMigrate(args, { log, error })
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
