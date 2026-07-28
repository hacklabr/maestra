#!/usr/bin/env bash
# Neutral-vocabulary grep-assert (ADR-012; spec acceptance criterion #3).
# No GitHub/GitLab-specific terms in instructions OUTSIDE the cookbooks.
# Platform names are allowed ONLY in anti-drift source citations ("a fonte diz…")
# and in templates/config.md (the config VALUES are literally github|gitlab).
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INSTRUCTIONS="$ROOT/src/instructions"
FAIL=0

is_excluded() {
  case "$1" in
    *reference/cookbook-github.md | *reference/cookbook-gitlab.md | *templates/config.md) return 0 ;;
    *) return 1 ;;
  esac
}

while IFS= read -r file; do
  is_excluded "$file" && continue
  rel="${file#"$INSTRUCTIONS"/}"
  while IFS= read -r hit; do
    line="${hit%%:*}"
    content="${hit#*:}"
    case "$content" in
      *"fonte diz"*) continue ;; # anti-drift source citation — allowed
      *"source says"*) continue ;; # anti-drift source citation (EN) — allowed
      *"source said"*) continue ;; # anti-drift source citation (EN, past tense) — allowed
    esac
    # Pointers AT the cookbook files are legitimate (the kernel must name them);
    # strip the filenames before testing for real dialect terms.
    stripped=$(echo "$content" | sed 's/cookbook-github\.md//g; s/cookbook-gitlab\.md//g')
    echo "$stripped" | grep -qiE 'github|gitlab|\bglab\b|\bgh\b|Projects v2|sub-?issues?\b' || continue
    echo "VIOLATION [$rel:$line] $content"
    FAIL=1
  done < <(grep -inE 'github|gitlab|\bglab\b|\bgh\b|Projects v2|sub-?issues?\b' "$file" || true)
  # "PR" without "MR" on the same line
  while IFS= read -r hit; do
    echo "VIOLATION [$rel:${hit%%:*}] ${hit#*:}  (PR sem MR)"
    FAIL=1
  done < <(grep -nE '\bPR\b' "$file" | grep -v '\bMR\b' || true)
done < <(find "$INSTRUCTIONS" -name "*.md" | sort)

if [ "$FAIL" -ne 0 ]; then
  echo "neutral-vocabulary check FAILED"
  exit 1
fi
echo "neutral-vocabulary check OK (instructions are platform-neutral outside cookbooks)"
