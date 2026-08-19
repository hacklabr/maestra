#!/usr/bin/env node
import { pathToFileURL } from "node:url"
import { resolveForge, type ResolvedForge } from "../platform/adapter.js"
import type { CommentFacts, IssueRef } from "../platform/types.js"
import { auditEpic, buildReport, renderReport, type EpicSnapshot, type ReportResult } from "./report-core.js"

/**
 * maestra-report — presence-gap audit over Fluxo instrumentation events
 * (A–F + override registers). CLI script, never a plugin tool, never in
 * checklist 8.3 (spec D1). Ships before dogfood #1.
 *
 * I/O edge: resolveForge (src/platform/adapter.ts) — the single adapter
 * factory. Audit logic is pure (report-core.ts); parsing is pure
 * (report-parse.ts). Every check compares event × STATE.
 *
 * Usage:
 *   maestra-report [--directory <path>] [--epics 12,15,20]
 */

const RECONCILIATION_TITLE = /reconcil/i

export interface ReportDeps {
  /** Injectable for tests. Defaults to the real resolveForge. */
  resolveForgeFn?: (directory: string) => Promise<ResolvedForge | null>
  log?: (line: string) => void
  error?: (line: string) => void
}

interface CliArgs {
  directory: string
  epics: number[] | null
  help: boolean
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { directory: process.cwd(), epics: null, help: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--help" || arg === "-h") {
      args.help = true
    } else if (arg === "--directory" && argv[i + 1]) {
      args.directory = argv[++i]
    } else if (arg === "--epics" && argv[i + 1]) {
      args.epics = argv[++i]
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0)
    }
  }
  return args
}

const USAGE = `maestra-report — A–F instrumentation presence-gap audit

Usage: maestra-report [--directory <path>] [--epics 12,15,20]

  --directory  Target repository (default: cwd)
  --epics      Audit only the listed epics (default: sweep — all
               issues with variant-* label, any state)

Exit 0: instrumentation intact. Exit 1: presence-gaps or thresholds exceeded.`

async function fetchSnapshot(
  resolved: ResolvedForge,
  issueNumber: number,
  comments: CommentFacts[],
): Promise<EpicSnapshot> {
  const { adapter, forge } = resolved
  const ref: IssueRef = { forge, number: issueNumber }

  const [issue, children, boardColumn] = await Promise.all([
    adapter.getIssue(ref),
    adapter.listChildren(ref).catch(() => []),
    adapter.getBoardColumn(ref).catch(() => null), // P6: board is a touchpoint, never a gate
  ])

  const reconciliacaoChild = children.find((c) => RECONCILIATION_TITLE.test(c.title))

  // E parity state leg: verify that each demand issue linked by an E event exists.
  const demandNumbers = [
    ...new Set(
      comments
        .map((c) => /\*\*Event E\*\*[^\n]*demand created: #(\d+)/.exec(c.body)?.[1])
        .filter((n): n is string => n !== undefined)
        .map(Number),
    ),
  ]
  const demandsExist = new Map<number, boolean>()
  for (const n of demandNumbers) {
    try {
      await adapter.getIssue({ forge, number: n })
      demandsExist.set(n, true)
    } catch {
      demandsExist.set(n, false)
    }
  }

  return {
    issue,
    comments,
    reconciliation: reconciliacaoChild
      ? { exists: true, state: reconciliacaoChild.state, number: reconciliacaoChild.number }
      : { exists: false, state: null, number: null },
    boardColumn,
    demandsExist,
  }
}

export async function main(argv: string[], deps: ReportDeps = {}): Promise<number> {
  const log = deps.log ?? ((line: string) => console.log(line))
  const error = deps.error ?? ((line: string) => console.error(line))
  const args = parseArgs(argv)

  if (args.help) {
    log(USAGE)
    return 0
  }

  const resolve = deps.resolveForgeFn ?? ((directory: string) => resolveForge(directory))
  const resolved = await resolve(args.directory)
  if (!resolved) {
    error(
      "maestra-report: issue platform not detected for this repository. " +
        "Configure config.md on the __maestra_config__ branch (platform, host, project — " +
        "ADR-003; maestra_status or maestra-config migrate) or run maestra_status to diagnose.",
    )
    return 1
  }

  const { adapter, forge } = resolved

  let epicNumbers: number[]
  if (args.epics) {
    epicNumbers = args.epics
  } else {
    try {
      const epics = await adapter.listEpics()
      epicNumbers = epics.map((e) => e.number)
    } catch (e: unknown) {
      error(`maestra-report: failed to list epics: ${e instanceof Error ? e.message : String(e)}`)
      return 1
    }
  }

  const audits = []
  for (const number of epicNumbers) {
    let comments: CommentFacts[]
    try {
      comments = await adapter.listComments({ forge, number })
    } catch (e: unknown) {
      error(`maestra-report: failed to read comments on #${number}: ${e instanceof Error ? e.message : String(e)}`)
      return 1
    }
    const snapshot = await fetchSnapshot(resolved, number, comments)
    audits.push(auditEpic(snapshot))
  }

  const result: ReportResult = buildReport(audits)
  const platform = `${forge.kind} · ${forge.host} · ${forge.project}`
  log(renderReport(result, platform))
  return result.exitCode
}

const invokedAsScript = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (invokedAsScript) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e: unknown) => {
      console.error(`maestra-report: unexpected error: ${e instanceof Error ? e.message : String(e)}`)
      process.exit(1)
    },
  )
}
