#!/bin/bash
# Test MCP GET Discovery endpoint for Agent Builder compatibility

BASE_URL="${1:-http://localhost:3000}"
ENDPOINT="${BASE_URL}/api/mcp/solar"

echo "🧪 Testing MCP GET Discovery: ${ENDPOINT}"
echo ""

echo "📡 GET Request:"
RESPONSE=$(curl -s -X GET "${ENDPOINT}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ Validation Checks:"
echo "$RESPONSE" | jq -e '.mcp_server == true' >/dev/null 2>&1 && echo "  ✓ mcp_server: true" || echo "  ✗ mcp_server missing or false"
echo "$RESPONSE" | jq -e '.version == "1.0"' >/dev/null 2>&1 && echo "  ✓ version: 1.0" || echo "  ✗ version incorrect"
echo "$RESPONSE" | jq -e '.capabilities.jsonrpc == true' >/dev/null 2>&1 && echo "  ✓ capabilities.jsonrpc: true" || echo "  ✗ capabilities.jsonrpc missing"
echo "$RESPONSE" | jq -e '.capabilities.tool_calling == true' >/dev/null 2>&1 && echo "  ✓ capabilities.tool_calling: true" || echo "  ✗ capabilities.tool_calling missing"
echo "$RESPONSE" | jq -e '.capabilities.edge_runtime == true' >/dev/null 2>&1 && echo "  ✓ capabilities.edge_runtime: true" || echo "  ✗ capabilities.edge_runtime missing"
echo "$RESPONSE" | jq -e '.tools | length == 4' >/dev/null 2>&1 && echo "  ✓ tools array has 4 items" || echo "  ✗ tools array incorrect length"
echo "$RESPONSE" | jq -e '.server_info.name == "qontrek-mcp-solar"' >/dev/null 2>&1 && echo "  ✓ server_info.name correct" || echo "  ✗ server_info.name incorrect"
echo "$RESPONSE" | jq -e '.server_info.owner == "Qontrek"' >/dev/null 2>&1 && echo "  ✓ server_info.owner correct" || echo "  ✗ server_info.owner incorrect"

echo ""
echo "✅ Test complete!"
