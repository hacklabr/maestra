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
 *
 * This renders a LEAN BOOTSTRAP SCAFFOLD: it points to the full kernel and
 * MUST NOT duplicate the entry router. The full kernel
 * (`instructions/kernel/maestra-kernel.md`) is the single source of the entry
 * router (entry doors) and the entry gate — duplicating them here would
 * reintroduce the F027 recurrence (a stale, cognitively-primary mini-router
 * in code diverging from the authoritative router in the .md, causing
 * misrouting such as capture-intent requests landing on J1 instead of J11).
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
    "# Workflow Facilitator (kernel L0)",
    "",
    `Full kernel: ${ctx.instructionsDir}/kernel/maestra-kernel.md`,
    "",
    "Every session begins with the entry gate defined in the full kernel:",
    "1. Run `maestra_status`.",
    "2. Read the full kernel — it defines the entry router (entry doors) and the mandatory entry gate.",
    "3. Identify the entry door against that router and load the corresponding journey module.",
    "",
    "Do NOT route against this placeholder — the full kernel is the single source of the entry router.",
    "No read, bash, codebase exploration, or platform operation may precede the entry gate.",
    "",
    "## Host dialect",
    "",
    DIALECT[host],
    "",
  ].join("\n")
}
