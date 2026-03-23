#!/bin/bash
# =============================================================================
# Vercel Ignored Build Step
# =============================================================================
# Skips builds when no relevant files changed, using VERCEL_GIT_PREVIOUS_SHA
# (the last successful deployment SHA) for comparison.
#
# Usage in vercel.json:
#   "ignoreCommand": "bash ../../scripts/vercel-ignore.sh apps/web packages/shared ..."
#
# Exit codes (Vercel convention):
#   0 = skip build
#   1 = proceed with build
# =============================================================================

# 1. Always skip Dependabot branches
if [[ "$VERCEL_GIT_COMMIT_REF" == dependabot/* ]]; then
  echo "Skip: Dependabot branch"
  exit 0
fi

# 2. No path args = always build (safety fallback)
if [ "$#" -eq 0 ]; then
  echo "Build: no watch paths specified"
  exit 1
fi

# 3. Determine the base SHA for comparison
# VERCEL_GIT_PREVIOUS_SHA = last successful deployment SHA (official Vercel env var)
# Falls back to HEAD^ for first deployment when no previous SHA exists
if [ -n "$VERCEL_GIT_PREVIOUS_SHA" ]; then
  BASE_SHA="$VERCEL_GIT_PREVIOUS_SHA"
else
  echo "No previous deployment SHA found, falling back to HEAD^"
  BASE_SHA="HEAD^"
fi

# 4. Check if any watched paths or root config files changed
# git diff --quiet exits 0 if no changes, 1 if changes exist
# This maps directly to Vercel's convention (0=skip, 1=build)
git diff "$BASE_SHA" HEAD --quiet -- "$@" \
  package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json
