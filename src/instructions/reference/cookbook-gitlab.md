# Cookbook — GitLab (glab CLI + API v4)

> Source: specification.md D6 (ADR-010/011/013/014) · fluxo-de-desenvolvimento.md §4 · jornadas.md P6 · Module version: 4 — 2026-08-28 (R18, issue #54: MR/branch operations for the epic-branch topology — ADR-006; previous: R16, issue #34 — issue classification note)
> Anti-drift: ONLY place where `glab`/GitLab API commands appear (ADR-012). Instructions
> reference OPERATIONS (neutral names in `kebab-case`), never CLIs. Divergence with the
> source is a finding, never a silent adjustment.
> Conventions: `<ENC>` = URL-encoded project (`group/store` → `group%2Fstore`) · `<I>` = issue
> iid · no databaseId gotcha (everything uses iid).

## 0. Capabilities matrix (what does NOT exist — degrade, do not fail)

| Capability | Situation | How to degrade |
|---|---|---|
| Native sub-issues | **Does not exist** (epics = Premium + deprecated; work-items = experimental, forbidden) | **ADR-011:** epic-as-issue + `relates_to` links + tasklist in the body (roll-up `task_completion_status`) |
| Board by assignee/iteration/milestone | Premium only | Lists by scoped label `status::*` (Free) |
| Custom card fields | Does not exist | Not used by the flow (zero loss) |
| Hierarchy tree in 1 query | Does not exist | 2–3 REST (the digest absorbs it) |
| `glab epic` / `glab board` high level | Does not exist | Raw `glab api` (below, everything pinned) |
| Write (notes, labels, links) | PAT scope **`api`**; `read_api` = read only | P6 `read_api` flavor: narrate and proceed |

**Canonical board columns:** `Not started` → `In progress` → `In review` → `Delivered`
(on GitLab: scoped labels `status::not-started` `status::in-progress` `status::in-review` `status::delivered`).

**Favorable inversions vs GitHub:** move card = **1 PUT**; add-to-board = **implicit**
(assigning the `status::*` label already makes the issue appear in the corresponding list).

## 1. Creation operations

> **Issue classification (R16, ADR-005):** native type + dimension labels are
> **NOT yet adapted** for GitLab — out of scope in R16, tracked for the first
> real GitLab pilot (per ROADMAP). Until then, create issues WITHOUT type;
> dimension labels work as plain repo labels when the repo adopts them
> (create-label below is already idempotent on 409).

### create-epic
```bash
glab issue create --title "<verb + object, ≤60c>" --description "$(cat epic.md)" \
  --label "variant-condensed" --assignee <user>
```
Body = two P1 layers (`## Summary` + metadata line + `---` + `## Details for execution`).
Outside the repo directory: add `--repo <group/store>` or use `glab api` (below).

### create-label
```bash
glab api projects/<ENC>/labels -X POST -f name="<name>" -f "color=#8A2BE2"
# idempotent: 409 "already exists" = ok, proceed
```
Flow set: `variant-*`, `stage-1|2|3`, `override-registered`, `doc-bug`,
`product-feedback`, and the 4 `status::*` of the columns.

### create-task (daughter issue)
```bash
glab api projects/<ENC>/issues -X POST \
  -f "title=<title>" -f "description=$(cat task.md)" \
  -f "labels=stage-1" -f "assignee_ids=<USER_ID>"
```
`USER_ID`: `glab api "users?username=<user>" --jq '.[0].id'`. Then `link-task` +
`keep-tasklist` + `label` with the initial column.

### create-milestone
```bash
glab api projects/<ENC>/milestones -X POST -f "title=R02 — report export"
# assign:
glab api projects/<ENC>/milestones --jq '.[] | select(.title | startswith("R02")) | .id'
glab api projects/<ENC>/issues/<I> -X PUT -f milestone_id=<ID>
```

## 2. Hierarchy operations (ADR-011: links + tasklist)

### link-task
```bash
# 1) relates_to link (bidirectional; requires permission on BOTH issues)
glab api "projects/<ENC>/issues/<I_EPIC>/links?target_project_id=<ENC>&target_issue_iid=<I_DAUGHTER>" -X POST
# 2) keep-tasklist (roll-up)
```

### keep-tasklist — 1 extra write per task (cost declared ADR-011)
```bash
# 1) read the current epic body
glab api projects/<ENC>/issues/<I_EPIC> --jq .description > /tmp/epic.md
# 2) edit locally: add "- [ ] #<I_DAUGHTER>" (or mark "- [x]" on close)
# 3) push back
glab api projects/<ENC>/issues/<I_EPIC> -X PUT -f "description=$(cat /tmp/epic.md)"
```
**Facts win over the field:** the real state is the issue's; checkbox×issue divergence is
reported by the digest (`hierarchy.desync`) and charged in reconciliation.

### unlink-task
```bash
glab api "projects/<ENC>/issues/<I_EPIC>/links?link_type=relates_to" -X DELETE -f issue_link_id=<LINK_ID>
# LINK_ID comes from read-hierarchy (issue_link_id field); also remove from the tasklist
```

### read-hierarchy
```bash
glab api "projects/<ENC>/issues/<I>/links?per_page=100" \
  --jq '[.[] | {number: .iid, title: .title, state: .state, labels, link: .issue_link_id}]'
# roll-up: glab api projects/<ENC>/issues/<I> --jq .task_completion_status
```
Daughters are also identified by the P1 line (`**Epic:** #N`) — canonical cross-reference.
> **Pagination:** single page (`per_page=100`). Above 100 items, the digest marks
> `pagination.daughtersTruncated: true` — treat as a signal, do not read beyond.

## 3. Read operations

### read-issue
```bash
glab api projects/<ENC>/issues/<I>
```

### read-comments (notes — filter `system: false`)
```bash
glab api "projects/<ENC>/issues/<I>/notes?per_page=100" \
  --jq '[.[] | select(.system == false and (.body | contains("— facilitator"))) | {author: .author.username, date: .created_at, body: .body}]'
```

### read-open-load (P7)
```bash
glab api "projects/<ENC>/issues?assignee_username=<user>&state=opened&per_page=100" --jq 'length'
```

### read-members (P5 — team map)
```bash
glab api "projects/<ENC>/members/all?per_page=100" --jq '.[].username'
# /members/all includes inherited from the group; /members only direct ones
```

### read-merged-mrs (reconciliation)
```bash
glab api "projects/<ENC>/merge_requests?state=merged&updated_after=<YYYY-MM-DD>T00:00:00Z&per_page=100" \
  --jq '[.[] | {number: .iid, title: .title, mergedAt: .merged_at}]'
```

## 4. Write operations

### comment (gates, P3 overrides, events A–F, acceptances)
```bash
glab issue note <I> -m "<text>"
# API variant (the one used by the adapter; body with line breaks via -f):
glab api projects/<ENC>/issues/<I>/notes -X POST -f "body=<text>"
```

### edit-body (P1 metadata line — rewrite only the line)
```bash
glab api projects/<ENC>/issues/<I> --jq .description > /tmp/body.md
# edit only the metadata line, then:
glab api projects/<ENC>/issues/<I> -X PUT -f "description=$(cat /tmp/body.md)"
```
Never rewrite the `## Summary` — only correct/append (P1).

### label = move-card (1 PUT — board is a projection of labels)
```bash
glab api projects/<ENC>/issues/<I> -X PUT \
  -f "add_labels=status::in-progress" -f "remove_labels=status::not-started"
```
P6 rules: `in-progress` only **after** confirmed derivation, narrated; `delivered` only with the
reconciliation task closed (round gate); permission failure → narrate and proceed.
J10 reclassification uses the same form with variant labels.

### assign (confirmed assignee)
```bash
glab api projects/<ENC>/issues/<I> -X PUT -f "assignee_ids=<USER_ID>"
```

### reassign-issue (QA routing — `qa` mode: acceptance hands over to the QA professional; QA rejection returns the task to the implementer)
```bash
# 1) resolve the destination user id first (if not yet known):
glab api "users?username=<qa-user>" --jq '.[0].id'
# 2) assignee change via API PUT (assignee_ids REPLACES the current assignees):
glab api projects/<ENC>/issues/<I> -X PUT -f "assignee_ids=<QA_USER_ID>"
```

### close-issue (acceptance with verdict per criterion)
```bash
glab api projects/<ENC>/issues/<I>/notes -X POST -f "body=<verdict criterion by criterion — facilitator>"
glab api projects/<ENC>/issues/<I> -X PUT -f "state_event=close"
```

### create-release (Stage 3.4)
```bash
glab release create v<X.Y.Z>   # in the repo directory
```

## 4.5 MR and branch operations (topology — ADR-006)

`pr-topology` in `workflow.md` (read via `maestra-config read workflow.md`; absent = `epic-branch`). The integration branch is the repo's own (`develop`, `main` — convention); the epic branch is `epic/<N>-<slug>` (N = epic issue number).

### open-mr (task MR — target by topology)
```bash
glab mr create --source-branch <task-branch> \
  --target-branch <epic/N-slug>   <!-- epic-branch topology: the epic branch, when it exists (J5 STAGE 1)
  --target-branch <develop|main>  <!-- direct topology (or Minimal variant, or single-task epic)
  --title "<title>" --description "$(cat mr.md)"
```
**GOTCHA:** without `--target-branch`, glab targets the project's DEFAULT branch — a silent wrong target under the epic-branch topology. Always pass it explicitly.

### open-epic-mr (integration MR of the epic — P6 7a)
```bash
glab mr create --source-branch epic/<N>-<slug> --target-branch <integration-branch> \
  --title "<epic title> — epic integration" --description "$(cat epic-mr.md)"
```
Opened **in the same act** as the acceptance of the LAST daughter task (substate `awaiting-integration`; in `qa` mode only when every daughter is closed).

### create-epic-branch / delete-branch (lifecycle)
```bash
git branch epic/<N>-<slug> <integration-branch> && git push -u origin epic/<N>-<slug>
git push origin --delete epic/<N>-<slug>   # on merge/abandonment, same act, narrated
```

## 5. Board setup (1× per project; persist id in `config.md` on `__maestra_config__` → `board:` — write via `maestra-config write config.md`)

```bash
# 1) create the board (if it does not exist)
glab api projects/<ENC>/boards -X POST -f "name=Flow"
# 2) ids of the column labels
glab api projects/<ENC>/labels --jq '[.[] | select(.name | startswith("status::")) | {name, id}]'
# 3) create the 4 lists (one per label, in canonical order)
glab api projects/<ENC>/boards/<BOARD_ID>/lists -X POST -f label_id=<LABEL_ID>
```
Existing boards: `glab api projects/<ENC>/boards --jq '.[] | {id, name}'` — reuse.

## 6. Auth and self-hosted

```bash
glab auth status                       # user + hosts
glab auth status --hostname <host>     # self-hosted
```
| Item | Value |
|---|---|
| Required PAT | scope **`api`** (notes, labels, links, boards, issues, releases) |
| `read_api` | read only → P6 on all writes |
| Self-hosted | `GITLAB_HOST=https://gitlab.company.com` env · or `--hostname <host>` per call · or `glab config set host` |
| Instance probe | `GET https://<host>/api/v4/version` → 401/200 = alive (used by `maestra_status`) |

### 6.1 Flag verification status (T12)

| Form | Status |
|---|---|
| `glab issue note -m` | ✅ verified (official docs, T4) |
| `glab issue create --label` | ✅ verified (official docs, T4) |
| REST endpoints (issues, links, notes, boards, labels, milestones, members, merge_requests) | ✅ verified against gitlab.com/api/v4 + docs (T4) |
| `glab api` (`-f`, `-X`, `--jq`, `--hostname`) | ⚠️ assumed (mirrors `gh api`; covered by stub in smoke — confirm in the 1st pilot) |
| `glab issue create --assignee`, `glab label create` (CLI form) | ⚠️ not verified — use the pinned `glab api` form above until the pilot |

## 7. P6 degradation per operation (`read_api` flavor / without permission)

| Operation | Typical failure | Behavior |
|---|---|---|
| `label`/`move-card`, `comment`, `link-task` | 403 (`read_api`) | Narrate the intended action in 1 sentence + proceed; **never blocks** |
| `create-label` | 409 already exists | Idempotent — proceed |
| `link-task` | 404 (wrong iid) / 403 (no permission on the daughter) | Report exactly; idempotent resumption (digest re-reads links) |
| `keep-tasklist` | checkbox×issue desync | **Do not hide**: digest reports; reconciliation charges |
| `read-members` | 403 | Partial team map (P5 minimum for the wave); never blocks the epic |
| everything (glab missing/unauth) | `glab auth status` fails | GitLab MCP (if configured) or ready commands for the human; **never a half-done epic** |

## 8. MCP parity (declarative fallback — NOT VERIFIED until the first GitLab pilot)

GitLab has its own official MCP server (docs/user/model_context_protocol/mcp_server).
`maestra_status` reports "configured" when present; the equivalence table will be
pinned after the pilot — until then, prefer `glab api` and treat MCP as experimental.
