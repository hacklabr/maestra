import { defaultExec, type ExecFn } from "./exec.js"
import { readFluxoConfig, writeFluxoConfig } from "./config.js"
import type { ForgeContext, PlatformKind } from "./types.js"

export type FetchProbe = (url: string) => Promise<{ status: number }>

export interface DetectOptions {
  exec?: ExecFn
  fetchFn?: FetchProbe
  /** Persist successful detections to .maestra/config.md (default: true). */
  persist?: boolean
}

const defaultFetch: FetchProbe = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
  return { status: response.status }
}

export function parseRemoteHost(remoteUrl: string): string | null {
  // git@host:group/repo.git
  const scp = /^git@([^:]+):/.exec(remoteUrl)
  if (scp) return scp[1]
  // ssh://git@host/group/repo.git | https://host/group/repo.git
  try {
    return new URL(remoteUrl).hostname || null
  } catch {
    return null
  }
}

export function parseRemoteProject(remoteUrl: string): string | null {
  const scp = /^git@[^:]+:(.+)$/.exec(remoteUrl)
  const path = scp ? scp[1] : urlPath(remoteUrl)
  if (!path) return null
  const clean = path.replace(/\.git$/, "").replace(/\/+$/, "")
  return clean.includes("/") ? clean : null
}

function urlPath(remoteUrl: string): string | null {
  try {
    return new URL(remoteUrl).pathname.replace(/^\//, "")
  } catch {
    return null
  }
}

/** Kept for backward compatibility with T1 scaffold consumers. */
export function parseRemotePlatform(remoteUrl: string): Pick<ForgeContext, "kind" | "host"> | null {
  const host = parseRemoteHost(remoteUrl)
  if (!host) return null
  if (host === "github.com") return { kind: "github", host }
  if (host === "gitlab.com") return { kind: "gitlab", host }
  return null
}

async function gitRemoteUrl(exec: ExecFn, directory: string): Promise<string | null> {
  const result = await exec("git", ["-C", directory, "remote", "get-url", "origin"])
  if (result.code !== 0) return null
  const url = result.stdout.trim()
  return url.length > 0 ? url : null
}

async function tryStatus(fetchFn: FetchProbe, url: string): Promise<number | null> {
  try {
    return (await fetchFn(url)).status
  } catch {
    return null
  }
}

/**
 * Single probe for unknown hosts: GitLab (`/api/v4/metadata`) × GHES
 * (`/api/v3/meta`). 200/401/403 all prove the platform (401/403 = alive but
 * needs auth; verified: gitlab.com/api/v4/version returns 401, not 404).
 */
export async function probeHost(fetchFn: FetchProbe, host: string): Promise<PlatformKind | null> {
  const gitlab = await tryStatus(fetchFn, `https://${host}/api/v4/metadata`)
  if (gitlab !== null && [200, 401, 403].includes(gitlab)) return "gitlab"
  const github = await tryStatus(fetchFn, `https://${host}/api/v3/meta`)
  if (github !== null && [200, 401, 403].includes(github)) return "github"
  return null
}

/**
 * ADR-010 detection hierarchy (first win):
 *  1. explicit `.maestra/config.md`
 *  2. `git remote get-url origin` (github.com × gitlab.com)
 *  3. unknown host → single probe, persisted
 *  4. ambiguous → null (the agent asks the human ONCE, then persists)
 */
export async function detectForge(directory: string, opts: DetectOptions = {}): Promise<ForgeContext | null> {
  const exec = opts.exec ?? defaultExec
  const fetchFn = opts.fetchFn ?? defaultFetch
  const persist = opts.persist ?? true

  const config = await readFluxoConfig(directory)
  if (config?.platform && config.host && config.project) {
    return { kind: config.platform, host: config.host, project: config.project }
  }

  const remote = await gitRemoteUrl(exec, directory)
  if (!remote) return null

  const host = parseRemoteHost(remote)
  const project = parseRemoteProject(remote)
  if (!host || !project) return null

  const known: PlatformKind | null =
    host === "github.com" ? "github" : host === "gitlab.com" ? "gitlab" : null
  const kind = known ?? (await probeHost(fetchFn, host))
  if (!kind) return null

  const forge: ForgeContext = { kind, host, project }
  if (persist) {
    await writeFluxoConfig(directory, { platform: kind, host, project })
  }
  return forge
}
