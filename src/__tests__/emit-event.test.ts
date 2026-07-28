import { beforeEach, describe, expect, it } from "vitest"
import { buildEventBody, maestraEmitEventTool, setForgeResolver } from "../tools/emit-event.js"
import type { ForgeAdapter, ForgeContext } from "../platform/types.js"
import type { ToolContext } from "../host-types.js"

const SIGNATURE = "— facilitador"

function signatureCount(body: string): number {
  return (body.match(/— facilitador/g) ?? []).length
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
    const body = buildEventBody("A", { perguntas_elicitacao: 4, perguntas_derivaveis: 1 })
    expect(body).toBe("**Evento A** — triagem: 4 perguntas de elicitação; deriváveis perguntadas: 1 — facilitador")
    expect(signatureCount(body)).toBe(1)
  })

  it("A — perguntas_derivaveis defaults to 0", () => {
    const body = buildEventBody("A", { perguntas_elicitacao: 2 })
    expect(body).toContain("deriváveis perguntadas: 0")
  })

  it("B — correction rounds", () => {
    const body = buildEventBody("B", { rodadas_correcao: 1 })
    expect(body).toBe("**Evento B** — entendimento: 1 rodada(s) de correção até a confirmação — facilitador")
    expect(signatureCount(body)).toBe(1)
  })

  it("C — não-sei per criterion (enum enforced)", () => {
    const body = buildEventBody("C", { criterio: "modelo-dados-ou-contrato" })
    expect(body).toBe('**Evento C** — "não sei" no critério: modelo-dados-ou-contrato — facilitador')
    expect(() => buildEventBody("C", { criterio: "criterio-inventado" })).toThrow(/Invalid payload/)
  })

  it("D — override with direction and disputed criterion", () => {
    const body = buildEventBody("D", { de: "Condensada", para: "Mínima", criterio_contestado: "estimativa > 5 dias" })
    expect(body).toBe('**Evento D** — override: Condensada → Mínima; critério contestado: "estimativa > 5 dias" — facilitador')
    expect(signatureCount(body)).toBe(1)
  })

  it("E — refusal with demand created (issue number gets #)", () => {
    const body = buildEventBody("E", { demanda_criada: 51 })
    expect(body).toBe("**Evento E** — recusa J8 (requisito novo); demanda criada: #51 — facilitador")
  })

  it("E — refusal with pending demand", () => {
    const body = buildEventBody("E", { demanda_criada: "pendente" })
    expect(body).toContain("demanda criada: pendente")
    expect(() => buildEventBody("E", { demanda_criada: "nenhuma" })).toThrow(/Invalid payload/)
  })

  it("F — deviations during vs. at reconciliation", () => {
    const body = buildEventBody("F", { rodada: "R02", durante: 2, na_reconciliacao: 1 })
    expect(body).toBe("**Evento F** — rodada R02: desvios durante=2, na-reconciliação=1 — facilitador")
    expect(signatureCount(body)).toBe(1)
  })

  it("override — P3 multi-line registry in the canonical format", () => {
    const body = buildEventBody("override", {
      tipo: "variante",
      de: "Condensada",
      para: "Mínima",
      criterio_contestado: "estimativa > 5 dias",
      motivo_declarado: "escopo já está fechado com o cliente",
      decidido_por: "@rafael",
      data: "2026-07-28",
    })
    expect(body).toBe(
      [
        "**Registro de override** — facilitador",
        "- Tipo: variante",
        "- De: Condensada → Para: Mínima",
        "- Critério objetivo contestado: estimativa > 5 dias",
        "- Motivo declarado: escopo já está fechado com o cliente",
        "- Decidido por: @rafael em 2026-07-28",
      ].join("\n"),
    )
    expect(signatureCount(body)).toBe(1)
  })

  it("override — handle is normalized (leading @ stripped, never duplicated)", () => {
    const body = buildEventBody("override", {
      tipo: "gate",
      de: "fechado",
      para: "aberto",
      criterio_contestado: "critérios de aceite",
      motivo_declarado: "cliente pediu",
      decidido_por: "rafael",
      data: "2026-07-28",
    })
    expect(body).toContain("- Decidido por: @rafael em")
    expect(body).not.toContain("@@rafael")
  })
})

describe("buildEventBody — required fields enforced", () => {
  it("motivo_declarado is REQUIRED on override", () => {
    expect(() =>
      buildEventBody("override", {
        tipo: "variante",
        de: "Condensada",
        para: "Mínima",
        criterio_contestado: "x",
        decidido_por: "rafael",
        data: "2026-07-28",
      }),
    ).toThrow(/Invalid payload/)
  })

  it("motivo_declarado cannot be empty", () => {
    expect(() =>
      buildEventBody("override", {
        tipo: "variante",
        de: "a",
        para: "b",
        criterio_contestado: "x",
        motivo_declarado: "",
        decidido_por: "rafael",
        data: "2026-07-28",
      }),
    ).toThrow(/Invalid payload/)
  })

  it("override tipo is restricted to variante | gate | triagem", () => {
    expect(() =>
      buildEventBody("override", {
        tipo: "inventado",
        de: "a",
        para: "b",
        criterio_contestado: "x",
        motivo_declarado: "m",
        decidido_por: "r",
        data: "d",
      }),
    ).toThrow(/Invalid payload/)
  })

  it("negative counts rejected; missing required fields rejected", () => {
    expect(() => buildEventBody("A", { perguntas_elicitacao: -1 })).toThrow()
    expect(() => buildEventBody("B", {})).toThrow()
    expect(() => buildEventBody("F", { rodada: "R01", durante: 0 })).toThrow()
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
          tipo: "variante",
          de: "a",
          para: "b",
          criterio_contestado: "x",
          motivo_declarado: "fake — facilitador",
          decidido_por: "r",
          data: "d",
        },
      },
      ctx(),
    )
    expect(result).toMatch(/^Error: payload field "motivo_declarado" contains the facilitator signature/)
  })

  it("every built body ends with exactly one signature", () => {
    const bodies = [
      buildEventBody("A", { perguntas_elicitacao: 0 }),
      buildEventBody("B", { rodadas_correcao: 0 }),
      buildEventBody("C", { criterio: "demanda-vaga" }),
      buildEventBody("D", { de: "a", para: "b", criterio_contestado: "c" }),
      buildEventBody("E", { demanda_criada: 1 }),
      buildEventBody("F", { rodada: "R01", durante: 0, na_reconciliacao: 0 }),
      buildEventBody("override", {
        tipo: "triagem",
        de: "a",
        para: "b",
        criterio_contestado: "c",
        motivo_declarado: "m",
        decidido_por: "r",
        data: "d",
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
      { epic: 12, type: "F", payload: { rodada: "R02", durante: 2, na_reconciliacao: 0 } },
      ctx(),
    )

    expect(posted).toHaveLength(1)
    expect(posted[0].number).toBe(12)
    expect(posted[0].body).toBe("**Evento F** — rodada R02: desvios durante=2, na-reconciliação=0 — facilitador")
    expect(result).toMatchObject({ metadata: { type: "F", epic: 12, platform: "github" } })
  })

  it("posts via the GitLab adapter identically (note = comment)", async () => {
    const posted = makeForge("gitlab")
    await maestraEmitEventTool.execute(
      { epic: 34, type: "E", payload: { demanda_criada: 51 } },
      ctx(),
    )

    expect(posted).toHaveLength(1)
    expect(posted[0].body).toContain("demanda criada: #51")
  })

  it("returns a clean error when the platform cannot be detected", async () => {
    const result = await maestraEmitEventTool.execute(
      { epic: 12, type: "B", payload: { rodadas_correcao: 0 } },
      ctx(),
    )
    expect(result).toMatch(/^Error: issue platform not detected/)
    expect(result).toContain("maestra_status")
  })

  it("returns a clean error on invalid payload without posting", async () => {
    const posted = makeForge()
    const result = await maestraEmitEventTool.execute({ epic: 12, type: "C", payload: { criterio: "x" } }, ctx())
    expect(result).toMatch(/^Error: Invalid payload/)
    expect(posted).toHaveLength(0)
  })
})
