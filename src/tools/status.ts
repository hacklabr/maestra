import { existsSync } from "node:fs"
import { join } from "node:path"
import { tool } from "../host-types.js"
import { resolveForge } from "../platform/adapter.js"
import { getExec, getFetch, getHostDetect, getMcpScan } from "../platform/runtime.js"
import { runCli, type ExecFn } from "../platform/exec.js"
import type { FetchProbe } from "../platform/detect.js"
import { PLUGIN_VERSION } from "../version.js"

/**
 * fluxo_status — deterministic environment probe (D1 contract, D-01, G-01).
 * Runs BEFORE any mutation promise ("nunca épico pela metade").
 * Reports capabilities; MCP is reported as "configured", never "available".
 */

type BoardAccess = "read-write" | "read" | "none" | "unknown"

interface CliProbe {
  present: boolean
  authenticated: boolean | null
  version: string | null
}

async function probeCli(exec: ExecFn, cli: "gh" | "glab", hostname?: string): Promise<CliProbe> {
  const versionResult = await exec(cli, ["--version"])
  if (versionResult.code !== 0) return { present: false, authenticated: null, version: null }

  const version = versionResult.stdout.split("\n")[0]?.trim() || null
  const authArgs = hostname ? ["auth", "status", "--hostname", hostname] : ["auth", "status"]
  const authResult = await exec(cli, authArgs)
  return { present: true, authenticated: authResult.code === 0, version }
}

async function probeReachability(fetchFn: FetchProbe | undefined, kind: "github" | "gitlab", host: string) {
  if (!fetchFn) return { url: null, status: null }
  const url =
    kind === "gitlab"
      ? `https://${host}/api/v4/version`
      : host === "github.com"
        ? "https://api.github.com/meta"
        : `https://${host}/api/v3/meta`
  try {
    const { status } = await fetchFn(url)
    // 401/403 still prove the instance is alive (needs auth)
    return { url, status }
  } catch {
    return { url, status: null }
  }
}

async function probeBoard(exec: ExecFn, forge: { kind: "github" | "gitlab"; host: string; project: string }): Promise<BoardAccess> {
  try {
    if (forge.kind === "github") {
      // Projects read probe; write scope is only knowable at first move (notes[])
      const owner = forge.project.split("/")[0]
      const hostArgs = forge.host === "github.com" ? [] : ["--hostname", forge.host]
      const result = await exec("gh", ["project", "list", "--owner", owner, ...hostArgs])
      return result.code === 0 ? "read" : "none"
    }
    const hostArgs = forge.host === "gitlab.com" ? [] : ["--hostname", forge.host]
    const stdout = await runCli(exec, "glab", [
      "api",
      ...hostArgs,
      `projects/${encodeURIComponent(forge.project)}`,
    ])
    const project = JSON.parse(stdout) as { permissions?: { project_access?: { access_level?: number } | null } }
    const level = project.permissions?.project_access?.access_level ?? 0
    // Reporter (20) can edit issues/labels ⇒ can move cards on label boards
    if (level >= 20) return "read-write"
    if (level >= 10) return "read"
    return "none"
  } catch {
    return "unknown"
  }
}

export const fluxoStatusTool = tool({
  description:
    "Environment probe for the Fluxo workflow: detected host (OpenCode/Mimo), issue platform + host (GitHub/GitLab/self-hosted), CLI presence and auth (gh/glab), API reachability, capability matrix {platform, cli, mcp, board, hierarchy}, board access, MCP configured (never 'available'), repo layout, plugin version. Run BEFORE any mutation (precondition of J1/J2).",
  args: {},
  async execute(_args, context) {
    const exec = getExec()
    const fetchFn = getFetch()
    const notes: string[] = []

    const host = getHostDetect()()
    const resolved = await resolveForge(context.directory)
    const forge = resolved?.forge ?? null
    if (!forge) {
      notes.push(
        "Plataforma de issues não detectada: pergunte UMA vez (GitHub ou GitLab? qual host?) e persista em .fluxo/config.md (ADR-010).",
      )
    }

    const cliForge = forge?.kind === "github" ? "gh" : forge?.kind === "gitlab" ? "glab" : null
    const [gh, glab] = await Promise.all([
      probeCli(exec, "gh", forge?.kind === "github" && forge.host !== "github.com" ? forge.host : undefined),
      probeCli(exec, "glab", forge?.kind === "gitlab" && forge.host !== "gitlab.com" ? forge.host : undefined),
    ])
    if (cliForge === "gh" && !gh.present) notes.push("`gh` ausente — fallback MCP ou comandos manuais para o humano.")
    if (cliForge === "gh" && gh.present && gh.authenticated === false)
      notes.push("`gh` presente mas NÃO autenticado (`gh auth login`).")
    if (cliForge === "glab" && !glab.present) notes.push("`glab` ausente — fallback MCP ou comandos manuais para o humano.")
    if (cliForge === "glab" && glab.present && glab.authenticated === false)
      notes.push("`glab` presente mas NÃO autenticado (`glab auth login`).")

    const [mcp, board, reachability] = await Promise.all([
      getMcpScan()(context.directory),
      forge ? probeBoard(exec, forge) : Promise.resolve<BoardAccess>("unknown"),
      forge ? probeReachability(fetchFn, forge.kind, forge.host) : Promise.resolve({ url: null, status: null }),
    ])
    if (forge?.kind === "github" && board === "read") {
      notes.push("Board (Projects): leitura ok; escopo de ESCRITA só é verificável na primeira movimentação — degradação P6 se falhar.")
    }
    if (reachability.status === null && reachability.url) {
      notes.push(`API da plataforma inalcançável (${reachability.url}) — verifique rede/VPN antes de criar qualquer coisa.`)
    }

    const cliOk = cliForge === "gh" ? gh.present && gh.authenticated === true : cliForge === "glab" ? glab.present && glab.authenticated === true : false

    const report = {
      pluginVersion: PLUGIN_VERSION,
      host: { id: host.id, evidence: host.evidence },
      plataforma: forge ? { kind: forge.kind, host: forge.host, projeto: forge.project } : null,
      cli: { gh, glab },
      reachability,
      mcp,
      board,
      capabilities: {
        platform: forge?.kind ?? null,
        cli: cliOk,
        mcp: forge ? mcp[forge.kind] === "configured" : false,
        board,
        hierarchy: forge ? (forge.kind === "github" ? "sub-issues" : "links+tasklist") : "none",
      },
      repo: {
        referenciaDocs: existsSync(join(context.directory, "docs", "referencia")),
        rodadas: existsSync(join(context.directory, "docs", "rodadas")),
        teamMd: existsSync(join(context.directory, ".fluxo", "team.md")),
        fluxoConfig: existsSync(join(context.directory, ".fluxo", "config.md")),
      },
      notes,
    }

    return { output: JSON.stringify(report, null, 2) }
  },
})
