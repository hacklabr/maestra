import { describe, expect, it } from "vitest"
import {
  SETUP_STEPS,
  compareVersions,
  parseSetupVerified,
  renderStampedConfig,
  verifySetupStamp,
  type SetupStep,
} from "../setup-check.js"
import { readConfigFile } from "../config-store.js"
import { addRemote, git, initBareRemote, initRepo, initRepoWithOrphanConfig } from "./git-repo.js"

const CONFIG = "# Fluxo Configuration\n\n- platform: github\n- host: github.com\n- project: acme/loja\n"

/** Two-step registry: one pre-existing (1.2.0), one born later (2.0.0). */
const STEPS: readonly SetupStep[] = [
  { id: "config-branch", label: "config branch step", sinceVersion: "1.2.0" },
  { id: "future-step", label: "future step (J99)", sinceVersion: "2.0.0" },
]

describe("compareVersions (loose semver)", () => {
  it("compares major/minor/patch numerically", () => {
    expect(compareVersions("1.2.0", "1.2.0")).toBe(0)
    expect(compareVersions("1.2.0", "1.10.0")).toBeLessThan(0)
    expect(compareVersions("2.0.0", "1.99.99")).toBeGreaterThan(0)
    expect(compareVersions("1.2", "1.2.0")).toBe(0)
  })

  it("tolerates v-prefix and prerelease suffixes", () => {
    expect(compareVersions("v1.4.0", "1.4.0")).toBe(0)
    expect(compareVersions("1.4.0-rc.1", "1.4.0")).toBe(0)
    expect(compareVersions("v2.0.0-rc.1", "1.4.0")).toBeGreaterThan(0)
  })

  it("returns null for unparsable input", () => {
    expect(compareVersions("banana", "1.0.0")).toBeNull()
    expect(compareVersions("1.0.0", "")).toBeNull()
  })
})

describe("parseSetupVerified", () => {
  it("reads the stamp line among other entries", () => {
    expect(parseSetupVerified(`${CONFIG}- setup-verified: 1.2.0\n`)).toBe("1.2.0")
  })

  it("null when the stamp is absent", () => {
    expect(parseSetupVerified(CONFIG)).toBeNull()
  })

  it("ignores non-list occurrences of the key", () => {
    expect(parseSetupVerified("# setup-verified: 9.9.9 (comment)\n" + CONFIG)).toBeNull()
  })
})

describe("renderStampedConfig", () => {
  it("appends the stamp, fixing a missing trailing newline, rest untouched", () => {
    const out = renderStampedConfig(CONFIG.replace(/\n$/, ""), "1.4.0")
    expect(out.startsWith(CONFIG)).toBe(true)
    expect(out.endsWith("\n- setup-verified: 1.4.0\n")).toBe(true)
  })

  it("replaces only the stamp line", () => {
    const stamped = `${CONFIG}- setup-verified: 1.2.0\n`
    const out = renderStampedConfig(stamped, "1.5.0")
    expect(out).toBe(`${CONFIG}- setup-verified: 1.5.0\n`)
  })
})

describe("SETUP_STEPS registry", () => {
  it("every step has id, label and a parsable sinceVersion", () => {
    for (const step of SETUP_STEPS) {
      expect(step.id).toMatch(/^[a-z-]+$/)
      expect(step.label.length).toBeGreaterThan(10)
      expect(compareVersions(step.sinceVersion, "0.0.0")).toBeGreaterThan(0)
    }
  })
})

describe("verifySetupStamp (real repo)", () => {
  it("no config.md → no-op: first-triage flow owns the setup", async () => {
    const dir = await initRepo("maestra-setup-none-")
    const check = await verifySetupStamp(dir, "2.0.0", STEPS)
    expect(check).toEqual({
      verifiedWith: null,
      current: "2.0.0",
      pendingSteps: [],
      stamped: false,
      downgraded: false,
      notes: [],
    })
  })

  it("adoption: stamps current silently; rerun on same version is a no-op (no new commit)", async () => {
    const dir = await initRepoWithOrphanConfig({ "config.md": CONFIG }, "maestra-setup-adopt-")
    const bare = await initBareRemote("maestra-setup-remote-")
    await addRemote(dir, bare)

    const first = await verifySetupStamp(dir, "1.4.0", STEPS)
    expect(first.stamped).toBe(true)
    expect(first.notes).toEqual([])
    expect(parseSetupVerified((await readConfigFile(dir, "config.md")) ?? "")).toBe("1.4.0")

    const afterFirst = (await git(dir, ["rev-list", "--count", "__maestra_config__"])).trim()
    const second = await verifySetupStamp(dir, "1.4.0", STEPS)
    expect(second.stamped).toBe(false)
    const afterSecond = (await git(dir, ["rev-list", "--count", "__maestra_config__"])).trim()
    expect(afterSecond).toBe(afterFirst)
  })

  it("drift: names the steps born after the stamp, then stamps current", async () => {
    const dir = await initRepoWithOrphanConfig(
      { "config.md": `${CONFIG}- setup-verified: 1.2.0\n` },
      "maestra-setup-drift-",
    )
    const check = await verifySetupStamp(dir, "2.0.0", STEPS)
    expect(check.pendingSteps.map((s) => s.id)).toEqual(["future-step"])
    expect(check.notes.join(" ")).toContain("re-setup pending")
    expect(check.notes.join(" ")).toContain("future step (J99)")
    expect(check.stamped).toBe(true)
    expect(check.verifiedWith).toBe("2.0.0")
    expect(parseSetupVerified((await readConfigFile(dir, "config.md")) ?? "")).toBe("2.0.0")
  })

  it("drift with no steps in between: informative note, still stamps", async () => {
    const dir = await initRepoWithOrphanConfig(
      { "config.md": `${CONFIG}- setup-verified: 1.3.0\n` },
      "maestra-setup-drift-empty-",
    )
    const check = await verifySetupStamp(dir, "1.4.0", STEPS)
    expect(check.pendingSteps).toEqual([])
    expect(check.notes.join(" ")).toContain("no new setup steps")
    expect(check.stamped).toBe(true)
  })

  it("downgrade: warns, keeps the stamp, writes nothing", async () => {
    const dir = await initRepoWithOrphanConfig(
      { "config.md": `${CONFIG}- setup-verified: 2.0.0\n` },
      "maestra-setup-downgrade-",
    )
    const check = await verifySetupStamp(dir, "1.4.0", STEPS)
    expect(check.downgraded).toBe(true)
    expect(check.stamped).toBe(false)
    expect(check.notes.join(" ")).toContain("downgraded")
    expect(parseSetupVerified((await readConfigFile(dir, "config.md")) ?? "")).toBe("2.0.0")
  })

  it("unparsable stamp → silent adoption (re-stamp current)", async () => {
    const dir = await initRepoWithOrphanConfig(
      { "config.md": `${CONFIG}- setup-verified: banana\n` },
      "maestra-setup-junk-",
    )
    const check = await verifySetupStamp(dir, "1.4.0", STEPS)
    expect(check.stamped).toBe(true)
    expect(check.notes.join(" ")).not.toContain("re-setup")
    expect(parseSetupVerified((await readConfigFile(dir, "config.md")) ?? "")).toBe("1.4.0")
  })
})
