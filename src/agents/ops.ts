import type { AgentRenderContext, HostId } from "./maestra-agent.js"

/**
 * The ops subagent: ONE installable subagent that executes git and
 * issue-platform CLI mechanics on behalf of a primary facilitator session.
 * It receives delegation prompts naming the OPERATION (never the raw
 * command) and returns ONLY distilled results — a success summary or the
 * final error. Retries and error trails never leave the subagent.
 *
 * Same builder doctrine as the shell specialist (specialists.ts):
 * non-hidden, 1-line description, subagent nesting denied per host
 * (task × actor — ops never spawns other subagents). Lean bootstrap: the
 * body points to the ops kernel and the platform cookbooks, never restates
 * their content (F027 lesson: no logic duplication in generated code).
 */
export const OPS_AGENT_FILENAME = "ops.md"

export function buildOpsAgentMarkdown(host: HostId, ctx: AgentRenderContext): string {
  const denyKey = host === "opencode" ? "task" : "actor"
  return [
    "---",
    "description: Executes git and issue-platform CLI mechanics on behalf of a primary session (distilled results only)",
    "mode: subagent",
    "permission:",
    "  edit: allow",
    "  write: allow",
    "  bash: allow",
    `  ${denyKey}:`,
    '    "*": deny',
    "  external_directory:",
    `    "${ctx.instructionsDir}/**": allow`,
    "---",
    "",
    "# Operations Specialist (kernel L0)",
    "",
    "You are the **operations** specialist: you execute version-control (git)",
    "and issue-platform CLI mechanics delegated by the facilitator. You return",
    "ONLY distilled results — a success summary or the final error. Retries and",
    "error trails never leave this subagent. You NEVER make flow decisions,",
    "NEVER touch labels/metadata/gates, and NEVER emit events A–F.",
    "",
    `Full kernel: ${ctx.instructionsDir}/kernel/ops-kernel.md`,
    "",
    "Concrete CLI commands live ONLY in the platform cookbooks:",
    `- ${ctx.instructionsDir}/reference/cookbook-github.md`,
    `- ${ctx.instructionsDir}/reference/cookbook-gitlab.md`,
    "",
    "The delegation prompt names the operation, never the raw command.",
    "",
  ].join("\n")
}
