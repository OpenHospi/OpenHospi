#!/usr/bin/env bash
# =============================================================================
# Vercel Ignored Build Step
# =============================================================================
# Skips the build if no relevant files changed for this app.
# Usage in vercel.json:  "ignoreCommand": "bash ../../scripts/vercel-ignore.sh apps/web packages/database packages/shared ..."
#
# Exit codes (Vercel convention):
#   0 = skip build (no changes)
#   1 = proceed with build (changes detected)
# =============================================================================

set -euo pipefail

if [ -z "${VERCEL_GIT_PREVIOUS_SHA:-}" ]; then
  echo "→ No previous deployment found — proceeding with build"
  exit 1
fi

DIRS="$@"

if [ -z "$DIRS" ]; then
  echo "→ No directories specified — proceeding with build"
  exit 1
fi

echo "→ Checking for changes in: $DIRS"

for dir in $DIRS; do
  if ! git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- "$dir"; then
    echo "→ Changes detected in $dir — proceeding with build"
    exit 1
  fi
done

echo "→ No relevant changes — skipping build"
exit 0
