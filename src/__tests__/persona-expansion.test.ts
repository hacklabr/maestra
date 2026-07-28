import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  createPersonaExpansionHook,
  EXPANSION_FAILURE_SIGNATURE,
  resolveCatalogRoot,
} from "../hooks/persona-expansion.js"
import { loadPersonaById } from "../catalog/loader.js"

const SHELL = "fluxo/especialista"

let tmp: string

function writePersona(root: string, division: string, id: string, name: string, body: string): void {
  mkdirSync(join(root, division), { recursive: true })
  writeFileSync(
    join(root, division, `${id}.md`),
    ["---", `name: ${name}`, `description: ${name} domain`, "---", "", body, ""].join("\n"),
  )
}

function call(prompt: string, subagentType: string = SHELL, toolName = "task") {
  const hook = createPersonaExpansionHook({ catalogRoot: tmp })
  const output = { args: { subagent_type: subagentType, prompt } as Record<string, unknown> }
  return { hook, output }
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "fluxo-catalog-"))
  writePersona(tmp, "software-development", "backend-architect", "Backend Architect", "You are the Backend Architect. Own the API contracts.")
  writePersona(tmp, "quality-assurance", "test-automation-engineer", "QA Engineer", "You are the QA Engineer. Everything is checkable.")
})

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
})

describe("loadPersonaById — division-prefixed lookup", () => {
  it("finds a persona whose division contains dashes (quality-assurance)", async () => {
    const persona = await loadPersonaById(tmp, "test-automation-engineer")
    expect(persona).toMatchObject({ division: "quality-assurance", name: "QA Engineer" })
    expect(persona!.systemPrompt).toContain("Everything is checkable")
  })

  it("finds a persona by filename in a flat division", async () => {
    const persona = await loadPersonaById(tmp, "backend-architect")
    expect(persona!.systemPrompt).toContain("Own the API contracts")
  })

  it("returns null for unknown id and unknown root", async () => {
    expect(await loadPersonaById(tmp, "nonexistent-persona")).toBeNull()
    expect(await loadPersonaById(join(tmp, "nope"), "backend-architect")).toBeNull()
  })

  it("loads a REAL persona from the vendored catalog (division-prefixed filename)", async () => {
    const persona = await loadPersonaById(
      join(__dirname, "..", "catalog", "agency-agents"),
      "software-development-backend-architect",
    )
    expect(persona).not.toBeNull()
    expect(persona!.division).toBe("software-development")
    expect(persona!.systemPrompt.length).toBeGreaterThan(100)
  })
})

describe("persona-expansion hook", () => {
  it("replaces the marker with the persona body, PRESERVING the marker line", async () => {
    const { hook, output } = call("persona::backend-architect@mesa-01\n\nPauta: decidir cache.")
    await hook({ tool: "task", sessionID: "s", callID: "c1" }, output)

    const prompt = output.args.prompt as string
    expect(prompt).toContain("persona::backend-architect@mesa-01")
    expect(prompt).toContain("You are the Backend Architect. Own the API contracts.")
    expect(prompt).toContain("Pauta: decidir cache.")
    expect(prompt.indexOf("persona::backend-architect@mesa-01")).toBeLessThan(
      prompt.indexOf("You are the Backend Architect"),
    )
  })

  it("injects the first-response persona declaration requirement", async () => {
    const { hook, output } = call("persona::backend-architect@mesa-01")
    await hook({ tool: "task", sessionID: "s", callID: "c2" }, output)

    expect(output.args.prompt).toContain('Declare sua persona na primeira linha')
    expect(output.args.prompt).toContain('"[backend-architect]"')
  })

  it("works with the actor tool name (Mimo) identically", async () => {
    const { hook, output } = call("persona::test-automation-engineer@mesa-02", SHELL, "actor")
    await hook({ tool: "actor", sessionID: "s", callID: "c3" }, output)

    expect(output.args.prompt).toContain("You are the QA Engineer")
  })

  it("marker without @mesa expands the same way (avulso)", async () => {
    const { hook, output } = call("persona::backend-architect")
    await hook({ tool: "task", sessionID: "s", callID: "c4" }, output)

    expect(output.args.prompt).toContain("persona::backend-architect")
    expect(output.args.prompt).toContain("You are the Backend Architect")
  })

  it("missing persona file → LOUD failure block replaces the marker", async () => {
    const { hook, output } = call("persona::nonexistent-persona@mesa-01\n\nPauta: x.")
    await hook({ tool: "task", sessionID: "s", callID: "c5" }, output)

    const prompt = output.args.prompt as string
    expect(prompt).toContain(EXPANSION_FAILURE_SIGNATURE)
    expect(prompt).toContain('"nonexistent-persona" não existe no catálogo instalado')
    expect(prompt).toContain("NÃO improvise")
    expect(prompt).not.toContain("persona::nonexistent-persona")
    expect(prompt).toContain("Pauta: x.")
  })

  it("STRICT scope: other subagent types pass through untouched", async () => {
    const { hook, output } = call("persona::backend-architect@mesa-01", "fluxo/something-else")
    const before = output.args.prompt as string
    await hook({ tool: "task", sessionID: "s", callID: "c6" }, output)

    expect(output.args.prompt).toBe(before)
  })

  it("no marker → pass through untouched (tracker fails closed, not this hook)", async () => {
    const { hook, output } = call("spawn sem marker, só contexto")
    const before = output.args.prompt as string
    await hook({ tool: "task", sessionID: "s", callID: "c7" }, output)

    expect(output.args.prompt).toBe(before)
  })

  it("non task/actor tools are ignored", async () => {
    const { hook, output } = call("persona::backend-architect@mesa-01", SHELL, "bash")
    const before = output.args.prompt as string
    await hook({ tool: "bash", sessionID: "s", callID: "c8" }, output)

    expect(output.args.prompt).toBe(before)
  })
})

describe("resolveCatalogRoot", () => {
  it("falls back to the package-bundled catalog (exists after build/dev)", () => {
    const root = resolveCatalogRoot("/tmp/nonexistent-project")
    expect(root).toContain("catalog")
  })

  it("honors FLUXO_CATALOG_DIR when set and existing", () => {
    process.env.FLUXO_CATALOG_DIR = tmp
    try {
      expect(resolveCatalogRoot("/tmp/nonexistent-project")).toBe(tmp)
    } finally {
      delete process.env.FLUXO_CATALOG_DIR
    }
  })
})
