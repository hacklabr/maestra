import { describe, expect, it } from "vitest"
import {
  classifyComment,
  classifyLabels,
  extractDeclaredArtifactPath,
  parseMetadataLine,
  parseTasklist,
} from "../digest-parse.js"

describe("classifyLabels (frozen vocabulary)", () => {
  it("extracts variante, etapas and markers; ignores everything else", () => {
    expect(
      classifyLabels(["bug", "variante-condensado", "etapa-2", "override-registrado", "priority-high"]),
    ).toEqual({
      variante: "variante-condensado",
      etapas: ["etapa-2"],
      marcadores: ["override-registrado"],
    })
  })

  it("returns null variante and empty arrays when no fluxo labels exist", () => {
    expect(classifyLabels(["bug"])).toEqual({ variante: null, etapas: [], marcadores: [] })
  })
})

describe("parseMetadataLine (P1)", () => {
  it("parses the full line including Subestado (P1.1)", () => {
    const body =
      "## Resumo\n\nTexto.\n\n**Variante:** condensado · **Etapa atual:** etapa-2 · **Épico:** #42 · **Rodada:** R02 · **Subestado:** em-execucao\n\n---"
    expect(parseMetadataLine(body)).toEqual({
      variante: "condensado",
      etapaAtual: "etapa-2",
      epico: 42,
      rodada: "R02",
      subestado: "em-execucao",
    })
  })

  it("returns null subestado when the field is absent (pre-P1.1 issues)", () => {
    const body = "**Variante:** minimo · **Etapa atual:** etapa-3 · **Épico:** #7 · **Rodada:** R05"
    expect(parseMetadataLine(body)?.subestado).toBeNull()
    expect(parseMetadataLine(body)?.epico).toBe(7)
  })

  it("returns null when there is no metadata line (J2 branch B1)", () => {
    expect(parseMetadataLine("issue avulsa sem metadados")).toBeNull()
  })
})

describe("classifyComment (P3 / events / signature)", () => {
  it("detects override registers", () => {
    expect(classifyComment("**Registro de override** — facilitador\n- Tipo: gate")).toBe("override")
  })

  it("detects instrumentation events A–F", () => {
    expect(classifyComment("**Evento A** — triagem épico #42: 3 perguntas — facilitador")).toBe("evento")
    expect(classifyComment("**Evento F** — rodada R02: durante=2, reconciliação=1 — facilitador")).toBe("evento")
  })

  it("detects other facilitator-signed comments (gates)", () => {
    expect(classifyComment("Gate verificado: 2 de 2 fechadas.\n— facilitador")).toBe("facilitador")
  })

  it("returns null for plain human comments", () => {
    expect(classifyComment("começando hoje")).toBeNull()
    expect(classifyComment("parece bom, facilitador")).toBeNull()
  })

  it("override wins over event when both markers appear", () => {
    expect(classifyComment("**Registro de override** — facilitador\n**Evento D** — x")).toBe("override")
  })
})

describe("parseTasklist (ADR-011)", () => {
  it("parses checked and unchecked items with issue refs", () => {
    const body = "## Tarefas\n\n- [ ] #43\n- [x] #44\n- [X] #45\n- [ ] item sem issue"
    expect(parseTasklist(body)).toEqual([
      { numero: 43, marcado: false },
      { numero: 44, marcado: true },
      { numero: 45, marcado: true },
    ])
  })

  it("returns empty when there is no tasklist", () => {
    expect(parseTasklist("sem tasklist aqui")).toEqual([])
  })
})

describe("extractDeclaredArtifactPath (G-05)", () => {
  it("extracts docs/referencia paths", () => {
    expect(extractDeclaredArtifactPath("REFERÊNCIA — atualizar docs/referencia/prd.md, seção X")).toBe(
      "docs/referencia/prd.md",
    )
  })

  it("extracts docs/rodadas paths", () => {
    expect(
      extractDeclaredArtifactPath("REGISTRO — docs/rodadas/R02-2026-10-exportacao/mini-briefing.md"),
    ).toBe("docs/rodadas/R02-2026-10-exportacao/mini-briefing.md")
  })

  it("extracts docs/decisoes (ADR) paths", () => {
    expect(extractDeclaredArtifactPath("criar docs/decisoes/adr/ADR-003-cache.md")).toBe(
      "docs/decisoes/adr/ADR-003-cache.md",
    )
  })

  it("returns null without a declared path", () => {
    expect(extractDeclaredArtifactPath("comentário técnico na própria issue")).toBeNull()
  })
})
