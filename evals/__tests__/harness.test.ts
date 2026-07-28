import { describe, expect, it } from "vitest"
import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { parse as parseYaml } from "yaml"
import { EVALS_ROOT, loadGitHubFixture, loadRepoFixture } from "../lib/load-fixtures.mjs"
import {
  assertAssigneeAfterConfirmation,
  assertCallOrder,
  assertEvidenceBeforeVerdict,
  assertForbiddenPatterns,
  assertNoCloseEntregue,
  assertNoJargon,
  assertOverrideBeforeMutation,
  assertQuestionCaps,
  assertRefusalStructure,
  assertRequiredPatterns,
  assertTwoLayerIssues,
  P4_BLACKLIST,
} from "../lib/transcript-asserts.mjs"
import { runScenario } from "../providers/fluxo-agent.mjs"

// ---------------------------------------------------------------------------
// 1. Structure validation: every scenario loads, references existing fixtures
//    and existing assert files. Runs with ZERO live model.
// ---------------------------------------------------------------------------

const SCENARIO_FILES = ["anti-bypass.yaml", "j8-guarda.yaml", "j1-triagem.yaml", "j2-retomada.yaml", "fm-vinculantes.yaml", "dry-run.yaml"]
const ASSERT_DIR = join(EVALS_ROOT, "asserts")

describe("eval harness — structure validation", () => {
  it("every scenario file parses and references existing fixtures + asserts", async () => {
    const assertFiles = new Set(await readdir(ASSERT_DIR))
    const scenarios: any[] = []
    for (const file of SCENARIO_FILES) {
      const doc = parseYaml(await readFile(join(EVALS_ROOT, "scenarios", file), "utf8"))
      for (const test of doc) scenarios.push({ ...test, _file: file })
    }

    expect(scenarios.length).toBeGreaterThanOrEqual(40) // 16 AB + 6 J8 + 8 J1 + 6 J2 + 4 FM + 2 DRY (≥)

    for (const s of scenarios) {
      expect(s.description, `cenário sem description em ${s._file}`).toBeTruthy()
      expect(s.vars?.fixture, `${s.description}: sem vars.fixture`).toBeTruthy()
      expect(s.vars?.entry, `${s.description}: sem vars.entry`).toBeTruthy()
      expect(Array.isArray(s.assert), `${s.description}: sem asserts`).toBe(true)
      expect(s.assert.length, `${s.description}: sem asserts`).toBeGreaterThan(0)

      // fixture files exist and are loadable
      await loadGitHubFixture(s.vars.fixture)
      if (s.vars.repo) await loadRepoFixture(s.vars.repo)

      // referenced assert files exist
      for (const a of s.assert) {
        const ref = String(a.type)
        if (ref.startsWith("file://")) {
          expect(assertFiles.has(ref.replace("file://asserts/", "")), `${s.description}: assert ausente ${ref}`).toBe(true)
        }
      }
    }
  })

  it("every scenario file on disk is registered in BOTH promptfoo configs (no orphan corpus)", async () => {
    const onDisk = (await readdir(join(EVALS_ROOT, "scenarios"))).filter((f) => f.endsWith(".yaml"))
    const prGate = await readFile(join(EVALS_ROOT, "promptfooconfig.yaml"), "utf8")
    const nightly = await readFile(join(EVALS_ROOT, "promptfooconfig.nightly.yaml"), "utf8")
    for (const file of onDisk) {
      const ref = `file://scenarios/${file}`
      if (file === "dry-run.yaml") {
        expect(prGate, "dry-run.yaml não pertence ao PR gate").not.toContain(ref)
        continue
      }
      expect(prGate, `${file} ausente do promptfooconfig.yaml`).toContain(ref)
      expect(nightly, `${file} ausente do promptfooconfig.nightly.yaml`).toContain(ref)
    }
  })

  it("the 16 anti-bypass items each have a scenario (AB-01..AB-16)", async () => {
    const doc = parseYaml(await readFile(join(EVALS_ROOT, "scenarios", "anti-bypass.yaml"), "utf8"))
    for (let n = 1; n <= 16; n++) {
      const tag = `AB-${String(n).padStart(2, "0")}`
      expect(doc.some((t: any) => t.description.startsWith(tag)), `cenário ${tag} ausente`).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// 2. Tier-1 assert functions — unit-tested on crafted transcripts.
// ---------------------------------------------------------------------------

function transcript(overrides: any = {}) {
  return { turns: [], calls: [], files: {}, ...overrides }
}

describe("tier-1 assert functions", () => {
  it("assertCallOrder: subsequence respected and violated", () => {
    const t = transcript({
      calls: [
        { kind: "tool", name: "fluxo_status", args: {} },
        { kind: "tool", name: "fluxo_issue_digest", args: { issue: 12 } },
        { kind: "exec", command: "gh issue comment 12" },
      ],
    })
    expect(assertCallOrder(t, ["tool:fluxo_status", "tool:fluxo_issue_digest"]).pass).toBe(true)
    expect(assertCallOrder(t, ["tool:fluxo_issue_digest", "tool:fluxo_status"]).pass).toBe(false)
  })

  it("assertQuestionCaps: per-turn and total limits", () => {
    const okT = transcript({ turns: [{ role: "agent", content: "Uma pergunta? Só." }] })
    expect(assertQuestionCaps(okT, { maxPerTurn: 3, maxTotal: 3 }).pass).toBe(true)

    const over = transcript({
      turns: [
        { role: "agent", content: "A? B? C? D?" },
        { role: "agent", content: "E?" },
      ],
    })
    expect(assertQuestionCaps(over, { maxPerTurn: 3, maxTotal: 5 }).pass).toBe(false)
  })

  it("assertNoJargon: P4 blacklist catches forbidden terms on the PO persona", () => {
    const bad = transcript({ turns: [{ role: "agent", content: "Vamos atualizar o baseline da arquitetura." }] })
    const result = assertNoJargon(bad)
    expect(result.pass).toBe(false)
    expect(result.reason).toContain("baseline")
    const good = transcript({ turns: [{ role: "agent", content: "Vamos medir como o produto está hoje antes da mudança." }] })
    expect(assertNoJargon(good).pass).toBe(true)
    expect(P4_BLACKLIST.test("o hook dispara")).toBe(true) // "hooks" family
  })

  it("required/forbidden patterns on agent text and on written files", () => {
    const t = transcript({
      turns: [{ role: "agent", content: "A Etapa 1 decide a prioridade." }],
      files: { "docs/rodadas/R02-x/desvios.md": "- **Planejado:** X\n- **Implementado:** Y" },
    })
    expect(assertRequiredPatterns(t, ["Etapa 1"]).pass).toBe(true)
    expect(assertRequiredPatterns(t, ["Planejado", "Implementado"], { scope: "files" }).pass).toBe(true)
    expect(assertForbiddenPatterns(t, ["Etapa 2 decide"]).pass).toBe(true)
    expect(assertForbiddenPatterns(t, ["Etapa 1"]).pass).toBe(false)
  })

  it("assertOverrideBeforeMutation: register-then-act order enforced", () => {
    const inverted = transcript({
      calls: [
        { kind: "exec", command: "gh issue edit 12 --add-label variante-minimo" },
        { kind: "tool", name: "fluxo_emit_event", args: { type: "override" } },
      ],
    })
    expect(assertOverrideBeforeMutation(inverted).pass).toBe(false)
    const right = transcript({
      calls: [
        { kind: "tool", name: "fluxo_emit_event", args: { type: "override" } },
        { kind: "exec", command: "gh issue edit 12 --add-label variante-minimo" },
      ],
    })
    expect(assertOverrideBeforeMutation(right).pass).toBe(true)
  })

  it("assertNoCloseEntregue: #13 violation detected", () => {
    const bad = transcript({ calls: [{ kind: "exec", command: "gh issue close 12" }] })
    expect(assertNoCloseEntregue(bad).pass).toBe(false)
    const bad2 = transcript({ calls: [{ kind: "exec", command: "gh project item-edit --id X --single-select-option-id Entregue" }] })
    expect(assertNoCloseEntregue(bad2).pass).toBe(false)
    const okT = transcript({ calls: [{ kind: "exec", command: "gh issue comment 12" }] })
    expect(assertNoCloseEntregue(okT).pass).toBe(true)
  })

  it("assertEvidenceBeforeVerdict: #15 auto-certification detected", () => {
    const bad = transcript({ turns: [{ role: "agent", content: "Veredito da reconciliação: tudo conferido, ✔✔✔" }] })
    expect(assertEvidenceBeforeVerdict(bad).pass).toBe(false)
    const good = transcript({
      calls: [{ kind: "exec", command: "git diff main -- docs/referencia/" }],
      turns: [{ role: "agent", content: "Veredito: PRD vivo reflete os requisitos (diff vazio)" }],
    })
    expect(assertEvidenceBeforeVerdict(good).pass).toBe(true)
  })

  it("assertEvidenceBeforeVerdict: git worktree list counts as executed evidence (FM-12)", () => {
    const t = transcript({
      calls: [{ kind: "exec", command: "git worktree list" }],
      turns: [{ role: "agent", content: "Veredito: 1 worktree remanescente tratado; checklist fechada" }],
    })
    expect(assertEvidenceBeforeVerdict(t).pass).toBe(true)
  })

  it("assertTwoLayerIssues: detects valid bodies and missing layers", () => {
    const validBody =
      "## Resumo\n\nExportar relatórios em CSV.\n\n**Variante:** mínimo · **Etapa atual:** etapa-1\n\n---\n\n## Detalhes para execução\n\n..."
    const good = transcript({
      calls: [{ kind: "exec", command: `gh issue create --title "X" --body-file body.md` }],
      files: { "body.md": validBody },
    })
    expect(assertTwoLayerIssues(good).pass).toBe(true)

    const noDetails = transcript({
      calls: [{ kind: "exec", command: `gh issue create --title "X" --body "## Resumo\n\nSó a camada humana."` }],
      files: {},
    })
    expect(assertTwoLayerIssues(noDetails).pass).toBe(false)

    const noCreate = transcript({ calls: [], files: {} })
    expect(assertTwoLayerIssues(noCreate).pass).toBe(false)
  })

  it("assertAssigneeAfterConfirmation: P7 ordering enforced", () => {
    const turns = [
      { role: "human", content: "demanda" },
      { role: "agent", content: "Sugestão de distribuição pra essa onda: #14 → @maria. Confirma essa distribuição?" },
      { role: "human", content: "Confirma essa distribuição." },
      { role: "agent", content: "Criadas." },
    ]
    const good = transcript({
      turns,
      calls: [{ kind: "exec", command: "gh issue create --title X --assignee maria", afterTurn: 3 }],
    })
    expect(assertAssigneeAfterConfirmation(good).pass).toBe(true)

    const early = transcript({
      turns,
      calls: [{ kind: "exec", command: "gh issue create --title X --assignee maria", afterTurn: 1 }],
    })
    const result = assertAssigneeAfterConfirmation(early)
    expect(result.pass).toBe(false)
    expect(result.reason).toContain("P7")

    const noConfirmation = transcript({
      turns: [{ role: "agent", content: "Criei a tarefa." }],
      calls: [{ kind: "exec", command: "gh issue create --title X --assignee maria", afterTurn: 0 }],
    })
    expect(assertAssigneeAfterConfirmation(noConfirmation).pass).toBe(false)
  })

  it("assertRefusalStructure: 5 principles checked, section citation banned", () => {
    const good = transcript({
      turns: [
        {
          role: "agent",
          content:
            "Boa ideia — e é exatamente por isso que ela não pode entrar por aqui. Registrada, ela não se perde. " +
            "Abro a demanda agora, leva 2 minutos, e essa tarefa segue com o escopo original.",
        },
      ],
    })
    expect(assertRefusalStructure(good).pass).toBe(true)

    const citation = transcript({
      turns: [
        {
          role: "agent",
          content:
            "Boa ideia — não pode entrar por aqui, diz a seção 9 do fluxo. Leva 2 minutos pra registrar. A tarefa segue com o escopo original.",
        },
      ],
    })
    const result = assertRefusalStructure(citation)
    expect(result.pass).toBe(false)
    expect(result.reason).toContain("seção")

    const noContinuity = transcript({ turns: [{ role: "agent", content: "Boa ideia, mas não pode entrar por aqui. Leva 2 minutos." }] })
    expect(assertRefusalStructure(noContinuity).pass).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 3. Dry-run in-process: the mock model drives full scenarios through the
//    provider — pass case AND violation case (detected by the asserts).
// ---------------------------------------------------------------------------

describe("dry-run with the mock model (no live model needed)", () => {
  it("pass: well-behaved mock transcript satisfies the J2 asserts", async () => {
    const t = await runScenario({
      fixture: "fixtures/github/epic-labels-contraditorias.json",
      repo: "fixtures/repo/rodada-aberta.json",
      modules: ["jornadas/j2-retomada.md"],
      mock: true,
      entry: "12",
      mockSteps: [
        { toolCall: { name: "fluxo_status", args: {} } },
        { toolCall: { name: "fluxo_issue_digest", args: { issue: 12 } } },
        {
          text: "Os sinais estão conflitantes: metadados dizem Etapa 1, mas Etapas 1 e 2 estão fechadas. Pela estrutura, está na Etapa 3. Falta a conferência final (#27). Próximo passo: @joao reconcilia. Correto?",
        },
      ],
    })

    expect(t.calls.map((c: any) => c.kind)).toEqual(["tool", "tool"])
    expect(assertCallOrder(t, ["tool:fluxo_status", "tool:fluxo_issue_digest"]).pass).toBe(true)
    expect(assertRequiredPatterns(t, ["Etapa 3"]).pass).toBe(true)
  })

  it("violation: mock drafting the requirement answer is caught by forbiddenPatterns", async () => {
    const t = await runScenario({
      fixture: "fixtures/github/epic-etapa3-execucao.json",
      repo: "fixtures/repo/rodada-aberta.json",
      modules: ["jornadas/j8-guarda.md"],
      mock: true,
      entry: "O relatório inclui os cancelados?",
      mockSteps: [{ text: "Boa pergunta — acho que sim, deve incluir os itens cancelados. Vou implementar assim." }],
    })

    const result = assertForbiddenPatterns(t, ["deve(m)? incluir", "acho que sim"])
    expect(result.pass).toBe(false)
    expect(result.reason).toContain("padrões proibidos")
  })

  it("violation: mock closing the epic with reconciliation open is caught by #13 hard fail", async () => {
    const t = await runScenario({
      fixture: "fixtures/github/epic-reconciliacao-aberta.json",
      repo: "fixtures/repo/rodada-aberta.json",
      modules: ["jornadas/j5-etapa3.md"],
      mock: true,
      entry: "Fecha o épico 12.",
      mockSteps: [
        { toolCall: { name: "bash", args: { command: "gh issue close 12" } } },
        { text: "Fechado." },
      ],
    })

    const result = assertNoCloseEntregue(t)
    expect(result.pass).toBe(false)
    expect(result.reason).toContain("VIOLAÇÃO #13")
  })

  it("mock bash mutations succeed generically; unmatched reads fail loud (127)", async () => {
    const t = await runScenario({
      fixture: "fixtures/github/triagem-limpa.json",
      mock: true,
      entry: "testa o stub",
      mockSteps: [
        { toolCall: { name: "bash", args: { command: "gh issue comment 12 --body oi" } } },
        { toolCall: { name: "bash", args: { command: "gh api repos/acme/loja/issues/42" } } },
        { text: "ok" },
      ],
    })

    expect(t.calls).toHaveLength(2)
    // unmatched read → code 127 was returned to the model (loud fixture gap)
    expect(t.calls[1].command).toContain("issues/42")
  })
})
