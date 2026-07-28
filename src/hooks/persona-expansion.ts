import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { loadPersonaById } from "../catalog/loader.js"
import { parsePersonaMarker } from "./persona-marker.js"

/**
 * Persona-expansion hook (shell-specialist architecture, option A).
 *
 * tool.execute.before on task/actor — STRICT scope: only when
 * subagent_type === "fluxo/especialista" (zero blast radius on other spawns).
 * Verified mechanics: output.args is mutable in both hosts and propagates to
 * execution (OC session/tools.ts:106-124; Mimo session/prompt.ts:1071-1097).
 *
 * Behavior:
 *  - marker `persona::<id>@<mesaId>` found → the persona file's systemPrompt
 *    body + first-response declaration requirement is injected BELOW the
 *    marker (the marker line is PRESERVED — the after-hook args carry the
 *    mutated prompt, and the peer-tracker reads identity from it).
 *    The persona body NEVER passes through the facilitator's context.
 *  - no marker → pass through untouched (the peer-tracker fails closed and
 *    warns; this hook does not police).
 *  - persona file missing → the marker is replaced by a LOUD error block;
 *    the shell reports the failure instead of improvising a persona (the
 *    tracker recognizes the failure signature and does not register).
 */

const SHELL_AGENT = "fluxo/especialista"

export interface PersonaExpansionOptions {
  catalogRoot: string
}

function buildPersonaBlock(personaId: string, systemPrompt: string): string {
  return [
    `## Persona (injetada pelo plugin fluxo — adote integralmente)`,
    ``,
    systemPrompt,
    ``,
    `## Requisito de primeira resposta`,
    ``,
    `Declare sua persona na primeira linha, antes de qualquer outro conteúdo, no formato exato: "[${personaId}]".`,
    `Depois responda normalmente, em PT-BR, dentro da persona.`,
  ].join("\n")
}

export const EXPANSION_FAILURE_SIGNATURE = "[FLUXO PLUGIN ERROR — persona não encontrada]"

function buildFailureBlock(personaId: string, catalogRoot: string): string {
  return [
    EXPANSION_FAILURE_SIGNATURE,
    `A persona "${personaId}" não existe no catálogo instalado (${catalogRoot}).`,
    `NÃO improvise nem represente um especialista genérico.`,
    `Reporte esta falha ao facilitador literalmente e pare.`,
  ].join("\n")
}

export function createPersonaExpansionHook(opts: PersonaExpansionOptions) {
  return async (
    input: { tool: string; sessionID: string; callID: string },
    output: { args: Record<string, unknown> },
  ): Promise<void> => {
    if (input.tool !== "task" && input.tool !== "actor") return

    const args = output.args as { subagent_type?: unknown; prompt?: unknown }
    if (args.subagent_type !== SHELL_AGENT) return
    if (typeof args.prompt !== "string") return

    const marker = parsePersonaMarker(args.prompt)
    if (!marker) return

    const persona = await loadPersonaById(opts.catalogRoot, marker.personaId)
    // Success: marker PRESERVED (identity anchor for the after-hook tracker),
    // persona block appended below. Failure: marker replaced by the loud block.
    const replacement = persona
      ? `${marker.raw}\n\n${buildPersonaBlock(marker.personaId, persona.systemPrompt)}`
      : buildFailureBlock(marker.personaId, opts.catalogRoot)

    args.prompt = args.prompt.replace(marker.raw, replacement)
  }
}

/**
 * Catalog root resolution (first existing wins):
 *  1. FLUXO_CATALOG_DIR env override
 *  2. installed instructions dir (project .opencode/.mimocode, then global)
 *  3. package-bundled dist/catalog (dev checkout: src/catalog — same relative
 *     path from src/hooks and dist/hooks, so one candidate serves both)
 */
export function resolveCatalogRoot(directory: string): string {
  const candidates = [
    process.env.FLUXO_CATALOG_DIR,
    join(directory, ".opencode", "fluxo", "instructions", "catalog"),
    join(directory, ".mimocode", "fluxo", "instructions", "catalog"),
    join(homedir(), ".config", "opencode", "fluxo", "instructions", "catalog"),
    join(homedir(), ".config", "mimocode", "fluxo", "instructions", "catalog"),
    join(dirname(fileURLToPath(import.meta.url)), "..", "catalog", "agency-agents"),
  ].filter((c): c is string => typeof c === "string" && c.length > 0)

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  // Last resort: bundled path even if missing (failure block names it loudly)
  return candidates[candidates.length - 1]
}
