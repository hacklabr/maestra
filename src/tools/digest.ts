import { existsSync } from "node:fs"
import { join } from "node:path"
import { tool } from "../host-types.js"
import { resolveForge } from "../platform/adapter.js"
import type { ChildIssue, IssueFacts } from "../platform/types.js"
import {
  classifyComment,
  classifyLabels,
  extractDeclaredArtifactPath,
  parseMetadataLine,
  parseTasklist,
  type MarkedCommentKind,
} from "./digest-parse.js"

/**
 * maestra_issue_digest — factual parser of Fluxo conventions (D1 contract).
 * FROZEN SCOPE: enumerates FACTS, never derives state. State derivation is
 * the model's job (anti-bypass #6 is served by construction: children are
 * enumerated one by one by the adapter, and gate arithmetic is computed here —
 * the model cannot "forget" the 5th child or infer a gate).
 */

const MAX_COMMENT_BODY = 600
const PAGE_SIZE = 100

interface PrimitiveError {
  primitive: string
  message: string
}

async function attempt<T>(primitive: string, promise: Promise<T>, errors: PrimitiveError[]): Promise<T | null> {
  try {
    return await promise
  } catch (err) {
    errors.push({ primitive, message: err instanceof Error ? err.message.slice(0, 300) : String(err) })
    return null
  }
}

interface ArtifactFact {
  number: number
  title: string
  declared: string | null
  exists: boolean | null
}

export const maestraIssueDigestTool = tool({
  description:
    "Factual parser of Fluxo conventions for a given issue (platform-aware via adapter): variant/etapa labels, epic→task hierarchy enumerated one by one (sub-issues on GitHub; links+tasklist on GitLab), gate/override/event comments or notes, declared-artifact existence on local fs (G-05), gate arithmetic per etapa, board column (Projects v2 × status::* labels), reconciliation field. Enumerates facts; NEVER derives state.",
  args: {
    issue: tool.schema.number().describe("Issue number (GitHub) or iid (GitLab) to digest"),
  },
  async execute(args, context) {
    const resolved = await resolveForge(context.directory)
    if (!resolved) {
      return (
        "Error: issue platform not detected for this repository. " +
        "Ask the human ONCE (GitHub or GitLab? which host?) and persist the answer in config.md on the " +
        "__maestra_config__ branch (platform, host, project — via maestra_status or maestra-config migrate; ADR-003) " +
        "— never ask again (ADR-010)."
      )
    }
    const { adapter, forge } = resolved
    const ref = { forge, number: args.issue }
    const errors: PrimitiveError[] = []

    // The issue itself is the only critical read; everything else degrades per-primitive
    let issue: IssueFacts
    try {
      issue = await adapter.getIssue(ref)
    } catch (err) {
      return `Error: could not read issue #${args.issue} on ${forge.kind} (${forge.host}): ${
        err instanceof Error ? err.message : String(err)
      }`
    }

    const [children, comments, column, parent] = await Promise.all([
      attempt("listChildren", adapter.listChildren(ref), errors),
      attempt("listComments", adapter.listComments(ref), errors),
      attempt("getBoardColumn", adapter.getBoardColumn(ref), errors),
      attempt("getParent", adapter.getParent(ref), errors),
    ])

    const childIssues = children ?? []
    const markedComments = (comments ?? [])
      .map((c) => ({ type: classifyComment(c.body), author: c.author, date: c.createdAt, body: c.body }))
      .filter((c): c is { type: MarkedCommentKind; author: string; date: string; body: string } => c.type !== null)
      .map((c) => ({
        ...c,
        body: c.body.length > MAX_COMMENT_BODY ? c.body.slice(0, MAX_COMMENT_BODY) + "…" : c.body,
      }))

    // Gate arithmetic per stage (closed/total), children enumerated one by one
    const perStage: Record<string, { closed_: number; total: number }> = {}
    let noStage = 0
    for (const child of childIssues) {
      const stages = classifyLabels(child.labels).stages
      if (stages.length === 0) {
        noStage++
        continue
      }
      for (const stage of stages) {
        perStage[stage] ??= { closed_: 0, total: 0 }
        perStage[stage].total++
        if (child.state === "closed") perStage[stage].closed_++
      }
    }

    const reconciliationChild = childIssues.find((c) => /reconcil/i.test(c.title))

    // G-05/FM-05: declared-artifact existence for CLOSED artifact tasks (stage-1/stage-2)
    const artifactChildren = childIssues.filter(
      (c) => c.state === "closed" && classifyLabels(c.labels).stages.some((e) => e === "stage-1" || e === "stage-2"),
    )
    const artifacts: ArtifactFact[] = await Promise.all(
      artifactChildren.map(async (child) => {
        const body = await attempt(`getIssue(#${child.number})`, adapter.getIssue({ forge, number: child.number }), errors)
        if (!body) return { number: child.number, title: child.title, declared: null, exists: null }
        const declared = extractDeclaredArtifactPath(body.body)
        return {
          number: child.number,
          title: child.title,
          declared,
          exists: declared ? existsSync(join(context.directory, declared)) : null,
        }
      }),
    )

    // ADR-011: tasklist × issue-state divergence (GitLab hierarchy sync check)
    const desync: Array<{ number: number; checkbox: string; issueState: string }> = []
    const tasklist = parseTasklist(issue.body)
    if (tasklist.length > 0) {
      const byNumber = new Map(childIssues.map((c) => [c.number, c]))
      for (const item of tasklist) {
        const child = byNumber.get(item.number)
        if (!child) {
          desync.push({ number: item.number, checkbox: item.checked ? "checked" : "unchecked", issueState: "outside-hierarchy" })
          continue
        }
        const diverges = (item.checked && child.state === "open") || (!item.checked && child.state === "closed")
        if (diverges) {
          desync.push({ number: item.number, checkbox: item.checked ? "checked" : "unchecked", issueState: child.state })
        }
      }
    }

    const digest = {
      platform: { kind: forge.kind, host: forge.host, project: forge.project },
      issue: {
        number: issue.number,
        id: issue.id,
        title: issue.title,
        state: issue.state,
        url: issue.url,
      },
      labels: classifyLabels(issue.labels),
      metadata: parseMetadataLine(issue.body),
      parent,
      children: childIssues.map((c: ChildIssue) => {
        const labels = classifyLabels(c.labels)
        return {
          number: c.number,
          title: c.title,
          state: c.state,
          variant: labels.variant,
          stages: labels.stages,
          assignees: c.assignees,
        }
      }),
      comments: markedComments,
      board: { column },
      gate: {
        perStage,
        noStage,
        reconciliation: reconciliationChild
          ? { exists: true, state: reconciliationChild.state, number: reconciliationChild.number }
          : { exists: false, state: null, number: null },
      },
      artifacts,
      hierarchy: {
        type: forge.kind === "github" ? "sub-issues" : "links+tasklist",
        taskCompletion: issue.taskCompletion,
        desync,
      },
      pagination: {
        // T2 deferral surfaced as a FACT: full page ⇒ possible truncation
        childrenTruncated: childIssues.length >= PAGE_SIZE,
        commentsTruncated: (comments ?? []).length >= PAGE_SIZE,
      },
      errors,
    }

    return { output: JSON.stringify(digest, null, 2) }
  },
})
