// Smoke runner: executes plugin tools against a fixture repo with stub CLIs.
// Usage: node scripts/smoke/run-tool.mjs <status|digest|hook> <directory> [arg]
import { fluxoStatusTool } from "../../dist/tools/status.js"
import { fluxoIssueDigestTool } from "../../dist/tools/digest.js"
import { createDesviosHook } from "../../dist/hooks/desvios.js"

const [what, dir, arg] = process.argv.slice(2)
const ctx = { sessionID: "smoke", directory: dir }

const print = (r) => console.log(typeof r === "string" ? r : r.output)

if (what === "status") {
  print(await fluxoStatusTool.execute({}, ctx))
} else if (what === "digest") {
  print(await fluxoIssueDigestTool.execute({ issue: Number(arg) }, ctx))
} else if (what === "hook") {
  const hook = createDesviosHook()
  const output = { output: "write ok" }
  await hook({ tool: "write", sessionID: "smoke", callID: "c1", args: { filePath: arg } }, output)
  console.log(output.output)
} else {
  console.error(`unknown tool: ${what}`)
  process.exit(2)
}
