import { describe, expect, it } from "vitest"
import type { CommentFacts, ForgeAdapter, IssueFacts } from "../platform/types.js"
import { auditEpic, buildReport, renderReport, THRESHOLDS, type EpicSnapshot } from "./report-core.js"
import { parseEventComments } from "./report-parse.js"
import { main } from "./report.js"

// --- Fixture builders (planted data, no hand-written JSON drift) -------------

function makeIssue(overrides: Partial<IssueFacts> = {}): IssueFacts {
  return {
    number: 12,
    id: 1001,
    title: "Implementar exportação de relatórios",
    body: "",
    state: "open",
    labels: ["variante-condensado"],
    assignees: ["rafael"],
    url: "https://github.com/acme/loja/issues/12",
    taskCompletion: null,
    ...overrides,
  }
}

const comment = (body: string): CommentFacts => ({ author: "fluxo[bot]", body, createdAt: "2026-07-28T10:00:00Z" })

const EVENT_A_OK = "**Evento A** — triagem: 2 perguntas de elicitação; deriváveis perguntadas: 0 — facilitador"
const EVENT_A_DERIVAVEL = "**Evento A** — triagem: 4 perguntas de elicitação; deriváveis perguntadas: 2 — facilitador"
const EVENT_A_CREEP = "**Evento A** — triagem: 6 perguntas de elicitação; deriváveis perguntadas: 0 — facilitador"
const EVENT_B_FAIL = "**Evento B** — entendimento: 2 rodada(s) de correção até a confirmação — facilitador"
const EVENT_D = '**Evento D** — override: Condensada → Mínima; critério contestado: "estimativa > 5 dias" — facilitador'
const EVENT_F_OK = "**Evento F** — rodada R02: desvios durante=2, na-reconciliação=0 — facilitador"
const EVENT_F_LATE = "**Evento F** — rodada R02: desvios durante=1, na-reconciliação=2 — facilitador"
const EVENT_E = (demanda: string) => `**Evento E** — recusa J8 (requisito novo); demanda criada: ${demanda} — facilitador`

function makeSnapshot(overrides: Partial<EpicSnapshot> = {}): EpicSnapshot {
  return {
    issue: makeIssue(),
    comments: [comment(EVENT_A_OK)],
    reconciliacao: { existe: false, estado: null, numero: null },
    boardColumn: "Em andamento",
    demandsExist: new Map(),
    ...overrides,
  }
}

// --- Parsers ------------------------------------------------------------------

describe("report-parse: event comment parsers (mirror of emit-event.ts)", () => {
  it("parses every event type", () => {
    const { events, drift } = parseEventComments([
      comment(EVENT_A_OK),
      comment(EVENT_B_FAIL),
      comment('**Evento C** — "não sei" no critério: estimativa-5-dias — facilitador'),
      comment(EVENT_D),
      comment(EVENT_E("#51")),
      comment(EVENT_E("pendente")),
      comment(EVENT_F_OK),
      comment("**Registro de override** — facilitador\n- Tipo: variante"),
      comment("comentário humano comum, ignorado"),
    ])
    expect(drift).toEqual([])
    expect(events.map((e) => e.type)).toEqual(["A", "B", "C", "D", "E", "E", "F", "override"])
    expect(events[0]).toMatchObject({ elicitacao: 2, derivaveis: 0 })
    expect(events[4]).toMatchObject({ demanda: 51 })
    expect(events[5]).toMatchObject({ demanda: "pendente" })
    expect(events[6]).toMatchObject({ rodada: "R02", durante: 2, naReconciliacao: 0 })
  })

  it("flags a marked comment that fails to parse as drift", () => {
    const { events, drift } = parseEventComments([
      comment("**Evento A** — triagem: formato antigo sem os campos novos — facilitador"),
    ])
    expect(events).toEqual([])
    expect(drift).toHaveLength(1)
  })
})

// --- Core audit ---------------------------------------------------------------

describe("fluxo-report core audit (planted fixtures)", () => {
  it("clean epic: no findings, exit 0", () => {
    const result = buildReport([auditEpic(makeSnapshot())])
    expect(result.resumo.gaps).toBe(0)
    expect(result.resumo.thresholds).toBe(0)
    expect(result.exitCode).toBe(0)
  })

  it("missing A: variante label without Evento A → PRESENCA-A gap", () => {
    const audit = auditEpic(makeSnapshot({ comments: [] }))
    expect(audit.findings.map((f) => f.codigo)).toEqual(["PRESENCA-A"])
  })

  it("FM-13: epic closed with reconciliation task open → gap naming the task", () => {
    const audit = auditEpic(
      makeSnapshot({
        issue: makeIssue({ state: "closed" }),
        reconciliacao: { existe: true, estado: "open", numero: 27 },
        boardColumn: "Em revisão",
      }),
    )
    const fm13 = audit.findings.find((f) => f.codigo === "FM-13")
    expect(fm13).toBeDefined()
    expect(fm13!.mensagem).toContain("#27")
    expect(fm13!.mensagem).not.toContain("bypass foi executado")
  })

  it("FM-13 escalates when the board already shows Entregue (two-click bypass completed)", () => {
    const audit = auditEpic(
      makeSnapshot({
        issue: makeIssue({ state: "closed" }),
        reconciliacao: { existe: true, estado: "open", numero: 27 },
        boardColumn: "Entregue",
      }),
    )
    expect(audit.findings.find((f) => f.codigo === "FM-13")!.mensagem).toContain("bypass foi executado por completo")
  })

  it("FM-13 on Mínima: closed single-issue epic without Evento F", () => {
    const audit = auditEpic(
      makeSnapshot({
        issue: makeIssue({ state: "closed", labels: ["variante-minimo"] }),
        reconciliacao: { existe: false, estado: null, numero: null },
      }),
    )
    expect(audit.findings.map((f) => f.codigo)).toContain("FM-13")
  })

  it("Mínima closed WITH Evento F: reconciliation done, no FM-13", () => {
    const audit = auditEpic(
      makeSnapshot({
        issue: makeIssue({ state: "closed", labels: ["variante-minimo"] }),
        comments: [comment(EVENT_A_OK), comment(EVENT_F_OK)],
      }),
    )
    expect(audit.findings.map((f) => f.codigo)).not.toContain("FM-13")
  })

  it("missing F: reconciliation task closed but no Evento F → PRESENCA-F (not FM-13)", () => {
    const audit = auditEpic(
      makeSnapshot({
        reconciliacao: { existe: true, estado: "closed", numero: 27 },
      }),
    )
    const codes = audit.findings.map((f) => f.codigo)
    expect(codes).toContain("PRESENCA-F")
    expect(codes).not.toContain("FM-13")
  })

  it("missing D: override-registrado label without Evento D → PRESENCA-D", () => {
    const audit = auditEpic(makeSnapshot({ issue: makeIssue({ labels: ["variante-condensado", "override-registrado"] }) }))
    expect(audit.findings.map((f) => f.codigo)).toEqual(["PRESENCA-D"])
  })

  it("E divergence >20% aggregated across epics → E-DIVERGENCIA threshold", () => {
    const e1 = auditEpic(makeSnapshot({ comments: [comment(EVENT_A_OK), comment(EVENT_E("#51")), comment(EVENT_E("pendente"))], demandsExist: new Map([[51, true]]) }))
    const e2 = auditEpic(makeSnapshot({ issue: makeIssue({ number: 13 }), comments: [comment(EVENT_A_OK), comment(EVENT_E("pendente"))] }))
    const result = buildReport([e1, e2])
    // 3 recusas, 1 criada → 67% divergence
    const div = result.global.find((f) => f.codigo === "E-DIVERGENCIA")
    expect(div).toBeDefined()
    expect(div!.severity).toBe("threshold")
    expect(div!.mensagem).toContain("3 recusa(s) J8 × 1 demanda(s)")
    expect(result.exitCode).toBe(1)
  })

  it("E with demand link to a nonexistent issue → E-LINK gap (recusa registrada, demanda perdida)", () => {
    const audit = auditEpic(makeSnapshot({ comments: [comment(EVENT_A_OK), comment(EVENT_E("#99"))], demandsExist: new Map([[99, false]]) }))
    expect(audit.findings.find((f) => f.codigo === "E-LINK")!.mensagem).toContain("#99")
  })

  it("F declared-during ratio below 50% → F-TARDIO threshold", () => {
    const audit = auditEpic(makeSnapshot({ comments: [comment(EVENT_A_OK), comment(EVENT_F_LATE)] }))
    const f = audit.findings.find((x) => x.codigo === "F-TARDIO")
    expect(f).toBeDefined()
    expect(f!.severity).toBe("threshold")
    expect(f!.mensagem).toContain("33% durante")
  })

  it("A with derivable questions → A-DERIVAVEL threshold (target zero)", () => {
    const audit = auditEpic(makeSnapshot({ comments: [comment(EVENT_A_DERIVAVEL)] }))
    const f = audit.findings.find((x) => x.codigo === "A-DERIVAVEL")
    expect(f!.mensagem).toContain("2 pergunta(s) derivável(is)")
    expect(THRESHOLDS.derivableQuestionsMax).toBe(0)
  })

  it("signals alone (B>1, A over cap) do not fail the report", () => {
    const audit = auditEpic(makeSnapshot({ comments: [comment(EVENT_A_CREEP), comment(EVENT_B_FAIL)] }))
    const codes = audit.findings.map((f) => f.codigo)
    expect(codes).toContain("SINAL-A-CAP")
    expect(codes).toContain("SINAL-B")
    const result = buildReport([audit])
    expect(result.exitCode).toBe(0)
    expect(result.resumo.signals).toBe(2)
  })

  it("Mínima cap is stricter (≤3): 4 questions on variante-minimo → signal", () => {
    const audit = auditEpic(
      makeSnapshot({
        issue: makeIssue({ labels: ["variante-minimo"] }),
        comments: [comment("**Evento A** — triagem: 4 perguntas de elicitação; deriváveis perguntadas: 0 — facilitador")],
      }),
    )
    expect(audit.findings.map((f) => f.codigo)).toContain("SINAL-A-CAP")
  })

  it("drift: marked comment with unknown format → DRIFT gap", () => {
    const audit = auditEpic(
      makeSnapshot({ comments: [comment(EVENT_A_OK), comment("**Evento F** — formato inventado pelo agente — facilitador")] }),
    )
    expect(audit.findings.map((f) => f.codigo)).toContain("DRIFT")
  })

  it("renders the PT-BR report with per-epic sections and a loud failure footer", () => {
    const result = buildReport([auditEpic(makeSnapshot({ comments: [] }))])
    const text = renderReport(result, "github · github.com · acme/loja")
    expect(text).toContain("fluxo-report — auditoria de instrumentação A–F")
    expect(text).toContain("ÉPICO #12")
    expect(text).toContain("PRESENCA-A")
    expect(text).toContain("Resultado: FALHOU")
  })
})

// --- CLI end-to-end with a stubbed adapter -------------------------------------

function fakeAdapter(overrides: Partial<ForgeAdapter>): ForgeAdapter {
  return {
    kind: "github",
    listEpics: async () => [],
    getIssue: async () => makeIssue(),
    listChildren: async () => [],
    listComments: async () => [],
    postComment: async () => {},
    getParent: async () => null,
    getBoardColumn: async () => null,
    ...overrides,
  }
}

const FORGE = { kind: "github" as const, host: "github.com", project: "acme/loja" }

describe("fluxo-report CLI (stubbed resolveForge)", () => {
  it("sweep: detects planted FM-13 and exits 1 with the PT-BR report", async () => {
    const lines: string[] = []
    const adapter = fakeAdapter({
      listEpics: async () => [makeIssue({ state: "closed" })],
      getIssue: async () => makeIssue({ state: "closed" }),
      listChildren: async () => [
        { number: 27, title: "Reconciliação da rodada", state: "open", labels: ["etapa-3"], assignees: ["joao"] },
      ],
      listComments: async () => [comment(EVENT_A_OK)],
      getBoardColumn: async () => "Entregue",
    })
    const code = await main([], {
      resolveForgeFn: async () => ({ adapter, forge: FORGE }),
      log: (l) => lines.push(l),
    })
    expect(code).toBe(1)
    const report = lines.join("\n")
    expect(report).toContain("FM-13")
    expect(report).toContain("bypass foi executado por completo")
    expect(report).toContain("Resultado: FALHOU")
  })

  it("clean sweep exits 0", async () => {
    const adapter = fakeAdapter({
      listEpics: async () => [makeIssue()],
      listComments: async () => [comment(EVENT_A_OK)],
    })
    const code = await main([], { resolveForgeFn: async () => ({ adapter, forge: FORGE }), log: () => {} })
    expect(code).toBe(0)
  })

  it("verifies E-demand existence through the adapter (state leg of E parity)", async () => {
    const lines: string[] = []
    const adapter = fakeAdapter({
      listEpics: async () => [makeIssue()],
      listComments: async () => [comment(EVENT_A_OK), comment(EVENT_E("#51")), comment(EVENT_E("pendente"))],
      getIssue: async (ref) => {
        if (ref.number === 51) throw new Error("404 Not Found")
        return makeIssue()
      },
    })
    const code = await main([], {
      resolveForgeFn: async () => ({ adapter, forge: FORGE }),
      log: (l) => lines.push(l),
    })
    expect(code).toBe(1)
    const report = lines.join("\n")
    expect(report).toContain("E-LINK")
    expect(report).toContain("E-DIVERGENCIA")
  })

  it("--epics limits the audit to the listed numbers", async () => {
    const read: number[] = []
    const adapter = fakeAdapter({
      listComments: async (ref) => {
        read.push(ref.number)
        return [comment(EVENT_A_OK)]
      },
    })
    const code = await main(["--epics", "12,15"], {
      resolveForgeFn: async () => ({ adapter, forge: FORGE }),
      log: () => {},
    })
    expect(code).toBe(0)
    expect(read).toEqual([12, 15])
  })

  it("fails loudly when the platform is not detected", async () => {
    const errors: string[] = []
    const code = await main([], { resolveForgeFn: async () => null, error: (l) => errors.push(l), log: () => {} })
    expect(code).toBe(1)
    expect(errors[0]).toContain("plataforma de issues não detectada")
  })
})
