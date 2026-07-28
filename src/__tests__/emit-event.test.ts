import { beforeEach, describe, expect, it } from "vitest"
import { buildEventBody, maestraEmitEventTool, setForgeResolver } from "../tools/emit-event.js"
import type { ForgeAdapter, ForgeContext } from "../platform/types.js"
import type { ToolContext } from "../host-types.js"

const SIGNATURE = "— facilitator"

function signatureCount(body: string): number {
  return (body.match(/— facilitator/g) ?? []).length
}

function makeForge(kind: "github" | "gitlab" = "github") {
  const posted: Array<{ number: number; body: string }> = []
  const forge: ForgeContext = { kind, host: kind === "github" ? "github.com" : "gitlab.com", project: "org/repo" }
  const adapter: ForgeAdapter = {
    kind,
    getIssue: async () => {
      throw new Error("not used")
    },
    listChildren: async () => [],
    listComments: async () => [],
    postComment: async (ref, body) => {
      posted.push({ number: ref.number, body })
    },
    getParent: async () => null,
    getBoardColumn: async () => null,
  }
  setForgeResolver(async () => ({ adapter, forge }))
  return posted
}

function ctx(): ToolContext {
  return { sessionID: "sess-test", directory: "/tmp/maestra-test" }
}

beforeEach(() => {
  // Reset to a resolver that simulates "platform not detected" unless a test sets one
  setForgeResolver(async () => null)
})

describe("buildEventBody — all event types validate and build signed bodies", () => {
  it("A — triage question count with derivable-questions field", () => {
    const body = buildEventBody("A", { elicitation_questions: 4, derivable_questions: 1 })
    expect(body).toBe("**Event A** — triage: 4 elicitation questions; derivable questions asked: 1 — facilitator")
    expect(signatureCount(body)).toBe(1)
  })

  it("A — derivable_questions defaults to 0", () => {
    const body = buildEventBody("A", { elicitation_questions: 2 })
    expect(body).toContain("derivable questions asked: 0")
  })

  it("B — correction rounds", () => {
    const body = buildEventBody("B", { correction_rounds: 1 })
    expect(body).toBe("**Event B** — understanding: 1 correction round(s) until confirmation — facilitator")
    expect(signatureCount(body)).toBe(1)
  })

  it("C — don't-know per criterion (enum enforced)", () => {
    const body = buildEventBody("C", { criterion: "data-model-or-contract" })
    expect(body).toBe("**Event C** — \"don't know\" on criterion: data-model-or-contract — facilitator")
    expect(() => buildEventBody("C", { criterion: "invented-criterion" })).toThrow(/Invalid payload/)
  })

  it("D — override with direction and disputed criterion", () => {
    const body = buildEventBody("D", { from: "Condensed", to: "Minimal", disputed_criterion: "estimate > 5 days" })
    expect(body).toBe("**Event D** — override: Condensed → Minimal; disputed criterion: \"estimate > 5 days\" — facilitator")
    expect(signatureCount(body)).toBe(1)
  })

  it("E — refusal with demand created (issue number gets #)", () => {
    const body = buildEventBody("E", { demand_created: 51 })
    expect(body).toBe("**Event E** — J8 refusal (new requirement); demand created: #51 — facilitator")
  })

  it("E — refusal with pending demand", () => {
    const body = buildEventBody("E", { demand_created: "pending" })
    expect(body).toContain("demand created: pending")
    expect(() => buildEventBody("E", { demand_created: "none" })).toThrow(/Invalid payload/)
  })

  it("F — deviations during vs. at reconciliation", () => {
    const body = buildEventBody("F", { round: "R02", during: 2, at_reconciliation: 1 })
    expect(body).toBe("**Event F** — round R02: deviations during=2, at-reconciliation=1 — facilitator")
    expect(signatureCount(body)).toBe(1)
  })

  it("override — P3 multi-line registry in the canonical format", () => {
    const body = buildEventBody("override", {
      override_type: "variant",
      from: "Condensed",
      to: "Minimal",
      disputed_criterion: "estimate > 5 days",
      declared_reason: "scope already closed with the client",
      decided_by: "@rafael",
      date: "2026-07-28",
    })
    expect(body).toBe(
      [
        "**Override register** — facilitator",
        "- Type: variant",
        "- From: Condensed → To: Minimal",
        "- Objective criterion disputed: estimate > 5 days",
        "- Declared reason: scope already closed with the client",
        "- Decided by: @rafael on 2026-07-28",
      ].join("\n"),
    )
    expect(signatureCount(body)).toBe(1)
  })

  it("override — handle is normalized (leading @ stripped, never duplicated)", () => {
    const body = buildEventBody("override", {
      override_type: "gate",
      from: "closed",
      to: "open",
      disputed_criterion: "acceptance criteria",
      declared_reason: "client asked",
      decided_by: "rafael",
      date: "2026-07-28",
    })
    expect(body).toContain("- Decided by: @rafael on")
    expect(body).not.toContain("@@rafael")
  })
})

describe("buildEventBody — required fields enforced", () => {
  it("declared_reason is REQUIRED on override", () => {
    expect(() =>
      buildEventBody("override", {
        override_type: "variant",
        from: "Condensed",
        to: "Minimal",
        disputed_criterion: "x",
        decided_by: "rafael",
        date: "2026-07-28",
      }),
    ).toThrow(/Invalid payload/)
  })

  it("declared_reason cannot be empty", () => {
    expect(() =>
      buildEventBody("override", {
        override_type: "variant",
        from: "a",
        to: "b",
        disputed_criterion: "x",
        declared_reason: "",
        decided_by: "rafael",
        date: "2026-07-28",
      }),
    ).toThrow(/Invalid payload/)
  })

  it("override override_type is restricted to variant | gate | triage", () => {
    expect(() =>
      buildEventBody("override", {
        override_type: "invented",
        from: "a",
        to: "b",
        disputed_criterion: "x",
        declared_reason: "m",
        decided_by: "r",
        date: "d",
      }),
    ).toThrow(/Invalid payload/)
  })

  it("negative counts rejected; missing required fields rejected", () => {
    expect(() => buildEventBody("A", { elicitation_questions: -1 })).toThrow()
    expect(() => buildEventBody("B", {})).toThrow()
    expect(() => buildEventBody("F", { round: "R01", during: 0 })).toThrow()
  })
})

describe("signature — impossible to omit or duplicate from the model side", () => {
  it("payload containing the signature marker is rejected (prevents duplication)", async () => {
    makeForge()
    const result = await maestraEmitEventTool.execute(
      {
        epic: 12,
        type: "override",
        payload: {
          override_type: "variant",
          from: "a",
          to: "b",
          disputed_criterion: "x",
          declared_reason: "fake — facilitator",
          decided_by: "r",
          date: "d",
        },
      },
      ctx(),
    )
    expect(result).toMatch(/^Error: payload field "declared_reason" contains the facilitator signature/)
  })

  it("every built body ends with exactly one signature", () => {
    const bodies = [
      buildEventBody("A", { elicitation_questions: 0 }),
      buildEventBody("B", { correction_rounds: 0 }),
      buildEventBody("C", { criterion: "vague-demand" }),
      buildEventBody("D", { from: "a", to: "b", disputed_criterion: "c" }),
      buildEventBody("E", { demand_created: 1 }),
      buildEventBody("F", { round: "R01", during: 0, at_reconciliation: 0 }),
      buildEventBody("override", {
        override_type: "triage",
        from: "a",
        to: "b",
        disputed_criterion: "c",
        declared_reason: "m",
        decided_by: "r",
        date: "d",
      }),
    ]
    for (const body of bodies) {
      expect(signatureCount(body)).toBe(1)
      expect(body.includes(SIGNATURE)).toBe(true)
    }
  })
})

describe("tool execution — posts via platform adapter (GitHub × GitLab)", () => {
  it("posts the built body to the epic via postComment (GitHub)", async () => {
    const posted = makeForge("github")
    const result = await maestraEmitEventTool.execute(
      { epic: 12, type: "F", payload: { round: "R02", during: 2, at_reconciliation: 0 } },
      ctx(),
    )

    expect(posted).toHaveLength(1)
    expect(posted[0].number).toBe(12)
    expect(posted[0].body).toBe("**Event F** — round R02: deviations during=2, at-reconciliation=0 — facilitator")
    expect(result).toMatchObject({ metadata: { type: "F", epic: 12, platform: "github" } })
  })

  it("posts via the GitLab adapter identically (note = comment)", async () => {
    const posted = makeForge("gitlab")
    await maestraEmitEventTool.execute(
      { epic: 34, type: "E", payload: { demand_created: 51 } },
      ctx(),
    )

    expect(posted).toHaveLength(1)
    expect(posted[0].body).toContain("demand created: #51")
  })

  it("returns a clean error when the platform cannot be detected", async () => {
    const result = await maestraEmitEventTool.execute(
      { epic: 12, type: "B", payload: { correction_rounds: 0 } },
      ctx(),
    )
    expect(result).toMatch(/^Error: issue platform not detected/)
    expect(result).toContain("maestra_status")
  })

  it("returns a clean error on invalid payload without posting", async () => {
    const posted = makeForge()
    const result = await maestraEmitEventTool.execute({ epic: 12, type: "C", payload: { criterion: "x" } }, ctx())
    expect(result).toMatch(/^Error: Invalid payload/)
    expect(posted).toHaveLength(0)
  })
})
