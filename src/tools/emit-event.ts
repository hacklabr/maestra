import { tool } from "../host-types.js"
import { z } from "zod"
import { resolveForge, type ResolvedForge } from "../platform/adapter.js"
import { ForgeError } from "../platform/exec.js"

/**
 * maestra_emit_event — instrumentation events A–F + override registry (P3 fold).
 *
 * The tool CONSTRUCTS and POSTS the comment: the zod union is the format
 * contract (jornadas §8 + P3), the signature "— facilitador" is appended by
 * code — the model can neither omit nor forge it (payload strings containing
 * the signature marker are rejected, preventing duplication).
 *
 * Format-as-contract rationale (spec D1): these lines exist FOR future
 * consolidation queries (maestra-report); format drift = silent data loss.
 */

const SIGNATURE = "— facilitator"
const SIGNATURE_PATTERN = /—\s*facilitator/

const TRIAGE_CRITERIA = [
  "technical-origin",
  "large-initiative",
  "estimate-5-days",
  "modules-3-or-more",
  "data-model-or-contract",
  "lasting-technical-decision",
  "behavior-in-use",
  "vague-demand",
] as const

const OVERRIDE_TYPES = ["variant", "gate", "triage"] as const

const payloadSchemas = {
  /** A — triage question count (derivation-failure detector). */
  A: z.object({
    elicitation_questions: z.number().int().min(0).describe("Elicitation questions asked (confirmations excluded)"),
    derivable_questions: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Derivable questions asked anyway — target zero"),
  }),
  /** B — understanding correction rounds (J1 Stage 1). */
  B: z.object({
    correction_rounds: z.number().int().min(0).describe("Correction rounds until the human confirmed"),
  }),
  /** C — "don't know" per triage criterion (translation-gap detector). */
  C: z.object({
    criterion: z.enum(TRIAGE_CRITERIA),
  }),
  /** D — override with direction + disputed criterion (calibration dataset). */
  D: z.object({
    from: z.string().min(1),
    to: z.string().min(1),
    disputed_criterion: z.string().min(1),
  }),
  /** E — J8 refusal vs. demand created (silent-bypass detector). */
  E: z.object({
    demand_created: z
      .union([z.number().int().positive(), z.literal("pending")])
      .describe("Issue number of the demand opened from the refusal, or 'pending'"),
  }),
  /** F — deviations during execution vs. at reconciliation (governance health). */
  F: z.object({
    round: z.string().min(1).describe("Round id, e.g. R02"),
    during: z.number().int().min(0),
    at_reconciliation: z.number().int().min(0),
  }),
  /** P3 override registry (record_override fold). declared_reason REQUIRED. */
  override: z.object({
    override_type: z.enum(OVERRIDE_TYPES),
    from: z.string().min(1).describe("Value indicated by criteria/state"),
    to: z.string().min(1).describe("Value decided by the human"),
    disputed_criterion: z.string().min(1),
    declared_reason: z.string().min(1).describe("REQUIRED: the human-worded reason"),
    decided_by: z.string().min(1).describe("GitHub/GitLab handle of the decider"),
    date: z.string().min(1).describe("Decision date (YYYY-MM-DD)"),
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
      return `**Event A** — triage: ${p.elicitation_questions} elicitation questions; derivable questions asked: ${p.derivable_questions} ${SIGNATURE}`
    case "B":
      return `**Event B** — understanding: ${p.correction_rounds} correction round(s) until confirmation ${SIGNATURE}`
    case "C":
      return `**Event C** — "don't know" on criterion: ${p.criterion} ${SIGNATURE}`
    case "D":
      return `**Event D** — override: ${p.from} → ${p.to}; disputed criterion: "${p.disputed_criterion}" ${SIGNATURE}`
    case "E":
      return `**Event E** — J8 refusal (new requirement); demand created: ${p.demand_created === "pending" ? "pending" : `#${p.demand_created}`} ${SIGNATURE}`
    case "F":
      return `**Event F** — round ${p.round}: deviations during=${p.during}, at-reconciliation=${p.at_reconciliation} ${SIGNATURE}`
    case "override": {
      const handle = String(p.decided_by).replace(/^@/, "")
      return [
        `**Override register** ${SIGNATURE}`,
        `- Type: ${p.override_type}`,
        `- From: ${p.from} → To: ${p.to}`,
        `- Objective criterion disputed: ${p.disputed_criterion}`,
        `- Declared reason: ${p.declared_reason}`,
        `- Decided by: @${handle} on ${p.date}`,
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

export const maestraEmitEventTool = tool({
  description:
    'Emit a Fluxo instrumentation event (A–F) or an override register (type=override, P3 format) as a structured comment on the epic, signed "— facilitator" by construction. The body is built and validated by the tool (zod union of formats); posting goes through the platform adapter (GitHub comment × GitLab note). In type=override, declared_reason is REQUIRED (the human-worded reason is the payload). NEVER write event/override comments by hand — format is a contract for the maestra-report audit.',
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
        "Run maestra_status to diagnose, or set platform/host/project in .maestra/config.md."
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
      output: `Event ${args.type} registered on #${args.epic} (${resolved.forge.kind}):\n${body}`,
      metadata: { type: args.type, epic: args.epic, platform: resolved.forge.kind },
    }
  },
})
