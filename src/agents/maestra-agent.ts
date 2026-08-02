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
 * Host question dialect — the clickable-question tool used by J11 Stage 1
 * (≤2 quick questions when ambiguity is material). Baked at INSTALL time,
 * same pattern as DIALECT. Verified per host (R07):
 * - opencode: built-in `question` tool, enabled by default — no frontmatter
 *   enablement needed (built-in tools are on unless denied by permission).
 * - mimocode: same built-in `question` tool (verified in the installed
 *   binary: tool registered under the name "question" with a `questions`
 *   parameter — header/question/options with label/description).
 * The instruction modules (J11, microcopy) stay host-neutral and refer only
 * to "the host's clickable-question tool, when available" — the concrete
 * name lives ONLY here.
 */
const QUESTION: Record<HostId, string> = {
  opencode:
    "To ask the author quick questions during capture (J11 Stage 1, ≤2 questions), " +
    "use the `question` tool (questions: header, question, options with label/description). " +
    "It is built in and enabled by default.",
  mimocode:
    "To ask the author quick questions during capture (J11 Stage 1, ≤2 questions), " +
    "use the `question` tool (questions: header, question, options with label/description).",
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

/**
 * Generates the `maestra-issue-writer` primary agent markdown — the
 * capture-only agent that publishes quick-capture issues (label `stage-0`)
 * WITHOUT traversing the standard kernel's entry router. Same lean-bootstrap
 * pattern as `buildDirectAgentMarkdown`, but pointing to the issue-writer
 * kernel. Capture logic lives ONLY in J11/microcopy — this markdown and the
 * kernel reference it, never restate it (F027 lesson: no router/capture
 * duplication in code).
 */
export function buildIssueWriterAgentMarkdown(host: HostId, ctx: AgentRenderContext): string {
  return [
    "---",
    "description: Quick issue capture (stage-0) without traversing the kernel",
    "mode: primary",
    "permission:",
    "  external_directory:",
    `    "${ctx.instructionsDir}/**": allow`,
    "---",
    "",
    "# Issue Writer (kernel L0 — quick capture)",
    "",
    "You are the **capture-only** facilitator: you publish quick-capture issues",
    "with curated text faithful to the author's intent — draft in chat,",
    "explicit confirmation gate, publish with the `stage-0` label. You",
    "NEVER triage, classify, assign variants, write metadata lines, emit",
    "events A–F, or create round folders — those belong to the `maestra` agent.",
    "",
    `Full kernel: ${ctx.instructionsDir}/kernel/issue-writer-kernel.md`,
    "",
    "## Entry point",
    "",
    "Every user message is a capture demand:",
    `- Any message → read ${ctx.instructionsDir}/journeys/j11-quick-capture.md`,
    "",
    "## Host dialect",
    "",
    DIALECT[host],
    "",
    "The same subagent tool powers J11 Stage 1 enrichment delegation — spawn a generic research subagent, never the discussion-panel shell.",
    "",
    "## Host question tool",
    "",
    QUESTION[host],
    "",
  ].join("\n")
}
