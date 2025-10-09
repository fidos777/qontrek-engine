#!/bin/zsh
set -euo pipefail
export BASE_URL=${BASE_URL:-http://127.0.0.1:8000}
echo "▶ $BASE_URL"

curl -sS "$BASE_URL/healthz" | jq .

curl -sS -X POST "$BASE_URL/ops/demo" \
  -H "Content-Type: application/json" \
  -d '{"mode":"strict","mock":true,"tenants":["Voltek_EN","Voltek_MS"]}' | jq .

curl -sS -X POST "$BASE_URL/ops/templates/batch" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: demo-001" \
  -d '{"mock":true,"batches":[
        {"tenant":"Voltek_MS","templates":["VOLTEK_GREETING_MS","VOLTEK_DOC_CHECKLIST_MS"]},
        {"tenant":"Voltek_EN","templates":["VOLTEK_GREETING_EN"]}
      ]}' | jq .

curl -sS -X POST "$BASE_URL/ops/rules/trigger" \
  -H "Content-Type: application/json" \
  -d '{"tenant":"Voltek_MS","rule":"Dormant_7d","dry_run":true}' | jq .

curl -sS "$BASE_URL/ops/logs?tenant=Voltek_MS&limit=20" | jq .
curl -sS "$BASE_URL/cfo/pack?tenant=Voltek_MS" | jq .
echo "✅ smoke ok"
