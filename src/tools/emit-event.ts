import { tool } from "../host-types.js"
import { z } from "zod"
import { resolveForge, type ResolvedForge } from "../platform/adapter.js"
import { ForgeError } from "../platform/exec.js"

/**
 * fluxo_emit_event — instrumentation events A–F + override registry (P3 fold).
 *
 * The tool CONSTRUCTS and POSTS the comment: the zod union is the format
 * contract (jornadas §8 + P3), the signature "— facilitador" is appended by
 * code — the model can neither omit nor forge it (payload strings containing
 * the signature marker are rejected, preventing duplication).
 *
 * Format-as-contract rationale (spec D1): these lines exist FOR future
 * consolidation queries (fluxo-report); format drift = silent data loss.
 */

const SIGNATURE = "— facilitador"
const SIGNATURE_PATTERN = /—\s*facilitador/

const TRIAGE_CRITERIA = [
  "origem-tecnica",
  "iniciativa-grande",
  "estimativa-5-dias",
  "modulos-3-ou-mais",
  "modelo-dados-ou-contrato",
  "decisao-tecnica-duradoura",
  "comportamento-em-uso",
  "demanda-vaga",
] as const

const OVERRIDE_TYPES = ["variante", "gate", "triagem"] as const

const payloadSchemas = {
  /** A — triage question count (derivation-failure detector). */
  A: z.object({
    perguntas_elicitacao: z.number().int().min(0).describe("Elicitation questions asked (confirmations excluded)"),
    perguntas_derivaveis: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Derivable questions asked anyway — target zero"),
  }),
  /** B — understanding correction rounds (J1 Etapa 1). */
  B: z.object({
    rodadas_correcao: z.number().int().min(0).describe("Correction rounds until the human confirmed"),
  }),
  /** C — "não sei" per triage criterion (translation-gap detector). */
  C: z.object({
    criterio: z.enum(TRIAGE_CRITERIA),
  }),
  /** D — override with direction + disputed criterion (calibration dataset). */
  D: z.object({
    de: z.string().min(1),
    para: z.string().min(1),
    criterio_contestado: z.string().min(1),
  }),
  /** E — J8 refusal vs. demand created (silent-bypass detector). */
  E: z.object({
    demanda_criada: z
      .union([z.number().int().positive(), z.literal("pendente")])
      .describe("Issue number of the demand opened from the refusal, or 'pendente'"),
  }),
  /** F — deviations during execution vs. at reconciliation (governance health). */
  F: z.object({
    rodada: z.string().min(1).describe("Rodada id, e.g. R02"),
    durante: z.number().int().min(0),
    na_reconciliacao: z.number().int().min(0),
  }),
  /** P3 override registry (record_override fold). motivo_declarado REQUIRED. */
  override: z.object({
    tipo: z.enum(OVERRIDE_TYPES),
    de: z.string().min(1).describe("Value indicated by criteria/state"),
    para: z.string().min(1).describe("Value decided by the human"),
    criterio_contestado: z.string().min(1),
    motivo_declarado: z.string().min(1).describe("REQUIRED: the human-worded reason"),
    decidido_por: z.string().min(1).describe("GitHub/GitLab handle of the decider"),
    data: z.string().min(1).describe("Decision date (YYYY-MM-DD)"),
  }),
} as const

export type EventType = keyof typeof payloadSchemas

function rejectSignatureInjection(payload: Record<string, unknown>): string | null {
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string" && SIGNATURE_PATTERN.test(value)) {
      return `Error: payload field "${key}" contains the facilitator signature. The signature is appended by the tool — never include it in payload values.`
    }
  }
  return null
}

/** Pure body builder — validates payload against the per-type schema and
 * constructs the exact comment body with signature appended by construction. */
export function buildEventBody(type: EventType, payload: Record<string, unknown>): string {
  const schema = payloadSchemas[type]
  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    throw new Error(`Invalid payload for event type "${type}": ${issues}`)
  }
  const p = parsed.data as Record<string, unknown>

  switch (type) {
    case "A":
      return `**Evento A** — triagem: ${p.perguntas_elicitacao} perguntas de elicitação; deriváveis perguntadas: ${p.perguntas_derivaveis} ${SIGNATURE}`
    case "B":
      return `**Evento B** — entendimento: ${p.rodadas_correcao} rodada(s) de correção até a confirmação ${SIGNATURE}`
    case "C":
      return `**Evento C** — "não sei" no critério: ${p.criterio} ${SIGNATURE}`
    case "D":
      return `**Evento D** — override: ${p.de} → ${p.para}; critério contestado: "${p.criterio_contestado}" ${SIGNATURE}`
    case "E":
      return `**Evento E** — recusa J8 (requisito novo); demanda criada: ${p.demanda_criada === "pendente" ? "pendente" : `#${p.demanda_criada}`} ${SIGNATURE}`
    case "F":
      return `**Evento F** — rodada ${p.rodada}: desvios durante=${p.durante}, na-reconciliação=${p.na_reconciliacao} ${SIGNATURE}`
    case "override": {
      const handle = String(p.decidido_por).replace(/^@/, "")
      return [
        `**Registro de override** ${SIGNATURE}`,
        `- Tipo: ${p.tipo}`,
        `- De: ${p.de} → Para: ${p.para}`,
        `- Critério objetivo contestado: ${p.criterio_contestado}`,
        `- Motivo declarado: ${p.motivo_declarado}`,
        `- Decidido por: @${handle} em ${p.data}`,
      ].join("\n")
    }
  }
}

/** Injectable seam for tests (mirrors setSdkClient in ask-peer). */
let forgeResolver: (directory: string) => Promise<ResolvedForge | null> = (directory) =>
  resolveForge(directory)

export function setForgeResolver(resolver: (directory: string) => Promise<ResolvedForge | null>): void {
  forgeResolver = resolver
}

export const fluxoEmitEventTool = tool({
  description:
    'Emit a Fluxo instrumentation event (A–F) or an override register (type=override, P3 format) as a structured comment on the epic, signed "— facilitador" by construction. The body is built and validated by the tool (zod union of formats); posting goes through the platform adapter (GitHub comment × GitLab note). In type=override, motivo_declarado is REQUIRED (the human-worded reason is the payload). NEVER write event/override comments by hand — format is a contract for the fluxo-report audit.',
  args: {
    epic: tool.schema.number().describe("Epic issue number (GitHub) or iid (GitLab)"),
    type: tool.schema
      .enum(["A", "B", "C", "D", "E", "F", "override"])
      .describe("Event type: A–F instrumentation events, or 'override' (P3 register)"),
    payload: tool.schema
      .record(tool.schema.string(), tool.schema.unknown())
      .describe("Event payload fields (per-type schema enforced by the tool)"),
  },
  async execute(args, context) {
    const injectionError = rejectSignatureInjection(args.payload)
    if (injectionError) return injectionError

    let body: string
    try {
      body = buildEventBody(args.type as EventType, args.payload)
    } catch (e: unknown) {
      return `Error: ${(e as Error).message}`
    }

    const resolved = await forgeResolver(context.directory)
    if (!resolved) {
      return (
        "Error: issue platform not detected for this repository. " +
        "Run fluxo_status to diagnose, or set platform/host/project in .fluxo/config.md."
      )
    }

    try {
      await resolved.adapter.postComment({ forge: resolved.forge, number: args.epic }, body)
    } catch (e: unknown) {
      if (e instanceof ForgeError) {
        return `Error: failed to post event comment on #${args.epic}: ${e.message}`
      }
      throw e
    }

    return {
      output: `Evento ${args.type} registrado em #${args.epic} (${resolved.forge.kind}):\n${body}`,
      metadata: { type: args.type, epic: args.epic, platform: resolved.forge.kind },
    }
  },
})
