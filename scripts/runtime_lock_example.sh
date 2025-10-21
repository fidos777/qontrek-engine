#!/usr/bin/env bash
set -euo pipefail

mkdir -p proof

LOCK=proof/.lock_v19_1

if mkdir "$LOCK" 2>/dev/null; then
  trap "rmdir '$LOCK'" EXIT
else
  echo "lock busy"
  exit 1
fi

START=$(date +%s)

if [[ ! -f proof/v19_1_frontend_certification.json ]]; then
  ./scripts/proof_write_fallback.sh
fi

END=$(date +%s)
echo "lock_held_seconds=$((END-START))" >> proof/.lock_metrics
echo "🔒 lock released"
