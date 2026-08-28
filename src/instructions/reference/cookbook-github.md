# Cookbook — GitHub (gh CLI + API)

> Source: specification.md D6 · fluxo-de-desenvolvimento.md §4 · jornadas.md P6 · Module version: 5 — 2026-08-28 (R18, issue #54: PR/branch operations for the epic-branch topology — ADR-006 · R19, issue #53: pre-creation dedup gate — `search-similar` op + §1 precondition; kernel trigger #19; previous: R16, issue #34 — issue classification)
> Anti-drift: ONLY place where `gh`/GitHub API commands appear (ADR-012). Instructions
> reference OPERATIONS (neutral names in `kebab-case`), never CLIs. Divergence with the
> source is a finding, never a silent adjustment.
> Conventions: `<O>/<R>` = owner/repo · `<N>` = issue number · `<ENC>` = URL-encoded project.

## 0. Capabilities matrix (what limits / gotchas — degrade, do not fail)

| Capability | Situation | How to degrade |
|---|---|---|
| Native sub-issues | **POST requires `sub_issue_id` = databaseId, NOT the number** (the number fails with 422) | Resolve the id first (`--jq .id`) — see `link-task` |
| Native issue types | Org-level feature; enabled in hacklabr — `Bug`/`Feature`/`Task`, one per issue (ADR-005) | Org/repo without types or permission failure → create WITHOUT `--type`, narrate in 1 line — classification never blocks |
| Board write (Projects v2) | Requires **`project`** scope on the token; current environment has `read:project` | P6: narrate the intended column and proceed — board is a touchpoint, not a gate |
| Board read | `read:project` is enough | — |
| Add-to-board | **NOT automatic** (requires `item-add` or a project workflow) | Always `item-add` when creating an epic/task |
| Labels/repo, comments, issues, milestones | `repo` scope — covered | — |
| Collaborators/members | `read:org` scope | P6: partial team map, never blocks the epic |
| GHES (self-hosted) | `gh auth login --hostname <host>`; `--hostname` on `gh api` or `GH_HOST` env | Same operations, base `/api/v3` |

**Canonical board columns:** `Not started` → `In progress` → `In review` → `Delivered`
(on GitHub: options of the **Status** single-select field of Projects v2).

## 1. Creation operations

> **Precondition (kernel trigger #19):** every creation below is preceded by
> `search-similar` (§3) — no demand-representing issue is born without the
> board having been searched (open + closed). Candidate found → the human
> decides create new / relate / increment BEFORE the creation; nothing found →
> proceed. Wave daughters under a confirmed P7 wave are exempt (the plan's
> dedup covers them).

### create-epic
```bash
gh issue create --repo <O>/<R> --title "<verb + object, ≤60c>" \
  --body-file epic.md --label "variant-condensed" --assignee <user> \
  --type <Bug|Feature|Task>
```
Body = two P1 layers (`## Summary` + metadata line + `---` + `## Details for execution`). Type derived at triage (J1) — see `set-type` for degradation when the org/repo has no issue types.

### create-label
```bash
gh label create <name> --repo <O>/<R> --color <hex-without-#> --force   # --force = idempotent
```
Flow set: `variant-full|condensed|minimal|technical`, `stage-1|2|3`,
`override-registered`, `doc-bug`, `product-feedback`.
Dimension set (R16, informational — ADR-005): `gestão`, `melhoria`,
`performance`, `devops`, `documentação` — created **on demand, only when first
needed** (idempotent recipe): check first with
`gh label list --repo <O>/<R> --search <name>`; create only when missing
(`--force` keeps re-runs safe).

### create-task (daughter issue)
```bash
gh issue create --repo <O>/<R> --title "<title>" --body-file task.md \
  --label "stage-1" --assignee <confirmed-user> --type <Bug|Feature|Task>
```
Then link (operation `link-task`) and add to the board (`add-to-board`).

### create-milestone
```bash
gh api repos/<O>/<R>/milestones -f title="R02 — report export"
gh issue edit <N> --repo <O>/<R> --milestone "R02 — report export"
```

## 2. Hierarchy operations (epic → tasks)

### link-task — databaseId GOTCHA
```bash
# 1) resolve the databaseId of the DAUGHTER (the NUMBER does not work in the POST)
DAUGHTER_ID=$(gh api repos/<O>/<R>/issues/<N_DAUGHTER> --jq .id)
# 2) link
gh api repos/<O>/<R>/issues/<N_EPIC>/sub_issues -f sub_issue_id=$DAUGHTER_ID
```

### unlink-task
```bash
gh api repos/<O>/<R>/issues/<N_EPIC>/sub_issues -X DELETE -f sub_issue_id=$DAUGHTER_ID
```

### reorder-tasks
```bash
gh api repos/<O>/<R>/issues/<N_EPIC>/sub_issues/priority -X PATCH \
  -f sub_issue_id=$DAUGHTER_ID -f after_id=$PREVIOUS_ID   # or before_id
```

### read-hierarchy (1 query — used by the digest; manual only for debugging)
```bash
gh api repos/<O>/<R>/issues/<N>/sub_issues?per_page=100 \
  --jq '[.[] | {number, title, state, labels: [.labels[].name], assignees: [.assignees[].login]}]'
```
Progress roll-up is native (sub-issues field in UI/API) — **no manual tasklist**.
> **Pagination:** single page (`per_page=100`). Above 100 items, the digest marks
> `pagination.daughtersTruncated: true` — treat as a signal, do not read beyond.

## 3. Read operations

### search-similar (kernel trigger #19 — pre-creation duplicate/related check)
```bash
gh search issues --repo <O>/<R> "<key terms of the title/demand>" --limit 20 \
  --json number,title,state --jq '.[] | "\(.number)\t\(.state)\t\(.title)"'
# no --state flag = open AND closed; refine terms (EN/PT synonyms) while noise dominates signal
```
Scope: the session's repo only. **Distilled return:** ≤3 candidates (number + title) or "nothing found" — never the full listing. Related non-duplicates become cross-references in the created body. Delegable to `maestra/ops` (J11 v5 pattern).

### read-issue
```bash
gh api repos/<O>/<R>/issues/<N>
```

### read-comments
```bash
gh api repos/<O>/<R>/issues/<N>/comments?per_page=100 \
  --jq '[.[] | select(.body | contains("— facilitator")) | {author: .user.login, date: .created_at, body: .body}]'
```

### read-open-load (P7 — distribution justification)
```bash
gh issue list --repo <O>/<R> --assignee <user> --state open \
  --json number,title --jq 'length'
```

### read-collaborators (P5 — team map)
```bash
gh api repos/<O>/<R>/collaborators --jq '.[].login'
```

### read-merged-prs (reconciliation — scope × implemented)
```bash
gh pr list --repo <O>/<R> --state merged --search "merged:>=<YYYY-MM-DD>" \
  --json number,title,mergedAt
```

## 4. Write operations

### comment (gates, P3 overrides, events A–F, acceptances)
```bash
gh issue comment <N> --repo <O>/<R> --body-file comment.md
# GHES-safe variant (the one used by the adapter):
gh api repos/<O>/<R>/issues/<N>/comments -f body="<text>"
```

### edit-body (P1 metadata line — rewrite only the line)
```bash
gh issue edit <N> --repo <O>/<R> --body-file updated-body.md
```
Never rewrite the `## Summary` — only correct/append (P1).

### label (add/remove — J10 reclassification, override)
```bash
gh issue edit <N> --repo <O>/<R> --add-label "override-registered"
gh issue edit <N> --repo <O>/<R> --remove-label "variant-minimal" --add-label "variant-condensed"
```

### set-type (issue classification — triage derivation and capture-promotion correction; ADR-005)
```bash
# at creation: --type <Bug|Feature|Task> on gh issue create (see create-epic/create-task)
# correction — J11 promotion confirms/corrects the capture guess in the act:
gh issue edit <N> --repo <O>/<R> --type <Bug|Feature|Task>
# dimension labels (free-form, multiple per issue — applied at triage when they fit the work):
gh issue edit <N> --repo <O>/<R> --add-label "performance" --add-label "devops"
```
Informational only — nothing consumes type/dimension (digest vocabulary unchanged).
Org/repo without issue types or permission failure → create/edit WITHOUT `--type`,
narrate in 1 line; classification never blocks.

### assign (confirmed assignee — every task is born with one)
```bash
gh issue edit <N> --repo <O>/<R> --add-assignee <user>
```

### reassign-issue (QA routing — `qa` mode: acceptance hands over to the QA professional; QA rejection returns the task to the implementer)
```bash
gh issue edit <N> --repo <O>/<R> --remove-assignee <implementer> --add-assignee <qa-user>
```

### close-issue (acceptance with verdict per criterion)
```bash
gh issue close <N> --repo <O>/<R> --comment "<verdict criterion by criterion — facilitator>"
```

### create-release (Stage 3.4)
```bash
gh release create v<X.Y.Z> --repo <O>/<R> --generate-notes
```

## 4.5 PR/MR and branch operations (topology — ADR-006)

`pr-topology` in `workflow.md` (read via `maestra-config read workflow.md`; absent = `epic-branch`). The integration branch is the repo's own (`develop`, `main` — convention); the epic branch is `epic/<N>-<slug>` (N = epic issue number).

### open-pr (task PR — base by topology)
```bash
gh pr create --repo <O>/<R> --head <task-branch> \
  --base <epic/N-slug>   <!-- epic-branch topology: the epic branch, when it exists (J5 STAGE 1)
  --base <develop|main>  <!-- direct topology (or Minimal variant, or single-task epic)
  --title "<title>" --body-file pr.md
```
**GOTCHA:** without `--base`, gh targets the repo's DEFAULT branch — a silent wrong base under the epic-branch topology. Always pass `--base` explicitly.

### open-epic-pr (integration PR of the epic — P6 7a)
```bash
gh pr create --repo <O>/<R> --head epic/<N>-<slug> --base <integration-branch> \
  --title "<epic title> — epic integration" --body-file epic-pr.md
```
Opened **in the same act** as the acceptance of the LAST daughter task (substate `awaiting-integration`; epic card → review; in `qa` mode only when every daughter is closed).

### create-epic-branch / delete-branch (lifecycle — lazy birth, death on merge/abandonment)
```bash
git branch epic/<N>-<slug> <integration-branch> && git push -u origin epic/<N>-<slug>
git push origin --delete epic/<N>-<slug>   # on merge/abandonment, same act, narrated
```

## 5. Board operations (Projects v2 — 3 to 4 calls with IDs)

### add-to-board
```bash
gh project item-add <PROJECT_NUM> --owner <ORG-or-@me> \
  --url https://github.com/<O>/<R>/issues/<N> --format json --jq .id
```

### discover-ids (1× per project; cache in `config.md` on `__maestra_config__` → `board:` — write via `maestra-config write config.md`)
```bash
# project id (PVT_…)
gh project view <PROJECT_NUM> --owner <ORG> --format json --jq .id
# field id + option ids of the Status field (PVTSSF_… + options)
gh project field-list <PROJECT_NUM> --owner <ORG> --format json \
  --jq '.fields[] | select(.name=="Status") | {fieldId: .id, options: [.options[] | {name, id}]}'
```

### move-card
```bash
# 1) item id (PVTI_…) of the issue in the project
ITEM=$(gh project item-list <PROJECT_NUM> --owner <ORG> --format json \
  --jq '.items[] | select(.content.number==<N>) | .id')
# 2) move
gh project item-edit --project-id <PVT_> --id $ITEM \
  --field-id <PVTSSF_> --single-select-option-id <OPT_ID>
```
P6 rules: `In progress` only **after** confirmed derivation, narrated; `Delivered` only with the
reconciliation task closed (round gate); permission failure → narrate and proceed.

## 6. Auth and scopes

```bash
gh auth status          # shows user, hosts and token SCOPES
```
| Scope | Needed for | Current environment |
|---|---|---|
| `repo` | issues, labels, comments, milestones, releases | ✓ |
| `project` | board **write** (move card) | ✗ — only `read:project` → P6 |
| `read:project` | board read | ✓ |
| `read:org` | collaborators/members (P5) | ✓ |

### 6.1 Verification status (T12)

All `gh` patterns verified against real gh 2.96.0 + official docs (T1/T4) and exercised
in the 4-cell smoke with stub. Exception: the `/parent` endpoint (REST sub-issues) is assumed
from the documented API — confirm on first use with a real repo.

## 7. P6 degradation per operation (`read:project` flavor / without scope)

| Operation | Typical failure | Behavior |
|---|---|---|
| `move-card`, `add-to-board` | `INSUFFICIENT_SCOPES` / 403 | Narrate the intended column in 1 sentence + proceed; **never blocks** |
| `link-task` | 422 (wrong id — number instead of databaseId) | Redo with `--jq .id`; report exactly |
| `create-epic`/`create-task` with `--type`, `set-type` | org/repo without issue types; permission failure | Create/edit WITHOUT `--type`, narrate in 1 sentence; **never blocks** (ADR-005) |
| any write | 403/404 | Report what was created and what is missing; idempotent resumption (digest re-reads what exists) |
| `read-collaborators` | 403 | Partial team map (P5 minimum for the wave); never blocks the epic |
| everything (gh missing/unauth) | `gh auth status` fails | GitHub MCP (if configured) or ready commands for the human; **never a half-done epic** |

## 8. MCP parity (declarative fallback — only if `maestra_status` reports GitHub MCP "configured")

| Operation | gh | MCP (typical names*) |
|---|---|---|
| create-epic/task | `gh issue create` | `github_issue_write` (create) |
| open-pr / open-epic-pr | `gh pr create --base` | `github_pull_request_write` (create) |
| comment | `gh issue comment` | `github_add_issue_comment` |
| link-task | `gh api …/sub_issues` | `github_sub_issue_write` (add) |
| label | `gh issue edit --add-label` | `github_label_write` / `github_issue_write` (labels) |
| move-card | `gh project item-edit` | `github_projects_write` (update_project_item) |
| read-hierarchy/issue | `gh api` | `github_issue_read` (get_sub_issues) |
| read-load | `gh issue list` | `github_list_issues` / `github_search_issues` |

\* Names vary depending on the installed MCP server — check the real toolset available in the session.
