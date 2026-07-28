import { promises as fs } from "node:fs"
import { join } from "node:path"
import type { PlatformKind } from "./types.js"

/**
 * ADR-014: `.maestra/config.md` — platform config versioned in the repo
 * (respects "no state outside the repository"). Created at first triage.
 */

export interface FluxoConfig {
  platform?: PlatformKind
  host?: string
  project?: string
  board?: string
}

const CONFIG_PATH = join(".maestra", "config.md")
const ENTRY = /^-?\s*(\w+):\s*(.+?)\s*$/gm

export async function readFluxoConfig(directory: string): Promise<FluxoConfig | null> {
  let content: string
  try {
    content = await fs.readFile(join(directory, CONFIG_PATH), "utf-8")
  } catch {
    return null
  }

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

export async function writeFluxoConfig(directory: string, config: FluxoConfig): Promise<void> {
  const lines = [
    "# Fluxo Configuration",
    "",
    "<!-- ADR-014: generated at first triage; edit by hand to override detection. -->",
    "",
  ]
  if (config.platform) lines.push(`- platform: ${config.platform}`)
  if (config.host) lines.push(`- host: ${config.host}`)
  if (config.project) lines.push(`- project: ${config.project}`)
  if (config.board) lines.push(`- board: ${config.board}`)
  lines.push("")

  await fs.mkdir(join(directory, ".maestra"), { recursive: true })
  await fs.writeFile(join(directory, CONFIG_PATH), lines.join("\n"), "utf-8")
}
