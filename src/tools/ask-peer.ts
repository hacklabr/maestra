import { tool } from "../host-types.js"
import type { ToolContext } from "../host-types.js"

/**
 * ask_peer — specialist↔specialist consultation inside a sequential mesa turn (J9).
 *
 * Ported from Mesa's peer-tools.ts WITHOUT the state machine:
 *  - no SQLite, no register_analysis, no rigor profiles, no phases
 *  - persona→session map is session-scoped, in-memory, populated by the
 *    peer-tracker hook (tool.execute.after on task/actor spawns of fluxo/*)
 *
 * Guards (spec D1/D8):
 *  - caller-identity gate: the caller's session MUST be a spawned specialist
 *    session. The facilitator is the PARENT of spawned sessions and is never
 *    a value in the map → mechanically excluded (pending decision #2 closed
 *    structurally, not by instruction).
 *  - anti-cycle by BUSY-CHECK: a peer mid-execution rejects new questions.
 *    This is what kills A→B→C→A (A is busy awaiting B when C consults A).
 *  - rate cap in-tool: bounded consultations per caller×peer pair per session.
 */

/** Max consultations per caller→peer pair per session (sequential mesa). */
export const PEER_CONSULTATION_CAP = 3

/** personaId → opencode/mimo session id of the spawned specialist. */
const peerSessions = new Map<string, string>()

/** `${callerPersona}:${peerPersona}` → consultations used this session. */
const consultationCounts = new Map<string, number>()

/** Structural subset of the host SDK client (identical in OpenCode and Mimo). */
type SdkSessionClient = {
  session: {
    status(opts?: {
      query?: { directory?: string }
    }): Promise<{ data?: Record<string, { type: string }> }>
    prompt(opts: {
      path: { id: string }
      body: {
        agent?: string
        parts: Array<{ type: string; text: string }>
        tools?: Record<string, boolean>
      }
    }): Promise<{
      data?: { parts?: Array<{ type: string; text?: string }> }
    }>
  }
}

let sdkClient: SdkSessionClient | null = null

export function setSdkClient(client: unknown): void {
  sdkClient = client as SdkSessionClient
}

/** Registers a spawned specialist session. Called by the peer-tracker hook. */
export function recordPeerSession(personaId: string, sessionId: string): void {
  const normalized = personaId.startsWith("fluxo/") ? personaId.slice("fluxo/".length) : personaId
  if (normalized && sessionId) peerSessions.set(normalized, sessionId)
}

/** Reverse-lookup: which spawned persona owns this session, if any. */
export function findCallerPersona(sessionId: string): string | undefined {
  for (const [persona, sid] of peerSessions) {
    if (sid === sessionId) return persona
  }
  return undefined
}

/** Test/session teardown hook. */
export function clearPeerState(): void {
  peerSessions.clear()
  consultationCounts.clear()
}

export const askPeerTool = tool({
  description:
    "Ask a peer specialist a direct question during a sequential discussion round (mesa, J9). The peer receives the question in their REAL session and responds with full context from previous turns. UNIDIRECTIONAL: you ask, the peer answers — do NOT use it to reply to a consultation you received; reply in your own output instead. Restricted to specialist↔specialist: the facilitator is mechanically excluded (caller-identity). A peer mid-execution rejects new questions (busy-check anti-cycle). Rate-limited to 3 consultations per caller→peer pair per session. Be targeted — do not ask vague questions.",
  args: {
    peer_id: tool.schema
      .string()
      .describe("Persona ID of the peer specialist to consult (without the 'fluxo/' prefix)"),
    question: tool.schema.string().describe("The question. Be specific and concise."),
  },
  async execute(args, context: ToolContext) {
    if (!sdkClient) {
      return "Error: SDK client not available (plugin not initialized)."
    }

    // Gate 1 — caller-identity: only spawned specialists may consult peers.
    // The facilitator's session is never registered as a spawned persona →
    // structurally excluded (spec D8, pending decision #2).
    const callerPersona = findCallerPersona(context.sessionID)
    if (!callerPersona) {
      return (
        "Error: ask_peer is restricted to specialists inside a sequential mesa turn. " +
        "The facilitator orchestrates and synthesizes — it does not consult. " +
        "Use task/actor for one-hop specialist consultation instead."
      )
    }

    const peerPersona = args.peer_id.startsWith("fluxo/")
      ? args.peer_id.slice("fluxo/".length)
      : args.peer_id

    // Gate 2 — the peer must have been spawned in this mesa (session-scoped map).
    const peerSessionId = peerSessions.get(peerPersona)
    if (!peerSessionId) {
      return (
        `Error: peer "${peerPersona}" has no session in this mesa. ` +
        `The facilitator must spawn the specialist (task/actor with subagent_type "fluxo/${peerPersona}") ` +
        `in this session before peer consultation is possible.`
      )
    }

    // Gate 3 — anti-cycle busy-check: a peer mid-execution rejects questions.
    // A→B→C→A dies here: A is busy awaiting B's answer when C consults A.
    try {
      const statusResult = await sdkClient.session.status({
        query: { directory: context.directory },
      })
      const peerStatus = statusResult.data?.[peerSessionId]
      if (peerStatus && peerStatus.type === "busy") {
        return (
          `Error: peer "${peerPersona}" is currently busy (mid-execution). ` +
          `Peer consultation is only possible when the peer is idle — ` +
          `wait for the peer's turn to complete before consulting.`
        )
      }
    } catch {
      // Status check is best-effort; proceed on failure (Mesa behavior).
    }

    // Gate 4 — rate cap per caller→peer pair per session.
    const pairKey = `${callerPersona}:${peerPersona}`
    const used = consultationCounts.get(pairKey) ?? 0
    if (used >= PEER_CONSULTATION_CAP) {
      return (
        `Error: consultation cap reached (${used}/${PEER_CONSULTATION_CAP}) for ` +
        `${callerPersona}→${peerPersona} in this session. Bring the point to your own ` +
        `output — the facilitator synthesizes divergences in the mesa synthesis.`
      )
    }
    consultationCounts.set(pairKey, used + 1)

    // Contamination path (deliberate, ported from Mesa): the question enters
    // the peer's REAL session history; the peer's next turn carries it.
    // Delegation and nested consultations are disabled in the answer context.
    try {
      const promptResult = await sdkClient.session.prompt({
        path: { id: peerSessionId },
        body: {
          parts: [
            {
              type: "text",
              text: `[Peer consultation from ${callerPersona}]\n\n${args.question}`,
            },
          ],
          tools: {
            task: false,
            actor: false,
            ask_peer: false,
          },
        },
      })

      const parts = promptResult.data?.parts ?? []
      const textParts = parts.filter((p) => p.type === "text" && p.text).map((p) => p.text!)
      const responseText = textParts.length > 0 ? textParts.join("\n") : "(no response)"

      return {
        output: responseText,
        metadata: {
          peerId: peerPersona,
          callerId: callerPersona,
          consultationsUsed: used + 1,
          consultationsCap: PEER_CONSULTATION_CAP,
        },
      }
    } catch (e: unknown) {
      const err = e as Error
      return `Error: peer consultation with "${peerPersona}" failed: ${err.message}`
    }
  },
})
