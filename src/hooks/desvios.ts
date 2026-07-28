import { readFile as fsReadFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { FILE_LEVEL, validateDesvios, type DesvioFinding } from "./validate-desvios.js"

type ToolExecuteAfterInput = {
  tool: string
  sessionID: string
  callID: string
  args?: Record<string, unknown>
}

type ToolExecuteAfterOutput = {
  title?: string
  output: string
  metadata?: unknown
}

/** Native tools that can write file content (union of both hosts' tool names). */
const WRITE_TOOLS = new Set(["write", "edit", "patch", "apply_patch", "multiedit", "notebookedit"])

const DESVIOS_PATH = /(?:^|\/)docs\/rounds\/[^/]+\/deviations\.md$/

const DEFAULT_MICROCOPY_PATH = fileURLToPath(
  new URL("../instructions/reference/microcopy.md", import.meta.url),
)

export function isDesviosPath(path: string): boolean {
  return DESVIOS_PATH.test(path.replaceAll("\\", "/"))
}

function extractFilePath(args: Record<string, unknown> | undefined): string | null {
  if (!args) return null
  const candidate = args.filePath ?? args.file_path ?? args.path
  return typeof candidate === "string" ? candidate : null
}

/**
 * Loads the calibrated warning text from the editable EN microcopy file
 * (spec D1: "warning in the editable EN microcopy" — never hardcoded).
 * Extracts the fenced block under "### deviations.md hook warning".
 *
 * Returns null when the file/section is unreadable: flag-never-block —
 * a missing microcopy must never break a write.
 */
export async function loadDesviosWarning(
  microcopyPath: string = DEFAULT_MICROCOPY_PATH,
  read: (path: string) => Promise<string> = (p) => fsReadFile(p, "utf8"),
): Promise<string | null> {
  try {
    const content = await read(microcopyPath)
    const heading = /^###\s+deviations\.md hook warning[^\n]*$/m.exec(content)
    if (!heading) return null
    const rest = content.slice(heading.index + heading[0].length)
    const fence = /```[^\n]*\n([\s\S]*?)```/.exec(rest)
    return fence ? fence[1].trimEnd() : null
  } catch {
    return null
  }
}

function formatFindings(findings: DesvioFinding[]): string {
  return findings
    .map((f) => {
      if (f.entryId === FILE_LEVEL) return `- ${f.note ?? "incomplete file"}`
      return `- ${f.entryId}: missing ${f.missing.join(", ")}.`
    })
    .join("\n")
}

export type DesviosHookDeps = {
  /** Injectable for tests. Defaults to node fs. */
  readFile?: (path: string) => Promise<string>
  /** Injectable for tests. Defaults to loadDesviosWarning() against the bundled microcopy. */
  loadWarning?: () => Promise<string | null>
}

/**
 * Post-write validation hook for docs/rodadas/*\/desvios.md (anti-bypass #14).
 *
 * Flag semantics, NEVER block — blocking would require `cancel` in
 * tool.execute.before, which only exists on Mimo Code (interposition asymmetry,
 * spec D1/D4). Fires AUTOMATICALLY on native write/edit success in both hosts
 * (never model-called); the output object propagates by reference, so appending
 * to output.output is visible to the model (OC session/tools.ts; Mimo
 * session/prompt.ts — smoke-dual CI asserts this mutation, task T12).
 *
 * Uncovered write paths (bash heredoc, human editor) are backstopped by the
 * reconciliation evidence check — this hook is early warning, never enforcement.
 * Both consume the same pure validateDesvios() (hooks/validate-desvios.ts).
 *
 * Dedup: session-scoped, max 1 warning per entry until the entry validates
 * (alert-fatigue guard for partial writes; a re-validated entry that regresses
 * warns again). Worst case after a process restart: one extra warning.
 */
export function createDesviosHook(deps: DesviosHookDeps = {}) {
  const read = deps.readFile ?? ((p: string) => fsReadFile(p, "utf8"))
  const loadWarning = deps.loadWarning ?? (() => loadDesviosWarning())
  const warned = new Set<string>()

  return async (input: ToolExecuteAfterInput, output: ToolExecuteAfterOutput): Promise<void> => {
    // Cheapest checks first: tool name, then path regex (ns cost) — validation
    // only runs on an actual desvios.md write.
    if (!WRITE_TOOLS.has(input.tool)) return
    const filePath = extractFilePath(input.args)
    if (!filePath || !isDesviosPath(filePath)) return

    let content: string
    try {
      content = await read(filePath)
    } catch {
      return // write succeeded but file unreadable — never break the write path
    }

    const validation = validateDesvios(content)

    if (validation.state !== "invalid") {
      // Entries now valid: reset this file's dedup so a later regression re-warns.
      for (const key of warned) {
        if (key.startsWith(`${filePath}::`)) warned.delete(key)
      }
      return
    }

    const fresh = validation.findings.filter((f) => !warned.has(`${filePath}::${f.entryId}`))
    if (fresh.length === 0) return
    for (const f of fresh) warned.add(`${filePath}::${f.entryId}`)

    const findingsText = formatFindings(fresh)
    const template = await loadWarning()
    const warning = template
      ? template.includes("{FINDINGS}")
        ? template.replace("{FINDINGS}", findingsText)
        : `${template}\n\n${findingsText}`
      : // Bare functional fallback — only when the microcopy file is unreadable.
        // The calibrated wording lives exclusively in microcopy.md.
        `deviations.md: incomplete deviation entry (anti-bypass #14).\n${findingsText}`

    output.output += `\n\n${warning}`
  }
}
