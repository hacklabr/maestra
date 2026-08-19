import type { ExecFn } from "./exec.js"
import { detectForge, type FetchProbe } from "./detect.js"
import type { ConfigWriteResult } from "./config-store.js"
import { createGitHubAdapter } from "./github.js"
import { createGitLabAdapter } from "./gitlab.js"
import { getExec, getFetch } from "./runtime.js"
import type { ForgeAdapter, ForgeContext } from "./types.js"

export interface ResolvedForge {
  adapter: ForgeAdapter
  forge: ForgeContext
}

/**
 * Adapter factory (ADR-010): per-repo platform detection + adapter creation.
 * THE single I/O edge for platform access (T12 reconciliation — the duplicate
 * createAdapter in runtime.ts was removed; runtime.ts keeps only the test
 * seam, which this edge consumes by default).
 * Returns null when the platform cannot be determined (the tool surfaces a
 * clean error pointing to the __maestra_config__ branch / maestra_status).
 */
export async function resolveForge(
  directory: string,
  opts: { exec?: ExecFn; fetchFn?: FetchProbe; onWrite?: (result: ConfigWriteResult) => void } = {},
): Promise<ResolvedForge | null> {
  const exec = opts.exec ?? getExec()
  const forge = await detectForge(directory, { exec, fetchFn: opts.fetchFn ?? getFetch(), onWrite: opts.onWrite })
  if (!forge) return null
  const adapter = forge.kind === "github" ? createGitHubAdapter(forge, exec) : createGitLabAdapter(forge, exec)
  return { adapter, forge }
}
