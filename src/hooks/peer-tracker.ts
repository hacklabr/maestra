import { recordPeerSession } from "../tools/ask-peer.js"
import { parsePersonaMarker } from "./persona-marker.js"
import { EXPANSION_FAILURE_SIGNATURE } from "./persona-expansion.js"

/**
 * Peer tracker hook (shell-specialist architecture) — observes shell spawns
 * (tool.execute.after on task/actor with subagent_type "maestra/especialista")
 * and registers persona→{sessionId, mesaId} for ask_peer.
 *
 * Persona identity comes from the MARKER in args.prompt (persona::<id>@<mesaId>)
 * — never from subagent_type, which is always the shell.
 *
 * Session id extraction is host-specific (verified in refs/):
 *  - OpenCode `task` tool result: metadata.sessionId  (tool/task.ts:187)
 *  - Mimo Code `actor` tool result: metadata.actor_id (tool/actor.ts:502+)
 *
 * Spawn WITHOUT marker: not registered (ask_peer's caller-identity gate fails
 * closed for that session) AND a warning is appended to the tool output —
 * same output-mutation semantics as the desvios hook (propagates by
 * reference in both hosts).
 *
 * The facilitator itself is never spawned via the shell → never enters the
 * map → structurally excluded from ask_peer (pending decision #2).
 */
const SHELL_AGENT = "maestra/specialist"

const NO_MARKER_WARNING = [
  "",
  "[maestra] Shell spawned WITHOUT persona:: marker — this session CANNOT use ask_peer",
  "(caller-identity fails closed) and will not be found by peers.",
  "Respawn with `persona::<id>@<panelId>` on the first line of the prompt.",
].join("\n")

export function createPeerTrackerHook() {
  return async (
    input: { tool: string; sessionID: string; callID: string; args?: Record<string, unknown> },
    output: { title?: string; output: string; metadata?: Record<string, unknown> },
  ): Promise<void> => {
    if (input.tool !== "task" && input.tool !== "actor") return
    if (input.args?.subagent_type !== SHELL_AGENT) return

    const prompt = input.args.prompt
    if (typeof prompt === "string" && prompt.includes(EXPANSION_FAILURE_SIGNATURE)) {
      // Persona-expansion already failed loudly — do not register, do not warn again
      return
    }

    const marker = typeof prompt === "string" ? parsePersonaMarker(prompt) : null

    if (!marker) {
      output.output += NO_MARKER_WARNING
      return
    }

    const sessionId = output.metadata?.sessionId ?? output.metadata?.actor_id
    if (typeof sessionId !== "string" || !sessionId) return

    recordPeerSession(marker.personaId, sessionId, marker.mesaId)
  }
}
