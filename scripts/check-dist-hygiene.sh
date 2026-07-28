#!/usr/bin/env bash
# Dist hygiene: zero test files / fixtures / __tests__ in the build output.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -d "$ROOT/dist" ]; then
  echo "dist hygiene: dist/ does not exist — run npm run build first"
  exit 1
fi

ARTIFACTS=$(find "$ROOT/dist" \( -name "*.test.*" -o -path "*__tests__*" -o -path "*fixtures*" \) 2>/dev/null)
if [ -n "$ARTIFACTS" ]; then
  echo "dist hygiene FAILURE:"
  echo "$ARTIFACTS"
  exit 1
fi
echo "dist hygiene OK (0 test/fixture artifacts in dist/)"
