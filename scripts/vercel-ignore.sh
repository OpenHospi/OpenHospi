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

# Skip preview deployments for Dependabot branches — only build on merge to main
BRANCH="${VERCEL_GIT_COMMIT_REF:-}"
if [[ "$BRANCH" == dependabot/* ]]; then
  echo "→ Dependabot branch ($BRANCH) — skipping preview build"
  exit 0
fi

if [ -z "${VERCEL_GIT_PREVIOUS_SHA:-}" ]; then
  echo "→ No previous deployment found — proceeding with build"
  exit 1
fi

# Verify the previous SHA actually exists in git history
# (first deploy of a new project may reference an unknown commit)
if ! git cat-file -e "$VERCEL_GIT_PREVIOUS_SHA" 2>/dev/null; then
  echo "→ Previous SHA not found in git history — proceeding with build"
  exit 1
fi

DIRS="$@"

if [ -z "$DIRS" ]; then
  echo "→ No directories specified — proceeding with build"
  exit 1
fi

echo "→ Comparing $VERCEL_GIT_PREVIOUS_SHA..HEAD"

# Always rebuild if lockfile or root config changed (dependency updates, version bumps)
ROOT_FILES="pnpm-lock.yaml package.json pnpm-workspace.yaml"
for file in $ROOT_FILES; do
  if ! git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- "$file"; then
    echo "→ $file changed — proceeding with build"
    exit 1
  fi
done

echo "→ Checking for changes in: $DIRS"

for dir in $DIRS; do
  # If the directory didn't exist at the previous SHA, it's new — must build
  if ! git rev-parse --verify "$VERCEL_GIT_PREVIOUS_SHA:$dir" &>/dev/null; then
    echo "→ $dir is new (didn't exist at previous deploy) — proceeding with build"
    exit 1
  fi

  if ! git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- "$dir"; then
    echo "→ Changes detected in $dir — proceeding with build"
    exit 1
  fi
done

echo "→ No relevant changes — skipping build"
exit 0
