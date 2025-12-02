#!/bin/bash
# MCP Solar API Test Script
BASE_URL="${1:-http://localhost:3000}"
ENDPOINT="${BASE_URL}/api/mcp/solar"

echo "🧪 Testing MCP Solar API: ${ENDPOINT}"
echo ""

echo "1️⃣  GET Discovery:"
curl -s "${ENDPOINT}" | jq '.' || curl -s "${ENDPOINT}"
echo -e "\n"

echo "2️⃣  JSON-RPC tools/list:"
curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.' || curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
echo -e "\n"

echo "3️⃣  JSON-RPC tools/call (get_kpi_summary):"
curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_kpi_summary","arguments":{}}}' | jq '.' || curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_kpi_summary","arguments":{}}}'
echo -e "\n"

echo "✅ Tests complete!"

