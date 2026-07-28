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
  primitiva: string
  mensagem: string
}

async function attempt<T>(primitiva: string, promise: Promise<T>, erros: PrimitiveError[]): Promise<T | null> {
  try {
    return await promise
  } catch (err) {
    erros.push({ primitiva, mensagem: err instanceof Error ? err.message.slice(0, 300) : String(err) })
    return null
  }
}

interface ArtifactFact {
  numero: number
  titulo: string
  declarado: string | null
  existe: boolean | null
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
        "Ask the human ONCE (GitHub or GitLab? which host?) and persist the answer in .maestra/config.md " +
        "(plataforma, host, projeto) — never ask again (ADR-010)."
      )
    }
    const { adapter, forge } = resolved
    const ref = { forge, number: args.issue }
    const erros: PrimitiveError[] = []

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
      attempt("listChildren", adapter.listChildren(ref), erros),
      attempt("listComments", adapter.listComments(ref), erros),
      attempt("getBoardColumn", adapter.getBoardColumn(ref), erros),
      attempt("getParent", adapter.getParent(ref), erros),
    ])

    const filhos = children ?? []
    const comentarios = (comments ?? [])
      .map((c) => ({ tipo: classifyComment(c.body), autor: c.author, data: c.createdAt, corpo: c.body }))
      .filter((c): c is { tipo: MarkedCommentKind; autor: string; data: string; corpo: string } => c.tipo !== null)
      .map((c) => ({
        ...c,
        corpo: c.corpo.length > MAX_COMMENT_BODY ? c.corpo.slice(0, MAX_COMMENT_BODY) + "…" : c.corpo,
      }))

    // Gate arithmetic per etapa (closed/total), children enumerated one by one
    const porEtapa: Record<string, { fechadas: number; total: number }> = {}
    let semEtapa = 0
    for (const child of filhos) {
      const etapas = classifyLabels(child.labels).etapas
      if (etapas.length === 0) {
        semEtapa++
        continue
      }
      for (const etapa of etapas) {
        porEtapa[etapa] ??= { fechadas: 0, total: 0 }
        porEtapa[etapa].total++
        if (child.state === "closed") porEtapa[etapa].fechadas++
      }
    }

    const reconciliacaoChild = filhos.find((c) => /reconcilia/i.test(c.title))

    // G-05/FM-05: declared-artifact existence for CLOSED artifact tasks (etapa-1/etapa-2)
    const artefatoChildren = filhos.filter(
      (c) => c.state === "closed" && classifyLabels(c.labels).etapas.some((e) => e === "etapa-1" || e === "etapa-2"),
    )
    const artefatos: ArtifactFact[] = await Promise.all(
      artefatoChildren.map(async (child) => {
        const body = await attempt(`getIssue(#${child.number})`, adapter.getIssue({ forge, number: child.number }), erros)
        if (!body) return { numero: child.number, titulo: child.title, declarado: null, existe: null }
        const declarado = extractDeclaredArtifactPath(body.body)
        return {
          numero: child.number,
          titulo: child.title,
          declarado,
          existe: declarado ? existsSync(join(context.directory, declarado)) : null,
        }
      }),
    )

    // ADR-011: tasklist × issue-state divergence (GitLab hierarchy sync check)
    const dessincronia: Array<{ numero: number; checkbox: string; estadoIssue: string }> = []
    const tasklist = parseTasklist(issue.body)
    if (tasklist.length > 0) {
      const byNumber = new Map(filhos.map((c) => [c.number, c]))
      for (const item of tasklist) {
        const child = byNumber.get(item.numero)
        if (!child) {
          dessincronia.push({ numero: item.numero, checkbox: item.marcado ? "marcado" : "desmarcado", estadoIssue: "fora-da-hierarquia" })
          continue
        }
        const diverges = (item.marcado && child.state === "open") || (!item.marcado && child.state === "closed")
        if (diverges) {
          dessincronia.push({ numero: item.numero, checkbox: item.marcado ? "marcado" : "desmarcado", estadoIssue: child.state })
        }
      }
    }

    const digest = {
      plataforma: { kind: forge.kind, host: forge.host, projeto: forge.project },
      issue: {
        numero: issue.number,
        id: issue.id,
        titulo: issue.title,
        estado: issue.state,
        url: issue.url,
      },
      labels: classifyLabels(issue.labels),
      metadados: parseMetadataLine(issue.body),
      pai: parent,
      filhos: filhos.map((c: ChildIssue) => {
        const labels = classifyLabels(c.labels)
        return {
          numero: c.number,
          titulo: c.title,
          estado: c.state,
          variante: labels.variante,
          etapas: labels.etapas,
          assignees: c.assignees,
        }
      }),
      comentarios,
      board: { coluna: column },
      gate: {
        porEtapa,
        semEtapa,
        reconciliacao: reconciliacaoChild
          ? { existe: true, estado: reconciliacaoChild.state, numero: reconciliacaoChild.number }
          : { existe: false, estado: null, numero: null },
      },
      artefatos,
      hierarquia: {
        tipo: forge.kind === "github" ? "sub-issues" : "links+tasklist",
        taskCompletion: issue.taskCompletion,
        dessincronia,
      },
      paginacao: {
        // T2 deferral surfaced as a FACT: full page ⇒ possible truncation
        filhosTruncados: filhos.length >= PAGE_SIZE,
        comentariosTruncados: (comments ?? []).length >= PAGE_SIZE,
      },
      erros,
    }

    return { output: JSON.stringify(digest, null, 2) }
  },
})
