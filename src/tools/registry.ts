import { maestraStatusTool } from "./status.js"
import { maestraIssueDigestTool } from "./digest.js"
import { askPeerTool } from "./ask-peer.js"
import { maestraEmitEventTool } from "./emit-event.js"
import { maestraReadInstructionsTool } from "./read-instructions.js"
import type { ToolDefinition } from "../host-types.js"

/**
 * Single source of truth for the plugin's tool surface (name ↔ definition).
 * Both entrypoints build from this registry — the V1 map and the V2
 * transform stay in lockstep by construction.
 */
export interface RegisteredTool {
  name: string
  def: ToolDefinition
}

export const TOOL_REGISTRY: readonly RegisteredTool[] = [
  { name: "maestra_status", def: maestraStatusTool },
  { name: "maestra_issue_digest", def: maestraIssueDigestTool },
  { name: "ask_peer", def: askPeerTool },
  { name: "maestra_emit_event", def: maestraEmitEventTool },
  { name: "maestra_read_instructions", def: maestraReadInstructionsTool },
]
