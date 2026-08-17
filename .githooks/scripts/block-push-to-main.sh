#!/usr/bin/env bash
# Prevents direct pushes to main. Branch, PR, preview deploy, merge.
# Install: .git/hooks/pre-push

set -euo pipefail
protected="main"

while read -r _local_ref _local_sha remote_ref _remote_sha; do
  branch="${remote_ref#refs/heads/}"
  if [ "$branch" = "$protected" ]; then
    echo "BLOCKED  direct push to '$protected'."
    echo "         Branch, open a PR, check the Cloudflare preview, then merge."
    exit 1
  fi
done
