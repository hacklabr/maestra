import type { ToolContext, ToolDefinition, ToolResult } from "../host-types.js"
import { rawShapeToJsonSchema } from "./json-schema.js"

/**
 * Structural subsets of the OpenCode V2 plugin API, verified against
 * @opencode/plugin 2.x types (spec D4 pattern — same spirit as host-types.ts
 * for V1). The V2 tool-execution context does NOT carry `directory`
 * (only sessionID/agent/messageID/id/signal), so the plugin's location
 * directory is captured at setup and injected here.
 */

export interface V2ToolExecuteContext {
  readonly sessionID: string
  readonly agent: string
  readonly messageID: string
  readonly signal: AbortSignal
}

/** `Tool.Result` subset — `content` may be a plain string or content parts. */
export interface V2ToolResult {
  content?: string | ReadonlyArray<{ type: string; text?: string }>
  metadata?: Record<string, unknown>
}

export interface V2ToolDefinition {
  name: string
  description: string
  input: Record<string, unknown>
  execute(input: unknown, context: V2ToolExecuteContext): Promise<V2ToolResult>
}

function toNeutralContext(context: V2ToolExecuteContext, directory: string): ToolContext {
  return {
    sessionID: context.sessionID,
    messageID: context.messageID,
    agent: context.agent,
    directory,
    abort: context.signal,
  }
}

/** Neutral ToolResult → V2 Tool.Result (`content` accepts a bare string). */
export function toV2ToolResult(result: ToolResult): V2ToolResult {
  if (typeof result === "string") return { content: result }
  const v2: V2ToolResult = { content: result.output }
  if (result.metadata !== undefined) v2.metadata = result.metadata
  return v2
}

/** Flattened text of a V2 result (string content, or joined text parts). */
export function v2ResultText(result: V2ToolResult): string {
  if (typeof result.content === "string") return result.content
  if (result.content === undefined) return ""
  return result.content
    .map((part) => (part.type === "text" && typeof part.text === "string" ? part.text : ""))
    .join("\n")
}

/** Result with `text` appended, preserving the original content shape. */
export function appendV2ResultText(result: V2ToolResult, text: string): V2ToolResult {
  const content =
    typeof result.content === "string" || result.content === undefined
      ? (result.content ?? "") + text
      : [...result.content, { type: "text", text }]
  return { ...result, content }
}

/**
 * Adapts a neutral tool definition (zod args + neutral execute) to the V2
 * `editor.add` shape. `directory` comes from the plugin's location
 * (`ctx.location.directory`, captured at setup).
 */
export function adaptToolToV2(name: string, def: ToolDefinition, directory: string): V2ToolDefinition {
  return {
    name,
    description: def.description,
    input: rawShapeToJsonSchema(def.args),
    async execute(input, context) {
      const result = await def.execute(input as never, toNeutralContext(context, directory))
      return toV2ToolResult(result)
    },
  }
}
