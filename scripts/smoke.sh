#!/usr/bin/env bash
# 4-cell smoke test (spec T12/D7): 2 hosts (OpenCode/Mimo) × 2 platforms (GitHub/GitLab).
# Each cell: fake HOME + stub gh/glab binaries → installer dialect → fluxo_status →
# fluxo_issue_digest → desvios hook → fluxo-report. Requires dist/ (npm run build).
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d /tmp/fluxo-smoke-XXXXXX)"
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
  {"number":43,"id":111,"title":"Mini-briefing","body":"","state":"closed","labels":[{"name":"etapa-1"}],"assignees":[{"login":"rafael"}],"html_url":"https://github.com/acme/loja/issues/43"},
  {"number":44,"id":112,"title":"Reconciliação da rodada","body":"","state":"open","labels":[{"name":"etapa-3"}],"assignees":[{"login":"joao"}],"html_url":"https://github.com/acme/loja/issues/44"}
]
JSON
    ;;
  "api repos/acme/loja/issues/42/comments?per_page=100")
    cat <<'JSON'
[
  {"user":{"login":"rafael"},"body":"**Evento A** — triagem épico #42: 2 perguntas de elicitação — facilitador","created_at":"2026-07-28T10:00:00Z"}
]
JSON
    ;;
  "api repos/acme/loja/issues/42/parent") echo "gh: Not Found (HTTP 404)" >&2; exit 1 ;;
  "api repos/acme/loja/issues/43")
    cat <<'JSON'
{"number":43,"id":111,"title":"Mini-briefing","body":"REGISTRO — docs/referencia/prd.md","state":"closed","labels":[{"name":"etapa-1"}],"assignees":[{"login":"rafael"}],"html_url":"https://github.com/acme/loja/issues/43"}
JSON
    ;;
  "api repos/acme/loja/issues/42")
    cat <<'JSON'
{"number":42,"id":123,"title":"Épico smoke","body":"**Variante:** condensado · **Etapa atual:** etapa-2 · **Épico:** #42 · **Rodada:** R01","state":"open","labels":[{"name":"variante-condensado"}],"assignees":[{"login":"rafael"}],"html_url":"https://github.com/acme/loja/issues/42"}
JSON
    ;;
  api\ graphql*)
    cat <<'JSON'
{"data":{"repository":{"issue":{"projectItems":{"nodes":[{"fieldValues":{"nodes":[{"name":"Em andamento","field":{"name":"Status"}}]}}]}}}}}
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
  {"iid":43,"id":111,"title":"Mini-briefing","description":"","state":"closed","labels":["etapa-1"],"assignees":[{"username":"rafael"}],"web_url":"https://gitlab.com/grupo/loja/-/issues/43","task_completion_status":null},
  {"iid":44,"id":112,"title":"Reconciliação da rodada","description":"","state":"opened","labels":["etapa-3"],"assignees":[{"username":"joao"}],"web_url":"https://gitlab.com/grupo/loja/-/issues/44","task_completion_status":null}
]
JSON
    ;;
  "api projects/grupo%2Floja/issues/42/notes?per_page=100")
    cat <<'JSON'
[
  {"system":true,"author":{"username":"gitlab"},"body":"added ~etapa-1 label","created_at":"2026-07-28T09:00:00Z"},
  {"system":false,"author":{"username":"rafael"},"body":"**Evento A** — triagem épico #42: 2 perguntas de elicitação — facilitador","created_at":"2026-07-28T10:00:00Z"}
]
JSON
    ;;
  "api projects/grupo%2Floja/issues/43")
    cat <<'JSON'
{"iid":43,"id":111,"title":"Mini-briefing","description":"REGISTRO — docs/referencia/prd.md","state":"closed","labels":["etapa-1"],"assignees":[{"username":"rafael"}],"web_url":"https://gitlab.com/grupo/loja/-/issues/43","task_completion_status":null}
JSON
    ;;
  "api projects/grupo%2Floja/issues/42")
    cat <<'JSON'
{"iid":42,"id":123,"title":"Épico smoke","description":"**Variante:** condensado · **Etapa atual:** etapa-2 · **Épico:** #42 · **Rodada:** R01\n\n- [ ] #43\n- [ ] #44","state":"opened","labels":["variante-condensado"],"assignees":[{"username":"rafael"}],"web_url":"https://gitlab.com/grupo/loja/-/issues/42","task_completion_status":{"count":2,"completed_count":0}}
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
    opencode) configdir="opencode"; dialect='tool `task`' ;;
    mimocode) configdir="mimocode"; dialect='tool `actor`' ;;
  esac
  case "$platform" in
    github) cli_name="gh"; project="acme/loja"; hierarchy="sub-issues"; make_gh_stub "$stubdir" ;;
    gitlab) cli_name="glab"; project="grupo/loja"; hierarchy="links+tasklist"; make_glab_stub "$stubdir" ;;
  esac

  mkdir -p "$repo/docs/referencia" "$repo/docs/rodadas/R01-smoke" "$repo/.fluxo"
  echo "# PRD vivo" > "$repo/docs/referencia/prd.md"
  printf -- '- plataforma: %s\n- host: %s\n- projeto: %s\n' \
    "$platform" "$([ "$platform" = github ] && echo github.com || echo gitlab.com)" "$project" \
    > "$repo/.fluxo/config.md"
  cat > "$repo/docs/rodadas/R01-smoke/desvios.md" <<'MD'
# Desvios da rodada R01 — smoke

## Desvio 1 — filtro por data
- **Planejado:** CSV e Excel
- **Implementado:** só CSV
- **Motivo:** tempo
MD

  export HOME="$home"
  export PATH="$stubdir:$ORIGINAL_PATH"

  # 1. installer
  node "$ROOT/dist/installer/install.js" --host "$host" > /dev/null 2>&1 \
    && ok "installer ran ($host)" || bad "installer ran ($host)"
  check_file "agent md generated" "$home/.config/$configdir/agents/fluxo.md"
  check_grep "dialect baked ($dialect)" "$dialect" "$home/.config/$configdir/agents/fluxo.md"
  check_grep "external_directory allow" 'external_directory' "$home/.config/$configdir/agents/fluxo.md"
  check_grep "instructions path in frontmatter" "$home/.config/$configdir/fluxo/instructions" "$home/.config/$configdir/agents/fluxo.md"
  check_file "instructions copied" "$home/.config/$configdir/fluxo/instructions/kernel/fluxo-kernel.md"
  check_grep "plugin registered" "fluxo-facilitador\|dist/index.js" "$home/.config/$configdir/$configdir.json"
  # design A: exactly ONE shell specialist + greppable full catalog
  local n_specialists
  n_specialists=$(find "$home/.config/$configdir/agents/fluxo" -name "*.md" 2>/dev/null | wc -l)
  [ "$n_specialists" -eq 1 ] && ok "exactly 1 shell agent generated" || bad "exactly 1 shell agent generated (got $n_specialists)"
  local shell="$home/.config/$configdir/agents/fluxo/especialista.md"
  check_grep "shell has task/actor dialect" "$([ "$host" = opencode ] && echo 'task:' || echo 'actor:')" "$shell"
  ! grep -q "^hidden:" "$shell" && ok "shell is non-hidden (Mimo actor enum)" || bad "shell is non-hidden (Mimo actor enum)"
  check_grep "shell base prompt: persona on delegation" "persona é definida integralmente pelo prompt de delegação" "$shell"
  check_file "greppable catalog installed" "$home/.config/$configdir/fluxo/instructions/catalog/design/design-ux-researcher.md"

  # 2. fluxo_status
  node "$ROOT/scripts/smoke/run-tool.mjs" status "$repo" > "$cell/status.json" 2>/dev/null
  check_json "status: platform=$platform" "$cell/status.json" "d.capabilities.platform==='$platform'"
  check_json "status: cli authed" "$cell/status.json" "d.capabilities.cli===true"
  check_json "status: host=$host" "$cell/status.json" "d.host.id==='$host'"
  check_json "status: hierarchy=$hierarchy" "$cell/status.json" "d.capabilities.hierarchy==='$hierarchy'"

  # 3. fluxo_issue_digest
  node "$ROOT/scripts/smoke/run-tool.mjs" digest "$repo" 42 > "$cell/digest.json" 2>/dev/null
  check_json "digest: metadados parsed" "$cell/digest.json" "d.metadados && d.metadados.variante==='condensado'"
  check_json "digest: 2 children enumerated" "$cell/digest.json" "d.filhos.length===2"
  check_json "digest: reconciliation found" "$cell/digest.json" "d.gate.reconciliacao.existe===true"
  check_json "digest: hierarchy type" "$cell/digest.json" "d.hierarquia.tipo==='$hierarchy'"
  check_json "digest: artifact exists (G-05)" "$cell/digest.json" "d.artefatos.length===1 && d.artefatos[0].existe===true"

  # 4. desvios hook (fires on native write; invalid entry → warning; valid → silent)
  node "$ROOT/scripts/smoke/run-tool.mjs" hook "$repo" "$repo/docs/rodadas/R01-smoke/desvios.md" > "$cell/hook-invalid.txt" 2>/dev/null
  check_grep "hook flags invalid desvios.md" "Registro de desvios" "$cell/hook-invalid.txt"
  cat > "$repo/docs/rodadas/R01-smoke/desvios.md" <<'MD'
# Desvios da rodada R01 — smoke

Nenhum desvio nesta rodada.
MD
  node "$ROOT/scripts/smoke/run-tool.mjs" hook "$repo" "$repo/docs/rodadas/R01-smoke/desvios.md" > "$cell/hook-valid.txt" 2>/dev/null
  [ "$(cat "$cell/hook-valid.txt")" = "write ok" ] && ok "hook silent on valid file" || bad "hook silent on valid file"

  # 5. fluxo-report
  node "$ROOT/dist/cli/report.js" --directory "$repo" --epics 42 > "$cell/report.txt" 2>&1
  local code=$?
  { [ "$code" -eq 0 ] || [ "$code" -eq 1 ]; } && ok "fluxo-report ran (exit $code)" || bad "fluxo-report ran (exit $code)"
  check_grep "report output rendered" "fluxo-report" "$cell/report.txt"
}

for host in opencode mimocode; do
  for platform in github gitlab; do
    run_cell "$host" "$platform"
  done
done

echo
echo "smoke: $PASSED passed, $FAILED failed (4 cells)"
[ "$FAILED" -eq 0 ]
