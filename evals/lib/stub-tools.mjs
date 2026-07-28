/**
 * Deterministic stub tool layer for evals. The model under test gets the SAME
 * tool surface as production (4 plugin tools + bash + read/write); the stubs
 * answer from fixtures and RECORD every call for tier-1 order/hard-fail
 * asserts. Missing read routes fail loud (exit 127 — a fixture bug, never
 * silent data). Mutations succeed generically and are recorded.
 */

export const TOOL_SURFACE = [
  {
    type: "function",
    function: {
      name: "maestra_status",
      description: "Environment probe: host, issue platform, CLI auth, board access, MCP configured.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "maestra_issue_digest",
      description: "Factual parser of Fluxo conventions for an issue (labels, children one by one, gate arithmetic, comments, board, reconciliation).",
      parameters: {
        type: "object",
        properties: { issue: { type: "number" } },
        required: ["issue"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "maestra_emit_event",
      description: "Emit an instrumentation event (A–F) or override register (type=override) as a structured comment, signed by construction.",
      parameters: {
        type: "object",
        properties: {
          epic: { type: "number" },
          type: { type: "string", enum: ["A", "B", "C", "D", "E", "F", "override"] },
          payload: { type: "object" },
        },
        required: ["epic", "type", "payload"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "bash",
      description: "Run a shell command (platform operations: gh/glab CLI, git).",
      parameters: {
        type: "object",
        properties: { command: { type: "string" } },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read",
      description: "Read a file from the repository.",
      parameters: {
        type: "object",
        properties: { filePath: { type: "string" } },
        required: ["filePath"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "task",
      description: "Spawn a subagent (OpenCode dialect). Shell-specialist architecture: subagent_type 'maestra/specialist' + marker persona::<id>@<panelId> on the prompt's first line.",
      parameters: {
        type: "object",
        properties: {
          subagent_type: { type: "string" },
          prompt: { type: "string" },
          description: { type: "string" },
          task_id: { type: "string" },
        },
        required: ["subagent_type", "prompt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read",
      description: "Read a file from the repository.",
      parameters: {
        type: "object",
        properties: { filePath: { type: "string" } },
        required: ["filePath"],
      },
    },
  },
]

const MUTATION = /(issue\s+(create|edit|close|comment)|issue\s+comment|label|item-edit|item-add|project\s|milestone|api\s+[^\n]*-X\s*(POST|PATCH|PUT|DELETE)|api\s+[^\n]*-f\s|git\s+(worktree\s+add|commit|checkout|switch|add))/i

const SHELL_AGENT = "maestra/specialist"
const MARKER_PATTERN = /persona::([a-z0-9][a-z0-9-]*)(?:@([\w.-]+))?/

const NO_MARKER_WARNING = [
  "",
  "[maestra] Shell spawned WITHOUT persona:: marker — this session will NOT be able to use ask_peer",
  "(caller-identity fails closed) and won't be found by peers.",
  "Respawn with `persona::<id>@<panelId>` on the first line of the prompt.",
].join("\n")

export function createStubExecutor({ fixture, repoFiles = {} }) {
  const files = { ...repoFiles }
  const calls = []
  const digests = fixture.digests ?? (fixture.digest ? { "*": fixture.digest } : {})
  /** Shell-specialist emulation: registered persona sessions (the peer-tracker's map). */
  const panel = { sessions: [] }

  function record(call) {
    calls.push({ ...call, afterTurn: record.turnCount ?? 0 })
    return calls[calls.length - 1]
  }

  /**
   * Emulates persona-expansion + peer-tracker around a shell spawn:
   * marker on the first line → session registered; no marker → fail-closed
   * warning, NOT registered. Response text is fixture-configurable per persona
   * (persona-declaration mismatch scenarios).
   */
  function executeShellSpawn(args) {
    const prompt = String(args.prompt ?? "")
    const firstLine = prompt.split("\n")[0] ?? ""
    const marker = MARKER_PATTERN.exec(firstLine)

    if (!marker) {
      return `Subagent finished.\n${NO_MARKER_WARNING}`
    }

    const personaId = marker[1]
    const panelId = marker[2]
    const taskId = args.task_id ?? args.actor_id
    const existing = taskId ? panel.sessions.find((s) => s.taskId === taskId) : null
    const sessionId = existing?.sessionId ?? `sess-${taskId ?? `${personaId}@${panelId ?? "standalone"}-${panel.sessions.length + 1}`}`
    if (!existing) {
      panel.sessions.push({ personaId, panelId, sessionId, taskId: taskId ?? null })
    }

    const perPersona = fixture.specialists?.[personaId] ?? {}
    if (perPersona.response) return perPersona.response
    // Full id is always a coherent declaration (division-agnostic; the
    // persona-declarations assert accepts id or hyphen-boundary tail).
    return `[${personaId}] Simulated specialist position (turn).`
  }

  function execute(name, args = {}) {
    if (name === "maestra_status") {
      record({ kind: "tool", name, args })
      return JSON.stringify(
        fixture.status ?? {
          host: "opencode",
          platform: { kind: "github", cli: "ok", mcp: "absent", board: "ok", hierarchy: "sub-issues" },
          plugin: "0.1.0",
        },
      )
    }

    if (name === "maestra_issue_digest") {
      record({ kind: "tool", name, args })
      const digest = digests[String(args.issue)] ?? digests["*"]
      if (!digest) return `Error: no digest fixture for issue #${args.issue}`
      return JSON.stringify(digest)
    }

    if (name === "maestra_emit_event") {
      record({ kind: "tool", name, args })
      return `Event ${args.type} registered on #${args.epic} (github):\n**Event ${args.type}** — facilitator`
    }

    if (name === "task" || name === "actor") {
      const call = record({ kind: "tool", name, args })
      const result =
        args.subagent_type === SHELL_AGENT
          ? executeShellSpawn(args)
          : `Subagent ${args.subagent_type} finished (generic stub).`
      call.result = result.slice(0, 400)
      return result
    }

    if (name === "bash") {
      const command = String(args.command ?? "")
      record({ kind: "exec", command })
      for (const route of fixture.execRoutes ?? []) {
        if (new RegExp(route.match, "i").test(command)) {
          if (route.code && route.code !== 0) {
            return JSON.stringify({ stdout: route.stdout ?? "", stderr: route.stderr ?? "", code: route.code })
          }
          return route.stdout ?? JSON.stringify({ stdout: route.stdout ?? "", stderr: "", code: 0 })
        }
      }
      if (MUTATION.test(command)) {
        return JSON.stringify({ stdout: "", stderr: "", code: 0 })
      }
      // Loud failure on unmatched reads: a missing route is a FIXTURE bug.
      return JSON.stringify({ stdout: "", stderr: `no stub route for: ${command}`, code: 127 })
    }

    if (name === "read") {
      record({ kind: "tool", name, args })
      const content = files[args.filePath]
      return content ?? `Error: ENOENT: ${args.filePath}`
    }

    if (name === "write") {
      files[args.filePath] = String(args.content ?? "")
      record({ kind: "write", path: args.filePath })
      return `File written: ${args.filePath}`
    }

    record({ kind: "tool", name, args })
    return `Error: unknown tool "${name}" in the eval stub layer`
  }

  return {
    execute,
    calls,
    files,
    panel,
    /** Marks the global position of a call within a turn (used by hard-fail rules). */
    markTurn(turnIdx) {
      record.turnCount = turnIdx
    },
  }
}
