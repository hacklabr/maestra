import type { Hooks, Plugin } from "./host-types.js"
import { fluxoStatusTool } from "./tools/status.js"
import { fluxoIssueDigestTool } from "./tools/digest.js"
import { askPeerTool, setSdkClient } from "./tools/ask-peer.js"
import { fluxoEmitEventTool } from "./tools/emit-event.js"
import { createDesviosHook } from "./hooks/desvios.js"
import { createPeerTrackerHook } from "./hooks/peer-tracker.js"
import { PLUGIN_VERSION } from "./version.js"

export const fluxoFacilitador: Plugin = async (input): Promise<Hooks> => {
  setSdkClient(input.client)

  const peerTracker = createPeerTrackerHook()
  const desviosHook = createDesviosHook()

  return {
    tool: {
      fluxo_status: fluxoStatusTool,
      fluxo_issue_digest: fluxoIssueDigestTool,
      ask_peer: askPeerTool,
      fluxo_emit_event: fluxoEmitEventTool,
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
          "<fluxo-plugin>",
          `Fluxo facilitator plugin v${PLUGIN_VERSION} is installed.`,
          "The `fluxo` primary agent facilitates the development workflow",
          "(triage → three etapas → reconciliation). Switch with /agent fluxo.",
          "</fluxo-plugin>",
        ].join("\n"),
      )
    },
  }
}

export default fluxoFacilitador
