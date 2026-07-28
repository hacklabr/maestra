import { describe, expect, it } from "vitest"
import { createDesviosHook, isDesviosPath, loadDesviosWarning } from "./desvios.js"
import { FILE_LEVEL, validateDesvios } from "./validate-desvios.js"

const DESVIOS = "docs/rounds/R02-2026-10-report-export/deviations.md"

const VALID_FILE = `# Deviations of round R02 — report export

## Deviation 1 — filter by date out of scope

- **Planned:** CSV and Excel export
- **Implemented:** CSV only
- **Reason:** "the integration with the spreadsheet tool cost 3x the estimate" — @rafael
- **Decision registered at:** #42 (comment)
- **Reference document updated:** docs/reference/prd.md#export
`

const NO_DEVIATIONS_FILE = `# Deviations of round R03 — accent fix

No deviations in this round.
`

const MISSING_REASON_FILE = `# Deviations of round R02 — export

## Deviation 1 — filter by date

- **Planned:** CSV and Excel
- **Implemented:** CSV only
- **Decision registered at:** #42
- **Reference document updated:** docs/reference/prd.md
`

const INVALID_FORMAT_FILE = `# Deviations of round R02 — export

## Deviation 1 — filter by date

We changed the plan midway and it ended up CSV only.
`

const EMPTY_REFERENCE_FILE = `# Deviations of round R02 — export

## Deviation 1 — filter by date

- **Planned:** CSV and Excel
- **Implemented:** CSV only
- **Reason:** integration cost
- **Decision registered at:** #42
- **Reference document updated:** <!-- commit/section link -->
`

const NO_ENTRIES_NO_DECLARATION_FILE = `# Deviations of round R02 — export
`

type HookFn = ReturnType<typeof createDesviosHook>

function makeHook(fileContents: Record<string, string>, loadWarning?: () => Promise<string | null>) {
  const hook: HookFn = createDesviosHook({
    readFile: async (path: string) => {
      const content = fileContents[path]
      if (content === undefined) throw new Error(`ENOENT: ${path}`)
      return content
    },
    loadWarning: loadWarning ?? (async () => "WARN-TEMPLATE {FINDINGS}"),
  })
  const invoke = (tool: string, filePath: string, output = { output: "original" }) =>
    hook({ tool, sessionID: "s1", callID: "c1", args: { filePath } }, output).then(() => output)
  return invoke
}

describe("validateDesvios (pure, shared with the reconciliation backstop)", () => {
  it("accepts a complete trinca with both links", () => {
    const result = validateDesvios(VALID_FILE)
    expect(result.state).toBe("valid")
    expect(result.findings).toEqual([])
  })

  it("flags a missing Reason", () => {
    const result = validateDesvios(MISSING_REASON_FILE)
    expect(result.state).toBe("invalid")
    expect(result.findings).toHaveLength(1)
    expect(result.findings[0].missing).toEqual(["Reason"])
  })

  it("flags an entry with no template fields at all", () => {
    const result = validateDesvios(INVALID_FORMAT_FILE)
    expect(result.state).toBe("invalid")
    expect(result.findings[0].missing).toHaveLength(5)
    expect(result.findings[0].entryId).toContain("Deviation 1")
  })

  it('treats "no deviations in this round" as a valid file state (no scaffold false positive)', () => {
    const result = validateDesvios(NO_DEVIATIONS_FILE)
    expect(result.state).toBe("no-deviations")
    expect(result.findings).toEqual([])
  })

  it("flags a file with neither entries nor the no-deviations declaration", () => {
    const result = validateDesvios(NO_ENTRIES_NO_DECLARATION_FILE)
    expect(result.state).toBe("invalid")
    expect(result.findings[0].entryId).toBe(FILE_LEVEL)
    expect(result.findings[0].note).toContain("No deviations in this round")
  })

  it("flags an empty/placeholder 'Reference document updated' (#14 rejection)", () => {
    const result = validateDesvios(EMPTY_REFERENCE_FILE)
    expect(result.state).toBe("invalid")
    expect(result.findings[0].missing).toEqual(["Reference document updated"])
  })

  it("flags a filled reference field without a link", () => {
    const noLink = VALID_FILE.replace("docs/reference/prd.md#export", "updated")
    const result = validateDesvios(noLink)
    expect(result.findings[0].missing).toEqual(["Reference document updated (link missing)"])
  })
})

describe("desvios write-validation hook (anti-bypass #14)", () => {
  it("fires automatically on a native edit — host-triggered, never model-called", async () => {
    const invoke = makeHook({ [DESVIOS]: MISSING_REASON_FILE })
    const output = await invoke("edit", DESVIOS)
    expect(output.output).toContain("WARN-TEMPLATE")
    expect(output.output).toContain("Reason")
  })

  it("fires on every native write tool (write/edit/patch/multiedit)", async () => {
    for (const tool of ["write", "edit", "patch", "multiedit"]) {
      const invoke = makeHook({ [DESVIOS]: MISSING_REASON_FILE })
      const output = await invoke(tool, DESVIOS)
      expect(output.output).toContain("WARN-TEMPLATE")
    }
  })

  it("ignores non-write tools and non-desvios paths (path regex first, no fs read)", async () => {
    let reads = 0
    const hook = createDesviosHook({
      readFile: async () => {
        reads++
        return MISSING_REASON_FILE
      },
      loadWarning: async () => "WARN {FINDINGS}",
    })
    const out = { output: "original" }
    await hook({ tool: "read", sessionID: "s", callID: "c", args: { filePath: DESVIOS } }, out)
    await hook({ tool: "edit", sessionID: "s", callID: "c", args: { filePath: "docs/rounds/R02-x/scope.md" } }, out)
    await hook({ tool: "edit", sessionID: "s", callID: "c", args: { filePath: "deviations.md" } }, out)
    expect(out.output).toBe("original")
    expect(reads).toBe(0)
  })

  it("appends the warning to output.output (mutation contract asserted)", async () => {
    const invoke = makeHook({ [DESVIOS]: MISSING_REASON_FILE })
    const output = await invoke("edit", DESVIOS)
    expect(output.output.startsWith("original")).toBe(true)
    expect(output.output.length).toBeGreaterThan("original".length)
  })

  it("stays silent for a valid file and for the no-deviations declaration", async () => {
    for (const content of [VALID_FILE, NO_DEVIATIONS_FILE]) {
      const invoke = makeHook({ [DESVIOS]: content })
      const output = await invoke("write", DESVIOS)
      expect(output.output).toBe("original")
    }
  })

  it("dedups per entry: repeated invalid writes warn once; a regression after a fix re-warns", async () => {
    const files = { [DESVIOS]: MISSING_REASON_FILE }
    const invoke = makeHook(files)

    const first = await invoke("edit", DESVIOS)
    expect(first.output).toContain("WARN-TEMPLATE")

    // Same entry still invalid (content edited, still missing Reason): silent.
    const second = await invoke("edit", DESVIOS, { output: "original" })
    expect(second.output).toBe("original")

    // Entry fixed: silent, and dedup resets.
    files[DESVIOS] = VALID_FILE
    const third = await invoke("edit", DESVIOS, { output: "original" })
    expect(third.output).toBe("original")

    // Regression after having been valid: warns again.
    files[DESVIOS] = MISSING_REASON_FILE
    const fourth = await invoke("edit", DESVIOS, { output: "original" })
    expect(fourth.output).toContain("WARN-TEMPLATE")
  })

  it("never breaks the write path when the file or the microcopy is unreadable", async () => {
    const hook = createDesviosHook({
      readFile: async () => {
        throw new Error("ENOENT")
      },
      loadWarning: async () => null,
    })
    const out = { output: "original" }
    await hook({ tool: "edit", sessionID: "s", callID: "c", args: { filePath: DESVIOS } }, out)
    expect(out.output).toBe("original")

    const fallback = makeHook({ [DESVIOS]: MISSING_REASON_FILE }, async () => null)
    const out2 = await fallback("edit", DESVIOS)
    expect(out2.output).toContain("anti-bypass #14")
    expect(out2.output).not.toContain("WARN-TEMPLATE")
  })

  it("loads the warning text from the EN microcopy file (not hardcoded)", async () => {
    const fromFile = await loadDesviosWarning()
    expect(fromFile).not.toBeNull()
    expect(fromFile).toContain("{FINDINGS}")
    expect(fromFile).toContain("the documentation starts to lie")

    const invoke = makeHook({ [DESVIOS]: MISSING_REASON_FILE }, () => loadDesviosWarning())
    const output = await invoke("edit", DESVIOS)
    expect(output.output).toContain("the documentation starts to lie")
    expect(output.output).toContain("Reason")
    expect(output.output).not.toContain("{FINDINGS}")
  })

  it("matches deviations.md paths with windows separators and absolute prefixes", () => {
    expect(isDesviosPath("C:\\repo\\docs\\rounds\\R01-x\\deviations.md")).toBe(true)
    expect(isDesviosPath("/home/u/repo/docs/rounds/R01-x/deviations.md")).toBe(true)
    expect(isDesviosPath("docs/rounds/deviations.md")).toBe(false)
    expect(isDesviosPath("docs/reference/deviations.md")).toBe(false)
  })
})
