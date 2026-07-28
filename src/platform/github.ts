import { runCli, defaultExec, ForgeError, type ExecFn } from "./exec.js"
import { VARIANTE_LABELS, type ChildIssue, type CommentFacts, type ForgeAdapter, type ForgeContext, type IssueFacts, type IssueRef } from "./types.js"

/**
 * GitHub adapter via `gh` CLI (gh api for reads — full field control without
 * jq incantations; payload shaping happens here in TypeScript).
 *
 * Gotchas honored:
 *  - sub-issues REST: children are referenced by databaseId on POST, but reads
 *    return the human `number` (Turn-1 finding). Reads are fine; the digest
 *    (T3) resolves ids only when writing.
 *  - Projects v2: column = the single-select field named "Status".
 *  - GHES: `--hostname` passed when host ≠ github.com.
 */

interface GhIssue {
  number: number
  id: number
  title: string
  body: string | null
  state: string
  labels: Array<{ name: string }>
  assignees: Array<{ login: string }>
  html_url: string
  /** Present when the /issues entry is actually a pull request — filtered out. */
  pull_request?: unknown
}

interface GhComment {
  user: { login: string } | null
  body: string
  created_at: string
}

function toIssueFacts(raw: GhIssue): IssueFacts {
  return {
    number: raw.number,
    id: raw.id,
    title: raw.title,
    body: raw.body ?? "",
    state: raw.state === "open" ? "open" : "closed",
    labels: raw.labels.map((l) => l.name),
    assignees: raw.assignees.map((a) => a.login),
    url: raw.html_url,
    taskCompletion: null,
  }
}

function toChildIssue(raw: GhIssue): ChildIssue {
  return {
    number: raw.number,
    title: raw.title,
    state: raw.state === "open" ? "open" : "closed",
    labels: raw.labels.map((l) => l.name),
    assignees: raw.assignees.map((a) => a.login),
  }
}

export function createGitHubAdapter(forge: ForgeContext, exec: ExecFn = defaultExec): ForgeAdapter {
  const repoPath = `repos/${forge.project}`
  const hostArgs = forge.host === "github.com" ? [] : ["--hostname", forge.host]

  const api = (path: string) => runCli(exec, "gh", ["api", ...hostArgs, path])

  return {
    kind: "github",

    async listEpics(): Promise<IssueFacts[]> {
      // labels filter is AND within one call — one query per variante label, deduped.
      // NOTE: single page per label (per_page=100) — truncation noted in report output.
      const byNumber = new Map<number, IssueFacts>()
      for (const label of VARIANTE_LABELS) {
        const stdout = await api(`${repoPath}/issues?labels=${label}&state=all&per_page=100`)
        for (const raw of JSON.parse(stdout) as GhIssue[]) {
          if (raw.pull_request !== undefined) continue
          byNumber.set(raw.number, toIssueFacts(raw))
        }
      }
      return [...byNumber.values()]
    },

    async getIssue(ref: IssueRef): Promise<IssueFacts> {
      const stdout = await api(`${repoPath}/issues/${ref.number}`)
      return toIssueFacts(JSON.parse(stdout) as GhIssue)
    },

    async listChildren(ref: IssueRef): Promise<ChildIssue[]> {
      // NOTE: single page (per_page=100) — pagination for very large epics is deferred
      const stdout = await api(`${repoPath}/issues/${ref.number}/sub_issues?per_page=100`)
      return (JSON.parse(stdout) as GhIssue[]).map(toChildIssue)
    },

    async listComments(ref: IssueRef): Promise<CommentFacts[]> {
      const stdout = await api(`${repoPath}/issues/${ref.number}/comments?per_page=100`)
      return (JSON.parse(stdout) as GhComment[]).map((c) => ({
        author: c.user?.login ?? "ghost",
        body: c.body,
        createdAt: c.created_at,
      }))
    },

    async postComment(ref: IssueRef, body: string): Promise<void> {
      // gh api (not `gh issue comment`) so GHES --hostname works uniformly
      await runCli(exec, "gh", [
        "api",
        ...hostArgs,
        `${repoPath}/issues/${ref.number}/comments`,
        "-f",
        `body=${body}`,
      ])
    },

    async getParent(ref: IssueRef): Promise<number | null> {
      // REST "Get parent issue" (sub-issues API): 404 when there is no parent
      const args = ["api", ...hostArgs, `${repoPath}/issues/${ref.number}/parent`]
      const result = await exec("gh", args)
      if (result.code !== 0) {
        if (result.stderr.includes("404") || result.stderr.includes("Not Found")) return null
        throw new ForgeError(
          `gh api failed with exit ${result.code}: ${result.stderr.trim().slice(0, 500)}`,
          "gh",
          args,
          result.stderr,
        )
      }
      const parent = JSON.parse(result.stdout) as { number: number }
      return parent.number
    },

    async getBoardColumn(ref: IssueRef): Promise<string | null> {
      const query = [
        "query($owner: String!, $repo: String!, $n: Int!) {",
        "  repository(owner: $owner, name: $repo) {",
        "    issue(number: $n) {",
        "      projectItems(first: 10) {",
        "        nodes {",
        "          fieldValues(first: 20) {",
        "            nodes {",
        "              ... on ProjectV2ItemFieldSingleSelectValue {",
        "                name",
        "                field { ... on ProjectV2SingleSelectField { name } }",
        "              }",
        "            }",
        "          }",
        "        }",
        "      }",
        "    }",
        "  }",
        "}",
      ].join("\n")

      const [owner, repo] = forge.project.split("/")
      const stdout = await runCli(exec, "gh", [
        "api",
        ...hostArgs,
        "graphql",
        "-f",
        `query=${query}`,
        "-F",
        `owner=${owner}`,
        "-F",
        `repo=${repo}`,
        "-F",
        `n=${ref.number}`,
      ])

      interface FieldValue {
        name?: string
        field?: { name?: string }
      }
      const response = JSON.parse(stdout) as {
        data?: {
          repository?: {
            issue?: {
              projectItems?: { nodes?: Array<{ fieldValues?: { nodes?: FieldValue[] } }> } | null
            } | null
          }
        }
      }

      const items = response.data?.repository?.issue?.projectItems?.nodes ?? []
      for (const item of items) {
        for (const value of item.fieldValues?.nodes ?? []) {
          if (value.field?.name === "Status" && value.name) return value.name
        }
      }
      return null
    },
  }
}
