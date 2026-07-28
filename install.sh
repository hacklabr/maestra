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
        *) echo "[maestra] --host inválido: ${2:-<vazio>} (use opencode|mimocode|both)" >&2; exit 1 ;;
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
  info "Repositório local detectado em $INSTALL_DIR (clone ignorado)"
  info "Atualizando submodules (catálogo de personas)"
  git -C "$INSTALL_DIR" submodule update --init --recursive
else
  REPO_URL="${1:-https://github.com/hacklabr/maestra}"
  INSTALL_DIR="${2:-$HOME/.local/share/maestra}"

  command -v git >/dev/null 2>&1 || error "git é obrigatório"

  if [ -d "$INSTALL_DIR" ]; then
    info "Atualizando instalação existente em $INSTALL_DIR"
    git -C "$INSTALL_DIR" fetch --unshallow 2>/dev/null || true
    git -C "$INSTALL_DIR" fetch origin --tags
    if [ -n "$TAG_FLAG" ]; then
      git -C "$INSTALL_DIR" checkout "tags/$TAG_FLAG"
    else
      git -C "$INSTALL_DIR" reset --hard origin/main
    fi
    git -C "$INSTALL_DIR" submodule update --init --recursive
  else
    info "Clonando maestra em $INSTALL_DIR"
    git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
    git -C "$INSTALL_DIR" submodule update --init --recursive
  fi
fi

command -v node >/dev/null 2>&1 || error "node é obrigatório"
command -v npm >/dev/null 2>&1  || error "npm é obrigatório"

# Node >= 20 (fetch nativo, AbortSignal.timeout). Sem exigência de node:sqlite —
# o plugin não usa banco local (estado = plataforma de issues + repositório).
NODE_VERSION="$(node -e "process.stdout.write(process.versions.node)" 2>/dev/null || echo 0)"
NODE_MAJOR="$(echo "$NODE_VERSION" | cut -d. -f1)"
if [ "$NODE_MAJOR" -lt 20 ]; then
  error "Node >= 20.0.0 é obrigatório (encontrado: $NODE_VERSION)."
fi

info "Instalando dependências"
rm -rf "$INSTALL_DIR/node_modules"
npm ci --prefix "$INSTALL_DIR" 2>/dev/null || npm install --prefix "$INSTALL_DIR"

info "Compilando o plugin (tsc)"
npm run build --prefix "$INSTALL_DIR"

info "Gerando agente e registrando o plugin nos hosts"
INSTALLER_ARGS=()
if [ -n "$HOST_FLAG" ]; then
  INSTALLER_ARGS+=(--host "$HOST_FLAG")
fi
node "$INSTALL_DIR/dist/installer/install.js" "${INSTALLER_ARGS[@]}"

info ""
info "Pronto. Reinicie o OpenCode/Mimo Code para carregar o plugin e o agente."
info ""
info "Diretório de instalação: $INSTALL_DIR"
if [ -n "$HOST_FLAG" ]; then
  info "Hosts configurados: $HOST_FLAG"
else
  info "Hosts configurados: auto-detecção (todos os dirs de config existentes)"
fi
info ""
info "Como usar:"
info "  /agent maestra  — facilitador do fluxo (triagem → etapas → reconciliação)"
info "  maestra-report  — auditoria de instrumentação (eventos A–F)"
info ""
info "Para instalar também em outro host depois:"
info "  node $INSTALL_DIR/dist/installer/install.js --host opencode|mimocode"
