#!/bin/bash
# =============================================================================
# Vercel Ignored Build Step
# =============================================================================
# Skips the build if no relevant files changed for this app.
# Uses HEAD^ (parent commit) comparison — works with Vercel's shallow clone.
#
# Usage in vercel.json:
#   "ignoreCommand": "bash ../../scripts/vercel-ignore.sh apps/web packages/database packages/shared"
#
# Exit codes (Vercel convention):
#   0 = skip build (no changes)
#   1 = proceed with build (changes detected)
# =============================================================================

# Skip preview deployments for Dependabot branches
if [[ "$VERCEL_GIT_COMMIT_REF" == dependabot/* ]]; then
  echo "🛑 - Dependabot branch — skipping preview build"
  exit 0
fi

# Check root config files that affect all apps (dependency updates, version bumps)
if ! git diff HEAD^ HEAD --quiet -- ../../pnpm-lock.yaml ../../package.json ../../pnpm-workspace.yaml; then
  echo "✅ - Root config changed — proceeding with build"
  exit 1
fi

# Check each watched directory for changes
for dir in "$@"; do
  if ! git diff HEAD^ HEAD --quiet -- "../../$dir"; then
    echo "✅ - Changes in $dir — proceeding with build"
    exit 1
  fi
done

echo "🛑 - No relevant changes — skipping build"
exit 0
