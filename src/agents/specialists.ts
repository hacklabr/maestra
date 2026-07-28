import type { Persona } from "../catalog/types.js"
import type { RosterEntry } from "../catalog/roster.js"
import type { HostId } from "./fluxo-agent.js"

/**
 * Specialist subagent generation (spec D5). Mirrors Mesa's generate-agents.js
 * subdirectory namespacing (agents/fluxo/<id>.md → spawnable as "fluxo/<id>")
 * with two deliberate differences:
 *
 *  1. NON-HIDDEN: Mimo's actor enum only lists `mode: subagent && !hidden`
 *     (actor.ts:325) — Mesa's hidden:true would make specialists unspawnable
 *     there. We omit `hidden` entirely (default false).
 *  2. Per-host permission dialect: subagent spawning is `task` on OpenCode
 *     and `actor` on Mimo — both denied here so a specialist cannot nest
 *     subagents (A→B→C→A via task is dead; ask_peer is the only consultation
 *     channel, and it is guarded in-tool).
 *
 * Description = the roster's one-line domain (per-message tax on Mimo).
 */
export function buildSpecialistMarkdown(host: HostId, persona: Persona, entry: RosterEntry): string {
  const denyKey = host === "opencode" ? "task" : "actor"
  return [
    "---",
    `description: ${entry.domain}`,
    "mode: subagent",
    "permission:",
    "  edit: allow",
    "  write: allow",
    "  bash: allow",
    `  ${denyKey}:`,
    '    "*": deny',
    "---",
    "",
    persona.systemPrompt || `You are ${persona.name}. ${persona.description}`,
    "",
  ].join("\n")
}
