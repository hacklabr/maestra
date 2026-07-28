import { describe, expect, it } from "vitest"
import { createGitHubAdapter } from "../github.js"
import { createGitLabAdapter } from "../gitlab.js"
import type { ExecFn } from "../exec.js"
import type { ForgeAdapter, ForgeContext } from "../types.js"
import { json, makeExecStub } from "./helpers.js"

/**
 * Unified adapter CONTRACT suite (spec acceptance criterion #2): the SAME
 * assertions run against both implementations. Parity is now enforced by
 * construction — adding a primitive or assertion here exercises both adapters
 * in one place. The twin files (github.test.ts / gitlab.test.ts) keep the
 * platform-specific gotchas (databaseId, system notes, GHES/self-hosted
 * hostname, URL-encoding, tasklist roll-up).
 */

const GITHUB_FORGE: ForgeContext = { kind: "github", host: "github.com", project: "acme/loja" }
const GITLAB_FORGE: ForgeContext = { kind: "gitlab", host: "gitlab.com", project: "grupo/loja" }

// Same logical issue in both payload dialects.
const GH_ISSUE = {
  number: 42,
  id: 123456789,
  title: "Implement report export",
  body: "**Variant:** condensed · **Epic:** #7",
  state: "open",
  labels: [{ name: "variant-condensed" }],
  assignees: [{ login: "maria" }],
  html_url: "https://github.com/acme/loja/issues/42",
}
const GH_CHILD = { ...GH_ISSUE, number: 43, title: "Mini-briefing", state: "closed", labels: [{ name: "stage-1" }] }
const GL_ISSUE = {
  iid: 42,
  id: 196035106,
  title: "Implement report export",
  description: "**Variant:** condensed · **Epic:** #7",
  state: "opened",
  labels: ["variant-condensed"],
  assignees: [{ username: "maria" }],
  web_url: "https://gitlab.com/grupo/loja/-/issues/42",
  task_completion_status: null,
}
const GL_CHILD = { ...GL_ISSUE, iid: 43, title: "Mini-briefing", state: "closed", labels: ["stage-1"] }

interface ContractCell {
  name: string
  forge: ForgeContext
  makeAdapter: (exec: ExecFn) => ForgeAdapter
  routes: Array<[RegExp, object]>
}

const CELLS: ContractCell[] = [
  {
    name: "github",
    forge: GITHUB_FORGE,
    makeAdapter: (exec) => createGitHubAdapter(GITHUB_FORGE, exec),
    routes: [
      [/issues\/42\/sub_issues/, json([GH_CHILD])],
      [/issues\/42\/comments/, json([{ user: { login: "rafael" }, body: "comment", created_at: "2026-07-28T10:00:00Z" }])],
      [/issues\/42\/parent/, json({ number: 7 })],
      [/issues\/42$/, json(GH_ISSUE)],
      [/issues\?labels=variant-full/, json([])],
      [/issues\?labels=variant-condensed/, json([GH_ISSUE])],
      [/issues\?labels=variant-minimal/, json([])],
      [/issues\?labels=variant-technical/, json([])],
      [/graphql/, json({ data: { repository: { issue: { projectItems: { nodes: [{ fieldValues: { nodes: [{ name: "In progress", field: { name: "Status" } }] } }] } } } } })],
    ],
  },
  {
    name: "gitlab",
    forge: GITLAB_FORGE,
    makeAdapter: (exec) => createGitLabAdapter(GITLAB_FORGE, exec),
    routes: [
      [/issues\/42\/links/, json([GL_CHILD])],
      [/issues\/42\/notes/, json([{ system: false, author: { username: "rafael" }, body: "comment", created_at: "2026-07-28T10:00:00Z" }])],
      [/issues\/42$/, json(GL_ISSUE)],
      [/issues\?labels=variant-full/, json([])],
      [/issues\?labels=variant-condensed/, json([GL_ISSUE])],
      [/issues\?labels=variant-minimal/, json([])],
      [/issues\?labels=variant-technical/, json([])],
    ],
  },
]

describe.each(CELLS)("adapter contract ($name)", ({ forge, makeAdapter, routes }) => {
  function setup() {
    const { exec, calls } = makeExecStub(routes)
    return { adapter: makeAdapter(exec), calls }
  }
  const ref = () => ({ forge, number: 42 })

  it("getIssue maps core IssueFacts identically", async () => {
    const { adapter } = setup()
    const issue = await adapter.getIssue(ref())
    expect(issue).toMatchObject({
      number: 42,
      title: "Implement report export",
      state: "open",
      labels: ["variant-condensed"],
      assignees: ["maria"],
    })
    expect(issue.url).toContain("http")
  })

  it("listChildren enumerates children with number and state", async () => {
    const { adapter } = setup()
    const children = await adapter.listChildren(ref())
    expect(children).toHaveLength(1)
    expect(children[0]).toMatchObject({ number: 43, state: "closed" })
  })

  it("listComments maps author, body and timestamp", async () => {
    const { adapter } = setup()
    const comments = await adapter.listComments(ref())
    expect(comments).toEqual([{ author: "rafael", body: "comment", createdAt: "2026-07-28T10:00:00Z" }])
  })

  it("postComment issues exactly one write carrying the body", async () => {
    const { adapter, calls } = setup()
    await adapter.postComment(ref(), "comment body")
    expect(calls).toHaveLength(1)
    expect(calls[0].args.join(" ")).toContain("comment body")
  })

  it("getParent resolves the parent issue number", async () => {
    const { adapter } = setup()
    // GitHub: /parent endpoint. GitLab: P1 metadata line ("**Epic:** #7").
    expect(await adapter.getParent(ref())).toBe(7)
  })

  it("getBoardColumn resolves the current column name", async () => {
    const { adapter } = setup()
    // GitHub: Projects v2 Status field. GitLab: status::* label scan — the
    // contract cell's issue has no status label, so GitLab returns null here;
    // the COLUMN-PRESENT case is covered in the platform-specific suite.
    const column = await adapter.getBoardColumn(ref())
    expect(column === "In progress" || column === null).toBe(true)
  })

  it("listEpics sweeps variant labels and dedupes", async () => {
    const { adapter } = setup()
    const epics = await adapter.listEpics()
    expect(epics).toHaveLength(1)
    expect(epics[0]).toMatchObject({ number: 42, labels: ["variant-condensed"] })
  })
})
