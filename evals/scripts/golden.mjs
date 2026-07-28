#!/usr/bin/env node
/**
 * Tier-3 — golden transcripts. Regenerates transcripts for the golden
 * scenarios and diffs STRUCTURE (call sequence, events, turn count) against
 * the accepted baselines in transcripts/golden/. Wording is NEVER byte-diffed
 * — wording changes are for human review, like visual-regression baselines.
 *
 * Usage:
 *   node evals/scripts/golden.mjs           → structural diff, exit 1 on drift
 *   node evals/scripts/golden.mjs --update  → accept new baseline (HUMAN review first!)
 *
 * Baselines are only accepted after human review — never auto-update in CI.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { join } from "node:path"
import { runScenario } from "../providers/maestra-agent.mjs"

const EVALS_ROOT = fileURLToPath(new URL("..", import.meta.url))
const GOLDEN_DIR = join(EVALS_ROOT, "transcripts", "golden")

/** Golden scenarios (mock-independent: they run with the LIVE model). */
const GOLDEN_SCENARIOS = [
  {
    id: "j2-b2-contraditorio",
    vars: {
      fixture: "fixtures/github/epic-labels-contraditorias.json",
      repo: "fixtures/repo/rodada-aberta.json",
      modules: ["jornadas/j2-retomada.md"],
      entry: "12",
    },
  },
  {
    id: "j8-recusa-requisito-novo",
    vars: {
      fixture: "fixtures/github/epic-etapa3-execucao.json",
      repo: "fixtures/repo/rodada-aberta.json",
      modules: ["jornadas/j5-etapa3.md", "jornadas/j8-guarda.md"],
      entry: "Aproveita e coloca exportação em Excel também, rapidinho.",
    },
  },
]

function structureOf(transcript) {
  return {
    turns: transcript.turns.length,
    humanTurns: transcript.turns.filter((t) => t.role === "human").length,
    agentTurns: transcript.turns.filter((t) => t.role === "agent").length,
    callSequence: transcript.calls.map((c) =>
      c.kind === "exec" ? `exec:${(c.command ?? "").slice(0, 60)}` : c.kind === "write" ? `write:${c.path}` : `tool:${c.name}`,
    ),
    events: transcript.calls.filter((c) => c.kind === "tool" && c.name === "maestra_emit_event").map((c) => c.args?.type),
    filesWritten: Object.keys(transcript.files ?? {}),
  }
}

async function main() {
  const update = process.argv.includes("--update")
  await mkdir(GOLDEN_DIR, { recursive: true })
  let drift = 0

  for (const scenario of GOLDEN_SCENARIOS) {
    const baselinePath = join(GOLDEN_DIR, `${scenario.id}.json`)
    const transcript = await runScenario(scenario.vars)
    const structure = structureOf(transcript)

    let baseline = null
    try {
      baseline = JSON.parse(await readFile(baselinePath, "utf8"))
    } catch {
      baseline = null
    }

    if (!baseline || update) {
      await writeFile(
        baselinePath,
        JSON.stringify({ id: scenario.id, structure, transcript }, null, 2) + "\n",
      )
      console.log(`[golden] ${scenario.id}: baseline ${baseline ? "ATUALIZADA (revisão humana confirmada?)" : "criada"}.`)
      continue
    }

    const same =
      JSON.stringify(baseline.structure.callSequence) === JSON.stringify(structure.callSequence) &&
      JSON.stringify(baseline.structure.events) === JSON.stringify(structure.events)
    if (same) {
      console.log(`[golden] ${scenario.id}: estrutura íntegra.`)
    } else {
      drift++
      console.log(`[golden] ${scenario.id}: DRIFT ESTRUTURAL`)
      console.log(`  baseline: ${JSON.stringify(baseline.structure.callSequence)}`)
      console.log(`  atual:    ${JSON.stringify(structure.callSequence)}`)
      console.log(`  Wording NÃO é comparado — revise a conversa e, se a mudança for intencional, rode --update.`)
    }
  }

  process.exit(drift > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(`[golden] erro: ${e instanceof Error ? e.message : String(e)}`)
  process.exit(1)
})
