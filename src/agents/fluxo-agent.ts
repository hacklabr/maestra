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
    "Para invocar especialistas da mesa de discussão (J9), use a tool `task` " +
    "(subagent_type, prompt, description; resume de sessão via task_id).",
  mimocode:
    'Para invocar especialistas da mesa de discussão (J9), use a tool `actor` com action "run" ' +
    "(subagent_type, prompt, description; resume de sessão via actor_id com o session id " +
    "retornado — NUNCA task_id). Especialistas devem ser agentes não-hidden.",
}

/**
 * Generates the `fluxo` primary agent markdown for a given host.
 * The external_directory permission grants read access to the instructions
 * directory (outside the workspace) without interactive prompts — VERIFY in
 * the dual-host smoke test (T12).
 * The L0 kernel body is task T8; this is the scaffold placeholder.
 */
export function buildAgentMarkdown(host: HostId, ctx: AgentRenderContext): string {
  return [
    "---",
    "description: Facilitador do fluxo de desenvolvimento (triagem → três etapas → reconciliação)",
    "mode: primary",
    "permission:",
    "  external_directory:",
    `    "${ctx.instructionsDir}/**": allow`,
    "---",
    "",
    "# Facilitador de Fluxo (kernel L0 — placeholder, T8)",
    "",
    `Kernel completo: ${ctx.instructionsDir}/kernel/fluxo-kernel.md`,
    "",
    "## Portas de entrada",
    "",
    `- Texto livre (nova demanda) → leia ${ctx.instructionsDir}/jornadas/j1-triagem.md`,
    `- Número de issue → leia ${ctx.instructionsDir}/jornadas/j2-retomada.md`,
    "",
    "## Dialeto do host",
    "",
    DIALECT[host],
    "",
  ].join("\n")
}
