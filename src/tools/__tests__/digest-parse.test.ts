import { describe, expect, it } from "vitest"
import {
  classifyComment,
  classifyLabels,
  extractDeclaredArtifactPath,
  parseMetadataLine,
  parseTasklist,
} from "../digest-parse.js"

describe("classifyLabels (frozen vocabulary)", () => {
  it("extracts variant, stages and markers; ignores everything else", () => {
    expect(
      classifyLabels(["bug", "variant-condensed", "stage-2", "override-registered", "priority-high"]),
    ).toEqual({
      variant: "variant-condensed",
      stages: ["stage-2"],
      markers: ["override-registered"],
    })
  })

  it("returns null variant and empty arrays when no fluxo labels exist", () => {
    expect(classifyLabels(["bug"])).toEqual({ variant: null, stages: [], markers: [] })
  })
})

describe("parseMetadataLine (P1)", () => {
  it("parses the full line including Substate (P1.1)", () => {
    const body =
      "## Summary\n\nText.\n\n**Variant:** condensed · **Current stage:** stage-2 · **Epic:** #42 · **Round:** R02 · **Substate:** in-execution\n\n---"
    expect(parseMetadataLine(body)).toEqual({
      variant: "condensed",
      currentStage: "stage-2",
      epic: 42,
      round: "R02",
      substate: "in-execution",
    })
  })

  it("returns null substate when the field is absent (pre-P1.1 issues)", () => {
    const body = "**Variant:** minimal · **Current stage:** stage-3 · **Epic:** #7 · **Round:** R05"
    expect(parseMetadataLine(body)?.substate).toBeNull()
    expect(parseMetadataLine(body)?.epic).toBe(7)
  })

  it("returns null when there is no metadata line (J2 branch B1)", () => {
    expect(parseMetadataLine("standalone issue without metadata")).toBeNull()
  })
})

describe("classifyComment (P3 / events / signature)", () => {
  it("detects override registers", () => {
    expect(classifyComment("**Override register** — facilitator\n- Type: gate")).toBe("override")
  })

  it("detects instrumentation events A–F", () => {
    expect(classifyComment("**Event A** — triage epic #42: 3 questions — facilitator")).toBe("event")
    expect(classifyComment("**Event F** — round R02: during=2, reconciliation=1 — facilitator")).toBe("event")
  })

  it("detects other facilitator-signed comments (gates)", () => {
    expect(classifyComment("Gate checked: 2 of 2 closed.\n— facilitator")).toBe("facilitator")
  })

  it("returns null for plain human comments", () => {
    expect(classifyComment("starting today")).toBeNull()
    expect(classifyComment("looks good, facilitator")).toBeNull()
  })

  it("override wins over event when both markers appear", () => {
    expect(classifyComment("**Override register** — facilitator\n**Event D** — x")).toBe("override")
  })
})

describe("parseTasklist (ADR-011)", () => {
  it("parses checked and unchecked items with issue refs", () => {
    const body = "## Tasks\n\n- [ ] #43\n- [x] #44\n- [X] #45\n- [ ] item without issue"
    expect(parseTasklist(body)).toEqual([
      { number: 43, checked: false },
      { number: 44, checked: true },
      { number: 45, checked: true },
    ])
  })

  it("returns empty when there is no tasklist", () => {
    expect(parseTasklist("no tasklist here")).toEqual([])
  })
})

describe("extractDeclaredArtifactPath (G-05)", () => {
  it("extracts docs/reference paths", () => {
    expect(extractDeclaredArtifactPath("REFERENCE — update docs/reference/prd.md, section X")).toBe(
      "docs/reference/prd.md",
    )
  })

  it("extracts docs/rounds paths", () => {
    expect(
      extractDeclaredArtifactPath("RECORD — docs/rounds/R02-2026-10-export/mini-briefing.md"),
    ).toBe("docs/rounds/R02-2026-10-export/mini-briefing.md")
  })

  it("extracts docs/decisions (ADR) paths", () => {
    expect(extractDeclaredArtifactPath("create docs/decisions/adr/ADR-003-cache.md")).toBe(
      "docs/decisions/adr/ADR-003-cache.md",
    )
  })

  it("returns null without a declared path", () => {
    expect(extractDeclaredArtifactPath("technical comment on the issue itself")).toBeNull()
  })
})
