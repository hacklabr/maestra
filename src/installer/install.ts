#!/usr/bin/env node
import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync } from "node:fs"
import { homedir } from "node:os"
import { join, dirname, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { buildAgentMarkdown, type HostId } from "../agents/maestra-agent.js"
import { buildShellAgentMarkdown, SHELL_AGENT_FILENAME } from "../agents/specialists.js"

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

/** Subdirectory namespacing (Mesa pattern): agents/maestra/<id>.md → spawnable as "maestra/<id>". */
const AGENTS_SUBDIR = "maestra"

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

function installForHost(host: HostSpec): void {
  const instructionsDir = join(host.configDir, "maestra", "instructions")
  mkdirSync(instructionsDir, { recursive: true })
  cpSync(INSTRUCTIONS_SRC, instructionsDir, { recursive: true })

  // Greppable full catalog (search substrate, design A): all personas
  // available for selection via grep/glob in the instructions dir
  const catalogDir = join(instructionsDir, "catalog")
  rmSync(catalogDir, { recursive: true, force: true })
  cpSync(CATALOG_SRC, catalogDir, {
    recursive: true,
    filter: (src) => !src.includes(`${"/"}.git`),
  })

  const agentsDir = join(host.configDir, "agents")
  mkdirSync(agentsDir, { recursive: true })
  const agentPath = join(agentsDir, "maestra.md")
  writeFileSync(agentPath, buildAgentMarkdown(host.id, { instructionsDir }), "utf-8")

  // ONE shell specialist subagent (design A): agents/maestra/especialista.md →
  // spawnable as "maestra/especialista"; persona injected in the task/actor
  // prompt from the greppable catalog. Replaces the 12 curated agents.
  const subagentsDir = join(agentsDir, AGENTS_SUBDIR)
  rmSync(subagentsDir, { recursive: true, force: true })
  mkdirSync(subagentsDir, { recursive: true })
  const shellPath = join(subagentsDir, SHELL_AGENT_FILENAME)
  writeFileSync(shellPath, buildShellAgentMarkdown(host.id), "utf-8")

  console.log(`[maestra] ${host.id}: instructions → ${instructionsDir}`)
  console.log(`[maestra] ${host.id}: catalog      → ${catalogDir} (greppable)`)
  console.log(`[maestra] ${host.id}: agent        → ${agentPath}`)
  console.log(`[maestra] ${host.id}: shell        → ${shellPath} (persona on demand)`)

  registerPlugin(host)
}

function registerPlugin(host: HostSpec): void {
  const pkgRoot = resolve(PKG_DIST, "..")
  // npm-installed package → registry spec; local dev checkout → absolute file URL
  const pluginSpec = pkgRoot.includes("node_modules")
    ? "maestra"
    : pathToFileURL(join(pkgRoot, "index.js")).href

  const configPath = join(host.configDir, host.configFile)
  let config: Record<string, unknown> = {}
  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, "utf-8")) as Record<string, unknown>
    } catch {
      console.warn(`[maestra] ${host.id}: could not parse ${configPath} (JSONC?). Add manually:`)
      console.warn(`  "plugin": ["${pluginSpec}"]`)
      return
    }
  }

  const plugins = Array.isArray(config.plugin) ? [...(config.plugin as unknown[])] : []
  const alreadyRegistered = plugins.some((p) => {
    const spec = Array.isArray(p) ? p[0] : p
    return typeof spec === "string" && (spec === pluginSpec || spec.includes("maestra"))
  })
  if (!alreadyRegistered) plugins.push(pluginSpec)
  config.plugin = plugins

  mkdirSync(host.configDir, { recursive: true })
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8")
  console.log(`[maestra] ${host.id}: plugin       → ${configPath} (${pluginSpec})`)
}

function main(): void {
  const hosts = detectHosts(parseHostFlag(process.argv.slice(2)))
  if (!existsSync(INSTRUCTIONS_SRC)) {
    console.error(`Instructions dir not found: ${INSTRUCTIONS_SRC} — run "npm run build" first.`)
    process.exit(1)
  }
  if (!existsSync(CATALOG_SRC)) {
    console.error(`Catalog dir not found: ${CATALOG_SRC} — run "git submodule update --init --recursive" and "npm run build".`)
    process.exit(1)
  }
  for (const host of hosts) installForHost(host)
  console.log("[maestra] Done. Restart the host to load the plugin and the maestra agent.")
}

main()
