import { beforeEach, describe, expect, it } from "vitest"
import {
  askPeerTool,
  clearPeerState,
  findCallerPersona,
  PEER_CONSULTATION_CAP,
  recordPeerSession,
  resolvePeerSession,
  setSdkClient,
} from "../tools/ask-peer.js"
import { createPeerTrackerHook } from "../hooks/peer-tracker.js"
import { parsePersonaMarker } from "../hooks/persona-marker.js"
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
  return { sessionID, directory: "/tmp/maestra-test" }
}

const M1 = "mesa-01"
const M2 = "mesa-02"

beforeEach(() => {
  clearPeerState()
})

describe("persona marker parsing", () => {
  it("parses persona::<id>@<mesaId>", () => {
    expect(parsePersonaMarker("persona::backend-architect@mesa-01\n\ntext")).toMatchObject({
      personaId: "backend-architect",
      mesaId: "mesa-01",
    })
  })

  it("parses marker without mesa (avulso one-off)", () => {
    expect(parsePersonaMarker("persona::security-engineer\ncontext")).toMatchObject({
      personaId: "security-engineer",
      mesaId: undefined,
    })
  })

  it("returns null when no marker is present", () => {
    expect(parsePersonaMarker("just a prompt")).toBeNull()
    expect(parsePersonaMarker("persona: almost")).toBeNull()
  })
})

describe("ask_peer — happy path (per-mesa routing)", () => {
  it("delivers the question to the peer's real session in the same mesa", async () => {
    recordPeerSession("frontend-developer", "sess-A", M1)
    recordPeerSession("backend-architect", "sess-B", M1)
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
    expect(result).toMatchObject({
      output: "Use event-driven invalidation.",
      metadata: { peerId: "backend-architect", callerId: "frontend-developer", mesa: M1 },
    })
  })

  it("disables delegation and nested consultation in the peer's answer context", async () => {
    recordPeerSession("frontend-developer", "sess-A", M1)
    recordPeerSession("backend-architect", "sess-B", M1)
    const { client, promptCalls } = makeClient({ statuses: {} })
    setSdkClient(client)

    await askPeerTool.execute({ peer_id: "backend-architect", question: "q" }, ctx("sess-A"))

    expect(promptCalls[0].body.tools).toMatchObject({ task: false, actor: false, ask_peer: false })
  })

  it("two parallel mesas with the SAME persona route within the caller's mesa", async () => {
    recordPeerSession("frontend-developer", "sess-A1", M1)
    recordPeerSession("backend-architect", "sess-B1", M1)
    recordPeerSession("frontend-developer", "sess-A2", M2)
    recordPeerSession("backend-architect", "sess-B2", M2)
    const { client, promptCalls } = makeClient({ statuses: {} })
    setSdkClient(client)

    // Caller in mesa-02 must reach the mesa-02 session of the same persona
    const result = await askPeerTool.execute({ peer_id: "backend-architect", question: "q" }, ctx("sess-A2"))

    expect(promptCalls).toHaveLength(1)
    expect(promptCalls[0].path.id).toBe("sess-B2")
    expect(result).toMatchObject({ metadata: { mesa: M2 } })
  })

  it("rejects a peer spawned only in ANOTHER mesa (parallel mesas are isolated)", async () => {
    recordPeerSession("frontend-developer", "sess-A1", M1)
    recordPeerSession("backend-architect", "sess-B2", M2)
    const { client, promptCalls } = makeClient({ statuses: {} })
    setSdkClient(client)

    const result = await askPeerTool.execute({ peer_id: "backend-architect", question: "q" }, ctx("sess-A1"))

    expect(result).toContain(`was not spawned in mesa "${M1}"`)
    expect(promptCalls).toHaveLength(0)
  })

  it("proceeds when the busy-check status call fails (best-effort)", async () => {
    recordPeerSession("frontend-developer", "sess-A", M1)
    recordPeerSession("backend-architect", "sess-B", M1)
    const { client, promptCalls } = makeClient({ statusThrows: true })
    setSdkClient(client)

    const result = await askPeerTool.execute({ peer_id: "backend-architect", question: "q" }, ctx("sess-A"))

    expect(promptCalls).toHaveLength(1)
    expect(result).toMatchObject({ output: "peer answer" })
  })
})

describe("ask_peer — caller-identity gate (facilitator exclusion, pending decision #2)", () => {
  it("denies a caller that is not a spawned shell specialist — the facilitator never is", async () => {
    recordPeerSession("backend-architect", "sess-B", M1)
    const { client, promptCalls } = makeClient({ statuses: {} })
    setSdkClient(client)

    const result = await askPeerTool.execute(
      { peer_id: "backend-architect", question: "q" },
      ctx("sess-facilitator"),
    )

    expect(result).toMatch(/^Error: ask_peer is restricted to specialists/)
    expect(result).toContain("facilitator")
    expect(promptCalls).toHaveLength(0)
  })
})

describe("ask_peer — anti-cycle busy-check", () => {
  it("A→B→C→A cycle dies at the busy-check: A is busy awaiting B when C consults A", async () => {
    recordPeerSession("specialist-a", "sess-A", M1)
    recordPeerSession("specialist-b", "sess-B", M1)
    recordPeerSession("specialist-c", "sess-C", M1)
    const { client, promptCalls } = makeClient({
      statuses: { "sess-A": { type: "busy" }, "sess-B": { type: "idle" }, "sess-C": { type: "idle" } },
    })
    setSdkClient(client)

    const ab = await askPeerTool.execute({ peer_id: "specialist-b", question: "q1" }, ctx("sess-A"))
    expect(ab).toMatchObject({ output: "peer answer" })

    const bc = await askPeerTool.execute({ peer_id: "specialist-c", question: "q2" }, ctx("sess-B"))
    expect(bc).toMatchObject({ output: "peer answer" })

    const ca = await askPeerTool.execute({ peer_id: "specialist-a", question: "q3" }, ctx("sess-C"))
    expect(ca).toMatch(/^Error: peer "specialist-a" is currently busy/)

    expect(promptCalls).toHaveLength(2)
  })
})

describe("ask_peer — rate cap (per mesa)", () => {
  it("allows up to the cap per caller→peer pair per mesa, then denies", async () => {
    recordPeerSession("frontend-developer", "sess-A", M1)
    recordPeerSession("backend-architect", "sess-B", M1)
    const { client, promptCalls } = makeClient({ statuses: {} })
    setSdkClient(client)

    for (let i = 0; i < PEER_CONSULTATION_CAP; i++) {
      const ok = await askPeerTool.execute({ peer_id: "backend-architect", question: `q${i}` }, ctx("sess-A"))
      expect(ok).toMatchObject({ output: "peer answer" })
    }

    const denied = await askPeerTool.execute({ peer_id: "backend-architect", question: "one more" }, ctx("sess-A"))
    expect(denied).toMatch(/^Error: consultation cap reached/)
    expect(denied).toContain(M1)
    expect(promptCalls).toHaveLength(PEER_CONSULTATION_CAP)
  })

  it("cap is per mesa: the same pair in a different mesa gets a fresh allowance", async () => {
    recordPeerSession("frontend-developer", "sess-A1", M1)
    recordPeerSession("backend-architect", "sess-B1", M1)
    recordPeerSession("frontend-developer", "sess-A2", M2)
    recordPeerSession("backend-architect", "sess-B2", M2)
    const { client, promptCalls } = makeClient({ statuses: {} })
    setSdkClient(client)

    for (let i = 0; i < PEER_CONSULTATION_CAP; i++) {
      await askPeerTool.execute({ peer_id: "backend-architect", question: `q${i}` }, ctx("sess-A1"))
    }

    const other = await askPeerTool.execute({ peer_id: "backend-architect", question: "q" }, ctx("sess-A2"))
    expect(other).toMatchObject({ output: "peer answer", metadata: { mesa: M2 } })
    expect(promptCalls).toHaveLength(PEER_CONSULTATION_CAP + 1)
  })
})

describe("ask_peer — error paths", () => {
  it("fails when the peer was never spawned, guiding the marker pattern", async () => {
    recordPeerSession("frontend-developer", "sess-A", M1)
    const { client, promptCalls } = makeClient({ statuses: {} })
    setSdkClient(client)

    const result = await askPeerTool.execute({ peer_id: "ux-researcher", question: "q" }, ctx("sess-A"))

    expect(result).toMatch(/^Error: peer "ux-researcher" has no session/)
    expect(result).toContain("persona::ux-researcher@<mesaId>")
    expect(result).toContain("maestra/especialista")
    expect(promptCalls).toHaveLength(0)
  })

  it("fails cleanly when the SDK client was never set", async () => {
    recordPeerSession("frontend-developer", "sess-A", M1)
    setSdkClient(null)

    const result = await askPeerTool.execute({ peer_id: "backend-architect", question: "q" }, ctx("sess-A"))

    expect(result).toMatch(/^Error: SDK client not available/)
  })

  it("surfaces prompt failures as errors", async () => {
    recordPeerSession("frontend-developer", "sess-A", M1)
    recordPeerSession("backend-architect", "sess-B", M1)
    const { client } = makeClient({ statuses: {}, promptThrows: true })
    setSdkClient(client)

    const result = await askPeerTool.execute({ peer_id: "backend-architect", question: "q" }, ctx("sess-A"))

    expect(result).toMatch(/^Error: peer consultation with "backend-architect" failed/)
  })

  it("returns (no response) when the peer produces no text parts", async () => {
    recordPeerSession("frontend-developer", "sess-A", M1)
    recordPeerSession("backend-architect", "sess-B", M1)
    setSdkClient({
      session: {
        status: async () => ({ data: {} }),
        prompt: async (_call: PromptCall) => ({ data: { parts: [{ type: "tool-invocation" }] } }),
      },
    })

    const result = await askPeerTool.execute({ peer_id: "backend-architect", question: "q" }, ctx("sess-A"))

    expect(result).toMatchObject({ output: "(no response)" })
  })
})

describe("resolvePeerSession — scope rules", () => {
  it("avulso caller reaches avulso peer", () => {
    recordPeerSession("frontend-developer", "sess-A")
    recordPeerSession("backend-architect", "sess-B")

    const resolved = resolvePeerSession("backend-architect", undefined)
    expect(resolved).toMatchObject({ sessionId: "sess-B", ambiguous: false })
  })

  it("duplicate spawn in the same scope resolves to the most recent, flagged", () => {
    recordPeerSession("backend-architect", "sess-B1", M1)
    recordPeerSession("backend-architect", "sess-B2", M1)

    const resolved = resolvePeerSession("backend-architect", M1)
    expect(resolved).toMatchObject({ sessionId: "sess-B2", ambiguous: true })
  })
})

describe("peer-tracker hook (marker-based identity, dual-host metadata)", () => {
  const SHELL = "maestra/especialista"

  it("records OpenCode task spawns: persona from marker, session from metadata.sessionId", async () => {
    const tracker = createPeerTrackerHook()
    await tracker(
      {
        tool: "task",
        sessionID: "sess-facilitator",
        callID: "c1",
        args: { subagent_type: SHELL, prompt: "persona::backend-architect@mesa-01\n\n## Persona\n..." },
      },
      { title: "t", output: "o", metadata: { sessionId: "sess-B" } },
    )

    expect(findCallerPersona("sess-B")).toMatchObject({ persona: "backend-architect", mesaId: "mesa-01" })
  })

  it("records Mimo actor spawns: persona from marker, session from metadata.actor_id", async () => {
    const tracker = createPeerTrackerHook()
    await tracker(
      {
        tool: "actor",
        sessionID: "sess-facilitator",
        callID: "c2",
        args: { subagent_type: SHELL, prompt: "persona::security-engineer@mesa-02\n..." },
      },
      { title: "t", output: "o", metadata: { actor_id: "sess-C" } },
    )

    expect(findCallerPersona("sess-C")).toMatchObject({ persona: "security-engineer", mesaId: "mesa-02" })
  })

  it("spawn WITHOUT marker: not registered AND warning appended to output", async () => {
    const tracker = createPeerTrackerHook()
    const output = { title: "t", output: "original output", metadata: { sessionId: "sess-X" } }
    await tracker(
      { tool: "task", sessionID: "sess-facilitator", callID: "c3", args: { subagent_type: SHELL, prompt: "no marker here" } },
      output,
    )

    expect(findCallerPersona("sess-X")).toBeUndefined()
    expect(output.output).toContain("original output")
    expect(output.output).toContain("SEM marker persona::")
    expect(output.output).toContain("NÃO poderá usar ask_peer")
  })

  it("ignores non-shell subagents and other tools", async () => {
    const tracker = createPeerTrackerHook()
    const out1 = { title: "t", output: "o", metadata: { sessionId: "sess-Y" } }
    await tracker(
      { tool: "task", sessionID: "s", callID: "c4", args: { subagent_type: "other/agent", prompt: "persona::x@m" } },
      out1,
    )
    await tracker(
      { tool: "bash", sessionID: "s", callID: "c5", args: { subagent_type: SHELL, prompt: "persona::x@m" } },
      { title: "t", output: "o", metadata: { sessionId: "sess-Z" } },
    )

    expect(findCallerPersona("sess-Y")).toBeUndefined()
    expect(findCallerPersona("sess-Z")).toBeUndefined()
    expect(out1.output).toBe("o")
  })

  it("skips silently when the persona-expansion failure signature is present", async () => {
    const tracker = createPeerTrackerHook()
    const output = { title: "t", output: "o", metadata: { sessionId: "sess-F" } }
    await tracker(
      {
        tool: "task",
        sessionID: "s",
        callID: "c6",
        args: { subagent_type: SHELL, prompt: "[FLUXO PLUGIN ERROR — persona não encontrada]\nA persona..." },
      },
      output,
    )

    expect(findCallerPersona("sess-F")).toBeUndefined()
    expect(output.output).toBe("o")
  })
})
