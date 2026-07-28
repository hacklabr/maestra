import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"

export type HostId = "opencode" | "mimocode" | "unknown"

export interface HostDetection {
  id: HostId
  evidence: string[]
}

export interface HostPaths {
  opencodeDir: string
  mimocodeDir: string
}

export function defaultHostPaths(): HostPaths {
  return {
    opencodeDir: join(homedir(), ".config", "opencode"),
    mimocodeDir: join(homedir(), ".config", "mimocode"),
  }
}

/**
 * Runtime host heuristic (flagged for dogfood validation since turn 1):
 * env MIMOCODE_HOME > single existing config dir > both (ambiguous) > none.
 * Evidence is always reported so the agent can state WHY it believes the host.
 */
export function detectHost(
  env: NodeJS.ProcessEnv = process.env,
  paths: HostPaths = defaultHostPaths(),
): HostDetection {
  const evidence: string[] = []
  const hasMimo = existsSync(paths.mimocodeDir) || Boolean(env.MIMOCODE_HOME)
  const hasOc = existsSync(paths.opencodeDir)

  if (env.MIMOCODE_HOME) evidence.push(`env MIMOCODE_HOME=${env.MIMOCODE_HOME}`)
  if (existsSync(paths.mimocodeDir)) evidence.push(`dir ${paths.mimocodeDir}`)
  if (existsSync(paths.opencodeDir)) evidence.push(`dir ${paths.opencodeDir}`)

  if (hasMimo && !hasOc) return { id: "mimocode", evidence }
  if (hasOc && !hasMimo) return { id: "opencode", evidence }
  if (hasOc && hasMimo) {
    if (env.MIMOCODE_HOME) return { id: "mimocode", evidence }
    evidence.push("both config dirs present, no disambiguating env")
    return { id: "unknown", evidence }
  }
  return { id: "unknown", evidence }
}

export type McpStatus = "configured" | "not-found"

export interface McpScan {
  github: McpStatus
  gitlab: McpStatus
}

/**
 * Reports "configured", NEVER "available" (W-02 contract amendment): we scan
 * config files for an MCP entry mentioning github/gitlab — we cannot verify
 * the server actually works.
 */
export async function scanMcpConfig(
  directory: string,
  paths: HostPaths = defaultHostPaths(),
): Promise<McpScan> {
  const candidates = [
    join(paths.opencodeDir, "opencode.json"),
    join(paths.mimocodeDir, "mimocode.json"),
    join(directory, "opencode.json"),
    join(directory, "mimocode.json"),
    join(directory, ".mcp.json"),
  ]

  let text = ""
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue
    try {
      text += "\n" + (await readFile(candidate, "utf-8"))
    } catch {
      // unreadable config file: skip (best-effort scan)
    }
  }

  const hasMcp = /"mcp"/i.test(text)
  return {
    github: hasMcp && /github/i.test(text) ? "configured" : "not-found",
    gitlab: hasMcp && /gitlab/i.test(text) ? "configured" : "not-found",
  }
}
