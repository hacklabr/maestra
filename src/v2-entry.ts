import { TOOL_REGISTRY } from "./tools/registry.js"
import { setPeerApi } from "./tools/ask-peer.js"
import { makeV2PeerApi, type V2SessionClientSubset } from "./tools/peer-session-api.js"
import { createDesviosHook } from "./hooks/desvios.js"
import { createPeerTrackerHook } from "./hooks/peer-tracker.js"
import { createPersonaExpansionHook, resolveCatalogRoot } from "./hooks/persona-expansion.js"
import {
  adaptToolToV2,
  appendV2ResultText,
  v2ResultText,
  type V2ToolDefinition,
  type V2ToolResult,
} from "./v2/tool-adapter.js"
import { bannerText } from "./banner.js"

/**
 * OpenCode V2 entrypoint (`setup(ctx)` in the dual export).
 *
 * Structural subset of the V2 plugin context (verified against
 * @opencode/plugin 2.x types). Hook/transform registrations are scoped to the
 * plugin runtime and disposed automatically on unload — no explicit cleanup
 * (in-memory peer state keeps V1 semantics).
 */

export interface V2ToolBeforeEvent {
  readonly tool: string
  readonly sessionID: string
  readonly id: string
  /** Mutable args of the call — mutations propagate to execution. */
  input: unknown
}

export interface V2ToolAfterEvent {
  readonly tool: string
  readonly sessionID: string
  readonly id: string
  readonly input?: unknown
  readonly status: "completed" | "error"
  /** Present when status === "completed"; mutable by replacement. */
  result?: V2ToolResult
  error?: unknown
}

export interface MaestraV2Context {
  location: { directory: string }
  tool: {
    transform(callback: (editor: { add(def: V2ToolDefinition): void }) => void): Promise<unknown>
    hook(name: "execute.before", callback: (event: V2ToolBeforeEvent) => Promise<void> | void): Promise<unknown>
    hook(name: "execute.after", callback: (event: V2ToolAfterEvent) => Promise<void> | void): Promise<unknown>
  }
  session: V2SessionClientSubset & {
    hook(
      name: "context",
      callback: (event: { system: Array<{ type: string; text: string }> }) => Promise<void> | void,
    ): Promise<unknown>
  }
}

export async function setupV2(ctx: MaestraV2Context): Promise<void> {
  // V2's tool-execution context carries no project directory — the plugin's
  // location is the per-project stand-in (same value V1 passed as `directory`).
  const directory = ctx.location.directory
  setPeerApi(makeV2PeerApi(ctx.session))

  const personaExpansion = createPersonaExpansionHook({
    catalogRoot: resolveCatalogRoot(directory),
  })
  const peerTracker = createPeerTrackerHook()
  const desviosHook = createDesviosHook()

  await ctx.tool.transform((editor) => {
    for (const { name, def } of TOOL_REGISTRY) {
      editor.add(adaptToolToV2(name, def, directory))
    }
  })

  // Persona expansion FIRST (before-execution): rewrites shell-spawn prompts
  // before execution — any later before-hook sees the expanded args.
  await ctx.tool.hook("execute.before", async (event) => {
    const args = (event.input ?? {}) as Record<string, unknown>
    await personaExpansion(
      { tool: event.tool, sessionID: event.sessionID, callID: event.id },
      { args },
    )
  })

  // Order matters (same as V1): the tracker populates persona→session
  // (ask_peer's caller-identity gate); the desvios validator is path-matched
  // and cheap on non-desvios writes.
  await ctx.tool.hook("execute.after", async (event) => {
    if (event.status !== "completed" || event.result === undefined) return
    const result = event.result
    const originalText = v2ResultText(result)
    const adaptedOutput = {
      output: originalText,
      metadata: result.metadata as Record<string, unknown> | undefined,
    }
    const input = {
      tool: event.tool,
      sessionID: event.sessionID,
      callID: event.id,
      args: event.input as Record<string, unknown> | undefined,
    }
    await peerTracker(input, adaptedOutput)
    await desviosHook(input, adaptedOutput)
    if (adaptedOutput.output !== originalText) {
      event.result = appendV2ResultText(result, adaptedOutput.output.slice(originalText.length))
    }
  })

  // Banner on the agent loop only ("context") — V2 equivalent of the V1
  // experimental.chat.system.transform (decision: no title/generate/compaction).
  await ctx.session.hook("context", (event) => {
    event.system.push({ type: "text", text: bannerText() })
  })
}
