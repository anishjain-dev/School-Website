#!/usr/bin/env bash
# Runs before push: types, lint, build, and the redirect map guard.
# Install: .git/hooks/pre-push

set -euo pipefail

echo "==> astro check"
pnpm check

echo "==> lint"
pnpm lint

echo "==> build"
pnpm build

# _redirects is generated from the URL inventory, never hand-edited (WA-25).
if git diff --cached --name-only | grep -q '_redirects'; then
  if ! git log -1 --format=%B | grep -qi 'redirect-map-regen'; then
    echo ""
    echo "BLOCKED  _redirects was edited by hand."
    echo "         Regenerate it with: pnpm inventory && pnpm redirects"
    echo "         If this really is a regen, include 'redirect-map-regen' in the message."
    exit 1
  fi
fi

echo "==> ok"
