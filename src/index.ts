import type { Hooks, Plugin } from "./host-types.js"
import { maestraStatusTool } from "./tools/status.js"
import { maestraIssueDigestTool } from "./tools/digest.js"
import { askPeerTool, setSdkClient } from "./tools/ask-peer.js"
import { maestraEmitEventTool } from "./tools/emit-event.js"
import { maestraReadInstructionsTool } from "./tools/read-instructions.js"
import { createDesviosHook } from "./hooks/desvios.js"
import { createPeerTrackerHook } from "./hooks/peer-tracker.js"
import { createPersonaExpansionHook, resolveCatalogRoot } from "./hooks/persona-expansion.js"
import { PLUGIN_VERSION } from "./version.js"

export const maestra: Plugin = async (input): Promise<Hooks> => {
  setSdkClient(input.client)

  const personaExpansion = createPersonaExpansionHook({
    catalogRoot: resolveCatalogRoot(input.directory),
  })
  const peerTracker = createPeerTrackerHook()
  const desviosHook = createDesviosHook()

  return {
    tool: {
      maestra_status: maestraStatusTool,
      maestra_issue_digest: maestraIssueDigestTool,
      ask_peer: askPeerTool,
      maestra_emit_event: maestraEmitEventTool,
      maestra_read_instructions: maestraReadInstructionsTool,
    },

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
      output.system.push(
        [
          "<maestra-plugin>",
          `Maestra plugin v${PLUGIN_VERSION} is installed.`,
          "The `maestra` primary agent facilitates the development workflow",
          "(triage → three stages → reconciliation). Switch with /agent maestra.",
          "</maestra-plugin>",
        ].join("\n"),
      )
    },
  }
}

export default maestra
