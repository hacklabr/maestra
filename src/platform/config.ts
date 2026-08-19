import type { PlatformKind } from "./types.js"
import { readConfigFile, writeConfigFiles, ORPHAN_BRANCH, type ConfigWriteResult } from "./config-store.js"

/**
 * ADR-003 (supersedes ADR-014): config.md lives at the ROOT of the orphan
 * branch `__maestra_config__` — same file, same parser (byte-compatible),
 * new address. Created at first triage; the host tree keeps no `.maestra/`.
 */

export interface FluxoConfig {
  platform?: PlatformKind
  host?: string
  project?: string
  board?: string
}

const CONFIG_FILE = "config.md"
const ENTRY = /^-?\s*(\w+):\s*(.+?)\s*$/gm

export async function readFluxoConfig(directory: string): Promise<FluxoConfig | null> {
  const content = await readConfigFile(directory, CONFIG_FILE)
  if (content === null) return null

  const config: FluxoConfig = {}
  for (const match of content.matchAll(ENTRY)) {
    const [, key, value] = match
    if (key === "platform" && (value === "github" || value === "gitlab")) {
      config.platform = value
    } else if (key === "host" || key === "project" || key === "board") {
      config[key] = value
    }
  }
  return config
}

export async function writeFluxoConfig(directory: string, config: FluxoConfig): Promise<ConfigWriteResult> {
  const lines = [
    "# Fluxo Configuration",
    "",
    "<!-- ADR-003: generated at first triage; edit by hand to override detection. Lives on the __maestra_config__ branch. -->",
    "",
  ]
  if (config.platform) lines.push(`- platform: ${config.platform}`)
  if (config.host) lines.push(`- host: ${config.host}`)
  if (config.project) lines.push(`- project: ${config.project}`)
  if (config.board) lines.push(`- board: ${config.board}`)
  lines.push("")

  try {
    return await writeConfigFiles(directory, { [CONFIG_FILE]: lines.join("\n") }, "maestra: update config.md")
  } catch (e: unknown) {
    // Bootstrap degradation (P6 spirit): a failed persist must never break
    // detection itself — surface the failure in the result, not as a throw.
    return {
      branch: ORPHAN_BRANCH,
      committed: false,
      sha: null,
      created: false,
      pushed: false,
      pushNote: null,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
