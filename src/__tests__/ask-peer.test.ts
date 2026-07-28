import { beforeEach, describe, expect, it } from "vitest"
import {
  askPeerTool,
  clearPeerState,
  findCallerPersona,
  PEER_CONSULTATION_CAP,
  recordPeerSession,
  setSdkClient,
} from "../tools/ask-peer.js"
import { createPeerTrackerHook } from "../hooks/peer-tracker.js"
import type { ToolContext } from "../host-types.js"

type PromptCall = {
  path: { id: string }
  body: { parts: Array<{ type: string; text: string }>; tools?: Record<string, boolean> }
}

function makeClient(opts: {
  statuses?: Record<string, { type: string }>
  statusThrows?: boolean
  answer?: string
  promptThrows?: boolean
}) {
  const promptCalls: PromptCall[] = []
  const client = {
    session: {
      status: async (_?: { query?: { directory?: string } }) => {
        if (opts.statusThrows) throw new Error("status unavailable")
        return { data: opts.statuses ?? {} }
      },
      prompt: async (call: PromptCall) => {
        if (opts.promptThrows) throw new Error("prompt failed")
        promptCalls.push(call)
        return { data: { parts: [{ type: "text", text: opts.answer ?? "peer answer" }] } }
      },
    },
  }
  return { client, promptCalls }
}

function ctx(sessionID: string): ToolContext {
  return { sessionID, directory: "/tmp/fluxo-test" }
}

beforeEach(() => {
  clearPeerState()
})

describe("ask_peer — happy path", () => {
  it("delivers the question to the peer's real session and returns the answer", async () => {
    recordPeerSession("frontend-developer", "sess-A")
    recordPeerSession("backend-architect", "sess-B")
    const { client, promptCalls } = makeClient({
      statuses: { "sess-B": { type: "idle" } },
      answer: "Use event-driven invalidation.",
    })
    setSdkClient(client)

    const result = await askPeerTool.execute(
      { peer_id: "backend-architect", question: "Cache TTL strategy?" },
      ctx("sess-A"),
    )

    expect(promptCalls).toHaveLength(1)
    expect(promptCalls[0].path.id).toBe("sess-B")
    expect(promptCalls[0].body.parts[0].text).toContain("[Peer consultation from frontend-developer]")
    expect(promptCalls[0].body.parts[0].text).toContain("Cache TTL strategy?")
    expect(result).toMatchObject({
      output: "Use event-driven invalidation.",
      metadata: { peerId: "backend-architect", callerId: "frontend-developer" },
    })
  })

  it("disables delegation and nested consultation in the peer's answer context", async () => {
    recordPeerSession("frontend-developer", "sess-A")
    recordPeerSession("backend-architect", "sess-B")
    const { client, promptCalls } = makeClient({ statuses: {} })
    setSdkClient(client)

    await askPeerTool.execute({ peer_id: "backend-architect", question: "q" }, ctx("sess-A"))

    expect(promptCalls[0].body.tools).toMatchObject({
      task: false,
      actor: false,
      ask_peer: false,
    })
  })

  it("accepts peer_id with the fluxo/ prefix (normalized)", async () => {
    recordPeerSession("frontend-developer", "sess-A")
    recordPeerSession("backend-architect", "sess-B")
    const { client, promptCalls } = makeClient({ statuses: {} })
    setSdkClient(client)

    const result = await askPeerTool.execute(
      { peer_id: "fluxo/backend-architect", question: "q" },
      ctx("sess-A"),
    )

    expect(promptCalls).toHaveLength(1)
    expect(result).toMatchObject({ metadata: { peerId: "backend-architect" } })
  })

  it("proceeds when the busy-check status call fails (best-effort)", async () => {
    recordPeerSession("frontend-developer", "sess-A")
    recordPeerSession("backend-architect", "sess-B")
    const { client, promptCalls } = makeClient({ statusThrows: true })
    setSdkClient(client)

    const result = await askPeerTool.execute({ peer_id: "backend-architect", question: "q" }, ctx("sess-A"))

    expect(promptCalls).toHaveLength(1)
    expect(result).toMatchObject({ output: "peer answer" })
  })
})

describe("ask_peer — caller-identity gate (facilitator exclusion, pending decision #2)", () => {
  it("denies a caller that is not a spawned specialist — the facilitator never is", async () => {
    recordPeerSession("backend-architect", "sess-B")
    const { client, promptCalls } = makeClient({ statuses: {} })
    setSdkClient(client)

    // "sess-facilitator" is the PARENT of sess-B; it is never a map value.
    const result = await askPeerTool.execute(
      { peer_id: "backend-architect", question: "q" },
      ctx("sess-facilitator"),
    )

    expect(result).toMatch(/^Error: ask_peer is restricted to specialists/)
    expect(result).toContain("facilitator")
    expect(promptCalls).toHaveLength(0)
  })

  it("denies arbitrary unknown sessions (not just the facilitator)", async () => {
    recordPeerSession("backend-architect", "sess-B")
    const { client, promptCalls } = makeClient({ statuses: {} })
    setSdkClient(client)

    const result = await askPeerTool.execute({ peer_id: "backend-architect", question: "q" }, ctx("sess-random"))

    expect(result).toMatch(/^Error: ask_peer is restricted to specialists/)
    expect(promptCalls).toHaveLength(0)
  })
})

describe("ask_peer — anti-cycle busy-check", () => {
  it("A→B→C→A cycle dies at the busy-check: A is busy awaiting B when C consults A", async () => {
    recordPeerSession("specialist-a", "sess-A")
    recordPeerSession("specialist-b", "sess-B")
    recordPeerSession("specialist-c", "sess-C")
    const { client, promptCalls } = makeClient({
      // A is mid-execution (awaiting B's answer to A's own consultation).
      statuses: { "sess-A": { type: "busy" }, "sess-B": { type: "idle" }, "sess-C": { type: "idle" } },
    })
    setSdkClient(client)

    // A→B works (B idle)
    const ab = await askPeerTool.execute({ peer_id: "specialist-b", question: "q1" }, ctx("sess-A"))
    expect(ab).toMatchObject({ output: "peer answer" })

    // B→C works (C idle)
    const bc = await askPeerTool.execute({ peer_id: "specialist-c", question: "q2" }, ctx("sess-B"))
    expect(bc).toMatchObject({ output: "peer answer" })

    // C→A MUST fail: A is busy → cycle broken
    const ca = await askPeerTool.execute({ peer_id: "specialist-a", question: "q3" }, ctx("sess-C"))
    expect(ca).toMatch(/^Error: peer "specialist-a" is currently busy/)

    // Only the two legitimate consultations reached the SDK
    expect(promptCalls).toHaveLength(2)
  })

  it("rejects consultation of any busy peer, not just cycle participants", async () => {
    recordPeerSession("frontend-developer", "sess-A")
    recordPeerSession("backend-architect", "sess-B")
    const { client, promptCalls } = makeClient({ statuses: { "sess-B": { type: "busy" } } })
    setSdkClient(client)

    const result = await askPeerTool.execute({ peer_id: "backend-architect", question: "q" }, ctx("sess-A"))

    expect(result).toContain("busy")
    expect(promptCalls).toHaveLength(0)
  })
})

describe("ask_peer — rate cap", () => {
  it("allows up to the cap per caller→peer pair, then denies", async () => {
    recordPeerSession("frontend-developer", "sess-A")
    recordPeerSession("backend-architect", "sess-B")
    const { client, promptCalls } = makeClient({ statuses: {} })
    setSdkClient(client)

    for (let i = 0; i < PEER_CONSULTATION_CAP; i++) {
      const ok = await askPeerTool.execute({ peer_id: "backend-architect", question: `q${i}` }, ctx("sess-A"))
      expect(ok).toMatchObject({ output: "peer answer" })
    }

    const denied = await askPeerTool.execute({ peer_id: "backend-architect", question: "one more" }, ctx("sess-A"))
    expect(denied).toMatch(/^Error: consultation cap reached/)
    expect(promptCalls).toHaveLength(PEER_CONSULTATION_CAP)
  })

  it("cap is per pair: a different peer keeps its own allowance", async () => {
    recordPeerSession("frontend-developer", "sess-A")
    recordPeerSession("backend-architect", "sess-B")
    recordPeerSession("security-engineer", "sess-C")
    const { client, promptCalls } = makeClient({ statuses: {} })
    setSdkClient(client)

    for (let i = 0; i < PEER_CONSULTATION_CAP; i++) {
      await askPeerTool.execute({ peer_id: "backend-architect", question: `q${i}` }, ctx("sess-A"))
    }

    const other = await askPeerTool.execute({ peer_id: "security-engineer", question: "q" }, ctx("sess-A"))
    expect(other).toMatchObject({ output: "peer answer" })
    expect(promptCalls).toHaveLength(PEER_CONSULTATION_CAP + 1)
  })
})

describe("ask_peer — peer lookup and error paths", () => {
  it("fails when the peer was never spawned in this session", async () => {
    recordPeerSession("frontend-developer", "sess-A")
    const { client, promptCalls } = makeClient({ statuses: {} })
    setSdkClient(client)

    const result = await askPeerTool.execute({ peer_id: "ux-researcher", question: "q" }, ctx("sess-A"))

    expect(result).toMatch(/^Error: peer "ux-researcher" has no session in this mesa/)
    expect(result).toContain("fluxo/ux-researcher")
    expect(promptCalls).toHaveLength(0)
  })

  it("fails cleanly when the SDK client was never set", async () => {
    recordPeerSession("frontend-developer", "sess-A")
    setSdkClient(null)

    const result = await askPeerTool.execute({ peer_id: "backend-architect", question: "q" }, ctx("sess-A"))

    expect(result).toMatch(/^Error: SDK client not available/)
  })

  it("surfaces prompt failures as errors", async () => {
    recordPeerSession("frontend-developer", "sess-A")
    recordPeerSession("backend-architect", "sess-B")
    const { client } = makeClient({ statuses: {}, promptThrows: true })
    setSdkClient(client)

    const result = await askPeerTool.execute({ peer_id: "backend-architect", question: "q" }, ctx("sess-A"))

    expect(result).toMatch(/^Error: peer consultation with "backend-architect" failed/)
  })

  it("returns (no response) when the peer produces no text parts", async () => {
    recordPeerSession("frontend-developer", "sess-A")
    recordPeerSession("backend-architect", "sess-B")
    const promptCalls: PromptCall[] = []
    setSdkClient({
      session: {
        status: async () => ({ data: {} }),
        prompt: async (call: PromptCall) => {
          promptCalls.push(call)
          return { data: { parts: [{ type: "tool-invocation" }] } }
        },
      },
    })

    const result = await askPeerTool.execute({ peer_id: "backend-architect", question: "q" }, ctx("sess-A"))

    expect(result).toMatchObject({ output: "(no response)" })
  })
})

describe("peer-tracker hook (persona→session population, dual-host)", () => {
  it("records OpenCode task spawns via metadata.sessionId", async () => {
    const tracker = createPeerTrackerHook()
    await tracker(
      { tool: "task", sessionID: "sess-facilitator", callID: "c1", args: { subagent_type: "fluxo/backend-architect" } },
      { title: "t", output: "o", metadata: { sessionId: "sess-B" } },
    )

    expect(findCallerPersona("sess-B")).toBe("backend-architect")
  })

  it("records Mimo actor spawns via metadata.actor_id", async () => {
    const tracker = createPeerTrackerHook()
    await tracker(
      { tool: "actor", sessionID: "sess-facilitator", callID: "c2", args: { subagent_type: "fluxo/security-engineer" } },
      { title: "t", output: "o", metadata: { actor_id: "sess-C" } },
    )

    expect(findCallerPersona("sess-C")).toBe("security-engineer")
  })

  it("ignores non-fluxo subagents, other tools, and missing metadata", async () => {
    const tracker = createPeerTrackerHook()
    await tracker(
      { tool: "task", sessionID: "s", callID: "c3", args: { subagent_type: "other/agent" } },
      { title: "t", output: "o", metadata: { sessionId: "sess-X" } },
    )
    await tracker(
      { tool: "bash", sessionID: "s", callID: "c4", args: { subagent_type: "fluxo/backend-architect" } },
      { title: "t", output: "o", metadata: { sessionId: "sess-Y" } },
    )
    await tracker(
      { tool: "task", sessionID: "s", callID: "c5", args: { subagent_type: "fluxo/backend-architect" } },
      { title: "t", output: "o", metadata: {} },
    )

    expect(findCallerPersona("sess-X")).toBeUndefined()
    expect(findCallerPersona("sess-Y")).toBeUndefined()
  })
})
