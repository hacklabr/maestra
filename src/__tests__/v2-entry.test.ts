import { beforeEach, afterEach, describe, expect, it } from "vitest"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { setupV2, type MaestraV2Context, type V2ToolAfterEvent, type V2ToolBeforeEvent } from "../v2-entry.js"
import type { V2ToolDefinition } from "../v2/tool-adapter.js"
import { clearPeerState, findCallerPersona, recordPeerSession, setPeerApi } from "../tools/ask-peer.js"
import { makeV2PeerApi } from "../tools/peer-session-api.js"

/**
 * V2 entry tests: setup against a mock plugin context (structural subset,
 * same shapes verified against @opencode/plugin 2.x types).
 */

type BeforeHook = (event: V2ToolBeforeEvent) => Promise<void> | void
type AfterHook = (event: V2ToolAfterEvent) => Promise<void> | void
type ContextHook = (event: { system: Array<{ type: string; text: string }> }) => Promise<void> | void

interface SessionMockState {
  info: { time?: { idle?: number; updated?: number } }
  messages: Array<{ type: string; content?: ReadonlyArray<{ type: string; text?: string }> }>
}

function makeMockCtx(directory: string, sessionState: SessionMockState) {
  const added: V2ToolDefinition[] = []
  const beforeHooks: BeforeHook[] = []
  const afterHooks: AfterHook[] = []
  const contextHooks: ContextHook[] = []
  const sessionCalls = {
    prompt: [] as Array<{ sessionID: string; text: string }>,
    wait: [] as Array<{ sessionID: string }>,
    context: [] as Array<{ sessionID: string }>,
    get: [] as Array<{ sessionID: string }>,
  }
  const ctx: MaestraV2Context = {
    location: { directory },
    tool: {
      transform: async (cb) => cb({ add: (def) => added.push(def) }),
      hook: async (name, cb) => {
        ;(name === "execute.before" ? beforeHooks : afterHooks).push(cb)
      },
    },
    session: {
      hook: async (_name, cb) => contextHooks.push(cb),
      get: async (input) => {
        sessionCalls.get.push(input)
        return sessionState.info
      },
      prompt: async (input) => {
        sessionCalls.prompt.push(input)
      },
      wait: async (input) => {
        sessionCalls.wait.push(input)
      },
      context: async (input) => {
        sessionCalls.context.push(input)
        return sessionState.messages
      },
    },
  }
  return { ctx, added, beforeHooks, afterHooks, contextHooks, sessionCalls }
}

const SIGNAL = new AbortController().signal

function execContext(overrides: Partial<{ sessionID: string; agent: string; messageID: string }> = {}) {
  return {
    sessionID: overrides.sessionID ?? "ses_caller",
    agent: overrides.agent ?? "maestra",
    messageID: overrides.messageID ?? "msg_1",
    signal: SIGNAL,
  }
}

let tmp: string
let prevCatalogDir: string | undefined
let prevInstructionsRoot: string | undefined

beforeEach(async () => {
  tmp = mkdtempSync(join(tmpdir(), "maestra-v2-"))
  // Catalog fixture for persona expansion (resolved at setup time).
  prevCatalogDir = process.env.MAESTRA_CATALOG_DIR
  const catalogRoot = join(tmp, "catalog")
  mkdirSync(join(catalogRoot, "software-development"), { recursive: true })
  writeFileSync(
    join(catalogRoot, "software-development", "backend-architect.md"),
    ["---", "name: Backend Architect", "description: backend domain", "---", "", "You are the Backend Architect.", ""].join("\n"),
    "utf-8",
  )
  process.env.MAESTRA_CATALOG_DIR = catalogRoot
  // Instructions fixture for maestra_read_instructions.
  prevInstructionsRoot = process.env.MAESTRA_INSTRUCTIONS_ROOT
  const instructionsRoot = join(tmp, "instructions")
  mkdirSync(join(instructionsRoot, "kernel"), { recursive: true })
  writeFileSync(join(instructionsRoot, "kernel", "test.md"), "kernel content", "utf-8")
  process.env.MAESTRA_INSTRUCTIONS_ROOT = instructionsRoot
})

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
  if (prevCatalogDir === undefined) delete process.env.MAESTRA_CATALOG_DIR
  else process.env.MAESTRA_CATALOG_DIR = prevCatalogDir
  if (prevInstructionsRoot === undefined) delete process.env.MAESTRA_INSTRUCTIONS_ROOT
  else process.env.MAESTRA_INSTRUCTIONS_ROOT = prevInstructionsRoot
  clearPeerState()
  setPeerApi(null)
})

describe("setupV2 — registration", () => {
  it("registers the 5 tools with exact names and JSON Schema inputs", async () => {
    const { ctx, added } = makeMockCtx(tmp, { info: {}, messages: [] })
    await setupV2(ctx)
    expect(added.map((t) => t.name).sort()).toEqual([
      "ask_peer",
      "maestra_emit_event",
      "maestra_issue_digest",
      "maestra_read_instructions",
      "maestra_status",
    ])
    for (const tool of added) {
      expect(tool.input).toMatchObject({ type: "object" })
      expect(tool.input.$schema).toBeUndefined()
      expect(tool.description.length).toBeGreaterThan(0)
    }
  })

  it("registers tool hooks and the session context banner", async () => {
    const { ctx, beforeHooks, afterHooks, contextHooks } = makeMockCtx(tmp, { info: {}, messages: [] })
    await setupV2(ctx)
    expect(beforeHooks.length).toBe(1)
    expect(afterHooks.length).toBe(1)
    expect(contextHooks.length).toBe(1)

    const system: Array<{ type: string; text: string }> = []
    await contextHooks[0]({ system })
    expect(system).toHaveLength(1)
    expect(system[0]).toMatchObject({ type: "text" })
    expect(system[0].text).toContain("<maestra-plugin>")
    expect(system[0].text).toContain("/agent maestra")
  })
})

describe("setupV2 — tool execution adaptation", () => {
  it("injects the plugin location directory and returns string results as content", async () => {
    const { ctx, added } = makeMockCtx(tmp, { info: {}, messages: [] })
    await setupV2(ctx)
    const readInstructions = added.find((t) => t.name === "maestra_read_instructions")!
    const result = await readInstructions.execute({ path: "kernel/test.md" }, execContext())
    expect(result).toMatchObject({ content: "kernel content" })
  })

  it("end-to-end ask_peer over the V2 peer api (prompt → wait → context)", async () => {
    const sessionState: SessionMockState = {
      info: { time: { idle: 10, updated: 5 } }, // idle >= updated → not busy
      messages: [
        { type: "user", content: [] },
        { type: "assistant", content: [{ type: "text", text: "peer answer one" }] },
        { type: "assistant", content: [{ type: "reasoning", text: "thinking..." }, { type: "text", text: "the answer" }] },
      ],
    }
    const { ctx, added, sessionCalls } = makeMockCtx(tmp, sessionState)
    await setupV2(ctx)

    recordPeerSession("backend-architect", "ses_peer", "mesa-1")
    recordPeerSession("frontend-developer", "ses_caller", "mesa-1")

    const askPeer = added.find((t) => t.name === "ask_peer")!
    const result = await askPeer.execute(
      { peer_id: "backend-architect", question: "what about the contract?" },
      execContext({ sessionID: "ses_caller" }),
    )

    expect(result).toMatchObject({ content: "the answer", metadata: { peerId: "backend-architect", mesa: "mesa-1" } })
    expect(sessionCalls.prompt).toEqual([
      {
        sessionID: "ses_peer",
        text: expect.stringContaining("[Peer consultation from frontend-developer]"),
      },
    ])
    expect(sessionCalls.prompt[0].text).toContain("do NOT delegate")
    expect(sessionCalls.wait).toEqual([{ sessionID: "ses_peer" }])
    expect(sessionCalls.context).toEqual([{ sessionID: "ses_peer" }])
  })
})

describe("setupV2 — execute.before (persona expansion)", () => {
  it("expands the persona marker on a V2 subagent spawn (agent arg field)", async () => {
    const { ctx, beforeHooks } = makeMockCtx(tmp, { info: {}, messages: [] })
    await setupV2(ctx)

    const input: { agent?: string; prompt?: string } = {
      agent: "maestra/specialist",
      prompt: "persona::backend-architect@mesa-1\n\nDiscuss the API.",
    }
    await beforeHooks[0]({
      tool: "subagent",
      sessionID: "ses_caller",
      id: "call_1",
      input,
    })

    expect(input.prompt).toContain("[backend-architect]")
    expect(input.prompt).toContain("You are the Backend Architect.")
    // Marker preserved — identity anchor for the after-hook tracker.
    expect(input.prompt).toContain("persona::backend-architect@mesa-1")
  })

  it("ignores non-shell spawns", async () => {
    const { ctx, beforeHooks } = makeMockCtx(tmp, { info: {}, messages: [] })
    await setupV2(ctx)
    const input = { agent: "general", prompt: "persona::backend-architect@mesa-1" }
    await beforeHooks[0]({ tool: "subagent", sessionID: "s", id: "c", input })
    expect(input.prompt).toBe("persona::backend-architect@mesa-1")
  })
})

describe("setupV2 — execute.after (peer tracker + desvios)", () => {
  it("registers a spawned peer from result metadata (subagent tool)", async () => {
    const { ctx, afterHooks } = makeMockCtx(tmp, { info: {}, messages: [] })
    await setupV2(ctx)

    await afterHooks[0]({
      tool: "subagent",
      sessionID: "ses_facilitator",
      id: "call_2",
      input: { agent: "maestra/specialist", prompt: "persona::backend-architect@mesa-9\n" },
      status: "completed",
      result: { content: "spawned", metadata: { sessionId: "ses_spawned" } },
    })

    expect(findCallerPersona("ses_spawned")).toMatchObject({ persona: "backend-architect", mesaId: "mesa-9" })
  })

  it("appends the desvios warning to the result content on an invalid deviations.md write", async () => {
    const roundDir = join(tmp, "docs", "rounds", "R01-2026-09-test")
    mkdirSync(roundDir, { recursive: true })
    const deviationsPath = join(roundDir, "deviations.md")
    writeFileSync(
      deviationsPath,
      [
        "# Deviations of round R01 — test",
        "",
        "## Deviation 1 — something",
        "",
        "- **Planned:** A",
        "- **Implemented:** B",
        "- **Decision registered at:** #42",
        "",
      ].join("\n"),
      "utf-8",
    )

    const { ctx, afterHooks } = makeMockCtx(tmp, { info: {}, messages: [] })
    await setupV2(ctx)

    const event: V2ToolAfterEvent = {
      tool: "write",
      sessionID: "ses_caller",
      id: "call_3",
      input: { filePath: deviationsPath },
      status: "completed",
      result: { content: "wrote the file" },
    }
    await afterHooks[0](event)

    expect(event.result!.content).toMatch(/^wrote the file/)
    expect(String(event.result!.content)).toContain("missing Reason")
    expect(String(event.result!.content)).toContain("Deviation register")
    expect(event.result!.metadata).toBeUndefined()
  })

  it("leaves the result untouched on non-desvios writes", async () => {
    const { ctx, afterHooks } = makeMockCtx(tmp, { info: {}, messages: [] })
    await setupV2(ctx)
    const event: V2ToolAfterEvent = {
      tool: "write",
      sessionID: "ses_caller",
      id: "call_4",
      input: { filePath: join(tmp, "README.md") },
      status: "completed",
      result: { content: "plain" },
    }
    await afterHooks[0](event)
    expect(event.result).toMatchObject({ content: "plain" })
  })

  it("skips error results", async () => {
    const { ctx, afterHooks } = makeMockCtx(tmp, { info: {}, messages: [] })
    await setupV2(ctx)
    const event: V2ToolAfterEvent = {
      tool: "write",
      sessionID: "ses_caller",
      id: "call_5",
      input: { filePath: "docs/rounds/R01-x/deviations.md" },
      status: "error",
      error: new Error("boom"),
    }
    await expect(afterHooks[0](event)).resolves.toBeUndefined()
  })
})

describe("makeV2PeerApi — busy heuristic", () => {
  it("reports busy when idle < updated, idle when idle >= updated, null on failure", async () => {
    const api = makeV2PeerApi({
      get: async () => ({ time: { idle: 1, updated: 2 } }),
      prompt: async () => {},
      wait: async () => {},
      context: async () => [],
    })
    expect(await api.isBusy("ses_x", "/tmp")).toBe(true)

    const idleApi = makeV2PeerApi({
      get: async () => ({ time: { idle: 3, updated: 2 } }),
      prompt: async () => {},
      wait: async () => {},
      context: async () => [],
    })
    expect(await idleApi.isBusy("ses_x", "/tmp")).toBe(false)

    const failingApi = makeV2PeerApi({
      get: async () => {
        throw new Error("unavailable")
      },
      prompt: async () => {},
      wait: async () => {},
      context: async () => [],
    })
    expect(await failingApi.isBusy("ses_x", "/tmp")).toBeNull()
  })
})
