/**
 * Model client for evals. Two backends:
 *  - live: minimal OpenAI-compatible chat-completions client (native fetch,
 *    zero deps) — any endpoint works (OpenAI, local vLLM/Ollama, proxies).
 *    Config via env: FLUXO_EVAL_MODEL, FLUXO_EVAL_BASE_URL, FLUXO_EVAL_API_KEY.
 *    Temperature pinned to 0 (deterministic eval runs).
 *  - mock: deterministic scripted model (FLUXO_EVAL_MOCK=1) — consumes
 *    vars.mockSteps so the FULL harness pipeline runs green without a live
 *    model (structure validation, plumbing, assert evaluation).
 */

export function liveModelConfig() {
  return {
    model: process.env.FLUXO_EVAL_MODEL ?? "gpt-4o-mini",
    baseUrl: (process.env.FLUXO_EVAL_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
    apiKey: process.env.FLUXO_EVAL_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
  }
}

export async function chatCompletion({ messages, tools, config }) {
  const { model, baseUrl, apiKey } = config
  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      temperature: 0,
    }),
  })
  if (!resp.ok) {
    throw new Error(`model API ${resp.status}: ${(await resp.text()).slice(0, 400)}`)
  }
  const data = await resp.json()
  const message = data.choices?.[0]?.message ?? {}
  return {
    text: message.content ?? "",
    toolCalls: (message.tool_calls ?? []).map((tc) => ({
      id: tc.id,
      name: tc.function?.name,
      args: safeParse(tc.function?.arguments),
      raw: tc,
    })),
    rawMessage: message,
    usage: data.usage ?? null,
  }
}

function safeParse(json) {
  try {
    return JSON.parse(json ?? "{}")
  } catch {
    return {}
  }
}

/**
 * Scripted mock model. Consumes vars.mockSteps sequentially:
 *   { "toolCall": { "name": "fluxo_status", "args": {} } }
 *   { "text": "resposta simulada" }
 * When steps run out, emits a closing text. Deterministic, zero cost —
 * this is what makes `npm run eval:dry` green without a live model.
 */
export function createMockModel(mockSteps = []) {
  let cursor = 0
  return async function mockChat() {
    const step = mockSteps[cursor] ?? null
    cursor++
    if (!step) {
      return { text: "Fim da simulação (mock).", toolCalls: [], rawMessage: { role: "assistant", content: "Fim (mock)." }, usage: null }
    }
    if (step.toolCall) {
      const raw = {
        id: `mockcall_${cursor}`,
        type: "function",
        function: { name: step.toolCall.name, arguments: JSON.stringify(step.toolCall.args ?? {}) },
      }
      return {
        text: "",
        toolCalls: [{ id: raw.id, name: step.toolCall.name, args: step.toolCall.args ?? {}, raw }],
        rawMessage: { role: "assistant", content: null, tool_calls: [raw] },
        usage: null,
      }
    }
    return { text: step.text ?? "", toolCalls: [], rawMessage: { role: "assistant", content: step.text ?? "" }, usage: null }
  }
}
