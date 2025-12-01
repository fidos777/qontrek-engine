#!/bin/bash
# Test JSON-RPC 2.0 POST handler for Agent Builder compatibility

BASE_URL="${1:-http://localhost:3000}"
ENDPOINT="${BASE_URL}/api/mcp/solar"

echo "🧪 Testing JSON-RPC 2.0 POST Handler: ${ENDPOINT}"
echo ""

echo "1️⃣  Testing tools/list:"
RESPONSE=$(curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"test01","method":"tools/list"}')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ Validation:"
echo "$RESPONSE" | jq -e '.jsonrpc == "2.0"' >/dev/null 2>&1 && echo "  ✓ jsonrpc: 2.0" || echo "  ✗ jsonrpc missing or incorrect"
echo "$RESPONSE" | jq -e '.id == "test01"' >/dev/null 2>&1 && echo "  ✓ id matches request" || echo "  ✗ id mismatch"
echo "$RESPONSE" | jq -e '.result.tools | length == 4' >/dev/null 2>&1 && echo "  ✓ result.tools has 4 items" || echo "  ✗ tools array incorrect"
echo "$RESPONSE" | jq -e '.result.tools[0].name == "get_kpi_summary"' >/dev/null 2>&1 && echo "  ✓ first tool name correct" || echo "  ✗ tool name incorrect"

echo ""
echo "2️⃣  Testing tools/call (get_kpi_summary):"
RESPONSE2=$(curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"test02","method":"tools/call","params":{"name":"get_kpi_summary","arguments":{}}}')

echo "$RESPONSE2" | jq '.' 2>/dev/null || echo "$RESPONSE2"

echo ""
echo "✅ Validation:"
echo "$RESPONSE2" | jq -e '.jsonrpc == "2.0"' >/dev/null 2>&1 && echo "  ✓ jsonrpc: 2.0" || echo "  ✗ jsonrpc missing"
echo "$RESPONSE2" | jq -e '.id == "test02"' >/dev/null 2>&1 && echo "  ✓ id matches request" || echo "  ✗ id mismatch"
echo "$RESPONSE2" | jq -e 'has("result")' >/dev/null 2>&1 && echo "  ✓ result field present" || echo "  ✗ result field missing"
echo "$RESPONSE2" | jq -e '.result | has("content")' >/dev/null 2>&1 && echo "  ✓ result.content present" || echo "  ✗ result.content missing"

echo ""
echo "✅ All tests complete!"
