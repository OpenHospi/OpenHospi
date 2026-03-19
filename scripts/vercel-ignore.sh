#!/bin/bash
# =============================================================================
# Vercel Ignored Build Step
# =============================================================================
# Skip preview deployments for Dependabot branches.
# All other commits proceed with build.
#
# Exit codes (Vercel convention):
#   0 = skip build
#   1 = proceed with build
# =============================================================================

# Skip preview deployments for Dependabot branches
if [[ "$VERCEL_GIT_COMMIT_REF" == dependabot/* ]]; then
  echo "🛑 - Dependabot branch — skipping preview build"
  exit 0
fi

echo "✅ - Proceeding with build"
exit 1
