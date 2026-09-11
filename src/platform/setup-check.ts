import { readConfigFile, writeConfigFiles } from "./config-store.js"

/**
 * Setup version tracking (issue #66): maestra_status records on the config
 * branch (`__maestra_config__`, ADR-003) the plugin version that last
 * verified the project setup. When the running version differs from the
 * stamped one, the steps introduced in between are reported as pending
 * re-setup — a project configured with an old version never stays silently
 * stale.
 *
 * The stamp is a single `- setup-verified: <version>` line inside config.md;
 * re-rendering preserves every other byte of the file (the file is
 * hand-editable by design — ADR-003 header comment).
 */

export interface SetupStep {
  id: string
  /** Human-readable, action-oriented description (goes into the alert note). */
  label: string
  /** First plugin version whose setup includes this step. */
  sinceVersion: string
}

/**
 * Registry of project-setup steps by birth version. When a release
 * introduces a NEW setup step, append it here with sinceVersion = that
 * release — projects stamped with an older version get the re-setup alert
 * on their next maestra_status run.
 */
export const SETUP_STEPS: readonly SetupStep[] = [
  {
    id: "config-branch",
    label: "config on the orphan branch __maestra_config__ (config.md + team.md; legacy .maestra/ → maestra-config migrate)",
    sinceVersion: "1.2.0",
  },
  {
    id: "workflow-config",
    label: "workflow.md on the config branch (post-PR acceptance mode + PR topology — ADR-004/ADR-006)",
    sinceVersion: "1.2.0",
  },
  {
    id: "agentic-organization",
    label: "agentic-organization stage of the setup route (J12 STAGE 5)",
    sinceVersion: "1.2.0",
  },
]

const STAMP_KEY = "setup-verified"
// Horizontal whitespace only (\s would swallow the trailing newline in replace()).
const STAMP_LINE = new RegExp(`^-[ \\t]*${STAMP_KEY}:[ \\t]*(\\S+)[ \\t]*$`, "m")

export interface SetupCheck {
  /** Version the project setup was last verified with (null: never verified). */
  verifiedWith: string | null
  /** Running plugin version, as probed. */
  current: string
  /** Steps born after verifiedWith — the pending re-setup. */
  pendingSteps: SetupStep[]
  /** True when this run wrote a new stamp to the config branch. */
  stamped: boolean
  /** True when verifiedWith > current (plugin downgraded; stamp kept). */
  downgraded: boolean
  /** Human-facing notes (drift alert, downgrade warning, persist degradation). */
  notes: string[]
}

export function parseSetupVerified(configContent: string): string | null {
  return configContent.match(STAMP_LINE)?.[1] ?? null
}

/** config.md with the stamp line replaced in place, or appended (rest untouched). */
export function renderStampedConfig(configContent: string, version: string): string {
  const line = `- ${STAMP_KEY}: ${version}`
  if (STAMP_LINE.test(configContent)) {
    return configContent.replace(STAMP_LINE, line)
  }
  const base = configContent.endsWith("\n") ? configContent : `${configContent}\n`
  return `${base}${line}\n`
}

function parseLoose(version: string): [number, number, number] | null {
  const match = version.trim().replace(/^v/, "").match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/)
  if (!match) return null
  return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)]
}

/**
 * Loose semver compare — `v` prefix, partial (`1.2`) and prerelease
 * (`1.2.0-rc.1`) forms tolerated; prerelease suffixes are ignored.
 * Null when either side is unparsable (caller decides the fallback).
 */
export function compareVersions(a: string, b: string): number | null {
  const pa = parseLoose(a)
  const pb = parseLoose(b)
  if (!pa || !pb) return null
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1
  }
  return 0
}

function isGreater(a: string, b: string): boolean {
  const cmp = compareVersions(a, b)
  return cmp !== null && cmp > 0
}

/**
 * Probe + (when needed) stamp. Never throws: persist problems degrade to a
 * note (P6 spirit).
 *
 * Adoption semantics: a config.md WITHOUT a stamp (every project predating
 * this feature) is stamped with the current version SILENTLY — drift
 * detection is effective from adoption onward; pre-adoption states keep
 * today's clean output.
 */
export async function verifySetupStamp(
  directory: string,
  currentVersion: string,
  steps: readonly SetupStep[] = SETUP_STEPS,
): Promise<SetupCheck> {
  const content = await readConfigFile(directory, "config.md")
  if (content === null) {
    // No config branch/file yet: the first-triage flow owns setup — nothing
    // to verify against (and nothing to stamp).
    return {
      verifiedWith: null,
      current: currentVersion,
      pendingSteps: [],
      stamped: false,
      downgraded: false,
      notes: [],
    }
  }

  const stamped = parseSetupVerified(content)
  const check: SetupCheck = {
    verifiedWith: stamped,
    current: currentVersion,
    pendingSteps: [],
    stamped: false,
    downgraded: false,
    notes: [],
  }

  // Same version, already verified — idempotent no-op (no commit per session).
  if (stamped === currentVersion) return check

  const comparable = stamped !== null && compareVersions(stamped, currentVersion) !== null

  if (comparable && isGreater(stamped, currentVersion)) {
    check.downgraded = true
    check.notes.push(
      `Plugin downgraded: setup was verified with ${stamped} but running ${currentVersion} — stamp kept; re-verify when you upgrade back.`,
    )
    return check
  }

  if (stamped !== null && comparable) {
    // Pending = born after the stamp AND already shipped in the running
    // version (a step born after `current` does not exist yet — not pending).
    check.pendingSteps = steps.filter(
      (step) => isGreater(step.sinceVersion, stamped) && !isGreater(step.sinceVersion, currentVersion),
    )
    check.notes.push(
      check.pendingSteps.length > 0
        ? `Setup drift: verified with ${stamped}, running ${currentVersion} — re-setup pending: ${check.pendingSteps.map((s) => s.label).join("; ")}.`
        : `Setup drift: verified with ${stamped}, running ${currentVersion} — no new setup steps in between; stamping ${currentVersion}.`,
    )
  }
  // stamped === null (or unparsable) → adoption path: stamp silently.

  try {
    const result = await writeConfigFiles(
      directory,
      { "config.md": renderStampedConfig(content, currentVersion) },
      `maestra: setup verified with ${currentVersion}`,
    )
    if (result.committed) {
      check.stamped = true
      check.verifiedWith = currentVersion
      if (!result.pushed && result.pushNote) {
        check.notes.push(
          `Setup stamp committed on ${result.branch} but push degraded (${result.pushNote.reason}): ${result.pushNote.detail}`,
        )
      }
    } else {
      check.notes.push(
        `Setup stamp persist FAILED on ${result.branch}: ${result.error ?? "unknown error"} — alert stands for this session.`,
      )
    }
  } catch (e: unknown) {
    check.notes.push(
      `Setup stamp persist FAILED: ${e instanceof Error ? e.message : String(e)} — alert stands for this session.`,
    )
  }

  return check
}
