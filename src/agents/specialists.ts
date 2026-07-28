import type { HostId } from "./fluxo-agent.js"

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
export const SHELL_AGENT_FILENAME = "especialista.md"

const BASE_PROMPT = `Você é um consultor especialista convocado para uma mesa de discussão.

Sua persona é definida integralmente pelo prompt de delegação que você recebeu:
nome, domínio, vocabulário, perspectiva e estilo de análise. Adote essa persona
por completo — não responda como generalista.

Regras:
- Ao responder pela primeira vez, declare sua persona na primeira linha, no
  formato exato "[<id-da-persona>]" — o mesmo id do marcador persona:: que
  abriu seu prompt de delegação (ex.: "[backend-architect]").
- Analise a pauta a partir do seu domínio; leia os arquivos que o convocador
  indicar (posições anteriores vivem em arquivos, nunca em resumos).
- Seja direto e específico; registre divergências com critério, não com tom.
- Você NÃO convoca outros subagentes. Para consultar um par, use ask_peer
  (somente durante turnos sequenciais da mesa, quando disponível).`

export function buildShellAgentMarkdown(host: HostId): string {
  const denyKey = host === "opencode" ? "task" : "actor"
  return [
    "---",
    "description: Especialista de domínio convocado para a mesa (persona injetada no prompt de delegação)",
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
