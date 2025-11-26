#!/bin/bash
#
# MCP Endpoints Test Script
# Tests all 10 MCP endpoints and reports results
#
# Usage: ./scripts/test-mcp.sh [BASE_URL]
# Default BASE_URL: http://localhost:3000
#

set -o pipefail

# Configuration
BASE_URL="${1:-http://localhost:3000}"
TIMEOUT=30

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Results array for summary
declare -a TEST_RESULTS

echo ""
echo -e "${BOLD}${BLUE}================================================${NC}"
echo -e "${BOLD}${BLUE}       MCP Endpoints Test Suite${NC}"
echo -e "${BOLD}${BLUE}================================================${NC}"
echo -e "${CYAN}Base URL:${NC} ${BASE_URL}"
echo -e "${CYAN}Timeout:${NC}  ${TIMEOUT}s"
echo -e "${BLUE}------------------------------------------------${NC}"
echo ""

# Function to run a test
# Args: $1=method, $2=endpoint, $3=description, $4=validation_jq_filter, $5=expected_description
run_test() {
    local method="$1"
    local endpoint="$2"
    local description="$3"
    local jq_filter="$4"
    local expected="$5"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -e "${BOLD}Test ${TOTAL_TESTS}: ${description}${NC}"
    echo -e "${CYAN}  ${method} ${endpoint}${NC}"

    local url="${BASE_URL}${endpoint}"
    local start_time=$(date +%s%3N)
    local response
    local http_code
    local body

    # Make request based on method
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            --max-time "$TIMEOUT" \
            "$url" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" \
            --max-time "$TIMEOUT" \
            "$url" 2>&1)
    fi

    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))

    # Extract HTTP code (last line) and body (everything else)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    # Check if curl failed (connection refused, timeout, etc.)
    if ! [[ "$http_code" =~ ^[0-9]+$ ]]; then
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "  ${RED}❌ FAIL${NC} - Connection error"
        echo -e "  ${YELLOW}Error:${NC} $response"
        echo -e "  ${CYAN}Time:${NC} ${duration}ms"
        TEST_RESULTS+=("❌ ${description}")
        echo ""
        return 1
    fi

    # Check HTTP status
    if [ "$http_code" -lt 200 ] || [ "$http_code" -ge 300 ]; then
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "  ${RED}❌ FAIL${NC} - HTTP ${http_code}"
        echo -e "  ${YELLOW}Response:${NC} $(echo "$body" | head -c 200)"
        echo -e "  ${CYAN}Time:${NC} ${duration}ms"
        TEST_RESULTS+=("❌ ${description}")
        echo ""
        return 1
    fi

    # Validate response with jq filter
    local validation_result
    validation_result=$(echo "$body" | jq -e "$jq_filter" 2>&1)
    local jq_exit_code=$?

    if [ $jq_exit_code -ne 0 ]; then
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "  ${RED}❌ FAIL${NC} - Validation failed"
        echo -e "  ${YELLOW}Expected:${NC} ${expected}"
        echo -e "  ${YELLOW}Got:${NC} $(echo "$body" | jq -c '.' 2>/dev/null | head -c 300 || echo "$body" | head -c 300)"
        echo -e "  ${CYAN}Time:${NC} ${duration}ms"
        TEST_RESULTS+=("❌ ${description}")
        echo ""
        return 1
    fi

    # Success
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "  ${GREEN}✅ PASS${NC} - HTTP ${http_code}"
    echo -e "  ${CYAN}Validated:${NC} ${expected}"
    echo -e "  ${CYAN}Time:${NC} ${duration}ms"
    TEST_RESULTS+=("✅ ${description}")
    echo ""
    return 0
}

# =============================================================================
# Test 1: GET /api/mcp/manifest
# =============================================================================
run_test "GET" "/api/mcp/manifest" \
    "MCP Manifest - Tool Discovery" \
    '.tools | length >= 10' \
    "tools.length >= 10"

# =============================================================================
# Test 2: GET /api/mcp/tenants
# =============================================================================
run_test "GET" "/api/mcp/tenants" \
    "Tenants - List All Tenants" \
    '.data.tenants' \
    "data.tenants exists"

# =============================================================================
# Test 3: GET /api/mcp/pipeline
# =============================================================================
run_test "GET" "/api/mcp/pipeline" \
    "Pipeline - Revenue Summary" \
    '.data.summary.total_recoverable > 0' \
    "data.summary.total_recoverable > 0"

# =============================================================================
# Test 4: GET /api/mcp/leads
# =============================================================================
run_test "GET" "/api/mcp/leads" \
    "Leads - Lead List" \
    '.data.leads | type == "array"' \
    "data.leads is array"

# =============================================================================
# Test 5: GET /api/mcp/governance
# =============================================================================
run_test "GET" "/api/mcp/governance" \
    "Governance - Score Overview" \
    '.data.overallScore' \
    "data.overallScore exists"

# =============================================================================
# Test 6: POST /api/mcp/proof/refresh
# =============================================================================
run_test "POST" "/api/mcp/proof/refresh" \
    "Proof Refresh - Generate New Proof (POST)" \
    '.data.tower.acknowledged == true' \
    "data.tower.acknowledged = true"

# =============================================================================
# Test 7: GET /api/mcp/proof/refresh
# =============================================================================
run_test "GET" "/api/mcp/proof/refresh" \
    "Proof Refresh - Get Current Proof (GET)" \
    '.data.proof.id' \
    "data.proof.id exists"

# =============================================================================
# Test 8: GET /api/mcp/healthz
# =============================================================================
run_test "GET" "/api/mcp/healthz" \
    "Health Check" \
    '.status == "healthy"' \
    "status = 'healthy'"

# =============================================================================
# Test 9: GET /api/mcp/tail
# =============================================================================
run_test "GET" "/api/mcp/tail" \
    "Tail - Recent Activity Log" \
    '. != null' \
    "response exists"

# =============================================================================
# Test 10: Manifest tools count validation
# =============================================================================
echo -e "${BOLD}Test 10: Manifest Tools Deep Validation${NC}"
echo -e "${CYAN}  GET /api/mcp/manifest${NC}"

TOTAL_TESTS=$((TOTAL_TESTS + 1))
start_time=$(date +%s%3N)
manifest_response=$(curl -s --max-time "$TIMEOUT" "${BASE_URL}/api/mcp/manifest" 2>&1)
end_time=$(date +%s%3N)
duration=$((end_time - start_time))

tools_count=$(echo "$manifest_response" | jq '.tools | length' 2>/dev/null)

if [ -n "$tools_count" ] && [ "$tools_count" -ge 10 ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "  ${GREEN}✅ PASS${NC} - Found ${tools_count} tools"

    # List all tool names
    tool_names=$(echo "$manifest_response" | jq -r '.tools[].name' 2>/dev/null)
    echo -e "  ${CYAN}Tools:${NC}"
    echo "$tool_names" | while read -r tool; do
        echo -e "    - ${tool}"
    done
    echo -e "  ${CYAN}Time:${NC} ${duration}ms"
    TEST_RESULTS+=("✅ Manifest Tools Deep Validation")
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo -e "  ${RED}❌ FAIL${NC} - Expected >= 10 tools, got: ${tools_count:-'invalid response'}"
    echo -e "  ${CYAN}Time:${NC} ${duration}ms"
    TEST_RESULTS+=("❌ Manifest Tools Deep Validation")
fi
echo ""

# =============================================================================
# Summary
# =============================================================================
echo -e "${BOLD}${BLUE}================================================${NC}"
echo -e "${BOLD}${BLUE}                 TEST SUMMARY${NC}"
echo -e "${BOLD}${BLUE}================================================${NC}"
echo ""
echo -e "${BOLD}Results:${NC}"
for result in "${TEST_RESULTS[@]}"; do
    echo -e "  ${result}"
done
echo ""
echo -e "${BLUE}------------------------------------------------${NC}"
echo -e "${BOLD}Total Tests:${NC}  ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:${NC}       ${PASSED_TESTS}"
echo -e "${RED}Failed:${NC}       ${FAILED_TESTS}"
echo ""

if [ "$FAILED_TESTS" -eq 0 ]; then
    echo -e "${BOLD}${GREEN}================================================${NC}"
    echo -e "${BOLD}${GREEN}      ALL TESTS PASSED!${NC}"
    echo -e "${BOLD}${GREEN}================================================${NC}"
    exit 0
else
    echo -e "${BOLD}${RED}================================================${NC}"
    echo -e "${BOLD}${RED}      ${FAILED_TESTS} TEST(S) FAILED${NC}"
    echo -e "${BOLD}${RED}================================================${NC}"
    exit 1
fi
