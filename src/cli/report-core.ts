import type { CommentFacts, IssueFacts } from "../platform/types.js"
import { classifyLabels } from "../tools/digest-parse.js"
import { parseEventComments, type ParsedEvent } from "./report-parse.js"

/**
 * maestra-report audit core — pure, I/O-free. Every check compares EVENT × STATE
 * (never event × event): each presence check has an independently observable
 * state leg (label applied, rodada closed, demand issue exists).
 *
 * The report is the provisional reader of signals A–F (G-15): instrumentation
 * without a reader is decorative. Loud failure = non-zero exit with a PT-BR
 * report; thresholds are encoded here, not configured (D7).
 */

export const THRESHOLDS = {
  /** Derivable questions asked anyway — target zero (jornadas §2). */
  derivableQuestionsMax: 0,
  /** E parity: |recusas − demandas criadas| / recusas above this → audit (silent bypass). */
  eDivergenceMax: 0.2,
  /** F: deviations declared during execution / total below this → late-declaration failure. */
  fDeclaredDuringMin: 0.5,
} as const

export type Severity = "gap" | "threshold" | "signal"

export interface Finding {
  severity: Severity
  codigo: string
  mensagem: string
}

export interface EpicSnapshot {
  issue: IssueFacts
  comments: CommentFacts[]
  /** Reconciliation task state (children scan — same rule as the digest). */
  reconciliacao: { existe: boolean; estado: "open" | "closed" | null; numero: number | null }
  boardColumn: string | null
  /** Demand issue number → exists on the platform (for E parity, state leg). */
  demandsExist: Map<number, boolean>
}

export interface EpicAudit {
  numero: number
  titulo: string
  variante: string | null
  findings: Finding[]
  eStats: { recusas: number; criadas: number }
}

export interface ReportResult {
  epics: EpicAudit[]
  global: Finding[]
  resumo: { epics: number; gaps: number; thresholds: number; signals: number }
  exitCode: 0 | 1
}

const BOARD_DONE = /entregue|done/i

function eventsOfType<T extends ParsedEvent["type"]>(events: ParsedEvent[], type: T) {
  return events.filter((e): e is Extract<ParsedEvent, { type: T }> => e.type === type)
}

/** Audits one epic snapshot. Pure. */
export function auditEpic(snap: EpicSnapshot): EpicAudit {
  const { issue, comments, reconciliacao, boardColumn, demandsExist } = snap
  const labels = classifyLabels(issue.labels)
  const { events, drift } = parseEventComments(comments)
  const findings: Finding[] = []
  const isMinima = labels.variante === "variante-minimo"
  const hasF = eventsOfType(events, "F").length > 0

  // --- Format drift (layer 3: unparseable marked comments) ---
  for (const line of drift) {
    findings.push({
      severity: "gap",
      codigo: "DRIFT",
      mensagem: `linha de evento/override irreconhecível (drift de formato): "${line}"`,
    })
  }

  // --- Presence-gap: variante label → evento A (triagem registrada) ---
  if (labels.variante && eventsOfType(events, "A").length === 0) {
    findings.push({
      severity: "gap",
      codigo: "PRESENCA-A",
      mensagem: `épico tem label ${labels.variante} mas nenhum Evento A — a triagem não foi instrumentada (ou aconteceu fora do plugin).`,
    })
  }

  // --- FM-13: epic closed without reconciliation (the two-click bypass) ---
  // reconciliationDone: task closed (all variants with children) or, on Mínima
  // (single issue, checkbox reconciliation), the F event as the executed verdict.
  const reconciliationDone = reconciliacao.existe ? reconciliacao.estado === "closed" : isMinima && hasF
  if (issue.state === "closed" && !reconciliationDone) {
    const boardNote = boardColumn && BOARD_DONE.test(boardColumn)
      ? ` — e o board já está em "${boardColumn}": o bypass foi executado por completo`
      : ""
    findings.push({
      severity: "gap",
      codigo: "FM-13",
      mensagem:
        `épico FECHADO sem reconciliação (${reconciliacao.existe ? `tarefa #${reconciliacao.numero} ainda aberta` : "nenhuma tarefa/evento de reconciliação"})${boardNote}. ` +
        `Rodada "entregue" pela UI, não pela régua — abrir reconciliação retroativa (J2 branch B6).`,
    })
  }

  // --- Presence-gap: rodada fechada → evento F ---
  // Closed rodada legs: reconciliation task closed (any variant) or Mínima closed
  // WITH reconciliation done (hasF covers it; if missing, FM-13 above already
  // names the anomaly — no double finding).
  const rodadaFechada = reconciliacao.existe && reconciliacao.estado === "closed"
  if (rodadaFechada && !hasF) {
    findings.push({
      severity: "gap",
      codigo: "PRESENCA-F",
      mensagem: `tarefa de reconciliação #${reconciliacao.numero} fechada, mas nenhum Evento F — fechamento não instrumentado.`,
    })
  }

  // --- Presence-gap: label override-registrado → evento D ---
  if (labels.marcadores.includes("override-registrado") && eventsOfType(events, "D").length === 0) {
    findings.push({
      severity: "gap",
      codigo: "PRESENCA-D",
      mensagem: `label override-registrado presente mas nenhum Evento D — override sem instrumentação de direção/critério.`,
    })
  }

  // --- Threshold A: derivable questions asked anyway — target ZERO ---
  for (const a of eventsOfType(events, "A")) {
    if (a.derivaveis > THRESHOLDS.derivableQuestionsMax) {
      findings.push({
        severity: "threshold",
        codigo: "A-DERIVAVEL",
        mensagem: `Evento A registra ${a.derivaveis} pergunta(s) derivável(is) feita(s) mesmo assim — alvo zero. Falha de derivação: revisar instructions da triagem.`,
      })
    }
    const cap = isMinima ? 3 : 5
    if (a.elicitacao > cap) {
      findings.push({
        severity: "signal",
        codigo: "SINAL-A-CAP",
        mensagem: `triagem com ${a.elicitacao} perguntas de elicitação (backstop: ≤${cap}${isMinima ? " na Mínima" : ""}). Creep de interrogatório?`,
      })
    }
  }

  // --- Signal B: correction rounds > 1 = comprehension-failure proxy ---
  for (const b of eventsOfType(events, "B")) {
    if (b.rodadas > 1) {
      findings.push({
        severity: "signal",
        codigo: "SINAL-B",
        mensagem: `entendimento confirmado após ${b.rodadas} rodadas de correção (>1 = proxy de falha de compreensão).`,
      })
    }
  }

  // --- Threshold F: late-declaration ratio per rodada ---
  for (const f of eventsOfType(events, "F")) {
    const total = f.durante + f.naReconciliacao
    if (total > 0 && f.durante / total < THRESHOLDS.fDeclaredDuringMin) {
      findings.push({
        severity: "threshold",
        codigo: "F-TARDIO",
        mensagem:
          `rodada ${f.rodada}: ${f.durante} desvio(s) declarado(s) durante × ${f.naReconciliacao} descoberto(s) na conferência ` +
          `(${Math.round((100 * f.durante) / total)}% durante — alvo ≥80%, piso 50%). ` +
          `Declaração tardia: o touchpoint de execução (J5 Etapa 2) está falhando.`,
      })
    }
  }

  // --- E parity inputs (aggregate computed at report level) + broken links ---
  const eEvents = eventsOfType(events, "E")
  let criadas = 0
  for (const e of eEvents) {
    if (e.demanda === "pendente") continue
    if (demandsExist.get(e.demanda) === false) {
      findings.push({
        severity: "gap",
        codigo: "E-LINK",
        mensagem: `Evento E aponta demanda criada #${e.demanda}, mas a issue não existe — recusa registrada, demanda perdida.`,
      })
    } else if (demandsExist.get(e.demanda) === true) {
      criadas++
    }
  }

  return {
    numero: issue.number,
    titulo: issue.title,
    variante: labels.variante,
    findings,
    eStats: { recusas: eEvents.length, criadas },
  }
}

/** Aggregates epic audits into the report (E parity is cross-epic). Pure. */
export function buildReport(audits: EpicAudit[]): ReportResult {
  const global: Finding[] = []

  const recusas = audits.reduce((n, a) => n + a.eStats.recusas, 0)
  const criadas = audits.reduce((n, a) => n + a.eStats.criadas, 0)
  if (recusas > 0) {
    const divergence = (recusas - criadas) / recusas
    if (divergence > THRESHOLDS.eDivergenceMax) {
      global.push({
        severity: "threshold",
        codigo: "E-DIVERGENCIA",
        mensagem:
          `paridade E quebrada: ${recusas} recusa(s) J8 × ${criadas} demanda(s) criada(s) ` +
          `(divergência ${Math.round(divergence * 100)}% > ${THRESHOLDS.eDivergenceMax * 100}%). ` +
          `Suspeita de bypass silencioso — auditar diffs das tarefas contra o escopo original.`,
      })
    }
  }

  const all = [...audits.flatMap((a) => a.findings), ...global]
  const resumo = {
    epics: audits.length,
    gaps: all.filter((f) => f.severity === "gap").length,
    thresholds: all.filter((f) => f.severity === "threshold").length,
    signals: all.filter((f) => f.severity === "signal").length,
  }
  return { epics: audits, global, resumo, exitCode: resumo.gaps + resumo.thresholds > 0 ? 1 : 0 }
}

const SEVERITY_MARK: Record<Severity, string> = { gap: "✗ GAP", threshold: "✗ LIMIAR", signal: "○ sinal" }

/** Renders the PT-BR report. Pure. */
export function renderReport(result: ReportResult, plataforma: string): string {
  const lines: string[] = [
    `maestra-report — auditoria de instrumentação A–F (${plataforma})`,
    `Leitor provisório dos sinais (G-15): instrumentação sem leitor definido é decorativa.`,
    "",
  ]

  if (result.epics.length === 0) {
    lines.push("Nenhum épico com label de variante encontrado — nada a auditar.", "")
  }

  for (const epic of result.epics) {
    lines.push(`ÉPICO #${epic.numero} — ${epic.variante ?? "sem variante"} — "${epic.titulo}"`)
    if (epic.findings.length === 0) {
      lines.push("  ✓ sem gaps")
    }
    for (const f of epic.findings) {
      lines.push(`  ${SEVERITY_MARK[f.severity]} [${f.codigo}] ${f.mensagem}`)
    }
    lines.push("")
  }

  for (const f of result.global) {
    lines.push(`${SEVERITY_MARK[f.severity]} [${f.codigo}] ${f.mensagem}`)
  }
  if (result.global.length > 0) lines.push("")

  const { epics, gaps, thresholds, signals } = result.resumo
  lines.push(`RESUMO: ${epics} épico(s) auditado(s) · ${gaps} gap(s) · ${thresholds} limiar(es) · ${signals} sinal(is)`)
  lines.push(
    result.exitCode === 0
      ? "Resultado: OK — instrumentação íntegra."
      : "Resultado: FALHOU — presence-gaps/limiares estourados. Revise antes do próximo dogfood.",
  )
  return lines.join("\n")
}
