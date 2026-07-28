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
    title: "Implement report export",
    body: "",
    state: "open",
    labels: ["variant-condensed"],
    assignees: ["rafael"],
    url: "https://github.com/acme/loja/issues/12",
    taskCompletion: null,
    ...overrides,
  }
}

const comment = (body: string): CommentFacts => ({ author: "maestra[bot]", body, createdAt: "2026-07-28T10:00:00Z" })

const EVENT_A_OK = "**Event A** — triage: 2 elicitation questions; derivable questions asked: 0 — facilitator"
const EVENT_A_DERIVAVEL = "**Event A** — triage: 4 elicitation questions; derivable questions asked: 2 — facilitator"
const EVENT_A_CREEP = "**Event A** — triage: 6 elicitation questions; derivable questions asked: 0 — facilitator"
const EVENT_B_FAIL = "**Event B** — understanding: 2 correction round(s) until confirmation — facilitator"
const EVENT_D = '**Event D** — override: Condensed → Minimal; disputed criterion: "estimate > 5 days" — facilitator'
const EVENT_F_OK = "**Event F** — round R02: deviations during=2, at-reconciliation=0 — facilitator"
const EVENT_F_LATE = "**Event F** — round R02: deviations during=1, at-reconciliation=2 — facilitator"
const EVENT_E = (demand: string) => `**Event E** — J8 refusal (new requirement); demand created: ${demand} — facilitator`

function makeSnapshot(overrides: Partial<EpicSnapshot> = {}): EpicSnapshot {
  return {
    issue: makeIssue(),
    comments: [comment(EVENT_A_OK)],
    reconciliation: { exists: false, state: null, number: null },
    boardColumn: "In progress",
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
      comment('**Event C** — "don\'t know" on criterion: estimate-5-days — facilitator'),
      comment(EVENT_D),
      comment(EVENT_E("#51")),
      comment(EVENT_E("pending")),
      comment(EVENT_F_OK),
      comment("**Override register** — facilitator\n- Type: variant"),
      comment("plain human comment, ignored"),
    ])
    expect(drift).toEqual([])
    expect(events.map((e) => e.type)).toEqual(["A", "B", "C", "D", "E", "E", "F", "override"])
    expect(events[0]).toMatchObject({ elicitation: 2, derivable: 0 })
    expect(events[4]).toMatchObject({ demand: 51 })
    expect(events[5]).toMatchObject({ demand: "pending" })
    expect(events[6]).toMatchObject({ round: "R02", during: 2, atReconciliation: 0 })
  })

  it("flags a marked comment that fails to parse as drift", () => {
    const { events, drift } = parseEventComments([
      comment("**Event A** — triage: old format without the new fields — facilitator"),
    ])
    expect(events).toEqual([])
    expect(drift).toHaveLength(1)
  })
})

// --- Core audit ---------------------------------------------------------------

describe("maestra-report core audit (planted fixtures)", () => {
  it("clean epic: no findings, exit 0", () => {
    const result = buildReport([auditEpic(makeSnapshot())])
    expect(result.summary.gaps).toBe(0)
    expect(result.summary.thresholds).toBe(0)
    expect(result.exitCode).toBe(0)
  })

  it("missing A: variant label without Event A → PRESENCE-A gap", () => {
    const audit = auditEpic(makeSnapshot({ comments: [] }))
    expect(audit.findings.map((f) => f.code)).toEqual(["PRESENCE-A"])
  })

  it("FM-13: epic closed with reconciliation task open → gap naming the task", () => {
    const audit = auditEpic(
      makeSnapshot({
        issue: makeIssue({ state: "closed" }),
        reconciliation: { exists: true, state: "open", number: 27 },
        boardColumn: "In review",
      }),
    )
    const fm13 = audit.findings.find((f) => f.code === "FM-13")
    expect(fm13).toBeDefined()
    expect(fm13!.message).toContain("#27")
    expect(fm13!.message).not.toContain("bypass was fully executed")
  })

  it("FM-13 escalates when the board already shows Delivered (two-click bypass completed)", () => {
    const audit = auditEpic(
      makeSnapshot({
        issue: makeIssue({ state: "closed" }),
        reconciliation: { exists: true, state: "open", number: 27 },
        boardColumn: "Delivered",
      }),
    )
    expect(audit.findings.find((f) => f.code === "FM-13")!.message).toContain("bypass was fully executed")
  })

  it("FM-13 on Minimal: closed single-issue epic without Event F", () => {
    const audit = auditEpic(
      makeSnapshot({
        issue: makeIssue({ state: "closed", labels: ["variant-minimal"] }),
        reconciliation: { exists: false, state: null, number: null },
      }),
    )
    expect(audit.findings.map((f) => f.code)).toContain("FM-13")
  })

  it("Minimal closed WITH Event F: reconciliation done, no FM-13", () => {
    const audit = auditEpic(
      makeSnapshot({
        issue: makeIssue({ state: "closed", labels: ["variant-minimal"] }),
        comments: [comment(EVENT_A_OK), comment(EVENT_F_OK)],
      }),
    )
    expect(audit.findings.map((f) => f.code)).not.toContain("FM-13")
  })

  it("missing F: reconciliation task closed but no Event F → PRESENCE-F (not FM-13)", () => {
    const audit = auditEpic(
      makeSnapshot({
        reconciliation: { exists: true, state: "closed", number: 27 },
      }),
    )
    const codes = audit.findings.map((f) => f.code)
    expect(codes).toContain("PRESENCE-F")
    expect(codes).not.toContain("FM-13")
  })

  it("missing D: override-registered label without Event D → PRESENCE-D", () => {
    const audit = auditEpic(makeSnapshot({ issue: makeIssue({ labels: ["variant-condensed", "override-registered"] }) }))
    expect(audit.findings.map((f) => f.code)).toEqual(["PRESENCE-D"])
  })

  it("E divergence >20% aggregated across epics → E-DIVERGENCE threshold", () => {
    const e1 = auditEpic(makeSnapshot({ comments: [comment(EVENT_A_OK), comment(EVENT_E("#51")), comment(EVENT_E("pending"))], demandsExist: new Map([[51, true]]) }))
    const e2 = auditEpic(makeSnapshot({ issue: makeIssue({ number: 13 }), comments: [comment(EVENT_A_OK), comment(EVENT_E("pending"))] }))
    const result = buildReport([e1, e2])
    // 3 refusals, 1 created → 67% divergence
    const div = result.global.find((f) => f.code === "E-DIVERGENCE")
    expect(div).toBeDefined()
    expect(div!.severity).toBe("threshold")
    expect(div!.message).toContain("3 J8 refusal(s) × 1 demand(s)")
    expect(result.exitCode).toBe(1)
  })

  it("E with demand link to a nonexistent issue → E-LINK gap (refusal registered, demand lost)", () => {
    const audit = auditEpic(makeSnapshot({ comments: [comment(EVENT_A_OK), comment(EVENT_E("#99"))], demandsExist: new Map([[99, false]]) }))
    expect(audit.findings.find((f) => f.code === "E-LINK")!.message).toContain("#99")
  })

  it("F declared-during ratio below 50% → F-LATE threshold", () => {
    const audit = auditEpic(makeSnapshot({ comments: [comment(EVENT_A_OK), comment(EVENT_F_LATE)] }))
    const f = audit.findings.find((x) => x.code === "F-LATE")
    expect(f).toBeDefined()
    expect(f!.severity).toBe("threshold")
    expect(f!.message).toContain("33% during")
  })

  it("A with derivable questions → A-DERIVABLE threshold (target zero)", () => {
    const audit = auditEpic(makeSnapshot({ comments: [comment(EVENT_A_DERIVAVEL)] }))
    const f = audit.findings.find((x) => x.code === "A-DERIVABLE")
    expect(f!.message).toContain("2 derivable question(s)")
    expect(THRESHOLDS.derivableQuestionsMax).toBe(0)
  })

  it("signals alone (B>1, A over cap) do not fail the report", () => {
    const audit = auditEpic(makeSnapshot({ comments: [comment(EVENT_A_CREEP), comment(EVENT_B_FAIL)] }))
    const codes = audit.findings.map((f) => f.code)
    expect(codes).toContain("SIGNAL-A-CAP")
    expect(codes).toContain("SIGNAL-B")
    const result = buildReport([audit])
    expect(result.exitCode).toBe(0)
    expect(result.summary.signals).toBe(2)
  })

  it("Minimal cap is stricter (≤3): 4 questions on variant-minimal → signal", () => {
    const audit = auditEpic(
      makeSnapshot({
        issue: makeIssue({ labels: ["variant-minimal"] }),
        comments: [comment("**Event A** — triage: 4 elicitation questions; derivable questions asked: 0 — facilitator")],
      }),
    )
    expect(audit.findings.map((f) => f.code)).toContain("SIGNAL-A-CAP")
  })

  it("drift: marked comment with unknown format → DRIFT gap", () => {
    const audit = auditEpic(
      makeSnapshot({ comments: [comment(EVENT_A_OK), comment("**Event F** — invented agent format — facilitator")] }),
    )
    expect(audit.findings.map((f) => f.code)).toContain("DRIFT")
  })

  it("renders the report with per-epic sections and a loud failure footer", () => {
    const result = buildReport([auditEpic(makeSnapshot({ comments: [] }))])
    const text = renderReport(result, "github · github.com · acme/loja")
    expect(text).toContain("maestra-report — A–F instrumentation audit")
    expect(text).toContain("EPIC #12")
    expect(text).toContain("PRESENCE-A")
    expect(text).toContain("Result: FAILED")
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

describe("maestra-report CLI (stubbed resolveForge)", () => {
  it("sweep: detects planted FM-13 and exits 1 with the report", async () => {
    const lines: string[] = []
    const adapter = fakeAdapter({
      listEpics: async () => [makeIssue({ state: "closed" })],
      getIssue: async () => makeIssue({ state: "closed" }),
      listChildren: async () => [
        { number: 27, title: "Round reconciliation", state: "open", labels: ["stage-3"], assignees: ["joao"] },
      ],
      listComments: async () => [comment(EVENT_A_OK)],
      getBoardColumn: async () => "Delivered",
    })
    const code = await main([], {
      resolveForgeFn: async () => ({ adapter, forge: FORGE }),
      log: (l) => lines.push(l),
    })
    expect(code).toBe(1)
    const report = lines.join("\n")
    expect(report).toContain("FM-13")
    expect(report).toContain("bypass was fully executed")
    expect(report).toContain("Result: FAILED")
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
      listComments: async () => [comment(EVENT_A_OK), comment(EVENT_E("#51")), comment(EVENT_E("pending"))],
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
    expect(report).toContain("E-DIVERGENCE")
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
    expect(errors[0]).toContain("issue platform not detected")
  })
})
