import { existsSync, realpathSync, statSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { homedir } from "node:os"
import { isAbsolute, join, sep } from "node:path"
import { tool } from "../host-types.js"
import { getHostDetect } from "../platform/runtime.js"
import type { HostDetection } from "../host.js"

/**
 * maestra_read_instructions — load ONE plugin instruction file (R17:
 * instructions without host prompt/read grants).
 *
 * The installed instructions tree lives at
 * `<host-config-dir>/maestra/instructions/{kernel,journeys,reference,templates,catalog}`
 * (copied there by the installer). Agents load files from it through THIS
 * tool with a RELATIVE path — never via the host read tool, which would
 * require an external_directory permission grant on absolute host paths.
 *
 * Design invariants:
 *  - LAZY BY DESIGN: returns exactly ONE file, verbatim and complete. The
 *    tool never lists or dumps the tree — the agent fetches only the file
 *    the current step needs (kernel resident, journeys on demand).
 *  - FAIL CLOSED: absolute paths, `..` segments, backslash separators and
 *    symlink escapes are rejected; the resolved target's realpath must stay
 *    inside the chosen root's realpath, and the target must be a regular
 *    file. Every failure returns a deterministic, diagnosable error string.
 *  - DETERMINISTIC ROOTS: candidates are ordered (detected host first, then
 *    the other host; `unknown` falls back to opencode→mimocode, the
 *    installer's HOSTS order) and the first EXISTING candidate wins. When
 *    none exists the error lists every searched path.
 *
 * Testability seam: MAESTRA_INSTRUCTIONS_ROOT replaces the host candidates
 * entirely (pins the tree — same spirit as MAESTRA_CATALOG_DIR in
 * persona-expansion), and both `instructionRootCandidates` and
 * `readInstructionFile` accept explicit inputs, so tests never depend on the
 * developer's real host config dirs.
 */

/** Supported hosts in deterministic fallback order (installer HOSTS order). */
const HOST_FALLBACK_ORDER: ReadonlyArray<"opencode" | "mimocode"> = ["opencode", "mimocode"]

/**
 * Host config dir (`<XDG_CONFIG_HOME|~/.config>/<host>`), XDG_CONFIG_HOME
 * respected. Note: host.ts/`defaultHostPaths` predate XDG support and are
 * not touched here; this is the resolution used for instruction trees.
 */
export function hostConfigDir(host: "opencode" | "mimocode", env: NodeJS.ProcessEnv = process.env): string {
  const xdg = env.XDG_CONFIG_HOME
  const base = typeof xdg === "string" && xdg.trim().length > 0 ? xdg : join(homedir(), ".config")
  return join(base, host)
}

export interface InstructionRootOptions {
  env?: NodeJS.ProcessEnv
  hostDetect?: () => HostDetection
}

/**
 * Candidate instruction roots, deterministic order:
 *  1. MAESTRA_INSTRUCTIONS_ROOT (env) — REPLACES the host candidates
 *  2. detected host's `<config-dir>/maestra/instructions`
 *  3. the other supported host's `<config-dir>/maestra/instructions`
 *     (`unknown` detection falls back to opencode→mimocode).
 */
export function instructionRootCandidates(opts: InstructionRootOptions = {}): string[] {
  const env = opts.env ?? process.env
  const override = env.MAESTRA_INSTRUCTIONS_ROOT
  if (typeof override === "string" && override.trim().length > 0) return [override]

  const detected = (opts.hostDetect ?? getHostDetect())().id
  const order: Array<"opencode" | "mimocode"> =
    detected === "mimocode" ? ["mimocode", "opencode"] : ["opencode", "mimocode"]
  return order.map((host) => join(hostConfigDir(host, env), "maestra", "instructions"))
}

/** Validates a relative posix path and returns its normalized segments. */
function validateRelativePath(rawPath: string): string[] | { error: string } {
  if (typeof rawPath !== "string" || rawPath.length === 0) {
    return { error: 'Error: "path" must be a non-empty relative path with posix separators, e.g. "kernel/maestra-kernel.md".' }
  }
  if (isAbsolute(rawPath) || /^[A-Za-z]:[\\/]/.test(rawPath)) {
    return { error: `Error: path must be RELATIVE inside the instructions tree — got absolute path "${rawPath}". Use e.g. "kernel/maestra-kernel.md".` }
  }
  if (rawPath.includes("\\")) {
    return { error: `Error: use posix "/" separators in path "${rawPath}" (e.g. "kernel/maestra-kernel.md").` }
  }
  const segments = rawPath.split("/")
  if (segments.includes("..")) {
    return { error: `Error: ".." segments are not allowed in path "${rawPath}".` }
  }
  const normalized = segments.filter((segment) => segment.length > 0 && segment !== ".")
  if (normalized.length === 0) {
    return { error: `Error: path "${rawPath}" is empty after normalization.` }
  }
  return normalized
}

export type ReadInstructionResult =
  | { content: string; root: string; relative: string }
  | { error: string }

/**
 * Resolves ONE instruction file inside the first EXISTING candidate root,
 * enforcing containment (realpath-based) and regular-file checks. Never
 * throws — failures come back as deterministic error strings.
 */
export async function readInstructionFile(
  relativePath: string,
  candidates: string[],
): Promise<ReadInstructionResult> {
  const validated = validateRelativePath(relativePath)
  if (!Array.isArray(validated)) return { error: validated.error }

  // Root selection: first EXISTING candidate wins (deterministic order).
  let root: string | null = null
  let rootReal = ""
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue
    try {
      rootReal = realpathSync(candidate)
      root = candidate
      break
    } catch {
      // exists but unresolvable (race/permissions) — keep searching
    }
  }
  if (root === null) {
    return {
      error:
        "Error: no instructions root found. Searched (in order):\n" +
        candidates.map((candidate) => `  - ${candidate}`).join("\n") +
        "\nReinstall the plugin (install.sh / maestra installer) or pin a tree via MAESTRA_INSTRUCTIONS_ROOT.",
    }
  }

  const targetPath = join(root, ...validated)
  let targetReal: string
  try {
    targetReal = realpathSync(targetPath)
  } catch {
    return { error: `Error: instruction file not found: "${relativePath}" inside root ${root}.` }
  }

  // Containment (fail closed): the target's realpath must be the root itself
  // or live underneath it — defends against symlink escapes out of the tree.
  if (targetReal !== rootReal && !targetReal.startsWith(rootReal + sep)) {
    return { error: `Error: "${relativePath}" resolves outside the instructions root ${root} (symlink escape rejected).` }
  }

  let stats
  try {
    stats = statSync(targetReal)
  } catch {
    return { error: `Error: instruction file not found: "${relativePath}" inside root ${root}.` }
  }
  if (stats.isDirectory()) {
    return { error: `Error: "${relativePath}" is a directory, not a file (root ${root}) — request exactly one file inside it.` }
  }
  if (!stats.isFile()) {
    return { error: `Error: "${relativePath}" is not a regular file (root ${root}).` }
  }

  try {
    // VERBATIM: full content, no truncation, no added commentary.
    const content = await readFile(targetReal, "utf-8")
    return { content, root, relative: validated.join("/") }
  } catch (e: unknown) {
    return { error: `Error: failed to read "${relativePath}" (${(e as Error).message}).` }
  }
}

export const maestraReadInstructionsTool = tool({
  description:
    'Reads the FULL content of exactly ONE plugin instruction file from the installed instructions tree — use this instead of the host read tool whenever you need kernel, journeys, reference or templates content. Takes a RELATIVE path with posix separators, e.g. "kernel/maestra-kernel.md", "journeys/j1-triage.md", "reference/microcopy.md", "templates/scope.md". Returns the file verbatim and complete. Never lists or dumps the whole tree: instruction loading is lazy BY DESIGN — fetch only the file the current step needs.',
  args: {
    path: tool.schema
      .string()
      .describe('Relative path inside the instructions tree, posix separators (e.g. "kernel/maestra-kernel.md").'),
  },
  async execute(args, _context) {
    const result = await readInstructionFile(args.path, instructionRootCandidates())
    return "error" in result ? result.error : result.content
  },
})
