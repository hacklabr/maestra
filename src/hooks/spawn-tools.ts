/**
 * Shell-spawn matching across host generations (spec D4):
 *  - OpenCode V1: `task` tool, arg `subagent_type`
 *  - Mimo Code:   `actor` tool, arg `subagent_type`
 *  - OpenCode V2: `subagent` tool (`task` is a deprecated alias), arg `agent`
 *
 * Persona identity NEVER comes from this field (it is always the shell);
 * it only scopes the hooks to maestra shell spawns (zero blast radius).
 */

export const SHELL_AGENT = "maestra/specialist"

const SPAWN_TOOLS = new Set(["task", "actor", "subagent"])

/** True when the tool call is a spawn of the maestra shell specialist. */
export function isShellSpawn(
  tool: string,
  args: Record<string, unknown> | undefined,
  shellAgent: string = SHELL_AGENT,
): boolean {
  if (!SPAWN_TOOLS.has(tool)) return false
  const agent = args?.subagent_type ?? args?.agent
  return agent === shellAgent
}

/**
 * Session-id extraction from a spawn result's metadata — host-specific keys
 * (OpenCode `sessionId`; Mimo `actor_id`; V2 may surface branded `sessionID`).
 */
export function extractSpawnSessionId(metadata: Record<string, unknown> | undefined): string | null {
  const candidate = metadata?.sessionId ?? metadata?.actor_id ?? metadata?.sessionID
  return typeof candidate === "string" && candidate.length > 0 ? candidate : null
}
