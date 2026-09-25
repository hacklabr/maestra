import type { Plugin as V2PluginDefinition } from "@opencode/plugin/promise/plugin"
import { buildV1Hooks } from "./v1-entry.js"
import { setupV2, type MaestraV2Context } from "./v2-entry.js"

/**
 * Dual-generation entrypoint (R25):
 *
 *  - OpenCode V2 reads `id` + `setup(ctx)` (registers tools via
 *    `ctx.tool.transform`, tool/session hooks, and the system banner).
 *  - OpenCode V1 (>= 1.18.29) calls `server(input)` and consumes the returned
 *    hooks map (same behavior as the historical function export).
 *
 * `Plugin.define` is an identity helper (verified in @opencode/plugin 2.x
 * source), so the definition is written literally against its TYPE only —
 * a type-only import keeps the runtime dependency-free for V1 hosts.
 */
const v2Definition: V2PluginDefinition = {
  id: "maestra",
  async setup(ctx) {
    // Structural subset (spec D4): the real context is richer; we consume
    // only the members verified against @opencode/plugin 2.x.
    await setupV2(ctx as unknown as MaestraV2Context)
  },
}

const entry = {
  ...v2Definition,
  server: buildV1Hooks,
}

/** Backward-compatible named export (V1 function form). */
export const maestra = buildV1Hooks

export default entry
