#!/usr/bin/env bash
# Blocks binary media from entering git.
#
# Git history is permanent. A committed photograph survives consent withdrawal
# in every clone, forever — breaking WA-36 and WA-41. Media belongs in
# Cloudflare Images / R2, referenced by ID.
#
# Install: .git/hooks/pre-commit  (or wire into husky / lefthook)

set -euo pipefail

BLOCKED_EXT='jpg|jpeg|png|gif|webp|avif|bmp|tiff|heic|mp4|mov|avi|webm|mkv|mp3|wav|m4a'
# Narrow carve-out for institution crests (VK, 2026-07-29) — see scripts/lint.mjs for the full
# reasoning. Short version: rule 1 protects a data subject whose consent can be withdrawn, and a
# university's own published mark has neither. The size ceiling below still applies inside it, and
# nothing here permits a photograph of a person.
ALLOW_DIR='^(packages/ui/src/icons/|public/favicon|docs/|sites/[^/]+/public/logos/)'
MAX_BYTES=51200   # 50KB — inline SVG and favicons only

staged=$(git diff --cached --name-only --diff-filter=ACM)
fail=0

while IFS= read -r f; do
  [ -z "$f" ] && continue

  # Allow-list first: checking the extension before it would make the carve-out unreachable.
  if echo "$f" | grep -qE "$ALLOW_DIR"; then continue; fi

  if echo "$f" | grep -qiE "\.($BLOCKED_EXT)$"; then
    echo "BLOCKED  $f"
    echo "         Binary media must not enter git. Upload to Cloudflare Images"
    echo "         and reference by ID. See CLAUDE.md hard rule 1."
    fail=1
    continue
  fi

  if [ -f "$f" ]; then
    size=$(wc -c < "$f" | tr -d ' ')
    if [ "$size" -gt "$MAX_BYTES" ] && file --mime-encoding "$f" | grep -q binary; then
      echo "BLOCKED  $f  (${size} bytes)"
      echo "         Large binary. If this is media, it belongs in Cloudflare."
      fail=1
    fi
  fi
done <<< "$staged"

if [ "$fail" -ne 0 ]; then
  echo ""
  echo "Commit rejected. Override only with a written reason and a WA reference."
  exit 1
fi
