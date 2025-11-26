#!/usr/bin/env bash
# scripts/test-mcp.sh
# Usage: ./scripts/test-mcp.sh [BASE_URL]
# Default BASE_URL: http://localhost:3000

set -o pipefail

BASE_URL="${1:-http://localhost:3000}"
TIMEOUT=20

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

total=0
passed=0
failed=0

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}         Qontrek MCP Endpoint Test Suite        ${NC}"
echo -e "${BLUE}================================================${NC}"
echo "Base URL: ${BASE_URL}"
echo "Timeout:  ${TIMEOUT}s"
echo "------------------------------------------------"
echo

require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    echo -e "${RED}jq is required but not installed. Install jq and retry.${NC}"
    exit 1
  fi
}

timed_curl() {
  local method=$1
  local url=$2
  local data=${3:-}
  local start end elapsed

  start=$(date +%s%3N)
  if [[ "$method" == "GET" ]]; then
    curl -sS --max-time "${TIMEOUT}" "${url}"
  else
    curl -sS --max-time "${TIMEOUT}" -X "$method" -H "Content-Type: application/json" -d "${data}" "${url}"
  fi
  end=$(date +%s%3N)
  elapsed=$((end - start))
  echo "::TIME_MS::${elapsed}"
}

run_test() {
  local name="$1"
  local method="$2"
  local path="$3"
  local validate_fn="$4"
  local data="${5:-}"

  total=$((total + 1))

  echo -e "${YELLOW}Test ${total}: ${name}${NC}"
  echo "  ${method} ${path}"

  local url="${BASE_URL}${path}"
  local raw
  if [[ -n "$data" ]]; then
    raw=$(timed_curl "$method" "$url" "$data")
  else
    raw=$(timed_curl "$method" "$url")
  fi

  local time_ms
  time_ms=$(echo "$raw" | awk -F'::TIME_MS::' 'NF>1{print $2}')
  local body
  body=$(echo "$raw" | sed 's/::TIME_MS::.*//' )

  if [[ -z "$body" ]]; then
    echo -e "  ${RED}❌ FAIL - empty response${NC}"
    failed=$((failed + 1))
    echo
    return
  fi

  local status
  status=$(echo "$body" | jq -r '."status" // .status // .code // 200' 2>/dev/null || echo 200)

  # Delegate to validate function
  if "$validate_fn" "$body"; then
    echo -e "  ${GREEN}✅ PASS${NC}"
    [[ -n "$time_ms" ]] && echo "  Time: ${time_ms}ms"
    passed=$((passed + 1))
  else
    echo -e "  ${RED}❌ FAIL${NC}"
    [[ -n "$time_ms" ]] && echo "  Time: ${time_ms}ms"
    echo "  Response:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    failed=$((failed + 1))
  fi

  echo
}

# ---- Validators ----

validate_manifest() {
  local body="$1"
  local count
  count=$(echo "$body" | jq '.toolCount // (.tools | length) // 0' 2>/dev/null)
  [[ "$count" -ge 8 ]]
}

validate_tenants() {
  local body="$1"
  local hasTenants
  hasTenants=$(echo "$body" | jq 'has("tenants")' 2>/dev/null)
  [[ "$hasTenants" == "true" ]]
}

validate_pipeline() {
  local body="$1"
  local tr
  tr=$(echo "$body" | jq '.summary.totalRecoverable // .summary.total_recoverable // 0' 2>/dev/null)
  [[ "$tr" -gt 0 ]]
}

validate_leads() {
  local body="$1"
  local isArray
  isArray=$(echo "$body" | jq '(.leads | type == "array")' 2>/dev/null)
  [[ "$isArray" == "true" ]]
}

validate_governance() {
  local body="$1"
  local hasScore
  hasScore=$(echo "$body" | jq 'has("overallScore") or .data?.overallScore? != null' 2>/dev/null)
  [[ "$hasScore" == "true" ]]
}

validate_proof_post() {
  local body="$1"
  local ack
  ack=$(echo "$body" | jq '.tower.acknowledged' 2>/dev/null)
  [[ "$ack" == "true" ]]
}

validate_proof_get() {
  local body="$1"
  local id
  id=$(echo "$body" | jq -r '.proof.id // empty' 2>/dev/null)
  [[ -n "$id" ]]
}

validate_healthz() {
  local body="$1"
  local status
  status=$(echo "$body" | jq -r '.status // empty' 2>/dev/null)
  [[ "$status" == "healthy" ]]
}

validate_tail() {
  local body="$1"
  # Just ensure it's valid JSON and has something
  local ok
  ok=$(echo "$body" | jq 'length >= 0' 2>/dev/null || echo "false")
  [[ "$ok" != "false" ]]
}

# ---- Run tests ----

require_jq

run_test "MCP Manifest"           "GET"  "/api/mcp/manifest"        validate_manifest
run_test "Tenants"                "GET"  "/api/mcp/tenants"         validate_tenants
run_test "Pipeline Summary"       "GET"  "/api/mcp/pipeline"        validate_pipeline
run_test "Critical Leads"         "GET"  "/api/mcp/leads"           validate_leads
run_test "Governance Status"      "GET"  "/api/mcp/governance"      validate_governance
run_test "Proof Refresh (POST)"   "POST" "/api/mcp/proof/refresh"   validate_proof_post '{}'
run_test "Proof Refresh (GET)"    "GET"  "/api/mcp/proof/refresh"   validate_proof_get
run_test "Health Check"           "GET"  "/api/mcp/healthz"         validate_healthz
run_test "Tail Logs"              "GET"  "/api/mcp/tail"            validate_tail

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}                 TEST SUMMARY                  ${NC}"
echo -e "${BLUE}================================================${NC}"
echo "Total tests: $total"
echo -e "Passed:      ${GREEN}${passed}${NC}"
echo -e "Failed:      ${RED}${failed}${NC}"
echo "------------------------------------------------"

if [[ "$failed" -eq 0 ]]; then
  echo -e "${GREEN}ALL TESTS PASSED${NC}"
  exit 0
else
  echo -e "${RED}SOME TESTS FAILED${NC}"
  exit 1
fi
