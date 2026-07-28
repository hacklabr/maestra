import { runCli, defaultExec, type ExecFn } from "./exec.js"
import { parseEpicRef } from "./p1.js"
import { VARIANTE_LABELS, type ChildIssue, type CommentFacts, type ForgeAdapter, type ForgeContext, type IssueFacts, type IssueRef } from "./types.js"

/**
 * GitLab adapter via `glab api` (payload shaping in TypeScript, no jq).
 *
 * Gotchas honored (Turn-4 delta):
 *  - IDs: everything uses the project-scoped `iid` — no databaseId gotcha.
 *  - Hierarchy (ADR-011): NO native sub-issues; epics are deprecated+Premium;
 *    work-items experimental (forbidden). Children = issue links
 *    (`relates_to`, Free/stable); roll-up = tasklist in the epic body
 *    (`task_completion_status`, Free). Parent = the P1 metadata line
 *    (`**Épico:** #N`) — the canonical cross-reference.
 *  - Board (ADR-013): column = scoped label `status::*` (Free); reading the
 *    column is a label scan — cheaper than GitHub Projects v2.
 *  - Self-hosted: `--hostname` passed when host ≠ gitlab.com
 *    (GITLAB_HOST env is also honored by glab itself).
 */

interface GlIssue {
  iid: number
  id: number
  title: string
  description: string | null
  state: string
  labels: string[]
  assignees: Array<{ username: string }>
  web_url: string
  task_completion_status?: { count: number; completed_count: number } | null
}

interface GlNote {
  system?: boolean
  author: { username: string }
  body: string
  created_at: string
}

function toIssueFacts(raw: GlIssue): IssueFacts {
  return {
    number: raw.iid,
    id: raw.id,
    title: raw.title,
    body: raw.description ?? "",
    state: raw.state === "opened" ? "open" : "closed",
    labels: raw.labels,
    assignees: raw.assignees.map((a) => a.username),
    url: raw.web_url,
    taskCompletion: raw.task_completion_status
      ? { total: raw.task_completion_status.count, completed: raw.task_completion_status.completed_count }
      : null,
  }
}

export function createGitLabAdapter(forge: ForgeContext, exec: ExecFn = defaultExec): ForgeAdapter {
  const projectPath = `projects/${encodeURIComponent(forge.project)}`
  const hostArgs = forge.host === "gitlab.com" ? [] : ["--hostname", forge.host]

  const api = (args: string[]) => runCli(exec, "glab", ["api", ...hostArgs, ...args])

  return {
    kind: "gitlab",

    async listEpics(): Promise<IssueFacts[]> {
      // labels filter is AND within one call — one query per variante label, deduped.
      const byIid = new Map<number, IssueFacts>()
      for (const label of VARIANTE_LABELS) {
        const stdout = await api([`${projectPath}/issues?labels=${label}&state=all&per_page=100`])
        for (const raw of JSON.parse(stdout) as GlIssue[]) {
          byIid.set(raw.iid, toIssueFacts(raw))
        }
      }
      return [...byIid.values()]
    },

    async getIssue(ref: IssueRef): Promise<IssueFacts> {
      const stdout = await api([`${projectPath}/issues/${ref.number}`])
      return toIssueFacts(JSON.parse(stdout) as GlIssue)
    },

    async listChildren(ref: IssueRef): Promise<ChildIssue[]> {
      // Links are bidirectional and include every relates_to link; the digest
      // (T3) applies convention filtering (etapa-* labels / P1 back-reference)
      const stdout = await api([`${projectPath}/issues/${ref.number}/links?per_page=100`])
      return (JSON.parse(stdout) as GlIssue[]).map((raw) => ({
        number: raw.iid,
        title: raw.title,
        state: raw.state === "opened" ? "open" : "closed",
        labels: raw.labels,
        assignees: raw.assignees.map((a) => a.username),
      }))
    },

    async listComments(ref: IssueRef): Promise<CommentFacts[]> {
      const stdout = await api([`${projectPath}/issues/${ref.number}/notes?per_page=100`])
      return (JSON.parse(stdout) as GlNote[])
        .filter((n) => n.system !== true) // system notes (label changes etc.) are noise
        .map((n) => ({ author: n.author.username, body: n.body, createdAt: n.created_at }))
    },

    async postComment(ref: IssueRef, body: string): Promise<void> {
      await api([`${projectPath}/issues/${ref.number}/notes`, "-X", "POST", "-f", `body=${body}`])
    },

    async getParent(ref: IssueRef): Promise<number | null> {
      // No native parent on Free tier: the P1 metadata line is canonical (ADR-011)
      const issue = await this.getIssue(ref)
      return parseEpicRef(issue.body)
    },

    async getBoardColumn(ref: IssueRef): Promise<string | null> {
      const issue = await this.getIssue(ref)
      const statusLabel = issue.labels.find((l) => l.startsWith("status::"))
      return statusLabel ? statusLabel.slice("status::".length) : null
    },
  }
}
