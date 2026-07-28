/**
 * Persona marker convention for the shell-specialist architecture.
 *
 * The facilitator spawns the single shell subagent (maestra/especialista) with
 * a marker in the prompt: `persona::<id>@<mesaId>` (@<mesaId> optional for
 * one-off consultations outside a mesa). The marker is the ONLY source of
 * persona identity — subagent_type is always the shell.
 *
 * Consumed by:
 *  - hooks/persona-expansion.ts (tool.execute.before): replaces the marker
 *    with the persona file content, plugin-side (persona never enters the
 *    facilitator's context).
 *  - hooks/peer-tracker.ts (tool.execute.after): registers
 *    persona→{sessionId, mesaId} for ask_peer's caller-identity and routing.
 */

export interface PersonaMarker {
  personaId: string
  mesaId?: string
  /** The exact matched substring, for surgical replacement in the prompt. */
  raw: string
}

const MARKER_PATTERN = /persona::([a-z0-9][a-z0-9-]*)(?:@([\w.-]+))?/

export function parsePersonaMarker(prompt: string): PersonaMarker | null {
  const match = MARKER_PATTERN.exec(prompt)
  if (!match) return null
  return { personaId: match[1], mesaId: match[2], raw: match[0] }
}
