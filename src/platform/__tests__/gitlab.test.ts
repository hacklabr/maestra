import { describe, expect, it } from "vitest"
import { createGitLabAdapter } from "../gitlab.js"
import { ForgeError } from "../exec.js"
import type { ForgeContext } from "../types.js"
import { fail, json, makeExecStub } from "./helpers.js"

const FORGE: ForgeContext = { kind: "gitlab", host: "gitlab.com", project: "grupo/loja" }
const REF = { forge: FORGE, number: 42 }

const GL_ISSUE = {
  iid: 42,
  id: 196035106,
  title: "Implementar exportação de relatórios",
  description: "**Variante:** condensado · **Épico:** #7",
  state: "opened",
  labels: ["variante-condensado", "status::em-andamento"],
  assignees: [{ username: "maria" }],
  web_url: "https://gitlab.com/grupo/loja/-/issues/42",
  task_completion_status: { count: 5, completed_count: 2 },
}

describe("GitLab adapter", () => {
  it("getIssue maps iid, description and tasklist roll-up; project path is URL-encoded", async () => {
    const { exec, calls } = makeExecStub([[/issues\/42/, json(GL_ISSUE)]])
    const issue = await createGitLabAdapter(FORGE, exec).getIssue(REF)

    expect(issue).toMatchObject({
      number: 42,
      id: 196035106,
      body: "**Variante:** condensado · **Épico:** #7",
      state: "open",
      labels: ["variante-condensado", "status::em-andamento"],
      assignees: ["maria"],
      taskCompletion: { total: 5, completed: 2 },
    })
    expect(calls[0].args.join(" ")).toContain("projects/grupo%2Floja/issues/42")
    expect(calls[0].args).not.toContain("--hostname")
  })

  it("getIssue maps closed state and null tasklist", async () => {
    const closed = { ...GL_ISSUE, state: "closed", task_completion_status: null }
    const { exec } = makeExecStub([[/issues\/42/, json(closed)]])
    const issue = await createGitLabAdapter(FORGE, exec).getIssue(REF)
    expect(issue.state).toBe("closed")
    expect(issue.taskCompletion).toBeNull()
  })

  it("self-hosted passes --hostname", async () => {
    const selfHosted: ForgeContext = { kind: "gitlab", host: "gitlab.acme.com", project: "grupo/loja" }
    const { exec, calls } = makeExecStub([[/issues\/42/, json(GL_ISSUE)]])
    await createGitLabAdapter(selfHosted, exec).getIssue({ forge: selfHosted, number: 42 })
    expect(calls[0].args).toEqual([
      "api",
      "--hostname",
      "gitlab.acme.com",
      "projects/grupo%2Floja/issues/42",
    ])
  })

  it("listChildren reads relates_to links (no databaseId gotcha)", async () => {
    const child = { ...GL_ISSUE, iid: 43, state: "opened", labels: ["etapa-1"], assignees: [] }
    const { exec, calls } = makeExecStub([[/links/, json([child])]])
    const children = await createGitLabAdapter(FORGE, exec).listChildren(REF)

    expect(calls[0].args.join(" ")).toContain("issues/42/links?per_page=100")
    expect(children).toEqual([
      { number: 43, title: child.title, state: "open", labels: ["etapa-1"], assignees: [] },
    ])
  })

  it("listComments filters system notes", async () => {
    const notes = [
      { system: true, author: { username: "gitlab" }, body: "added ~etapa-1 label", created_at: "2026-07-28T09:00:00Z" },
      { system: false, author: { username: "rafael" }, body: "**Evento A** — triagem", created_at: "2026-07-28T10:00:00Z" },
    ]
    const { exec } = makeExecStub([[/notes/, json(notes)]])
    const comments = await createGitLabAdapter(FORGE, exec).listComments(REF)

    expect(comments).toEqual([
      { author: "rafael", body: "**Evento A** — triagem", createdAt: "2026-07-28T10:00:00Z" },
    ])
  })

  it("postComment POSTs a note with -f body", async () => {
    const { exec, calls } = makeExecStub([[/notes/, json({ id: 1 })]])
    await createGitLabAdapter(FORGE, exec).postComment(REF, "comentário de gate — facilitador")
    expect(calls[0].args).toEqual([
      "api",
      "projects/grupo%2Floja/issues/42/notes",
      "-X",
      "POST",
      "-f",
      "body=comentário de gate — facilitador",
    ])
  })

  it("getParent derives the epic from the P1 metadata line", async () => {
    const { exec } = makeExecStub([[/issues\/42/, json(GL_ISSUE)]])
    expect(await createGitLabAdapter(FORGE, exec).getParent(REF)).toBe(7)
  })

  it("getParent returns null without a P1 epic reference", async () => {
    const orphan = { ...GL_ISSUE, description: "issue avulsa, sem metadados" }
    const { exec } = makeExecStub([[/issues\/42/, json(orphan)]])
    expect(await createGitLabAdapter(FORGE, exec).getParent(REF)).toBeNull()
  })

  it("getBoardColumn reads the status::* label", async () => {
    const { exec } = makeExecStub([[/issues\/42/, json(GL_ISSUE)]])
    expect(await createGitLabAdapter(FORGE, exec).getBoardColumn(REF)).toBe("em-andamento")
  })

  it("getBoardColumn returns null without a status:: label", async () => {
    const noStatus = { ...GL_ISSUE, labels: ["variante-condensado"] }
    const { exec } = makeExecStub([[/issues\/42/, json(noStatus)]])
    expect(await createGitLabAdapter(FORGE, exec).getBoardColumn(REF)).toBeNull()
  })

  it("throws ForgeError with stderr context on CLI failure", async () => {
    const { exec } = makeExecStub([[/issues\/42/, fail("403 Forbidden")]])
    await expect(createGitLabAdapter(FORGE, exec).getIssue(REF)).rejects.toThrow(ForgeError)
  })

  it("listEpics queries every variante label and dedupes by iid", async () => {
    const { exec } = makeExecStub([
      [/labels=variante-completo/, json([])],
      [/labels=variante-condensado/, json([GL_ISSUE])],
      [/labels=variante-minimo/, json([GL_ISSUE])], // same iid in two label queries
      [/labels=variante-tecnica/, json([])],
    ])
    const epics = await createGitLabAdapter(FORGE, exec).listEpics()

    expect(epics).toHaveLength(1)
    expect(epics[0].number).toBe(42)
    expect(epics[0].labels).toContain("variante-condensado")
  })
})
