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

# Vercel uses shallow clones — fetch enough history to compare
# If the previous SHA isn't reachable, deepen until it is (max 100 commits)
if ! git cat-file -e "$VERCEL_GIT_PREVIOUS_SHA" 2>/dev/null; then
  echo "→ Fetching git history to reach previous deployment..."
  git fetch --deepen=100 2>/dev/null || true
fi

if ! git cat-file -e "$VERCEL_GIT_PREVIOUS_SHA" 2>/dev/null; then
  echo "→ Previous SHA $VERCEL_GIT_PREVIOUS_SHA not reachable — proceeding with build"
  exit 1
fi

DIRS="$@"

if [ -z "$DIRS" ]; then
  echo "→ No directories specified — proceeding with build"
  exit 1
fi

echo "→ Comparing $VERCEL_GIT_PREVIOUS_SHA..HEAD"

# Count total changed files between the two SHAs to sanity-check the diff works
TOTAL_CHANGED=$(git diff --name-only "$VERCEL_GIT_PREVIOUS_SHA" HEAD 2>/dev/null | wc -l | tr -d ' ')
echo "→ Total files changed since last deploy: $TOTAL_CHANGED"

if [ "$TOTAL_CHANGED" = "0" ]; then
  echo "→ No files changed at all — skipping build"
  exit 0
fi

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
  CHANGED=$(git diff --name-only "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- "$dir" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$CHANGED" != "0" ]; then
    echo "→ $CHANGED file(s) changed in $dir — proceeding with build"
    exit 1
  fi
done

echo "→ No relevant changes — skipping build"
exit 0
