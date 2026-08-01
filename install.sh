#!/usr/bin/env bash
# maestra installer — modeled on Mesa's install.sh (refs/opencode-mesa).
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/hacklabr/maestra/main/install.sh | bash
#   bash install.sh [--host opencode|mimocode|both] [--tag vX.Y.Z]
set -euo pipefail

HOST_FLAG=""
TAG_FLAG=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --host)
      case "${2:-}" in
        opencode|mimocode|both) HOST_FLAG="$2"; shift 2 ;;
        *) echo "[maestra] invalid --host: ${2:-<empty>} (use opencode|mimocode|both)" >&2; exit 1 ;;
      esac
      ;;
    --tag) TAG_FLAG="$2"; shift 2 ;;
    *) break ;;
  esac
done

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { printf "${GREEN}[maestra]${NC} %s\n" "$1"; }
warn()  { printf "${YELLOW}[maestra]${NC} %s\n" "$1"; }
error() { printf "${RED}[maestra]${NC} %s\n" "$1" >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

detect_local_repo() {
  if [ -f "$SCRIPT_DIR/package.json" ] && grep -q '"maestra"' "$SCRIPT_DIR/package.json" 2>/dev/null; then
    echo "$SCRIPT_DIR"
    return 0
  fi
  return 1
}

LOCAL_REPO="$(detect_local_repo)" || true

if [ -n "$LOCAL_REPO" ]; then
  INSTALL_DIR="$LOCAL_REPO"
  info "Local repository detected at $INSTALL_DIR (clone ignored)"
  info "Updating submodules (persona catalog)"
  git -C "$INSTALL_DIR" submodule update --init --recursive
else
  REPO_URL="${1:-https://github.com/hacklabr/maestra}"
  INSTALL_DIR="${2:-$HOME/.local/share/maestra}"

  command -v git >/dev/null 2>&1 || error "git is required"

  if [ -d "$INSTALL_DIR" ]; then
    info "Updating existing installation at $INSTALL_DIR"
    git -C "$INSTALL_DIR" fetch --unshallow 2>/dev/null || true
    git -C "$INSTALL_DIR" fetch origin --tags
    if [ -n "$TAG_FLAG" ]; then
      git -C "$INSTALL_DIR" checkout "tags/$TAG_FLAG"
    else
      git -C "$INSTALL_DIR" reset --hard origin/main
    fi
    git -C "$INSTALL_DIR" submodule update --init --recursive
  else
    info "Cloning maestra to $INSTALL_DIR"
    git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
    git -C "$INSTALL_DIR" submodule update --init --recursive
  fi
fi

command -v node >/dev/null 2>&1 || error "node is required"
command -v npm >/dev/null 2>&1  || error "npm is required"

# Node >= 20 (native fetch, AbortSignal.timeout). No node:sqlite requirement —
# the plugin uses no local database (state = issue platform + repository).
NODE_VERSION="$(node -e "process.stdout.write(process.versions.node)" 2>/dev/null || echo 0)"
NODE_MAJOR="$(echo "$NODE_VERSION" | cut -d. -f1)"
if [ "$NODE_MAJOR" -lt 20 ]; then
  error "Node >= 20.0.0 is required (found: $NODE_VERSION)."
fi

info "Installing dependencies"
rm -rf "$INSTALL_DIR/node_modules"
npm ci --prefix "$INSTALL_DIR" 2>/dev/null || npm install --prefix "$INSTALL_DIR"

info "Compiling the plugin (tsc)"
npm run build --prefix "$INSTALL_DIR"

info "Generating agent and registering the plugin on hosts"
INSTALLER_ARGS=()
if [ -n "$HOST_FLAG" ]; then
  INSTALLER_ARGS+=(--host "$HOST_FLAG")
fi
node "$INSTALL_DIR/dist/installer/install.js" "${INSTALLER_ARGS[@]}"

info ""
info "Done. Restart OpenCode/Mimo Code to load the plugin and agent."
info ""
info "Installation directory: $INSTALL_DIR"
if [ -n "$HOST_FLAG" ]; then
  info "Configured hosts: $HOST_FLAG"
else
  info "Configured hosts: auto-detection (all existing config dirs)"
fi
info ""
info "How to use:"
info "  /agent maestra  — workflow facilitator (triage → stages → reconciliation)"
info "  /agent maestra-direct  — direct workflow mode (Minimal flow in a single session)"
info "  /agent maestra-issue-writer  — quick issue capture (stage-0), no triage"
info "  maestra-report  — instrumentation audit (events A–F)"
info ""
info "To also install on another host later:"
info "  node $INSTALL_DIR/dist/installer/install.js --host opencode|mimocode"
