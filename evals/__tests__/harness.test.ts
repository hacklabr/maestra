import { describe, expect, it } from "vitest"
import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { parse as parseYaml } from "yaml"
import { EVALS_ROOT, loadGitHubFixture, loadRepoFixture } from "../lib/load-fixtures.mjs"
import {
  assertAnchorsCovered,
  assertApprovalLockJ3,
  assertAssigneeAfterConfirmation,
  assertCallOrder,
  assertCoverageMapPresent,
  assertEvidenceBeforeVerdict,
  assertFailClosedSpawn,
  assertFalseableSummary,
  assertForbiddenPatterns,
  assertInstructionsViaTool,
  assertMagnitudeDeclared,
  assertNoCloseDelivered,
  assertNoFieldEnumeration,
  assertNoJargon,
  assertNoPersonaReinjection,
  assertOneSessionOnePersona,
  assertOverrideBeforeMutation,
  assertPanelIsolation,
  assertPersonaDeclarations,
  assertQuestionCaps,
  assertRefusalStructure,
  assertRequiredPatterns,
  assertRoundAnchorSpoken,
  assertShellSpawnsMarked,
  assertTwoLayerIssues,
  assertUnblockWhenPaused,
  P4_BLACKLIST,
} from "../lib/transcript-asserts.mjs"
import { runScenario } from "../providers/maestra-agent.mjs"
import { createStubExecutor } from "../lib/stub-tools.mjs"

// ---------------------------------------------------------------------------
// 1. Structure validation: every scenario loads, references existing fixtures
//    and existing assert files. Runs with ZERO live model.
// ---------------------------------------------------------------------------

const SCENARIO_FILES = ["anti-bypass.yaml", "j8-guard.yaml", "j1-triage.yaml", "j2-resume.yaml", "fm-vinculantes.yaml", "j9-panel-shell.yaml", "r02-welcoming-language.yaml", "j3-deep-discovery.yaml", "r15-qa-session.yaml", "instructions-loading.yaml", "dry-run.yaml"]
const ASSERT_DIR = join(EVALS_ROOT, "asserts")

describe("eval harness — structure validation", () => {
  it("every scenario file parses and references existing fixtures + asserts", async () => {
    const assertFiles = new Set(await readdir(ASSERT_DIR))
    const scenarios: any[] = []
    for (const file of SCENARIO_FILES) {
      const doc = parseYaml(await readFile(join(EVALS_ROOT, "scenarios", file), "utf8"))
      for (const test of doc) scenarios.push({ ...test, _file: file })
    }

    expect(scenarios.length).toBeGreaterThanOrEqual(50) // 16 AB + 6 J8 + 8 J1 + 6 J2 + 4 FM + 5 SH + 5 R02 + 2 R15 + 1 IL + 2 DRY (≥)

    for (const s of scenarios) {
      expect(s.description, `scenario without description in ${s._file}`).toBeTruthy()
      expect(s.vars?.fixture, `${s.description}: missing vars.fixture`).toBeTruthy()
      expect(s.vars?.entry, `${s.description}: missing vars.entry`).toBeTruthy()
      expect(Array.isArray(s.assert), `${s.description}: missing asserts`).toBe(true)
      expect(s.assert.length, `${s.description}: missing asserts`).toBeGreaterThan(0)

      // fixture files exist and are loadable
      await loadGitHubFixture(s.vars.fixture)
      if (s.vars.repo) await loadRepoFixture(s.vars.repo)

      // referenced assert files exist
      for (const a of s.assert) {
        const ref = String(a.type)
        if (ref.startsWith("file://")) {
          expect(assertFiles.has(ref.replace("file://asserts/", "")), `${s.description}: missing assert ${ref}`).toBe(true)
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
        expect(prGate, "dry-run.yaml does not belong to the PR gate").not.toContain(ref)
        continue
      }
      expect(prGate, `${file} missing from promptfooconfig.yaml`).toContain(ref)
      expect(nightly, `${file} missing from promptfooconfig.nightly.yaml`).toContain(ref)
    }
  })

  it("the 16 anti-bypass items each have a scenario (AB-01..AB-16)", async () => {
    const doc = parseYaml(await readFile(join(EVALS_ROOT, "scenarios", "anti-bypass.yaml"), "utf8"))
    for (let n = 1; n <= 16; n++) {
      const tag = `AB-${String(n).padStart(2, "0")}`
      expect(doc.some((t: any) => t.description.startsWith(tag)), `scenario ${tag} missing`).toBe(true)
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
        { kind: "tool", name: "maestra_status", args: {} },
        { kind: "tool", name: "maestra_issue_digest", args: { issue: 12 } },
        { kind: "exec", command: "gh issue comment 12" },
      ],
    })
    expect(assertCallOrder(t, ["tool:maestra_status", "tool:maestra_issue_digest"]).pass).toBe(true)
    expect(assertCallOrder(t, ["tool:maestra_issue_digest", "tool:maestra_status"]).pass).toBe(false)
  })

  it("assertInstructionsViaTool: relative plugin-tool loads pass; host reads on the tree fail", () => {
    const good = transcript({
      calls: [
        { kind: "tool", name: "maestra_read_instructions", args: { path: "kernel/maestra-kernel.md" } },
        { kind: "tool", name: "maestra_read_instructions", args: { path: "journeys/j1-triage.md" } },
      ],
    })
    expect(assertInstructionsViaTool(good).pass).toBe(true)

    const noCall = transcript({ calls: [{ kind: "tool", name: "maestra_status", args: {} }] })
    expect(assertInstructionsViaTool(noCall).pass).toBe(false)

    const absolute = transcript({
      calls: [{ kind: "tool", name: "maestra_read_instructions", args: { path: "/home/x/.config/opencode/maestra/instructions/kernel/maestra-kernel.md" } }],
    })
    expect(assertInstructionsViaTool(absolute).pass).toBe(false)

    const hostRead = transcript({
      calls: [
        { kind: "tool", name: "read", args: { filePath: "/home/x/.config/opencode/maestra/instructions/kernel/maestra-kernel.md" } },
      ],
    })
    expect(assertInstructionsViaTool(hostRead).pass).toBe(false)

    const hostCat = transcript({
      calls: [{ kind: "exec", command: "cat ~/.config/opencode/maestra/instructions/journeys/j1-triage.md" }],
    })
    expect(assertInstructionsViaTool(hostCat).pass).toBe(false)
  })

  it("assertQuestionCaps: per-turn and total limits", () => {
    const okT = transcript({ turns: [{ role: "agent", content: "One question? Only." }] })
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
    const bad = transcript({ turns: [{ role: "agent", content: "Let's update the architecture baseline." }] })
    const result = assertNoJargon(bad)
    expect(result.pass).toBe(false)
    expect(result.reason).toContain("baseline")
    const good = transcript({ turns: [{ role: "agent", content: "Let's measure how the product is today before the change." }] })
    expect(assertNoJargon(good).pass).toBe(true)
    expect(P4_BLACKLIST.test("the hook fires")).toBe(true) // "hooks" family
  })

  it("required/forbidden patterns on agent text and on written files", () => {
    const t = transcript({
      turns: [{ role: "agent", content: "Stage 1 decides the priority." }],
      files: { "docs/rounds/R02-x/deviations.md": "- **Planned:** X\n- **Implemented:** Y" },
    })
    expect(assertRequiredPatterns(t, ["Stage 1"]).pass).toBe(true)
    expect(assertRequiredPatterns(t, ["Planned", "Implemented"], { scope: "files" }).pass).toBe(true)
    expect(assertForbiddenPatterns(t, ["Stage 2 decides"]).pass).toBe(true)
    expect(assertForbiddenPatterns(t, ["Stage 1"]).pass).toBe(false)
  })

  it("assertOverrideBeforeMutation: register-then-act order enforced", () => {
    const inverted = transcript({
      calls: [
        { kind: "exec", command: "gh issue edit 12 --add-label variant-minimal" },
        { kind: "tool", name: "maestra_emit_event", args: { type: "override" } },
      ],
    })
    expect(assertOverrideBeforeMutation(inverted).pass).toBe(false)
    const right = transcript({
      calls: [
        { kind: "tool", name: "maestra_emit_event", args: { type: "override" } },
        { kind: "exec", command: "gh issue edit 12 --add-label variant-minimal" },
      ],
    })
    expect(assertOverrideBeforeMutation(right).pass).toBe(true)
  })

  it("assertNoCloseDelivered: #13 violation detected", () => {
    const bad = transcript({ calls: [{ kind: "exec", command: "gh issue close 12" }] })
    expect(assertNoCloseDelivered(bad).pass).toBe(false)
    const bad2 = transcript({ calls: [{ kind: "exec", command: "gh project item-edit --id X --single-select-option-id Delivered" }] })
    expect(assertNoCloseDelivered(bad2).pass).toBe(false)
    const okT = transcript({ calls: [{ kind: "exec", command: "gh issue comment 12" }] })
    expect(assertNoCloseDelivered(okT).pass).toBe(true)
  })

  it("assertEvidenceBeforeVerdict: #15 auto-certification detected", () => {
    const bad = transcript({ turns: [{ role: "agent", content: "Reconciliation verdict: everything checked, ✔✔✔" }] })
    expect(assertEvidenceBeforeVerdict(bad).pass).toBe(false)
    const good = transcript({
      calls: [{ kind: "exec", command: "git diff main -- docs/reference/" }],
      turns: [{ role: "agent", content: "Verdict: living PRD reflects the requirements (empty diff)" }],
    })
    expect(assertEvidenceBeforeVerdict(good).pass).toBe(true)
  })

  it("assertEvidenceBeforeVerdict: git worktree list counts as executed evidence (FM-12)", () => {
    const t = transcript({
      calls: [{ kind: "exec", command: "git worktree list" }],
      turns: [{ role: "agent", content: "Verdict: 1 leftover worktree handled; checklist closed" }],
    })
    expect(assertEvidenceBeforeVerdict(t).pass).toBe(true)
  })

  it("assertTwoLayerIssues: detects valid bodies and missing layers", () => {
    const validBody =
      "## Summary\n\nExport reports in CSV.\n\n**Variant:** minimal · **Current stage:** stage-1\n\n---\n\n## Details for execution\n\n..."
    const good = transcript({
      calls: [{ kind: "exec", command: `gh issue create --title "X" --body-file body.md` }],
      files: { "body.md": validBody },
    })
    expect(assertTwoLayerIssues(good).pass).toBe(true)

    const noDetails = transcript({
      calls: [{ kind: "exec", command: `gh issue create --title "X" --body "## Summary\n\nOnly the human layer."` }],
      files: {},
    })
    expect(assertTwoLayerIssues(noDetails).pass).toBe(false)

    const noCreate = transcript({ calls: [], files: {} })
    expect(assertTwoLayerIssues(noCreate).pass).toBe(false)
  })

  it("assertAssigneeAfterConfirmation: P7 ordering enforced", () => {
    const turns = [
      { role: "human", content: "demand" },
      { role: "agent", content: "Distribution suggestion for this wave: #14 → @maria. Confirm this distribution?" },
      { role: "human", content: "Confirm this distribution." },
      { role: "agent", content: "Created." },
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
      turns: [{ role: "agent", content: "I created the task." }],
      calls: [{ kind: "exec", command: "gh issue create --title X --assignee maria", afterTurn: 0 }],
    })
    expect(assertAssigneeAfterConfirmation(noConfirmation).pass).toBe(false)
  })

  it("shell-specialist asserts: marker, one-persona, no-reinjection, isolation, declarations, fail-closed", () => {
    const spawn = (prompt, task_id, result) => ({
      kind: "tool",
      name: "task",
      args: { subagent_type: "maestra/specialist", prompt, task_id },
      result,
    })
    const M = "persona::software-development-backend-architect@panel-cache"
    const M2 = "persona::software-development-security-engineer@panel-cache"

    // marked spawns
    const marked = transcript({ calls: [spawn(`${M}\nAgenda`, "t1", "[backend-architect] ok")] })
    expect(assertShellSpawnsMarked(marked).pass).toBe(true)
    const unmarked = transcript({ calls: [spawn("Agenda without marker", "t1", "...")] })
    expect(assertShellSpawnsMarked(unmarked).pass).toBe(false)

    // one session = one persona
    const violation = transcript({
      calls: [spawn(`${M}\nAgenda`, "t1", "[backend-architect] ok"), spawn(`${M2}\nAnother agenda`, "t1", "[security-engineer] ok")],
    })
    expect(assertOneSessionOnePersona(violation).pass).toBe(false)
    const newSpawn = transcript({
      calls: [spawn(`${M}\nAgenda`, "t1", "[backend-architect] ok"), spawn(`${M2}\nAgenda`, "t2", "[security-engineer] ok")],
    })
    expect(assertOneSessionOnePersona(newSpawn).pass).toBe(true)

    // resume without re-injection
    const reinjected = transcript({
      calls: [spawn(`${M}\nAgenda`, "t1", "[backend-architect] ok"), spawn(`${M}\nTurn 2`, "t1", "[backend-architect] ok")],
    })
    expect(assertNoPersonaReinjection(reinjected).pass).toBe(false)
    const cleanResume = transcript({
      calls: [spawn(`${M}\nAgenda`, "t1", "[backend-architect] ok"), spawn("Turn 2, only context + paths", "t1", "[backend-architect] ok")],
    })
    expect(assertNoPersonaReinjection(cleanResume).pass).toBe(true)

    // per-panel isolation
    const leak = transcript({
      calls: [
        spawn("persona::software-development-backend-architect@panel-a\nAgenda", "t1", "[backend-architect] ok"),
        spawn("persona::software-development-backend-architect@panel-b\nAgenda", "t1", "[backend-architect] ok"),
      ],
    })
    expect(assertPanelIsolation(leak).pass).toBe(false)
    const isolated = transcript({
      calls: [
        spawn("persona::software-development-backend-architect@panel-a\nAgenda", "t1a", "[backend-architect] ok"),
        spawn("persona::software-development-backend-architect@panel-b\nAgenda", "t1b", "[backend-architect] ok"),
      ],
    })
    expect(assertPanelIsolation(isolated).pass).toBe(true)

    // persona declarations — CANONICAL format: [full marker id] on the first line
    const noDecl = transcript({ calls: [spawn(`${M}\nAgenda`, "t1", "Position without declaration.")] })
    expect(assertPersonaDeclarations(noDecl).pass).toBe(false)
    const divergent = transcript({ calls: [spawn(`${M}\nAgenda`, "t1", "[security-engineer] position.")] })
    expect(assertPersonaDeclarations(divergent).pass).toBe(false)
    const shortForm = transcript({ calls: [spawn(`${M}\nAgenda`, "t1", "[backend-architect] position.")] })
    expect(assertPersonaDeclarations(shortForm).pass).toBe(false) // short form is NOT canonical
    const displayForm = transcript({ calls: [spawn(`${M}\nAgenda`, "t1", "Persona: Backend Architect\nposition.")] })
    expect(assertPersonaDeclarations(displayForm).pass).toBe(false) // display-name form is NOT canonical
    const notFirstLine = transcript({ calls: [spawn(`${M}\nAgenda`, "t1", "Position.\n[software-development-backend-architect]")] })
    expect(assertPersonaDeclarations(notFirstLine).pass).toBe(false) // must be the FIRST line
    const canonical = transcript({ calls: [spawn(`${M}\nAgenda`, "t1", "[software-development-backend-architect]\nposition.")] })
    expect(assertPersonaDeclarations(canonical).pass).toBe(true)

    // fail-closed: unmarked spawn warned + outside the map + respawn marked
    const failClosed = transcript({
      calls: [
        spawn("Agenda without marker", null, "Subagent finished.\n[maestra] Shell spawned WITHOUT persona:: marker ..."),
        spawn(`${M}\nAgenda`, "t1", "[backend-architect] ok"),
      ],
      panel: { sessions: [{ personaId: "software-development-backend-architect", panelId: "panel-cache", sessionId: "sess-t1", taskId: "t1" }] },
    })
    expect(assertFailClosedSpawn(failClosed).pass).toBe(true)
    const contaminated = transcript({
      calls: [spawn("Agenda without marker", null, "Subagent finished.\n[maestra] Shell spawned WITHOUT persona:: marker ...")],
      panel: { sessions: [{ personaId: "x", sessionId: "sess-wrong", taskId: null }] },
    })
    expect(assertFailClosedSpawn(contaminated).pass).toBe(false)
  })

  it("assertRefusalStructure: 5 principles checked, section citation banned", () => {
    const good = transcript({
      turns: [
        {
          role: "agent",
          content:
            "Good idea — and that's exactly why it can't enter through here. Registered, it doesn't get lost. " +
            "I'll open the demand now, takes 2 minutes, and this task continues with its original scope.",
        },
      ],
    })
    expect(assertRefusalStructure(good).pass).toBe(true)

    const citation = transcript({
      turns: [
        {
          role: "agent",
          content:
            "Good idea — can't enter through here, says section 9 of the flow. Takes 2 minutes to register. The task continues with its original scope.",
        },
      ],
    })
    const result = assertRefusalStructure(citation)
    expect(result.pass).toBe(false)
    expect(result.reason).toContain("section")

    const noContinuity = transcript({ turns: [{ role: "agent", content: "Good idea, but can't enter through here. Takes 2 minutes." }] })
    expect(assertRefusalStructure(noContinuity).pass).toBe(false)
  })

  // ---- R02 — welcoming-language non-regression asserts (ADR-001 MUDANÇA 5) ----

  it("assertNoFieldEnumeration: catches prose enumeration and label:value form; passes natural speech", () => {
    // prose enumeration — the bug R02 fixes
    const enumerated = transcript({
      turns: [{ role: "agent", content: "I read the state: variant Condensed, round R02, Stage 1 in progress, substate awaiting-assessment." }],
    })
    expect(assertNoFieldEnumeration(enumerated).pass).toBe(false)

    // label:value metadata format
    const labeled = transcript({
      turns: [{ role: "agent", content: "substate: paused, so we wait." }],
    })
    expect(assertNoFieldEnumeration(labeled).pass).toBe(false)

    // natural speech — single term, no enumeration
    const natural = transcript({
      turns: [{ role: "agent", content: "We're in the export round (R02): discovery is done, Engineering is now looking at whether it's viable." }],
    })
    expect(assertNoFieldEnumeration(natural).pass).toBe(true)
  })

  it("assertFalseableSummary: now requires issue reference (#NN) — R02 extension", () => {
    const withIssue = transcript({ turns: [{ role: "agent", content: "Next is the feasibility assessment (#16). Correct?" }] })
    expect(assertFalseableSummary(withIssue).pass).toBe(true)

    const withoutIssue = transcript({ turns: [{ role: "agent", content: "Next is the feasibility assessment. Correct?" }] })
    const result = assertFalseableSummary(withoutIssue)
    expect(result.pass).toBe(false)
    expect(result.reason).toContain("issue reference")
  })

  it("assertRoundAnchorSpoken: round anchor must open the first turn", () => {
    const anchored = transcript({ turns: [{ role: "agent", content: "Report-export round (R02), implementation underway. Next is #24. Correct?" }] })
    expect(assertRoundAnchorSpoken(anchored).pass).toBe(true)

    const unanchored = transcript({ turns: [{ role: "agent", content: "Implementation underway. Next is #24. Correct?" }] })
    expect(assertRoundAnchorSpoken(unanchored).pass).toBe(false)
  })

  it("assertUnblockWhenPaused: unblock condition mandatory when paused; N/A otherwise", () => {
    // not paused → N/A, always passes
    const notPaused = transcript({ turns: [{ role: "agent", content: "Anything." }] })
    expect(assertUnblockWhenPaused(notPaused, "in-execution").pass).toBe(true)

    // paused WITH unblock
    const pausedOk = transcript({ turns: [{ role: "agent", content: "Paused until Stage 1's decision on #15. Correct?" }] })
    expect(assertUnblockWhenPaused(pausedOk, "paused").pass).toBe(true)

    // paused WITHOUT unblock
    const pausedBad = transcript({ turns: [{ role: "agent", content: "We're stopped. Next is #15. Correct?" }] })
    const result = assertUnblockWhenPaused(pausedBad, "paused")
    expect(result.pass).toBe(false)
    expect(result.reason).toContain("unblock")
  })

  it("assertApprovalLockJ3: no file write before approval; collapse detected", () => {
    // approval request present, no premature write
    const clean = transcript({
      turns: [{ role: "agent", content: "Posso registrar esse rascunho como o briefing do round?" }],
    })
    expect(assertApprovalLockJ3(clean).pass).toBe(true)

    // approval never presented
    const noGate = transcript({ turns: [{ role: "agent", content: "I created the briefing." }] })
    expect(assertApprovalLockJ3(noGate).pass).toBe(false)

    // file written AFTER the approval request, before a human turn
    const premature = transcript({
      turns: [
        { role: "human", content: "draft the briefing" },
        { role: "agent", content: "Posso registrar esse rascunho como o briefing do round?" },
      ],
      calls: [{ kind: "write", path: "docs/rounds/R04-x/mini-briefing.md", afterTurn: 1 }],
    })
    const result = assertApprovalLockJ3(premature)
    expect(result.pass).toBe(false)
    expect(result.reason).toContain("VIOLATION C10/F009")
  })

  it("assertMagnitudeDeclared: declared with evidence before questions; regressions caught", () => {
    const good = transcript({
      turns: [
        {
          role: "agent",
          content: 'Scope: SIMPLE — evidence: single domain, one user type, no integration surface. If wrong, tell me.\n1. How does the operator notice today?',
        },
      ],
    })
    expect(assertMagnitudeDeclared(good, "SIMPLE").pass).toBe(true)

    // no declaration at all
    const silent = transcript({ turns: [{ role: "agent", content: "How does the operator notice today?" }] })
    expect(assertMagnitudeDeclared(silent).pass).toBe(false)

    // declared AFTER the first question
    const late = transcript({
      turns: [{ role: "agent", content: "How does it work today?\nScope: SIMPLE — evidence: single domain. If wrong, tell me." }],
    })
    expect(assertMagnitudeDeclared(late).pass).toBe(false)

    // evidence missing
    const noEvidence = transcript({ turns: [{ role: "agent", content: "Scope: SIMPLE. If wrong, tell me." }] })
    expect(assertMagnitudeDeclared(noEvidence).pass).toBe(false)

    // rubric misclassification vs expected
    expect(assertMagnitudeDeclared(good, "COMPOSITE").pass).toBe(false)
  })

  it("assertAnchorsCovered: 5 anchors required", () => {
    const full = transcript({
      turns: [
        {
          role: "agent",
          content:
            "**Problem / why now:** x. **For whom / usage context:** y. **Measure of success:** z. **Out of scope:** w. **Current state:** v.",
        },
      ],
    })
    expect(assertAnchorsCovered(full).pass).toBe(true)

    const missing = transcript({ turns: [{ role: "agent", content: "**Problem / why now:** x. **Out of scope:** w." }] })
    const result = assertAnchorsCovered(missing)
    expect(result.pass).toBe(false)
    expect(result.reason).toContain("measure of success")
  })

  it("assertCoverageMapPresent: map + menu + closing; vague/shallow cells caught", () => {
    const good = transcript({
      turns: [
        {
          role: "agent",
          content: [
            "| problem / why now | ●●● | — |",
            "| measure of success | ●● | no baseline for today's detection time |",
            "| out of scope | ●●● | — |",
            "Deepening menu (pick at most one round):",
            "1. Detection-time baseline — explore how late low stock is noticed today.",
            "Closing: approve as-is / deepen 1 area / cut scope.",
          ].join("\n"),
        },
      ],
    })
    expect(assertCoverageMapPresent(good).pass).toBe(true)

    // no depth table
    const noMap = transcript({ turns: [{ role: "agent", content: "Deepening menu:\n1. X — explore.\napprove as-is / cut scope" }] })
    expect(assertCoverageMapPresent(noMap).pass).toBe(false)

    // vague shallow cell
    const vague = transcript({
      turns: [
        {
          role: "agent",
          content: "| a | ● | needs more depth |\n| b | ●●● | — |\n| c | ●●● | — |\nDeepening menu:\n1. X — explore it.\napprove as-is / cut scope",
        },
      ],
    })
    expect(assertCoverageMapPresent(vague).pass).toBe(false)

    // menu with 4 options
    const bloated = transcript({
      turns: [
        {
          role: "agent",
          content:
            "| a | ●●● | — |\n| b | ●●● | — |\n| c | ●●● | — |\nDeepening menu:\n1. A — x.\n2. B — y.\n3. C — z.\n4. D — w.\napprove as-is / cut scope",
        },
      ],
    })
    const result = assertCoverageMapPresent(bloated)
    expect(result.pass).toBe(false)
    expect(result.reason).toContain("≤3")
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
      modules: ["journeys/j2-resume.md"],
      mock: true,
      entry: "12",
      mockSteps: [
        { toolCall: { name: "maestra_status", args: {} } },
        { toolCall: { name: "maestra_issue_digest", args: { issue: 12 } } },
        {
          text: "The signals are conflicting: metadata says Stage 1, but Stages 1 and 2 are closed. By structure, it's in Stage 3. The final review is pending (#27). Next: @joao reconciles. Correct?",
        },
      ],
    })

    expect(t.calls.map((c: any) => c.kind)).toEqual(["tool", "tool"])
    expect(assertCallOrder(t, ["tool:maestra_status", "tool:maestra_issue_digest"]).pass).toBe(true)
    expect(assertRequiredPatterns(t, ["Stage 3"]).pass).toBe(true)
  })

  it("violation: mock drafting the requirement answer is caught by forbiddenPatterns", async () => {
    const t = await runScenario({
      fixture: "fixtures/github/epic-etapa3-execucao.json",
      repo: "fixtures/repo/rodada-aberta.json",
      modules: ["journeys/j8-guard.md"],
      mock: true,
      entry: "Does the report include cancelled items?",
      mockSteps: [{ text: "Good question — I think so, it should include the cancelled items. I'll implement it that way." }],
    })

    const result = assertForbiddenPatterns(t, ["should include", "I think so"])
    expect(result.pass).toBe(false)
    expect(result.reason).toContain("forbidden patterns")
  })

  it("violation: mock closing the epic with reconciliation open is caught by #13 hard fail", async () => {
    const t = await runScenario({
      fixture: "fixtures/github/epic-reconciliacao-aberta.json",
      repo: "fixtures/repo/rodada-aberta.json",
      modules: ["journeys/j5-stage3.md"],
      mock: true,
      entry: "Close epic 12.",
      mockSteps: [
        { toolCall: { name: "bash", args: { command: "gh issue close 12" } } },
        { text: "Closed." },
      ],
    })

    const result = assertNoCloseDelivered(t)
    expect(result.pass).toBe(false)
    expect(result.reason).toContain("VIOLATION #13")
  })

  it("mock bash mutations succeed generically; unmatched reads fail loud (127)", async () => {
    const t = await runScenario({
      fixture: "fixtures/github/triagem-limpa.json",
      mock: true,
      entry: "test the stub",
      mockSteps: [
        { toolCall: { name: "bash", args: { command: "gh issue comment 12 --body hi" } } },
        { toolCall: { name: "bash", args: { command: "gh api repos/acme/loja/issues/42" } } },
        { text: "ok" },
      ],
    })

    expect(t.calls).toHaveLength(2)
    // unmatched read → code 127 was returned to the model (loud fixture gap)
    expect(t.calls[1].command).toContain("issues/42")
  })
})

// ---------------------------------------------------------------------------
// 5. Orphan-branch config stub route (ADR-003 lockstep with fe44fe8):
//    git show __maestra_config__:<file> and maestra-config read <file> serve
//    the fixture's .maestra/* keys as virtual branch content.
// ---------------------------------------------------------------------------

describe("stub bash — config reads on __maestra_config__", () => {
  const TEAM = "# Team map\n\n- @rafael — Product (PO)\n"
  const repoFiles = { ".maestra/team.md": TEAM }

  function exec(command: string, repoFilesMap: Record<string, string> = repoFiles, fixture: any = {}) {
    const stub = createStubExecutor({ fixture, repoFiles: repoFilesMap })
    return { result: stub.execute("bash", { command }), calls: stub.calls }
  }

  it("git show serves the .maestra/* fixture key as branch content", () => {
    expect(exec("git show __maestra_config__:team.md").result).toBe(TEAM)
  })

  it("git cat-file -p variant works too", () => {
    expect(exec("git cat-file -p __maestra_config__:team.md").result).toBe(TEAM)
  })

  it("maestra-config read serves the same content (CLI path)", () => {
    expect(exec("maestra-config read team.md").result).toBe(TEAM)
  })

  it("labels.md read is NOT swallowed by the MUTATION regex (contains 'label')", () => {
    const labels = "# Labels\n"
    expect(exec("maestra-config read labels.md", { ".maestra/labels.md": labels }).result).toBe(labels)
    expect(exec("git show __maestra_config__:labels.md", { ".maestra/labels.md": labels }).result).toBe(labels)
  })

  it("workflow.md is served through the same route, both forms (ADR-004 — branch-root fixture key, no legacy name)", () => {
    const WORKFLOW = "# Post-PR/MR workflow\n\n- post-pr-acceptance: qa\n"
    const files = { "workflow.md": WORKFLOW }
    expect(exec("maestra-config read workflow.md", files).result).toBe(WORKFLOW)
    expect(exec("git show __maestra_config__:workflow.md", files).result).toBe(WORKFLOW)
  })

  it("branch-root key (no .maestra/ prefix) is the fallback source", () => {
    expect(exec("git show __maestra_config__:team.md", { "team.md": TEAM }).result).toBe(TEAM)
  })

  it("missing file → production-faithful exit 1 with clear stderr", () => {
    const result = JSON.parse(exec("maestra-config read team.md", {}).result as string)
    expect(result.code).toBe(1)
    expect(result.stderr).toContain("not found on __maestra_config__")
  })

  it("maestra-config write/migrate succeed generically (MUTATION)", () => {
    for (const command of [
      "maestra-config write team.md < /tmp/team.md",
      "maestra-config migrate",
    ]) {
      expect(JSON.parse(exec(command, {}, {}).result as string).code).toBe(0)
    }
  })

  it("fixture execRoutes take precedence over the default config route", () => {
    const { result } = exec("git show __maestra_config__:team.md", repoFiles, {
      execRoutes: [{ match: "git show __maestra_config__", stdout: "OVERRIDDEN" }],
    })
    expect(result).toBe("OVERRIDDEN")
  })

  it("unrelated git reads still fail loud (127)", () => {
    const result = JSON.parse(exec("git show main:src/index.ts").result as string)
    expect(result.code).toBe(127)
  })
})
