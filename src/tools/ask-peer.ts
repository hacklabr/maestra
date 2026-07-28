import { tool } from "../host-types.js"
import type { ToolContext } from "../host-types.js"

/**
 * ask_peer — specialist↔specialist consultation inside a sequential mesa turn (J9).
 *
 * Shell-specialist architecture: persona identity comes from the spawn-prompt
 * marker (persona::<id>@<mesaId>), registered by the peer-tracker hook —
 * NEVER from subagent_type (always fluxo/especialista).
 *
 * Guards (spec D1/D8):
 *  - caller-identity gate: the caller's session MUST be a registered shell
 *    spawn. The facilitator is never spawned via the shell → mechanically
 *    excluded (pending decision #2 closed structurally).
 *  - per-mesa routing: a caller reaches peers IN THE SAME MESA (parallel
 *    mesas may share persona ids — sessions are disambiguated by mesaId).
 *  - anti-cycle by BUSY-CHECK: a peer mid-execution rejects new questions
 *    (A is busy awaiting B when C consults A → cycle dies).
 *  - rate cap in-tool: 3 consultations per caller→peer pair PER MESA.
 */

/** Max consultations per caller→peer pair per mesa (human-approved). */
export const PEER_CONSULTATION_CAP = 3

export interface PeerEntry {
  sessionId: string
  mesaId?: string
}

export interface CallerIdentity {
  persona: string
  mesaId?: string
}

/** personaId → spawned shell sessions (multi-session for parallel mesas). */
const peerSessions = new Map<string, PeerEntry[]>()

/** `${mesa|avulso}:${callerPersona}:${peerPersona}` → consultations used. */
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

/** Registers a spawned shell session. Called by the peer-tracker hook. */
export function recordPeerSession(personaId: string, sessionId: string, mesaId?: string): void {
  const normalized = personaId.startsWith("fluxo/") ? personaId.slice("fluxo/".length) : personaId
  if (!normalized || !sessionId) return
  const entries = peerSessions.get(normalized) ?? []
  entries.push({ sessionId, mesaId })
  peerSessions.set(normalized, entries)
}

/** Reverse-lookup: which spawned persona (+mesa) owns this session, if any. */
export function findCallerPersona(sessionId: string): CallerIdentity | undefined {
  for (const [persona, entries] of peerSessions) {
    for (const entry of entries) {
      if (entry.sessionId === sessionId) return { persona, mesaId: entry.mesaId }
    }
  }
  return undefined
}

/**
 * Resolves the peer's session within the caller's mesa.
 * Callers without mesa (avulso one-off consultations) reach avulso peers;
 * ambiguity (same persona spawned twice in the same scope) resolves to the
 * most recent spawn, flagged in the result.
 */
export function resolvePeerSession(
  peerPersona: string,
  callerMesa: string | undefined,
): { sessionId: string; ambiguous: boolean } | { error: string } {
  const entries = peerSessions.get(peerPersona) ?? []
  if (entries.length === 0) {
    return {
      error:
        `Error: peer "${peerPersona}" has no session in this context. ` +
        `The facilitator must spawn the shell specialist (task/actor with subagent_type ` +
        `"fluxo/especialista" and marker \`persona::${peerPersona}@<mesaId>\` in the prompt) first.`,
    }
  }

  const sameScope = entries.filter((e) => e.mesaId === callerMesa)
  if (sameScope.length === 0) {
    const scope = callerMesa ? `mesa "${callerMesa}"` : "this one-off context"
    return {
      error:
        `Error: peer "${peerPersona}" was not spawned in ${scope}. ` +
        `Parallel mesas are isolated — the facilitator must spawn \`persona::${peerPersona}@${callerMesa ?? ""}\` here.`,
    }
  }

  const chosen = sameScope[sameScope.length - 1]
  return { sessionId: chosen.sessionId, ambiguous: sameScope.length > 1 }
}

/** Test/session teardown hook. */
export function clearPeerState(): void {
  peerSessions.clear()
  consultationCounts.clear()
}

export const askPeerTool = tool({
  description:
    "Ask a peer specialist a direct question during a sequential discussion round (mesa, J9). The peer receives the question in their REAL session and responds with full context from previous turns. UNIDIRECTIONAL: you ask, the peer answers — do NOT use it to reply to a consultation you received; reply in your own output instead. Restricted to specialist↔specialist IN THE SAME MESA: the facilitator is mechanically excluded (caller-identity). A peer mid-execution rejects new questions (busy-check anti-cycle). Rate-limited to 3 consultations per caller→peer pair per mesa. Be targeted — do not ask vague questions.",
  args: {
    peer_id: tool.schema
      .string()
      .describe("Persona ID of the peer specialist to consult (catalog id, e.g. 'software-development-backend-architect')"),
    question: tool.schema.string().describe("The question. Be specific and concise."),
  },
  async execute(args, context: ToolContext) {
    if (!sdkClient) {
      return "Error: SDK client not available (plugin not initialized)."
    }

    // Gate 1 — caller-identity: only registered shell specialists may consult.
    // The facilitator's session is never a shell spawn → structurally excluded.
    const caller = findCallerPersona(context.sessionID)
    if (!caller) {
      return (
        "Error: ask_peer is restricted to specialists inside a sequential mesa turn. " +
        "The facilitator orchestrates and synthesizes — it does not consult. " +
        "Use task/actor for one-hop specialist consultation instead."
      )
    }

    const peerPersona = args.peer_id.startsWith("fluxo/")
      ? args.peer_id.slice("fluxo/".length)
      : args.peer_id

    // Gate 2 — per-mesa routing: the peer must live in the caller's mesa.
    const resolved = resolvePeerSession(peerPersona, caller.mesaId)
    if ("error" in resolved) {
      return resolved.error
    }

    // Gate 3 — anti-cycle busy-check: a peer mid-execution rejects questions.
    // A→B→C→A dies here: A is busy awaiting B's answer when C consults A.
    try {
      const statusResult = await sdkClient.session.status({
        query: { directory: context.directory },
      })
      const peerStatus = statusResult.data?.[resolved.sessionId]
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

    // Gate 4 — rate cap per caller→peer pair per mesa.
    const scope = caller.mesaId ?? "avulso"
    const pairKey = `${scope}:${caller.persona}:${peerPersona}`
    const used = consultationCounts.get(pairKey) ?? 0
    if (used >= PEER_CONSULTATION_CAP) {
      return (
        `Error: consultation cap reached (${used}/${PEER_CONSULTATION_CAP}) for ` +
        `${caller.persona}→${peerPersona} in ${scope}. Bring the point to your own ` +
        `output — the facilitator synthesizes divergences in the mesa synthesis.`
      )
    }
    consultationCounts.set(pairKey, used + 1)

    // Contamination path (deliberate, ported from Mesa): the question enters
    // the peer's REAL session history; the peer's next turn carries it.
    // Delegation and nested consultations are disabled in the answer context.
    try {
      const promptResult = await sdkClient.session.prompt({
        path: { id: resolved.sessionId },
        body: {
          parts: [
            {
              type: "text",
              text: `[Peer consultation from ${caller.persona}]\n\n${args.question}`,
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
          callerId: caller.persona,
          mesa: scope,
          ...(resolved.ambiguous ? { warning: "multiple sessions for this persona in scope; routed to the most recent" } : {}),
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
