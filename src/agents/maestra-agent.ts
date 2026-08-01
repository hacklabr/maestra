export type HostId = "opencode" | "mimocode"

export interface AgentRenderContext {
  /** Absolute path to the installed instructions directory. */
  instructionsDir: string
}

/**
 * Host dialect is baked at INSTALL time (spec D4: one host per machine).
 * OpenCode: subagents via `task` (resume by task_id slug).
 * Mimo Code: subagents via `actor` (only non-hidden agents are spawnable;
 * resume by actor_id = returned session id — task_id has different semantics
 * there and MUST NOT be used for resume).
 */
const DIALECT: Record<HostId, string> = {
  opencode:
    "To call discussion panel specialists (J9), use the `task` tool " +
    "(subagent_type, prompt, description; resume session via task_id).",
  mimocode:
    'To call discussion panel specialists (J9), use the `actor` tool with action "run" ' +
    "(subagent_type, prompt, description; resume session via actor_id with the returned session id " +
    "— NEVER task_id). Specialists must be non-hidden agents.",
}

/**
 * Generates the `maestra` primary agent markdown for a given host.
 * The external_directory permission grants read access to the instructions
 * directory (outside the workspace) without interactive prompts — VERIFY in
 * the dual-host smoke test (T12).
 * The L0 kernel body is task T8; this is the scaffold placeholder.
 */
export function buildAgentMarkdown(host: HostId, ctx: AgentRenderContext): string {
  return [
    "---",
    "description: Development workflow facilitator (triage → three stages → reconciliation)",
    "mode: primary",
    "permission:",
    "  external_directory:",
    `    "${ctx.instructionsDir}/**": allow`,
    "---",
    "",
    "# Workflow Facilitator (kernel L0 — placeholder, T8)",
    "",
    `Full kernel: ${ctx.instructionsDir}/kernel/maestra-kernel.md`,
    "",
    "## Entry points",
    "",
    `- Free text (new demand) → read ${ctx.instructionsDir}/journeys/j1-triage.md`,
    `- Issue number → read ${ctx.instructionsDir}/journeys/j2-resume.md`,
    "",
    "## Host dialect",
    "",
    DIALECT[host],
    "",
  ].join("\n")
}

/**
 * Generates the `maestra-direct` primary agent markdown — the direct-mode
 * facilitator that runs the Minimal flow in a single session (async gate
 * boundaries collapsed into synchronous turn boundaries). Same lean-bootstrap
 * pattern as `buildAgentMarkdown`, but pointing to the direct kernel.
 */
export function buildDirectAgentMarkdown(host: HostId, ctx: AgentRenderContext): string {
  return [
    "---",
    "description: Direct workflow mode (Minimal flow in a single session)",
    "mode: primary",
    "permission:",
    "  external_directory:",
    `    "${ctx.instructionsDir}/**": allow`,
    "---",
    "",
    "# Direct-Mode Facilitator (kernel L0 — modo direto)",
    "",
    "You are the **direct-mode** facilitator: a specialization of the standard",
    "`maestra` agent that runs the entire Minimal flow — triage → discovery →",
    "technical design → implementation → reconciliation — in a **single session**,",
    "without async handoffs between stages. Use this agent for small demands that",
    "don't need async fragmentation; use the standard `maestra` agent when stages",
    "must be split across sessions.",
    "",
    `Full kernel: ${ctx.instructionsDir}/kernel/maestra-direct-kernel.md`,
    "",
    "## Entry points",
    "",
    `- Free text (new demand) → read ${ctx.instructionsDir}/journeys/j1-triage.md`,
    `- Issue number → read ${ctx.instructionsDir}/journeys/j2-resume.md`,
    "",
    "## Host dialect",
    "",
    DIALECT[host],
    "",
  ].join("\n")
}
