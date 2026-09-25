import type { Hooks, PluginInput } from "./host-types.js"
import { setSdkClient } from "./tools/ask-peer.js"
import { TOOL_REGISTRY } from "./tools/registry.js"
import { createDesviosHook } from "./hooks/desvios.js"
import { createPeerTrackerHook } from "./hooks/peer-tracker.js"
import { createPersonaExpansionHook, resolveCatalogRoot } from "./hooks/persona-expansion.js"
import { bannerText } from "./banner.js"

/**
 * OpenCode V1 / Mimo Code entrypoint — the plugin function body, unchanged
 * (extracted from index.ts in R25). Reached through the dual export's
 * `server()` method (V1 object entrypoint, OpenCode >= 1.18.29) and kept
 * exported as `maestra` for direct/test use.
 */
export async function buildV1Hooks(input: PluginInput): Promise<Hooks> {
  setSdkClient(input.client)

  const personaExpansion = createPersonaExpansionHook({
    catalogRoot: resolveCatalogRoot(input.directory),
  })
  const peerTracker = createPeerTrackerHook()
  const desviosHook = createDesviosHook()

  return {
    tool: Object.fromEntries(TOOL_REGISTRY.map(({ name, def }) => [name, def])),

    "tool.execute.before": async (hookInput, output) => {
      // Persona expansion FIRST: rewrites shell-spawn prompts before execution
      // (any future before-hook sees the expanded args).
      await personaExpansion(hookInput, output)
    },

    "tool.execute.after": async (hookInput, output) => {
      // Order matters: the tracker populates persona→session (ask_peer's
      // caller-identity gate); the desvios validator is path-matched and
      // cheap on non-desvios writes.
      await peerTracker(hookInput, output)
      await desviosHook(hookInput, output)
    },

    "experimental.chat.system.transform": async (_hookInput, output) => {
      output.system.push(bannerText())
    },
  }
}
