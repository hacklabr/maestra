import { defaultExec, type ExecFn } from "./exec.js"
import type { FetchProbe } from "./detect.js"
import { detectHost, scanMcpConfig, type HostDetection, type McpScan } from "../host.js"

/**
 * Test seam (module-level injection): exec/fetch/host-detection/mcp-scan.
 * The single I/O edge for platform access is src/platform/adapter.ts
 * (resolveForge) — it consumes THIS seam by default, so tools stay
 * signature-compatible with the host API while tests inject stubs
 * (same pattern Mesa uses for the SDK client).
 */

let execFn: ExecFn = defaultExec
let fetchFn: FetchProbe | undefined
let hostDetectFn: () => HostDetection = () => detectHost()
let mcpScanFn: (directory: string) => Promise<McpScan> = (directory) => scanMcpConfig(directory)

export function getExec(): ExecFn {
  return execFn
}

export function setExec(fn: ExecFn): void {
  execFn = fn
}

export function getFetch(): FetchProbe | undefined {
  return fetchFn
}

export function setFetch(fn: FetchProbe | undefined): void {
  fetchFn = fn
}

export function getHostDetect(): () => HostDetection {
  return hostDetectFn
}

export function setHostDetect(fn: () => HostDetection): void {
  hostDetectFn = fn
}

export function getMcpScan(): (directory: string) => Promise<McpScan> {
  return mcpScanFn
}

export function setMcpScan(fn: (directory: string) => Promise<McpScan>): void {
  mcpScanFn = fn
}
