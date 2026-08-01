#!/usr/bin/env bash
# 4-cell smoke test (spec T12/D7): 2 hosts (OpenCode/Mimo) × 2 platforms (GitHub/GitLab).
# Each cell: fake HOME + stub gh/glab binaries → installer dialect → maestra_status →
# maestra_issue_digest → desvios hook → maestra-report. Requires dist/ (npm run build).
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d /tmp/maestra-smoke-XXXXXX)"
trap 'rm -rf "$WORK"' EXIT

PASSED=0
FAILED=0
ORIGINAL_PATH="$PATH"
ok()  { PASSED=$((PASSED+1)); echo "  ✓ $1"; }
bad() { FAILED=$((FAILED+1)); echo "  ✗ $1"; }

check_file()  { [ -f "$2" ] && ok "$1" || bad "$1"; }
check_grep()  { grep -q "$2" "$3" 2>/dev/null && ok "$1" || bad "$1"; }
check_json()  { # <desc> <json-file> <js-expression-on-d>
  if node -e "const d=JSON.parse(require('fs').readFileSync('$2','utf-8')); process.exit(($3)?0:1)" 2>/dev/null; then
    ok "$1"
  else
    bad "$1"
  fi
}

[ -d "$ROOT/dist" ] || { echo "dist/ missing — run npm run build first"; exit 1; }

# ---------------------------------------------------------------------------
# Stub CLIs
# ---------------------------------------------------------------------------
make_gh_stub() {
  local dir="$1"
  mkdir -p "$dir"
  cat > "$dir/gh" <<'STUB'
#!/usr/bin/env bash
case "$*" in
  "--version") echo "gh version 2.96.0 (stub)" ;;
  "auth status") echo "github.com"; echo "  ✓ Logged in to github.com (stub)" ;;
  "project list --owner acme") echo "1	Fluxo" ;;
  "api repos/acme/loja/issues/42/sub_issues?per_page=100")
    cat <<'JSON'
[
  {"number":43,"id":111,"title":"Mini-briefing","body":"","state":"closed","labels":[{"name":"stage-1"}],"assignees":[{"login":"rafael"}],"html_url":"https://github.com/acme/loja/issues/43"},
  {"number":44,"id":112,"title":"Reconciliation of the round","body":"","state":"open","labels":[{"name":"stage-3"}],"assignees":[{"login":"joao"}],"html_url":"https://github.com/acme/loja/issues/44"}
]
JSON
    ;;
  "api repos/acme/loja/issues/42/comments?per_page=100")
    cat <<'JSON'
[
  {"user":{"login":"rafael"},"body":"**Event A** — triage: 2 elicitation questions; derivable questions asked: 0 — facilitator","created_at":"2026-07-28T10:00:00Z"}
]
JSON
    ;;
  "api repos/acme/loja/issues/42/parent") echo "gh: Not Found (HTTP 404)" >&2; exit 1 ;;
  "api repos/acme/loja/issues/43")
    cat <<'JSON'
{"number":43,"id":111,"title":"Mini-briefing","body":"RECORD — docs/reference/prd.md","state":"closed","labels":[{"name":"stage-1"}],"assignees":[{"login":"rafael"}],"html_url":"https://github.com/acme/loja/issues/43"}
JSON
    ;;
  "api repos/acme/loja/issues/42")
    cat <<'JSON'
{"number":42,"id":123,"title":"Smoke epic","body":"**Variant:** condensed · **Current stage:** stage-2 · **Epic:** #42 · **Round:** R01","state":"open","labels":[{"name":"variant-condensed"}],"assignees":[{"login":"rafael"}],"html_url":"https://github.com/acme/loja/issues/42"}
JSON
    ;;
  api\ graphql*)
    cat <<'JSON'
{"data":{"repository":{"issue":{"projectItems":{"nodes":[{"fieldValues":{"nodes":[{"name":"In progress","field":{"name":"Status"}}]}}]}}}}}
JSON
    ;;
  *) echo "gh stub: unmatched: $*" >&2; exit 127 ;;
esac
STUB
  chmod +x "$dir/gh"
}

make_glab_stub() {
  local dir="$1"
  mkdir -p "$dir"
  cat > "$dir/glab" <<'STUB'
#!/usr/bin/env bash
case "$*" in
  "--version") echo "glab version 1.46.1 (stub)" ;;
  "auth status") echo "gitlab.com"; echo "  ✓ Logged in to gitlab.com (stub)" ;;
  "api projects/grupo%2Floja") echo '{"permissions":{"project_access":{"access_level":30}}}' ;;
  "api projects/grupo%2Floja/issues/42/links?per_page=100")
    cat <<'JSON'
[
  {"iid":43,"id":111,"title":"Mini-briefing","description":"","state":"closed","labels":["stage-1"],"assignees":[{"username":"rafael"}],"web_url":"https://gitlab.com/grupo/loja/-/issues/43","task_completion_status":null},
  {"iid":44,"id":112,"title":"Reconciliation of the round","description":"","state":"opened","labels":["stage-3"],"assignees":[{"username":"joao"}],"web_url":"https://gitlab.com/grupo/loja/-/issues/44","task_completion_status":null}
]
JSON
    ;;
  "api projects/grupo%2Floja/issues/42/notes?per_page=100")
    cat <<'JSON'
[
  {"system":true,"author":{"username":"gitlab"},"body":"added ~stage-1 label","created_at":"2026-07-28T09:00:00Z"},
  {"system":false,"author":{"username":"rafael"},"body":"**Event A** — triage: 2 elicitation questions; derivable questions asked: 0 — facilitator","created_at":"2026-07-28T10:00:00Z"}
]
JSON
    ;;
  "api projects/grupo%2Floja/issues/43")
    cat <<'JSON'
{"iid":43,"id":111,"title":"Mini-briefing","description":"RECORD — docs/reference/prd.md","state":"closed","labels":["stage-1"],"assignees":[{"username":"rafael"}],"web_url":"https://gitlab.com/grupo/loja/-/issues/43","task_completion_status":null}
JSON
    ;;
  "api projects/grupo%2Floja/issues/42")
    cat <<'JSON'
{"iid":42,"id":123,"title":"Smoke epic","description":"**Variant:** condensed · **Current stage:** stage-2 · **Epic:** #42 · **Round:** R01\n\n- [ ] #43\n- [ ] #44","state":"opened","labels":["variant-condensed"],"assignees":[{"username":"rafael"}],"web_url":"https://gitlab.com/grupo/loja/-/issues/42","task_completion_status":{"count":2,"completed_count":0}}
JSON
    ;;
  *) echo "glab stub: unmatched: $*" >&2; exit 127 ;;
esac
STUB
  chmod +x "$dir/glab"
}

# ---------------------------------------------------------------------------
# Cell runner
# ---------------------------------------------------------------------------
run_cell() {
  local host="$1" platform="$2"
  local cell="$WORK/$host-$platform"
  local home="$cell/home" repo="$cell/repo" stubdir="$cell/bin"
  local configdir agentsdir dialect hierarchy cli_name project
  echo "── cell: $host × $platform"

  case "$host" in
    opencode) configdir="opencode"; dialect='`task` tool' ;;
    mimocode) configdir="mimocode"; dialect='`actor` tool' ;;
  esac
  case "$platform" in
    github) cli_name="gh"; project="acme/loja"; hierarchy="sub-issues"; make_gh_stub "$stubdir" ;;
    gitlab) cli_name="glab"; project="grupo/loja"; hierarchy="links+tasklist"; make_glab_stub "$stubdir" ;;
  esac

  mkdir -p "$repo/docs/reference" "$repo/docs/rounds/R01-smoke" "$repo/.maestra"
  echo "# Living PRD" > "$repo/docs/reference/prd.md"
  printf -- '- platform: %s\n- host: %s\n- project: %s\n' \
    "$platform" "$([ "$platform" = github ] && echo github.com || echo gitlab.com)" "$project" \
    > "$repo/.maestra/config.md"
  cat > "$repo/docs/rounds/R01-smoke/deviations.md" <<'MD'
# Deviations of round R01 — smoke

## Deviation 1 — filter by date
- **Planned:** CSV and Excel
- **Implemented:** CSV only
- **Reason:** time
MD

  export HOME="$home"
  export PATH="$stubdir:$ORIGINAL_PATH"

  # 1. installer
  node "$ROOT/dist/installer/install.js" --host "$host" > /dev/null 2>&1 \
    && ok "installer ran ($host)" || bad "installer ran ($host)"
  check_file "agent md generated" "$home/.config/$configdir/agents/maestra.md"
  check_grep "dialect baked ($dialect)" "$dialect" "$home/.config/$configdir/agents/maestra.md"
  check_grep "external_directory allow" 'external_directory' "$home/.config/$configdir/agents/maestra.md"
  check_grep "instructions path in frontmatter" "$home/.config/$configdir/maestra/instructions" "$home/.config/$configdir/agents/maestra.md"
  check_file "issue-writer agent md generated" "$home/.config/$configdir/agents/maestra-issue-writer.md"
  check_grep "issue-writer dialect baked ($dialect)" "$dialect" "$home/.config/$configdir/agents/maestra-issue-writer.md"
  check_grep "issue-writer points to its kernel" 'kernel/issue-writer-kernel.md' "$home/.config/$configdir/agents/maestra-issue-writer.md"
  check_grep "issue-writer routes to J11" 'journeys/j11-quick-capture.md' "$home/.config/$configdir/agents/maestra-issue-writer.md"
  check_file "issue-writer kernel installed" "$home/.config/$configdir/maestra/instructions/kernel/issue-writer-kernel.md"
  check_file "instructions copied" "$home/.config/$configdir/maestra/instructions/kernel/maestra-kernel.md"
  check_grep "plugin registered" "maestra\|dist/index.js" "$home/.config/$configdir/$configdir.json"
  # design A: exactly ONE shell specialist + greppable full catalog
  local n_specialists
  n_specialists=$(find "$home/.config/$configdir/agents/maestra" -name "*.md" 2>/dev/null | wc -l)
  [ "$n_specialists" -eq 1 ] && ok "exactly 1 shell agent generated" || bad "exactly 1 shell agent generated (got $n_specialists)"
  local shell="$home/.config/$configdir/agents/maestra/specialist.md"
  check_grep "shell has task/actor dialect" "$([ "$host" = opencode ] && echo 'task:' || echo 'actor:')" "$shell"
  ! grep -q "^hidden:" "$shell" && ok "shell is non-hidden (Mimo actor enum)" || bad "shell is non-hidden (Mimo actor enum)"
  check_grep "shell base prompt: persona on delegation" "persona is defined entirely by the delegation prompt" "$shell"
  check_file "greppable catalog installed" "$home/.config/$configdir/maestra/instructions/catalog/design/design-ux-researcher.md"

  # 2. maestra_status
  node "$ROOT/scripts/smoke/run-tool.mjs" status "$repo" > "$cell/status.json" 2>/dev/null
  check_json "status: platform=$platform" "$cell/status.json" "d.capabilities.platform==='$platform'"
  check_json "status: cli authed" "$cell/status.json" "d.capabilities.cli===true"
  check_json "status: host=$host" "$cell/status.json" "d.host.id==='$host'"
  check_json "status: hierarchy=$hierarchy" "$cell/status.json" "d.capabilities.hierarchy==='$hierarchy'"

  # 3. maestra_issue_digest
  node "$ROOT/scripts/smoke/run-tool.mjs" digest "$repo" 42 > "$cell/digest.json" 2>/dev/null
  check_json "digest: metadata parsed" "$cell/digest.json" "d.metadata && d.metadata.variant==='condensed'"
  check_json "digest: 2 children enumerated" "$cell/digest.json" "d.children.length===2"
  check_json "digest: reconciliation found" "$cell/digest.json" "d.gate.reconciliation.exists===true"
  check_json "digest: hierarchy type" "$cell/digest.json" "d.hierarchy.type==='$hierarchy'"
  check_json "digest: artifact exists (G-05)" "$cell/digest.json" "d.artifacts.length===1 && d.artifacts[0].exists===true"

  # 4. deviations hook (fires on native write; invalid entry → warning; valid → silent)
  node "$ROOT/scripts/smoke/run-tool.mjs" hook "$repo" "$repo/docs/rounds/R01-smoke/deviations.md" > "$cell/hook-invalid.txt" 2>/dev/null
  check_grep "hook flags invalid deviations.md" "Deviation register" "$cell/hook-invalid.txt"
  cat > "$repo/docs/rounds/R01-smoke/deviations.md" <<'MD'
# Deviations of round R01 — smoke

No deviations in this round.
MD
  node "$ROOT/scripts/smoke/run-tool.mjs" hook "$repo" "$repo/docs/rounds/R01-smoke/deviations.md" > "$cell/hook-valid.txt" 2>/dev/null
  [ "$(cat "$cell/hook-valid.txt")" = "write ok" ] && ok "hook silent on valid file" || bad "hook silent on valid file"

  # 5. maestra-report
  node "$ROOT/dist/cli/report.js" --directory "$repo" --epics 42 > "$cell/report.txt" 2>&1
  local code=$?
  { [ "$code" -eq 0 ] || [ "$code" -eq 1 ]; } && ok "maestra-report ran (exit $code)" || bad "maestra-report ran (exit $code)"
  check_grep "report output rendered" "maestra-report" "$cell/report.txt"
}

for host in opencode mimocode; do
  for platform in github gitlab; do
    run_cell "$host" "$platform"
  done
done

echo
echo "smoke: $PASSED passed, $FAILED failed (4 cells)"
[ "$FAILED" -eq 0 ]
