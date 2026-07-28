import { describe, expect, it } from "vitest"
import { createDesviosHook, isDesviosPath, loadDesviosWarning } from "./desvios.js"
import { FILE_LEVEL, validateDesvios } from "./validate-desvios.js"

const DESVIOS = "docs/rodadas/R02-2026-10-exportacao-relatorios/desvios.md"

const VALID_FILE = `# Desvios da rodada R02 — exportação de relatórios

## Desvio 1 — filtro por data fora do escopo

- **Planejado:** exportação em CSV e Excel
- **Implementado:** somente CSV
- **Motivo:** "integração com a planilharia custava 3x o estimado" — @rafael
- **Decisão registrada em:** #42 (comentário)
- **Documento de referência atualizado:** docs/referencia/prd.md#exportacao
`

const NO_DEVIATIONS_FILE = `# Desvios da rodada R03 — correção de acentos

Nenhum desvio nesta rodada.
`

const MISSING_MOTIVO_FILE = `# Desvios da rodada R02 — exportação

## Desvio 1 — filtro por data

- **Planejado:** CSV e Excel
- **Implementado:** somente CSV
- **Decisão registrada em:** #42
- **Documento de referência atualizado:** docs/referencia/prd.md
`

const INVALID_FORMAT_FILE = `# Desvios da rodada R02 — exportação

## Desvio 1 — filtro por data

Mudamos o planejado no meio do caminho e ficou só CSV.
`

const EMPTY_REFERENCE_FILE = `# Desvios da rodada R02 — exportação

## Desvio 1 — filtro por data

- **Planejado:** CSV e Excel
- **Implementado:** somente CSV
- **Motivo:** custo da integração
- **Decisão registrada em:** #42
- **Documento de referência atualizado:** <!-- link do commit/seção -->
`

const NO_ENTRIES_NO_DECLARATION_FILE = `# Desvios da rodada R02 — exportação
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

  it("flags a missing Motivo", () => {
    const result = validateDesvios(MISSING_MOTIVO_FILE)
    expect(result.state).toBe("invalid")
    expect(result.findings).toHaveLength(1)
    expect(result.findings[0].missing).toEqual(["Motivo"])
  })

  it("flags an entry with no template fields at all", () => {
    const result = validateDesvios(INVALID_FORMAT_FILE)
    expect(result.state).toBe("invalid")
    expect(result.findings[0].missing).toHaveLength(5)
    expect(result.findings[0].entryId).toContain("Desvio 1")
  })

  it('treats "nenhum desvio nesta rodada" as a valid file state (no scaffold false positive)', () => {
    const result = validateDesvios(NO_DEVIATIONS_FILE)
    expect(result.state).toBe("no-deviations")
    expect(result.findings).toEqual([])
  })

  it("flags a file with neither entries nor the no-deviations declaration", () => {
    const result = validateDesvios(NO_ENTRIES_NO_DECLARATION_FILE)
    expect(result.state).toBe("invalid")
    expect(result.findings[0].entryId).toBe(FILE_LEVEL)
    expect(result.findings[0].note).toContain("nenhum desvio nesta rodada")
  })

  it("flags an empty/placeholder 'Documento de referência atualizado' (#14 rejection)", () => {
    const result = validateDesvios(EMPTY_REFERENCE_FILE)
    expect(result.state).toBe("invalid")
    expect(result.findings[0].missing).toEqual(["Documento de referência atualizado"])
  })

  it("flags a filled reference field without a link", () => {
    const noLink = VALID_FILE.replace("docs/referencia/prd.md#exportacao", "atualizado")
    const result = validateDesvios(noLink)
    expect(result.findings[0].missing).toEqual(["Documento de referência atualizado (link ausente)"])
  })
})

describe("desvios write-validation hook (anti-bypass #14)", () => {
  it("fires automatically on a native edit — host-triggered, never model-called", async () => {
    const invoke = makeHook({ [DESVIOS]: MISSING_MOTIVO_FILE })
    const output = await invoke("edit", DESVIOS)
    expect(output.output).toContain("WARN-TEMPLATE")
    expect(output.output).toContain("Motivo")
  })

  it("fires on every native write tool (write/edit/patch/multiedit)", async () => {
    for (const tool of ["write", "edit", "patch", "multiedit"]) {
      const invoke = makeHook({ [DESVIOS]: MISSING_MOTIVO_FILE })
      const output = await invoke(tool, DESVIOS)
      expect(output.output).toContain("WARN-TEMPLATE")
    }
  })

  it("ignores non-write tools and non-desvios paths (path regex first, no fs read)", async () => {
    let reads = 0
    const hook = createDesviosHook({
      readFile: async () => {
        reads++
        return MISSING_MOTIVO_FILE
      },
      loadWarning: async () => "WARN {FINDINGS}",
    })
    const out = { output: "original" }
    await hook({ tool: "read", sessionID: "s", callID: "c", args: { filePath: DESVIOS } }, out)
    await hook({ tool: "edit", sessionID: "s", callID: "c", args: { filePath: "docs/rodadas/R02-x/escopo.md" } }, out)
    await hook({ tool: "edit", sessionID: "s", callID: "c", args: { filePath: "desvios.md" } }, out)
    expect(out.output).toBe("original")
    expect(reads).toBe(0)
  })

  it("appends the warning to output.output (mutation contract asserted)", async () => {
    const invoke = makeHook({ [DESVIOS]: MISSING_MOTIVO_FILE })
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
    const files = { [DESVIOS]: MISSING_MOTIVO_FILE }
    const invoke = makeHook(files)

    const first = await invoke("edit", DESVIOS)
    expect(first.output).toContain("WARN-TEMPLATE")

    // Same entry still invalid (content edited, still missing Motivo): silent.
    const second = await invoke("edit", DESVIOS, { output: "original" })
    expect(second.output).toBe("original")

    // Entry fixed: silent, and dedup resets.
    files[DESVIOS] = VALID_FILE
    const third = await invoke("edit", DESVIOS, { output: "original" })
    expect(third.output).toBe("original")

    // Regression after having been valid: warns again.
    files[DESVIOS] = MISSING_MOTIVO_FILE
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

    const fallback = makeHook({ [DESVIOS]: MISSING_MOTIVO_FILE }, async () => null)
    const out2 = await fallback("edit", DESVIOS)
    expect(out2.output).toContain("anti-bypass #14")
    expect(out2.output).not.toContain("WARN-TEMPLATE")
  })

  it("loads the warning text from the PT-BR microcopy file (not hardcoded)", async () => {
    const fromFile = await loadDesviosWarning()
    expect(fromFile).not.toBeNull()
    expect(fromFile).toContain("{FINDINGS}")
    expect(fromFile).toContain("a documentação começa a mentir")

    const invoke = makeHook({ [DESVIOS]: MISSING_MOTIVO_FILE }, () => loadDesviosWarning())
    const output = await invoke("edit", DESVIOS)
    expect(output.output).toContain("a documentação começa a mentir")
    expect(output.output).toContain("Motivo")
    expect(output.output).not.toContain("{FINDINGS}")
  })

  it("matches desvios.md paths with windows separators and absolute prefixes", () => {
    expect(isDesviosPath("C:\\repo\\docs\\rodadas\\R01-x\\desvios.md")).toBe(true)
    expect(isDesviosPath("/home/u/repo/docs/rodadas/R01-x/desvios.md")).toBe(true)
    expect(isDesviosPath("docs/rodadas/desvios.md")).toBe(false)
    expect(isDesviosPath("docs/referencia/desvios.md")).toBe(false)
  })
})
