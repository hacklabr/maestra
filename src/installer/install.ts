#!/usr/bin/env node
import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync } from "node:fs"
import { homedir } from "node:os"
import { join, dirname, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { buildAgentMarkdown, type HostId } from "../agents/fluxo-agent.js"
import { buildSpecialistMarkdown } from "../agents/specialists.js"
import { loadCatalogFromDirectory, type Persona } from "../catalog/loader.js"
import { ROSTER, ROSTER_SUBDIR } from "../catalog/roster.js"

interface HostSpec {
  id: HostId
  configDir: string
  configFile: string
}

const HOSTS: Record<HostId, HostSpec> = {
  opencode: {
    id: "opencode",
    configDir: join(homedir(), ".config", "opencode"),
    configFile: "opencode.json",
  },
  mimocode: {
    id: "mimocode",
    configDir: join(homedir(), ".config", "mimocode"),
    configFile: "mimocode.json",
  },
}

const PKG_DIST = dirname(fileURLToPath(import.meta.url)) // <pkg>/dist/installer
const INSTRUCTIONS_SRC = join(PKG_DIST, "..", "instructions")
const CATALOG_SRC = join(PKG_DIST, "..", "catalog", "agency-agents")

/**
 * Roster validation (spec D5 / j9-mesa.md contract): every curated id MUST
 * exist in the vendored catalog — a wrong roster never reaches runtime.
 * Fails loudly naming every offender.
 */
export async function loadAndValidateRoster(catalogRoot: string): Promise<Map<string, Persona>> {
  const { personas } = await loadCatalogFromDirectory(catalogRoot)
  const byId = new Map(personas.map((p) => [p.id, p]))

  const missing = ROSTER.filter((entry) => !byId.has(entry.id)).map((entry) => entry.id)
  if (missing.length > 0) {
    console.error(`[fluxo] ROSTER INVÁLIDO — ids ausentes no catálogo vendored (${catalogRoot}):`)
    for (const id of missing) console.error(`[fluxo]   ✗ ${id}`)
    console.error("[fluxo] Corrija src/catalog/roster.ts ou atualize o submodule src/catalog/agency-agents.")
    process.exit(1)
  }
  return byId
}

function parseHostFlag(argv: string[]): HostId | "both" | null {
  const idx = argv.indexOf("--host")
  if (idx === -1) return null
  const value = argv[idx + 1]
  if (value === "opencode" || value === "mimocode" || value === "both") return value
  console.error(`Invalid --host value: "${value}". Use opencode | mimocode | both.`)
  process.exit(2)
}

function detectHosts(flag: HostId | "both" | null): HostSpec[] {
  if (flag === "both") return Object.values(HOSTS)
  if (flag) return [HOSTS[flag]]
  const detected = Object.values(HOSTS).filter((h) => existsSync(h.configDir))
  if (detected.length === 0) {
    console.error("No host config dir found (~/.config/opencode or ~/.config/mimocode).")
    console.error("Re-run with --host opencode | mimocode | both.")
    process.exit(2)
  }
  return detected
}

function installForHost(host: HostSpec, roster: Map<string, Persona>): void {
  const instructionsDir = join(host.configDir, "fluxo", "instructions")
  mkdirSync(instructionsDir, { recursive: true })
  cpSync(INSTRUCTIONS_SRC, instructionsDir, { recursive: true })

  // Greppable full catalog (two-tier model, D5): all personas available for
  // selection beyond the curated roster via grep/glob in the instructions dir
  const catalogDir = join(instructionsDir, "catalog")
  rmSync(catalogDir, { recursive: true, force: true })
  cpSync(CATALOG_SRC, catalogDir, {
    recursive: true,
    filter: (src) => !src.includes(`${"/"}.git`),
  })

  const agentsDir = join(host.configDir, "agents")
  mkdirSync(agentsDir, { recursive: true })
  const agentPath = join(agentsDir, "fluxo.md")
  writeFileSync(agentPath, buildAgentMarkdown(host.id, { instructionsDir }), "utf-8")

  // Curated specialist subagents: agents/fluxo/<id>.md → spawnable as "fluxo/<id>"
  // (subdirectory namespacing, Mesa pattern; NON-HIDDEN for Mimo's actor enum)
  const rosterDir = join(agentsDir, ROSTER_SUBDIR)
  rmSync(rosterDir, { recursive: true, force: true })
  mkdirSync(rosterDir, { recursive: true })
  for (const entry of ROSTER) {
    const persona = roster.get(entry.id)!
    writeFileSync(
      join(rosterDir, `${entry.id}.md`),
      buildSpecialistMarkdown(host.id, persona, entry),
      "utf-8",
    )
  }

  console.log(`[fluxo] ${host.id}: instructions → ${instructionsDir}`)
  console.log(`[fluxo] ${host.id}: catálogo    → ${catalogDir} (${roster.size === 0 ? 0 : "grepável"})`)
  console.log(`[fluxo] ${host.id}: agent        → ${agentPath}`)
  console.log(`[fluxo] ${host.id}: especialistas → ${rosterDir} (${ROSTER.length} personas, não-hidden)`)

  registerPlugin(host)
}

function registerPlugin(host: HostSpec): void {
  const pkgRoot = resolve(PKG_DIST, "..")
  // npm-installed package → registry spec; local dev checkout → absolute file URL
  const pluginSpec = pkgRoot.includes("node_modules")
    ? "fluxo-facilitador"
    : pathToFileURL(join(pkgRoot, "index.js")).href

  const configPath = join(host.configDir, host.configFile)
  let config: Record<string, unknown> = {}
  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, "utf-8")) as Record<string, unknown>
    } catch {
      console.warn(`[fluxo] ${host.id}: could not parse ${configPath} (JSONC?). Add manually:`)
      console.warn(`  "plugin": ["${pluginSpec}"]`)
      return
    }
  }

  const plugins = Array.isArray(config.plugin) ? [...(config.plugin as unknown[])] : []
  const alreadyRegistered = plugins.some((p) => {
    const spec = Array.isArray(p) ? p[0] : p
    return typeof spec === "string" && (spec === pluginSpec || spec.includes("fluxo-facilitador"))
  })
  if (!alreadyRegistered) plugins.push(pluginSpec)
  config.plugin = plugins

  mkdirSync(host.configDir, { recursive: true })
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8")
  console.log(`[fluxo] ${host.id}: plugin       → ${configPath} (${pluginSpec})`)
}

async function main(): Promise<void> {
  const hosts = detectHosts(parseHostFlag(process.argv.slice(2)))
  if (!existsSync(INSTRUCTIONS_SRC)) {
    console.error(`Instructions dir not found: ${INSTRUCTIONS_SRC} — run "npm run build" first.`)
    process.exit(1)
  }
  if (!existsSync(CATALOG_SRC)) {
    console.error(`Catalog dir not found: ${CATALOG_SRC} — run "git submodule update --init --recursive" and "npm run build".`)
    process.exit(1)
  }
  // Roster validation happens ONCE before any host is touched (fail loud early)
  const roster = await loadAndValidateRoster(CATALOG_SRC)
  for (const host of hosts) installForHost(host, roster)
  console.log("[fluxo] Done. Restart the host to load the plugin and the fluxo agent.")
}

await main()
