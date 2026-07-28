import type { HostId } from "./maestra-agent.js"

/**
 * The shell specialist subagent (human-approved design A): ONE nearly-empty
 * subagent replaces the 12 curated personas. The persona is injected ON
 * DEMAND at spawn time — the facilitator reads the persona file from the
 * greppable catalog (instructions/catalog/) and inlines it in the task/actor
 * prompt. Token cost: 1 line in the subagent enum (~60 tokens/msg) instead of
 * 12+ — and zero on Mimo, where hidden agents can't spawn anyway.
 *
 * Non-hidden (Mimo's actor enum only lists `mode: subagent && !hidden`).
 * Description: 1 line (per-message tax). Subagent nesting denied per host
 * (task × actor — the consultation channel is ask_peer, guarded in-tool).
 */
export const SHELL_AGENT_FILENAME = "specialist.md"

const BASE_PROMPT = `You are a specialist consultant called to a discussion panel.

Your persona is defined entirely by the delegation prompt you received:
name, domain, vocabulary, perspective, and analysis style. Adopt this persona
fully — do not respond as a generalist.

Rules:
- On your first response, declare your persona on the first line, in the
  exact format "[<persona-id>]" — the same id as the persona:: marker that
  opened your delegation prompt (e.g. "[backend-architect]").
- Analyze the agenda from your domain; read the files the caller indicates
  (previous positions live in files, never in summaries).
- Be direct and specific; register divergences with criteria, not with tone.
- You do NOT call other subagents. To consult a peer, use ask_peer
  (only during sequential panel turns, when available).`

export function buildShellAgentMarkdown(host: HostId): string {
  const denyKey = host === "opencode" ? "task" : "actor"
  return [
    "---",
    "description: Domain specialist called to the discussion panel (persona injected in the delegation prompt)",
    "mode: subagent",
    "permission:",
    "  edit: allow",
    "  write: allow",
    "  bash: allow",
    `  ${denyKey}:`,
    '    "*": deny',
    "---",
    "",
    BASE_PROMPT,
    "",
  ].join("\n")
}
