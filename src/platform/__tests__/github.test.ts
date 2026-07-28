import { describe, expect, it } from "vitest"
import { createGitHubAdapter } from "../github.js"
import { ForgeError } from "../exec.js"
import type { ForgeContext } from "../types.js"
import { fail, json, makeExecStub } from "./helpers.js"

const FORGE: ForgeContext = { kind: "github", host: "github.com", project: "acme/loja" }
const REF = { forge: FORGE, number: 42 }

const GH_ISSUE = {
  number: 42,
  id: 123456789,
  title: "Implement report export",
  body: "**Variant:** condensed",
  state: "open",
  labels: [{ name: "variant-condensed" }, { name: "stage-1" }],
  assignees: [{ login: "maria" }],
  html_url: "https://github.com/acme/loja/issues/42",
}

describe("GitHub adapter", () => {
  it("getIssue maps the REST payload to IssueFacts", async () => {
    const { exec, calls } = makeExecStub([[/gh api repos\/acme\/loja\/issues\/42$/, json(GH_ISSUE)]])
    const issue = await createGitHubAdapter(FORGE, exec).getIssue(REF)

    expect(issue).toMatchObject({
      number: 42,
      id: 123456789,
      title: "Implement report export",
      state: "open",
      labels: ["variant-condensed", "stage-1"],
      assignees: ["maria"],
      url: "https://github.com/acme/loja/issues/42",
      taskCompletion: null,
    })
    expect(calls[0].args).not.toContain("--hostname")
  })

  it("getIssue passes --hostname on GHES", async () => {
    const ghes: ForgeContext = { kind: "github", host: "github.acme.com", project: "acme/loja" }
    const { exec, calls } = makeExecStub([[/issues\/42/, json(GH_ISSUE)]])
    await createGitHubAdapter(ghes, exec).getIssue({ forge: ghes, number: 42 })
    expect(calls[0].args).toEqual(["api", "--hostname", "github.acme.com", "repos/acme/loja/issues/42"])
  })

  it("getIssue throws ForgeError with stderr context on CLI failure", async () => {
    const { exec } = makeExecStub([[/issues\/42/, fail("gh: Not Found (HTTP 404)")]])
    await expect(createGitHubAdapter(FORGE, exec).getIssue(REF)).rejects.toThrow(ForgeError)
  })

  it("listChildren reads the sub_issues endpoint", async () => {
    const child = { ...GH_ISSUE, number: 43, id: 987, state: "closed", labels: [], assignees: [] }
    const { exec, calls } = makeExecStub([[/sub_issues/, json([child])]])
    const children = await createGitHubAdapter(FORGE, exec).listChildren(REF)

    expect(calls[0].args.join(" ")).toContain("repos/acme/loja/issues/42/sub_issues?per_page=100")
    expect(children).toEqual([{ number: 43, title: child.title, state: "closed", labels: [], assignees: [] }])
  })

  it("listComments maps user.login and timestamps", async () => {
    const comments = [
      { user: { login: "rafael" }, body: "**Event A** — triage", created_at: "2026-07-28T10:00:00Z" },
    ]
    const { exec, calls } = makeExecStub([[/comments/, json(comments)]])
    const result = await createGitHubAdapter(FORGE, exec).listComments(REF)

    expect(calls[0].args.join(" ")).toContain("issues/42/comments?per_page=100")
    expect(result).toEqual([{ author: "rafael", body: "**Event A** — triage", createdAt: "2026-07-28T10:00:00Z" }])
  })

  it("postComment POSTs via gh api (GHES-compatible)", async () => {
    const { exec, calls } = makeExecStub([[/comments/, json({ id: 1 })]])
    await createGitHubAdapter(FORGE, exec).postComment(REF, "gate comment — facilitator")
    expect(calls[0].args).toEqual([
      "api",
      "repos/acme/loja/issues/42/comments",
      "-f",
      "body=gate comment — facilitator",
    ])
  })

  it("getParent returns the parent number from the /parent endpoint", async () => {
    const { exec } = makeExecStub([[/issues\/42\/parent/, json({ number: 7 })]])
    expect(await createGitHubAdapter(FORGE, exec).getParent(REF)).toBe(7)
  })

  it("getParent returns null on 404 (no parent)", async () => {
    const { exec } = makeExecStub([[/issues\/42\/parent/, fail("gh: Not Found (HTTP 404)")]])
    expect(await createGitHubAdapter(FORGE, exec).getParent(REF)).toBeNull()
  })

  it("getParent throws on non-404 failures", async () => {
    const { exec } = makeExecStub([[/issues\/42\/parent/, fail("gh: authentication failed", 401)]])
    await expect(createGitHubAdapter(FORGE, exec).getParent(REF)).rejects.toThrow(ForgeError)
  })

  it("getBoardColumn reads the Status single-select via GraphQL", async () => {
    const response = {
      data: {
        repository: {
          issue: {
            projectItems: {
              nodes: [
                {
                  fieldValues: {
                    nodes: [
                      { name: "high", field: { name: "Priority" } },
                      { name: "In progress", field: { name: "Status" } },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    }
    const { exec, calls } = makeExecStub([[/graphql/, json(response)]])
    const column = await createGitHubAdapter(FORGE, exec).getBoardColumn(REF)

    expect(column).toBe("In progress")
    const line = calls[0].args.join(" ")
    expect(line).toContain("-F owner=acme")
    expect(line).toContain("-F repo=loja")
    expect(line).toContain("-F n=42")
  })

  it("getBoardColumn returns null without a Status field or project items", async () => {
    const empty = { data: { repository: { issue: { projectItems: { nodes: [] } } } } }
    const { exec } = makeExecStub([[/graphql/, json(empty)]])
    expect(await createGitHubAdapter(FORGE, exec).getBoardColumn(REF)).toBeNull()
  })

  it("listEpics queries every variant label, dedupes and filters out pull requests", async () => {
    const epic = { ...GH_ISSUE, labels: [{ name: "variant-condensed" }] }
    const pr = { ...GH_ISSUE, number: 99, pull_request: { url: "https://api.github.com/..." } }
    const { exec } = makeExecStub([
      [/labels=variant-full/, json([])],
      [/labels=variant-condensed/, json([epic, pr])],
      [/labels=variant-minimal/, json([epic])], // duplicate of the condensed hit
      [/labels=variant-technical/, json([])],
    ])
    const epics = await createGitHubAdapter(FORGE, exec).listEpics()

    expect(epics).toHaveLength(1)
    expect(epics[0].number).toBe(42)
  })
})
