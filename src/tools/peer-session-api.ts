/**
 * PeerSessionApi — host-agnostic seam for ask_peer's session operations
 * (spec D4 pattern: one interface, one implementation per host API
 * generation).
 *
 *  - V1 (`makeV1PeerApi`): OpenCode V1 / Mimo Code SDK client shapes
 *    (`session.status({query})`, `session.prompt({path, body})`).
 *  - V2 (`makeV2PeerApi`): OpenCode V2 plugin context (`ctx.session.*`).
 *    `prompt` returns an admission, not the answer — the answer is collected
 *    via `wait` + `context()`; busy state is derived from `time.idle` vs
 *    `time.updated` (no direct status endpoint in V2).
 */

export interface ConsultationInput {
  peerSessionId: string
  callerPersona: string
  peerPersona: string
  question: string
  /** Project directory for this session. */
  directory: string
}

export interface PeerSessionApi {
  /**
   * Best-effort busy check for the peer's session.
   * Resolves `null` when busy state cannot be determined (proceed on failure).
   */
  isBusy(peerSessionId: string, directory: string): Promise<boolean | null>
  /**
   * Sends the question into the peer's REAL session (contamination path,
   * deliberate — the question enters the peer's history) and resolves the
   * peer's answer text.
   */
  consult(input: ConsultationInput): Promise<string>
}

/**
 * Consultation prompt text. The no-delegation instruction is textual in BOTH
 * generations: V2's PromptInput has no tools map (verified against
 * @opencode/plugin 2.x types), so the instruction is the portable contract;
 * the V1 implementation additionally disables the tools mechanically.
 */
export function buildConsultationText(input: ConsultationInput): string {
  return [
    `[Peer consultation from ${input.callerPersona}]`,
    ``,
    input.question,
    ``,
    `Answer directly in your own output — do NOT delegate (task/actor/subagent) and do NOT consult other peers (ask_peer).`,
  ].join("\n")
}

/** Structural subset of the V1 SDK session client (identical in OpenCode and Mimo). */
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

export function makeV1PeerApi(client: unknown): PeerSessionApi {
  const sdk = client as SdkSessionClient
  return {
    async isBusy(peerSessionId, directory) {
      try {
        const statusResult = await sdk.session.status({
          query: { directory },
        })
        const peerStatus = statusResult.data?.[peerSessionId]
        return peerStatus ? peerStatus.type === "busy" : null
      } catch {
        // Status check is best-effort; proceed on failure (Mesa behavior).
        return null
      }
    },
    async consult(input) {
      const promptResult = await sdk.session.prompt({
        path: { id: input.peerSessionId },
        body: {
          parts: [{ type: "text", text: buildConsultationText(input) }],
          tools: {
            task: false,
            actor: false,
            ask_peer: false,
          },
        },
      })
      const parts = promptResult.data?.parts ?? []
      const textParts = parts.filter((p) => p.type === "text" && p.text).map((p) => p.text!)
      return textParts.length > 0 ? textParts.join("\n") : "(no response)"
    },
  }
}

/** Structural subset of a V2 session message (tagged union — only what we read). */
export interface V2SessionMessage {
  type: string
  content?: ReadonlyArray<{ type: string; text?: string }>
}

/**
 * Structural subset of the V2 plugin-context session domain, verified against
 * @opencode/plugin 2.x types (`SessionDomain`).
 */
export interface V2SessionClientSubset {
  get(input: { sessionID: string }): Promise<{ time?: { idle?: number; updated?: number } }>
  prompt(input: { sessionID: string; text: string }): Promise<unknown>
  wait(input: { sessionID: string }): Promise<void>
  context(input: { sessionID: string }): Promise<readonly V2SessionMessage[]>
}

export function makeV2PeerApi(session: V2SessionClientSubset): PeerSessionApi {
  return {
    async isBusy(peerSessionId) {
      try {
        const info = await session.get({ sessionID: peerSessionId })
        const idle = info?.time?.idle
        const updated = info?.time?.updated
        if (typeof idle !== "number" || typeof updated !== "number") return null
        // A session mid-execution was updated after its last idle mark.
        return idle < updated
      } catch {
        return null
      }
    },
    async consult(input) {
      await session.prompt({
        sessionID: input.peerSessionId,
        text: buildConsultationText(input),
      })
      // The V2 prompt call admits the input; the peer's answer arrives when
      // the agent loop completes (wait) and is read from the transcript.
      await session.wait({ sessionID: input.peerSessionId })
      const messages = await session.context({ sessionID: input.peerSessionId })
      const lastAssistant = [...messages].reverse().find((m) => m.type === "assistant")
      const texts = (lastAssistant?.content ?? [])
        .filter((p) => p.type === "text" && typeof p.text === "string")
        .map((p) => p.text as string)
      return texts.length > 0 ? texts.join("\n") : "(no response)"
    },
  }
}
