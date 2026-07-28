import { promises as fs } from "node:fs"
import { join } from "node:path"
import type { PlatformKind } from "./types.js"

/**
 * ADR-014: `.fluxo/config.md` — platform config versioned in the repo
 * (respects "no state outside the repository"). Created at first triage.
 */

export interface FluxoConfig {
  plataforma?: PlatformKind
  host?: string
  projeto?: string
  board?: string
}

const CONFIG_PATH = join(".fluxo", "config.md")
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
    if (key === "plataforma" && (value === "github" || value === "gitlab")) {
      config.plataforma = value
    } else if (key === "host" || key === "projeto" || key === "board") {
      config[key] = value
    }
  }
  return config
}

export async function writeFluxoConfig(directory: string, config: FluxoConfig): Promise<void> {
  const lines = [
    "# Configuração do Fluxo",
    "",
    "<!-- ADR-014: gerado na primeira triagem; edite à mão para sobrescrever a detecção. -->",
    "",
  ]
  if (config.plataforma) lines.push(`- plataforma: ${config.plataforma}`)
  if (config.host) lines.push(`- host: ${config.host}`)
  if (config.projeto) lines.push(`- projeto: ${config.projeto}`)
  if (config.board) lines.push(`- board: ${config.board}`)
  lines.push("")

  await fs.mkdir(join(directory, ".fluxo"), { recursive: true })
  await fs.writeFile(join(directory, CONFIG_PATH), lines.join("\n"), "utf-8")
}
