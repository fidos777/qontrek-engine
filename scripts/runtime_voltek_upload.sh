#!/bin/bash
set -euo pipefail
echo "🧩 Voltek Upload Runtime Start"

VENV_BIN="${VENV_BIN:-$HOME/Documents/qontrek-engine/.venv/bin/activate}"
PY_CONVERTER="${PY_CONVERTER:-$HOME/Documents/qontrek-engine/convert_voltek_fixtures.py}"
TOWER_URL="${TOWER_URL:-http://localhost:3000/api/tower/seal-review}"
TOWER_TOKEN="${TOWER_TOKEN:-dev-token}"

source "$VENV_BIN"
cd "$(dirname "$PY_CONVERTER")"
python3 "$PY_CONVERTER" && STATUS=success || STATUS=failure

curl --fail --show-error -sS -X POST "$TOWER_URL" \
  -H "Authorization: Bearer $TOWER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"gate\":\"G19.9.1\",\"status\":\"$STATUS\"}"

echo "{\"timestamp\":\"$(date -u +%FT%TZ)\",\"gate\":\"G19.9.1\",\"status\":\"$STATUS\"}" \
  > proof/runtime_log_v19_9_1.json

echo "✅ Runtime completed ($STATUS)"
