import { chatCompletion, createMockModel, liveModelConfig } from "../lib/model-client.mjs"
import { TOOL_SURFACE, createStubExecutor } from "../lib/stub-tools.mjs"
import { buildSystemPrompt, loadGitHubFixture, loadRepoFixture } from "../lib/load-fixtures.mjs"

const MAX_STEPS_PER_TURN = 12

/**
 * promptfoo custom provider: drives the facilitator agent loop with STUBBED
 * tools. The scenario (vars) carries the fixture, the repo scaffold, the
 * journey modules to load, and the scripted human turns (entry + humanScript).
 * The provider plays the whole scripted conversation and returns the full
 * transcript as JSON — promptfoo asserts inspect it (tier-1 deterministic).
 *
 * vars: {
 *   fixture: "fixtures/github/x.json"     (github state — digests/status/execRoutes)
 *   repo: "fixtures/repo/x.json"          (virtual fs scaffold, optional)
 *   modules: ["jornadas/j1-triagem.md"]   (journey modules loaded into system)
 *   entry: "texto livre ou número"        (first human turn)
 *   humanScript: ["...", "..."]           (subsequent scripted human turns)
 *   mockSteps: [...]                      (mock model script — dry-run mode)
 * }
 */
export default class FluxoAgentProvider {
  constructor(options = {}) {
    this.config = options.config ?? {}
  }

  id() {
    return "maestra-agent"
  }

  async callApi(_prompt, context) {
    const vars = context?.vars ?? {}
    try {
      const transcript = await runScenario(vars)
      return { output: JSON.stringify(transcript), cached: false }
    } catch (error) {
      return { error: `maestra-agent provider: ${error instanceof Error ? error.message : String(error)}` }
    }
  }
}

/** promptfoo flattens single-element arrays in vars — normalize list-ish vars. */
function asArray(value) {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

export async function runScenario(vars) {
  if (!vars.fixture) throw new Error("scenario sem vars.fixture")
  if (!vars.entry) throw new Error("scenario sem vars.entry")

  const fixture = await loadGitHubFixture(vars.fixture)
  const repo = vars.repo ? await loadRepoFixture(vars.repo) : { files: {} }
  const system = await buildSystemPrompt(asArray(vars.modules))
  const stub = createStubExecutor({ fixture, repoFiles: repo.files })

  const mock = process.env.MAESTRA_EVAL_MOCK === "1" || vars.mock === true
  const modelConfig = liveModelConfig()
  const mockChat = mock ? createMockModel(asArray(vars.mockSteps)) : null

  const messages = [{ role: "system", content: system }]
  const transcript = { turns: [], calls: [], files: null }
  const humanTurns = [vars.entry, ...asArray(vars.humanScript)]

  for (const human of humanTurns) {
    messages.push({ role: "user", content: human })
    transcript.turns.push({ role: "human", content: human })

    for (let step = 0; step < MAX_STEPS_PER_TURN; step++) {
      stub.markTurn(transcript.turns.length)
      const resp = mock
        ? await mockChat()
        : await chatCompletion({ messages, tools: TOOL_SURFACE, config: modelConfig })

      if (resp.toolCalls.length === 0) {
        messages.push(resp.rawMessage ?? { role: "assistant", content: resp.text })
        transcript.turns.push({ role: "agent", content: resp.text })
        break
      }

      messages.push(resp.rawMessage)
      transcript.turns.push({ role: "agent-toolcalls", calls: resp.toolCalls.map((c) => c.name) })
      for (const call of resp.toolCalls) {
        const result = stub.execute(call.name, call.args)
        messages.push({ role: "tool", tool_call_id: call.id, content: result })
      }
    }
  }

  // Preserve global call order across turns: the stub records in execution order.
  transcript.calls = stub.calls
  transcript.files = stub.files
  transcript.mesa = stub.mesa
  return transcript
}
