import { recordPeerSession } from "../tools/ask-peer.js"

/**
 * Peer tracker hook — observes subagent spawns (tool.execute.after on
 * task/actor) and records persona→session for ask_peer's caller-identity
 * gate and peer lookup.
 *
 * Session id extraction is host-specific (verified in refs/):
 *  - OpenCode `task` tool result: metadata.sessionId  (tool/task.ts:187)
 *  - Mimo Code `actor` tool result: metadata.actor_id (tool/actor.ts:502+)
 *
 * Only spawns of catalog specialists (subagent_type prefix "fluxo/") are
 * tracked. The facilitator itself is never spawned as fluxo/* → never enters
 * the map → structurally excluded from ask_peer (caller-identity gate).
 */
export function createPeerTrackerHook() {
  return async (
    input: { tool: string; sessionID: string; callID: string; args?: Record<string, unknown> },
    output: { title?: string; output: string; metadata?: Record<string, unknown> },
  ): Promise<void> => {
    if (input.tool !== "task" && input.tool !== "actor") return

    const subagentType = input.args?.subagent_type
    if (typeof subagentType !== "string" || !subagentType.startsWith("fluxo/")) return

    const sessionId = output.metadata?.sessionId ?? output.metadata?.actor_id
    if (typeof sessionId !== "string" || !sessionId) return

    recordPeerSession(subagentType, sessionId)
  }
}
