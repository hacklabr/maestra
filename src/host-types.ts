import { z } from "zod"

/**
 * Local structural types for the host plugin APIs (OpenCode AND Mimo Code).
 *
 * We intentionally do NOT depend on @opencode-ai/plugin or @mimo-ai/plugin:
 * the runtime contract is the Hooks object shape consumed by both hosts, and
 * the two packages diverge (@opencode-ai/plugin 1.18.5 × @mimo-ai/plugin 0.1.9;
 * ToolResult shape; Effect × Promise on ctx.ask). Types here are the verified
 * common subset (spec D4).
 */

export type ToolContext = {
  sessionID: string
  messageID?: string
  agent?: string
  /** Project directory for this session. Prefer over process.cwd(). */
  directory: string
  worktree?: string
  abort?: AbortSignal
  metadata?(input: { title?: string; metadata?: Record<string, any> }): void
}

/**
 * Mimo-compatible subset, also accepted by OpenCode.
 * (OpenCode additionally allows `title` and `attachments`; Mimo does not.)
 */
export type ToolResult = string | { output: string; metadata?: Record<string, any> }

export function tool<Args extends z.ZodRawShape>(input: {
  description: string
  args: Args
  execute(args: z.infer<z.ZodObject<Args>>, context: ToolContext): Promise<ToolResult>
}) {
  return input
}
tool.schema = z

export type ToolDefinition = ReturnType<typeof tool>

export type PluginInput = {
  client: unknown
  project?: unknown
  directory: string
  worktree?: string
  serverUrl?: URL
}

export type Hooks = {
  dispose?: () => Promise<void>
  event?: (input: { event: unknown }) => Promise<void>
  config?: (input: unknown) => Promise<void>
  tool?: Record<string, ToolDefinition>
  "permission.ask"?: (input: unknown, output: { status: "ask" | "deny" | "allow" }) => Promise<void>
  "tool.execute.after"?: (
    input: { tool: string; sessionID: string; callID: string; args?: Record<string, unknown> },
    output: { title?: string; output: string; metadata?: any },
  ) => Promise<void>
  "experimental.chat.system.transform"?: (
    input: { sessionID?: string; model?: unknown },
    output: { system: string[] },
  ) => Promise<void>
  "tool.definition"?: (
    input: { toolID: string },
    output: { description: string; parameters?: unknown },
  ) => Promise<void>
}

export type Plugin = (input: PluginInput, options?: Record<string, unknown>) => Promise<Hooks>
