import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { join } from "node:path"

/** evals/ root — all fixture/scenario paths resolve relative to this. */
export const EVALS_ROOT = fileURLToPath(new URL("..", import.meta.url))
/** package root (maestra/) — instructions live here. */
export const PACKAGE_ROOT = join(EVALS_ROOT, "..")

export async function loadJson(relativePath) {
  const full = join(EVALS_ROOT, relativePath)
  return JSON.parse(await readFile(full, "utf8"))
}

/** GitHub-state fixture: { id, descricao, status?, digests|digest, execRoutes? }. */
export async function loadGitHubFixture(relativePath) {
  const fixture = await loadJson(relativePath)
  if (!fixture.id) throw new Error(`fixture ${relativePath} sem campo "id"`)
  if (!fixture.digests && !fixture.digest && !fixture.status) {
    throw new Error(`fixture ${relativePath}: precisa de "digests", "digest" ou "status"`)
  }
  return fixture
}

/** Repo scaffold fixture: { id, files: { [path]: content } } — virtual fs. */
export async function loadRepoFixture(relativePath) {
  const fixture = await loadJson(relativePath)
  if (!fixture.files || typeof fixture.files !== "object") {
    throw new Error(`repo fixture ${relativePath}: precisa de "files" (objeto)`)
  }
  return fixture
}

/** Loads the kernel + requested journey modules as the system prompt. */
export async function buildSystemPrompt(modules = []) {
  const kernel = await readFile(join(PACKAGE_ROOT, "src/instructions/kernel/maestra-kernel.md"), "utf8")
  const parts = [kernel]
  for (const mod of modules) {
    const content = await readFile(join(PACKAGE_ROOT, "src/instructions", mod), "utf8")
    parts.push(`\n\n---\n\n${content}`)
  }
  return parts.join("")
}
