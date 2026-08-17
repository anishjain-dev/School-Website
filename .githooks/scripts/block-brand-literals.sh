#!/usr/bin/env bash
# Blocks hardcoded brand colours in components.
#
# Brand resolves from the campus segment at build time. A component with a
# colour literal cannot be themed. See CLAUDE.md hard rule 2.
#
# Install: .git/hooks/pre-commit

set -euo pipefail

# Brand files are the ONLY place hex literals are legitimate.
ALLOW='^packages/tokens/'
SCAN='^(packages/ui/|sites/)'

staged=$(git diff --cached --name-only --diff-filter=ACM \
         | grep -E '\.(astro|css|ts|tsx|jsx|svelte|vue)$' || true)
fail=0

while IFS= read -r f; do
  [ -z "$f" ] && continue
  echo "$f" | grep -qE "$ALLOW" && continue
  echo "$f" | grep -qE "$SCAN"  || continue
  [ -f "$f" ] || continue

  # 3-, 6- or 8-digit hex, and rgb()/hsl() literals
  hits=$(grep -nEi '#[0-9a-f]{3,8}\b|rgba?\([0-9]|hsla?\([0-9]' "$f" || true)
  if [ -n "$hits" ]; then
    echo "BLOCKED  $f"
    echo "$hits" | sed 's/^/         /'
    echo "         Use var(--accent) etc. Literals belong in packages/tokens/brands/."
    fail=1
  fi

  # Browser storage — hard rule 3
  store=$(grep -nE 'localStorage|sessionStorage|indexedDB' "$f" || true)
  if [ -n "$store" ]; then
    echo "BLOCKED  $f"
    echo "$store" | sed 's/^/         /'
    echo "         Browser storage APIs are not permitted. See CLAUDE.md hard rule 3."
    fail=1
  fi
done <<< "$staged"

[ "$fail" -eq 0 ] || { echo ""; echo "Commit rejected."; exit 1; }
