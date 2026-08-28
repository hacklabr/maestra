import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { homedir, tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  hostConfigDir,
  instructionRootCandidates,
  maestraReadInstructionsTool,
  readInstructionFile,
} from "../read-instructions.js"
import { setHostDetect } from "../../platform/runtime.js"
import type { HostDetection } from "../../host.js"

/**
 * Hermetic by construction: every test pins candidates explicitly (core) or
 * pins MAESTRA_INSTRUCTIONS_ROOT / a fake XDG_CONFIG_HOME (tool level), so
 * the developer's real ~/.config never participates.
 */

const ctx = (directory = ".") => ({ sessionID: "test", directory }) as never

const KERNEL = "# Kernel (stub)\n\nEntry gate line.\n"

let treeCount = 0
async function makeTree(prefix: string, kernelContent = KERNEL): Promise<string> {
  const root = mkdtempSync(join(tmpdir(), `${prefix}-${++treeCount}-`))
  await mkdir(join(root, "kernel"), { recursive: true })
  await writeFile(join(root, "kernel", "maestra-kernel.md"), kernelContent, "utf-8")
  await mkdir(join(root, "journeys"), { recursive: true })
  await writeFile(join(root, "journeys", "j1-triage.md"), "# J1\n", "utf-8")
  return root
}

/** Saves/clears the env keys this suite manipulates; restores afterwards. */
const ENV_KEYS = ["MAESTRA_INSTRUCTIONS_ROOT", "XDG_CONFIG_HOME"] as const
let savedEnv: Record<string, string | undefined> = {}

beforeEach(() => {
  savedEnv = {}
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key]
    delete process.env[key]
  }
})

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = savedEnv[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  setHostDetect(() => ({ id: "unknown", evidence: [] }))
})

describe("readInstructionFile (core)", () => {
  it("happy path: returns the file content VERBATIM (trailing newline included)", async () => {
    const root = await makeTree("read-instr-ok")
    const result = await readInstructionFile("kernel/maestra-kernel.md", [root])
    expect("error" in result && result.error).toBeFalsy()
    expect(!("error" in result) && result.content).toBe(KERNEL)
    expect(!("error" in result) && result.root).toBe(root)
  })

  it("normalizes '.' and empty segments (posix style)", async () => {
    const root = await makeTree("read-instr-norm")
    const result = await readInstructionFile("./kernel/./maestra-kernel.md", [root])
    expect(!("error" in result) && result.content).toBe(KERNEL)
  })

  it("rejects absolute paths (posix and windows-drive)", async () => {
    const root = await makeTree("read-instr-abs")
    for (const bad of ["/etc/passwd", "C:\\Windows\\system.ini"]) {
      const result = await readInstructionFile(bad, [root])
      expect("error" in result && result.error).toContain("RELATIVE")
    }
  })

  it("rejects backslash separators", async () => {
    const root = await makeTree("read-instr-win")
    const result = await readInstructionFile("kernel\\maestra-kernel.md", [root])
    expect("error" in result && result.error).toContain('posix "/" separators')
  })

  it("rejects '..' traversal segments (leading and mid-path)", async () => {
    const root = await makeTree("read-instr-trav")
    for (const bad of ["../outside.md", "kernel/../../outside.md"]) {
      const result = await readInstructionFile(bad, [root])
      expect("error" in result && result.error).toContain('".." segments are not allowed')
    }
  })

  it("rejects symlink escapes out of the root (fail closed)", async () => {
    const root = await makeTree("read-instr-symlink")
    const outsideDir = mkdtempSync(join(tmpdir(), "read-instr-outside-"))
    const outsideFile = join(outsideDir, "secret.md")
    writeFileSync(outsideFile, "SECRET", "utf-8")
    symlinkSync(outsideFile, join(root, "kernel", "escape.md"))

    const result = await readInstructionFile("kernel/escape.md", [root])
    expect("error" in result && result.error).toContain("outside the instructions root")
    expect("error" in result && result.error).toContain("symlink escape")
  })

  it("allows symlinks that stay INSIDE the root (containment holds)", async () => {
    const root = await makeTree("read-instr-inner-link")
    symlinkSync(join(root, "kernel", "maestra-kernel.md"), join(root, "kernel", "alias.md"))

    const result = await readInstructionFile("kernel/alias.md", [root])
    expect(!("error" in result) && result.content).toBe(KERNEL)
  })

  it("directory request → clear error (exactly ONE file by contract)", async () => {
    const root = await makeTree("read-instr-dir")
    const result = await readInstructionFile("kernel", [root])
    expect("error" in result && result.error).toContain("is a directory")
  })

  it("missing file → error names the requested relative path AND the searched root", async () => {
    const root = await makeTree("read-instr-missing")
    const result = await readInstructionFile("kernel/nope.md", [root])
    expect("error" in result && result.error).toContain('"kernel/nope.md"')
    expect("error" in result && result.error).toContain(root)
  })

  it("no existing root → deterministic error listing EVERY searched path", async () => {
    const missing = [join(tmpdir(), "read-instr-none-a"), join(tmpdir(), "read-instr-none-b")]
    const result = await readInstructionFile("kernel/maestra-kernel.md", missing)
    expect("error" in result && result.error).toContain("no instructions root found")
    for (const candidate of missing) {
      expect("error" in result && result.error).toContain(candidate)
    }
  })

  it("first EXISTING candidate wins — no silent fallthrough to the next root", async () => {
    const first = await makeTree("read-instr-first", "# FIRST\n")
    const second = await makeTree("read-instr-second", "# SECOND\n")

    // File present in both → served from the FIRST existing root.
    const both = await readInstructionFile("kernel/maestra-kernel.md", [first, second])
    expect(!("error" in both) && both.content).toBe("# FIRST\n")

    // File present ONLY in the second root → not-found inside the first
    // (root selection is by existence, not by file presence).
    await writeFile(join(second, "kernel", "only-here.md"), "# ONLY\n", "utf-8")
    const onlySecond = await readInstructionFile("kernel/only-here.md", [first, second])
    expect("error" in onlySecond && onlySecond.error).toContain('"kernel/only-here.md"')
    expect("error" in onlySecond && onlySecond.error).toContain(first)

    // Non-existing first candidate is skipped transparently.
    const skipped = await readInstructionFile("kernel/maestra-kernel.md", [join(first, "gone"), second])
    expect(!("error" in skipped) && skipped.content).toBe("# SECOND\n")
  })
})

describe("instructionRootCandidates (resolution order)", () => {
  const detect = (id: HostDetection["id"]): (() => HostDetection) => () => ({ id, evidence: [] })

  it("detected host first: mimocode → mimocode root, then opencode", () => {
    const candidates = instructionRootCandidates({ env: { XDG_CONFIG_HOME: "/xdg" }, hostDetect: detect("mimocode") })
    expect(candidates).toEqual([
      join("/xdg", "mimocode", "maestra", "instructions"),
      join("/xdg", "opencode", "maestra", "instructions"),
    ])
  })

  it("detected host first: opencode → opencode root, then mimocode", () => {
    const candidates = instructionRootCandidates({ env: { XDG_CONFIG_HOME: "/xdg" }, hostDetect: detect("opencode") })
    expect(candidates[0]).toBe(join("/xdg", "opencode", "maestra", "instructions"))
    expect(candidates[1]).toBe(join("/xdg", "mimocode", "maestra", "instructions"))
  })

  it("unknown detection → deterministic fallback order (opencode, then mimocode)", () => {
    const candidates = instructionRootCandidates({ env: { XDG_CONFIG_HOME: "/xdg" }, hostDetect: detect("unknown") })
    expect(candidates).toEqual([
      join("/xdg", "opencode", "maestra", "instructions"),
      join("/xdg", "mimocode", "maestra", "instructions"),
    ])
  })

  it("MAESTRA_INSTRUCTIONS_ROOT REPLACES the host candidates (pin seam)", () => {
    const candidates = instructionRootCandidates({
      env: { MAESTRA_INSTRUCTIONS_ROOT: "/pinned/root", XDG_CONFIG_HOME: "/xdg" },
      hostDetect: detect("opencode"),
    })
    expect(candidates).toEqual(["/pinned/root"])
  })

  it("hostConfigDir respects XDG_CONFIG_HOME and falls back to ~/.config", () => {
    expect(hostConfigDir("opencode", { XDG_CONFIG_HOME: "/custom-xdg" })).toBe(join("/custom-xdg", "opencode"))
    // empty XDG value → default base
    expect(hostConfigDir("opencode", { XDG_CONFIG_HOME: "" })).toBe(join(homedir(), ".config", "opencode"))
    expect(hostConfigDir("mimocode", {})).toBe(join(homedir(), ".config", "mimocode"))
  })
})

describe("maestra_read_instructions (tool, hermetic via env)", () => {
  it("happy path through the tool with MAESTRA_INSTRUCTIONS_ROOT pinned", async () => {
    const root = await makeTree("read-instr-tool-ok")
    process.env.MAESTRA_INSTRUCTIONS_ROOT = root

    const output = await maestraReadInstructionsTool.execute({ path: "kernel/maestra-kernel.md" }, ctx())
    expect(output).toBe(KERNEL)
  })

  it("traversal through the tool → deterministic error string", async () => {
    const root = await makeTree("read-instr-tool-trav")
    process.env.MAESTRA_INSTRUCTIONS_ROOT = root

    const output = await maestraReadInstructionsTool.execute({ path: "../escape.md" }, ctx())
    expect(output).toContain('".." segments are not allowed')
  })

  it("no root found through the tool → error lists the pinned path (fail closed)", async () => {
    process.env.MAESTRA_INSTRUCTIONS_ROOT = join(tmpdir(), "read-instr-tool-none")

    const output = await maestraReadInstructionsTool.execute({ path: "kernel/maestra-kernel.md" }, ctx())
    expect(output).toContain("no instructions root found")
    expect(output).toContain(process.env.MAESTRA_INSTRUCTIONS_ROOT)
  })

  it("end-to-end root order: fake XDG + detected mimocode → mimocode tree wins", async () => {
    const xdg = mkdtempSync(join(tmpdir(), "read-instr-xdg-"))
    for (const host of ["opencode", "mimocode"] as const) {
      const tree = join(xdg, host, "maestra", "instructions", "kernel")
      mkdirSync(tree, { recursive: true })
      writeFileSync(join(tree, "maestra-kernel.md"), `# ${host} kernel\n`, "utf-8")
    }
    process.env.XDG_CONFIG_HOME = xdg
    setHostDetect(() => ({ id: "mimocode", evidence: ["test stub"] }))

    const output = await maestraReadInstructionsTool.execute({ path: "kernel/maestra-kernel.md" }, ctx())
    expect(output).toBe("# mimocode kernel\n")
  })
})
