import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))

/** Version is ALWAYS read from package.json (never hardcoded). */
export function readVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(HERE, "..", "package.json"), "utf-8"))
    return typeof pkg.version === "string" ? pkg.version : "0.0.0-unknown"
  } catch {
    return "0.0.0-unknown"
  }
}

export const PLUGIN_VERSION = readVersion()
