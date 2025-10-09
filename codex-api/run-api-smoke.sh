#!/bin/zsh
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8000}"
IDEMP="demo-001" # ok to reuse for idempotent batch
TENANT="${TENANT:-Voltek_MS}"

echo "▶ Base URL: $BASE_URL  Tenant: $TENANT"
[ -f .venv/bin/activate ] && source .venv/bin/activate || true

# start server in background if not already listening
if ! curl -fsS "$BASE_URL/healthz" >/dev/null 2>&1; then
  echo "🚀 Starting uvicorn..."
  ( uvicorn main:app --host 0.0.0.0 --port 8000 --reload >/tmp/codex-api.log 2>&1 ) &
  SERVER_PID=$!
  # wait for healthz → current API returns {"status":"ok"}
  echo "⏳ Waiting for /healthz ..."
  for i in {1..30}; do
    if curl -fsS "$BASE_URL/healthz" | grep -q '"status":"ok"'; then
      echo "✅ Engine ready"
      break
    fi
    sleep 1
  done
else
  echo "ℹ️  Server already running"
  SERVER_PID=""
fi

# ---- Smoke suite (only endpoints your openapi shows) ----
echo "🔎 GET /healthz"
curl -sS "$BASE_URL/healthz" | jq .

echo "🧪 POST /ops/demo"
curl -sS -X POST "$BASE_URL/ops/demo" \
  -H "Content-Type: application/json" \
  -d "{\"mode\":\"strict\",\"mock\":true,\"tenants\":[\"Voltek_EN\",\"$TENANT\"]}" | jq .

echo "📦 POST /ops/templates/batch"
curl -sS -X POST "$BASE_URL/ops/templates/batch" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: $IDEMP" \
  -d "{\"mock\":true,\"batches\":[
        {\"tenant\":\"$TENANT\",\"templates\":[\"VOLTEK_GREETING_MS\",\"VOLTEK_DOC_CHECKLIST_MS\"]},
        {\"tenant\":\"Voltek_EN\",\"templates\":[\"VOLTEK_GREETING_EN\"]}
      ]}" | jq .

echo "🧪 POST /ops/rules/trigger (dry-run)"
curl -sS -X POST "$BASE_URL/ops/rules/trigger" \
  -H "Content-Type: application/json" \
  -d "{\"tenant\":\"$TENANT\",\"rule\":\"Dormant_7d\",\"dry_run\":true}" | jq .

echo "🗒  GET /ops/logs (latest 20)"
curl -sS "$BASE_URL/ops/logs?tenant=$TENANT&limit=20" | jq .

echo "📑 GET /cfo/pack"
curl -sS "$BASE_URL/cfo/pack?tenant=$TENANT" | jq .

# ---- Teardown if we started the server ----
if [ -n "${SERVER_PID:-}" ]; then
  echo "🛑 Stopping server pid=$SERVER_PID"
  kill "$SERVER_PID" || true
fi
echo "🎉 Smoke complete."
