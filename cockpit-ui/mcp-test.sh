#!/bin/bash

# MCP Solar API Test Harness
# Tests GET discovery and JSON-RPC 2.0 handlers

set -e

BASE_URL="${1:-http://localhost:3000}"
ENDPOINT="${BASE_URL}/api/mcp/solar"

echo "🧪 Testing MCP Solar API at ${ENDPOINT}"
echo ""

# Test 1: GET Discovery
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: GET Discovery"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -X GET "${ENDPOINT}" -H "Accept: application/json")
echo "${RESPONSE}" | jq '.' 2>/dev/null || echo "${RESPONSE}"
echo ""

# Validate GET response structure
if echo "${RESPONSE}" | jq -e '.mcp_server == true and .version == "1.0" and .tools | length == 4' > /dev/null 2>&1; then
  echo "✅ GET discovery: VALID"
else
  echo "❌ GET discovery: INVALID - Response structure incorrect"
  exit 1
fi
echo ""

# Test 2: tools/list
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: JSON-RPC tools/list"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"list01","method":"tools/list"}')
echo "${RESPONSE}" | jq '.' 2>/dev/null || echo "${RESPONSE}"
echo ""

# Validate tools/list response
if echo "${RESPONSE}" | jq -e '.jsonrpc == "2.0" and .id == "list01" and .result.tools | length == 4' > /dev/null 2>&1; then
  echo "✅ tools/list: VALID"
else
  echo "❌ tools/list: INVALID - Response structure incorrect"
  exit 1
fi
echo ""

# Test 3: tools/call - get_kpi_summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: JSON-RPC tools/call (get_kpi_summary)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"kpi01","method":"tools/call","params":{"name":"get_kpi_summary"}}')
echo "${RESPONSE}" | jq '.' 2>/dev/null || echo "${RESPONSE}"
echo ""

# Validate tools/call response
if echo "${RESPONSE}" | jq -e '.jsonrpc == "2.0" and .id == "kpi01" and (.result.content != null or .error != null)' > /dev/null 2>&1; then
  echo "✅ tools/call (get_kpi_summary): VALID"
else
  echo "❌ tools/call (get_kpi_summary): INVALID - Response structure incorrect"
  exit 1
fi
echo ""

# Test 4: tools/call - get_critical_leads
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: JSON-RPC tools/call (get_critical_leads)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"leads01","method":"tools/call","params":{"name":"get_critical_leads"}}')
echo "${RESPONSE}" | jq '.' 2>/dev/null || echo "${RESPONSE}"
echo ""

if echo "${RESPONSE}" | jq -e '.jsonrpc == "2.0" and .id == "leads01" and (.result.content != null or .error != null)' > /dev/null 2>&1; then
  echo "✅ tools/call (get_critical_leads): VALID"
else
  echo "❌ tools/call (get_critical_leads): INVALID"
  exit 1
fi
echo ""

# Test 5: Error handling - Invalid method
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 5: Error handling (invalid method)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"err01","method":"invalid_method"}')
echo "${RESPONSE}" | jq '.' 2>/dev/null || echo "${RESPONSE}"
echo ""

if echo "${RESPONSE}" | jq -e '.jsonrpc == "2.0" and .error.code == -32601' > /dev/null 2>&1; then
  echo "✅ Error handling: VALID (returns -32601 for method not found)"
else
  echo "❌ Error handling: INVALID"
  exit 1
fi
echo ""

# Test 6: Error handling - Missing tool name
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 6: Error handling (missing tool name)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"err02","method":"tools/call","params":{}}')
echo "${RESPONSE}" | jq '.' 2>/dev/null || echo "${RESPONSE}"
echo ""

if echo "${RESPONSE}" | jq -e '.jsonrpc == "2.0" and .error.code == -32602' > /dev/null 2>&1; then
  echo "✅ Error handling: VALID (returns -32602 for invalid params)"
else
  echo "❌ Error handling: INVALID"
  exit 1
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All MCP tests passed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"


