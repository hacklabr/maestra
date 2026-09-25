// Smoke runner: executes plugin tools against a fixture repo with stub CLIs.
// Usage: node scripts/smoke/run-tool.mjs <status|digest|hook|v2> <directory> [arg]
import { maestraStatusTool } from "../../dist/tools/status.js"
import { maestraIssueDigestTool } from "../../dist/tools/digest.js"
import { createDesviosHook } from "../../dist/hooks/desvios.js"
import entry from "../../dist/index.js"

const [what, dir, arg] = process.argv.slice(2)
const ctx = { sessionID: "smoke", directory: dir }

const print = (r) => console.log(typeof r === "string" ? r : r.output)

if (what === "status") {
  print(await maestraStatusTool.execute({}, ctx))
} else if (what === "digest") {
  print(await maestraIssueDigestTool.execute({ issue: Number(arg) }, ctx))
} else if (what === "hook") {
  const hook = createDesviosHook()
  const output = { output: "write ok" }
  await hook({ tool: "write", sessionID: "smoke", callID: "c1", args: { filePath: arg } }, output)
  console.log(output.output)
} else if (what === "v2") {
  // R25: dual-generation entrypoint over the REAL dist build. Prints one
  // "ok:" line per assertion; smoke.sh greps them.
  const assert = (cond, label) => {
    if (!cond) {
      console.error(`v2 smoke FAILED: ${label}`)
      process.exit(1)
    }
    console.log(`ok: ${label}`)
  }

  assert(entry.id === "maestra", "dual export has stable id")
  assert(typeof entry.setup === "function", "dual export has setup (V2)")
  assert(typeof entry.server === "function", "dual export has server (V1)")

  const added = []
  const hooks = {}
  const mockCtx = {
    location: { directory: dir },
    tool: {
      transform: async (cb) => cb({ add: (d) => added.push(d) }),
      hook: async (name, cb) => {
        hooks[name] = cb
      },
    },
    session: {
      hook: async (name, cb) => {
        hooks[`session.${name}`] = cb
      },
      get: async () => ({}),
      prompt: async () => {},
      wait: async () => {},
      context: async () => [],
    },
  }
  await entry.setup(mockCtx)
  assert(added.length === 5, `5 tools registered via transform (got ${added.length})`)
  assert(
    added.every((t) => t.input && t.input.type === "object" && !("$schema" in t.input)),
    "tools carry bare JSON Schema inputs",
  )

  const system = []
  await hooks["session.context"]({ system })
  assert(system.length === 1 && system[0].text.includes("<maestra-plugin>"), "banner pushed on context hook")

  // Tool execute adaptation: neutral ToolResult → V2 content.
  const askPeer = added.find((t) => t.name === "ask_peer")
  const denied = await askPeer.execute({ peer_id: "x", question: "q" }, {
    sessionID: "smoke",
    agent: "maestra",
    messageID: "m1",
    signal: new AbortController().signal,
  })
  assert(
    typeof denied.content === "string" && denied.content.startsWith("Error:"),
    "ask_peer executes through the V2 adapter (caller-identity gate fails closed)",
  )

  const v1 = await entry.server({ client: null, directory: dir })
  assert(
    Object.keys(v1.tool).length === 5 && typeof v1["tool.execute.before"] === "function",
    "server() returns the V1 hooks map (5 tools + hooks)",
  )
} else {
  console.error(`unknown tool: ${what}`)
  process.exit(2)
}
