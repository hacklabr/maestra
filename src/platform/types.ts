export type PlatformKind = "github" | "gitlab"

/** Fluxo variant labels (fluxo-de-desenvolvimento.md §4.5) — the epic marker. */
export const VARIANTE_LABELS = ["variante-completo", "variante-condensado", "variante-minimo", "variante-tecnica"] as const

/**
 * ADR-010: the issue platform is per-REPOSITORY, never baked at install time
 * (host ≠ platform; a machine may run OpenCode while repos live on GitHub
 * or self-hosted GitLab).
 */
export interface ForgeContext {
  kind: PlatformKind
  /** e.g. "github.com", "gitlab.com", "gitlab.empresa.com" */
  host: string
  /** e.g. "owner/repo" (GitHub) or "group/subgroup/repo" (GitLab) */
  project: string
}

export interface IssueRef {
  forge: ForgeContext
  /** Issue number (GitHub) or iid (GitLab) — the human-visible identifier. */
  number: number
}

export interface IssueFacts {
  number: number
  /** databaseId (GitHub) / global id (GitLab). Needed for GitHub sub-issues POST. */
  id: number
  title: string
  body: string
  state: "open" | "closed"
  labels: string[]
  assignees: string[]
  url: string
  /** GitLab tasklist roll-up (ADR-011); always null on GitHub. */
  taskCompletion: { total: number; completed: number } | null
}

export interface ChildIssue {
  number: number
  title: string
  state: "open" | "closed"
  labels: string[]
  assignees: string[]
}

export interface CommentFacts {
  author: string
  body: string
  createdAt: string
}

/**
 * The 6 platform primitives (ADR-010). Tool logic is 100% platform-neutral;
 * each adapter maps a primitive to gh/glab CLI calls and shapes payloads in
 * plain TypeScript (no jq incantations in our own code — jq belongs to the
 * digest presentation layer, T3).
 */
export interface ForgeAdapter {
  readonly kind: PlatformKind
  /** All issues (any state) carrying a variante-* label — the fluxo epics. Used by the fluxo-report sweep. */
  listEpics(): Promise<IssueFacts[]>
  getIssue(ref: IssueRef): Promise<IssueFacts>
  listChildren(ref: IssueRef): Promise<ChildIssue[]>
  listComments(ref: IssueRef): Promise<CommentFacts[]>
  postComment(ref: IssueRef, body: string): Promise<void>
  /** Parent issue number, or null when the issue has no parent. */
  getParent(ref: IssueRef): Promise<number | null>
  /** Board column name (Projects v2 Status × status::* label), or null. */
  getBoardColumn(ref: IssueRef): Promise<string | null>
}
