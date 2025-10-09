#!/usr/bin/env bash
set -euo pipefail
LAST_TAG="$(git describe --tags --abbrev=0 2>/dev/null || true)"
if [ -z "$LAST_TAG" ]; then
  echo "No tags found; nothing to rollback to."
  exit 0
fi
echo "Rolling back to ${LAST_TAG}..."
git reset --hard "$LAST_TAG"
echo "✅ Restored to $LAST_TAG"
