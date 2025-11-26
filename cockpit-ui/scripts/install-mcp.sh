#!/usr/bin/env bash
#
# install-mcp.sh - Install MCP files from numbered downloads
#
# Usage: ./scripts/install-mcp.sh [source_directory]
#
# This script moves and renames MCP files from a source directory
# (default: ~/Downloads) into the correct project structure.
#
# Files expected:
#   1-types-mcp.ts        → types/mcp.ts
#   2-demo-data.ts        → lib/mcp/demo-data.ts
#   3-route-tenants.ts    → app/api/mcp/tenants/route.ts
#   4-route-pipeline.ts   → app/api/mcp/pipeline/route.ts
#   5-route-leads.ts      → app/api/mcp/leads/route.ts
#   6-route-proof-refresh.ts → app/api/mcp/proof/refresh/route.ts
#   7-route-governance.ts → app/api/mcp/governance/route.ts
#   8-route-manifest.ts   → app/api/mcp/manifest/route.ts

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory (cockpit-ui/scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Source directory (default: ~/Downloads)
SOURCE_DIR="${1:-$HOME/Downloads}"

# File mappings: source_name -> destination_path (relative to PROJECT_ROOT)
declare -A FILE_MAP=(
    ["1-types-mcp.ts"]="types/mcp.ts"
    ["2-demo-data.ts"]="lib/mcp/demo-data.ts"
    ["3-route-tenants.ts"]="app/api/mcp/tenants/route.ts"
    ["4-route-pipeline.ts"]="app/api/mcp/pipeline/route.ts"
    ["5-route-leads.ts"]="app/api/mcp/leads/route.ts"
    ["6-route-proof-refresh.ts"]="app/api/mcp/proof/refresh/route.ts"
    ["7-route-governance.ts"]="app/api/mcp/governance/route.ts"
    ["8-route-manifest.ts"]="app/api/mcp/manifest/route.ts"
)

# Directories to create
DIRECTORIES=(
    "types"
    "lib/mcp"
    "app/api/mcp/tenants"
    "app/api/mcp/pipeline"
    "app/api/mcp/leads"
    "app/api/mcp/proof/refresh"
    "app/api/mcp/governance"
    "app/api/mcp/manifest"
)

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           MCP Files Installation Script                      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Project root:${NC} $PROJECT_ROOT"
echo -e "${BLUE}Source directory:${NC} $SOURCE_DIR"
echo ""

# Verify source directory exists
if [[ ! -d "$SOURCE_DIR" ]]; then
    echo -e "${RED}Error: Source directory does not exist: $SOURCE_DIR${NC}"
    exit 1
fi

# Check which files are available
echo -e "${YELLOW}Checking for source files...${NC}"
MISSING_FILES=()
FOUND_FILES=()

for src_file in "${!FILE_MAP[@]}"; do
    if [[ -f "$SOURCE_DIR/$src_file" ]]; then
        FOUND_FILES+=("$src_file")
        echo -e "  ${GREEN}✓${NC} Found: $src_file"
    else
        MISSING_FILES+=("$src_file")
        echo -e "  ${RED}✗${NC} Missing: $src_file"
    fi
done

echo ""

if [[ ${#FOUND_FILES[@]} -eq 0 ]]; then
    echo -e "${RED}Error: No MCP files found in $SOURCE_DIR${NC}"
    echo ""
    echo "Expected files:"
    for src_file in "${!FILE_MAP[@]}"; do
        echo "  - $src_file"
    done | sort
    exit 1
fi

if [[ ${#MISSING_FILES[@]} -gt 0 ]]; then
    echo -e "${YELLOW}Warning: ${#MISSING_FILES[@]} file(s) missing. Continuing with available files.${NC}"
    echo ""
fi

# Create directory structure
echo -e "${YELLOW}Creating directory structure...${NC}"
for dir in "${DIRECTORIES[@]}"; do
    full_path="$PROJECT_ROOT/$dir"
    if [[ -d "$full_path" ]]; then
        echo -e "  ${BLUE}○${NC} Exists: $dir"
    else
        mkdir -p "$full_path"
        echo -e "  ${GREEN}+${NC} Created: $dir"
    fi
done

echo ""

# Move and rename files
echo -e "${YELLOW}Installing files...${NC}"
INSTALLED=0
SKIPPED=0

for src_file in "${FOUND_FILES[@]}"; do
    dest_path="${FILE_MAP[$src_file]}"
    src_full="$SOURCE_DIR/$src_file"
    dest_full="$PROJECT_ROOT/$dest_path"

    # Check if destination already exists with same content
    if [[ -f "$dest_full" ]]; then
        if cmp -s "$src_full" "$dest_full"; then
            echo -e "  ${BLUE}○${NC} Identical: $dest_path (skipped)"
            ((SKIPPED++))
            continue
        else
            echo -e "  ${YELLOW}↻${NC} Updating: $dest_path"
        fi
    else
        echo -e "  ${GREEN}+${NC} Installing: $dest_path"
    fi

    # Copy file (using cp to preserve source for idempotency)
    cp "$src_full" "$dest_full"
    ((INSTALLED++))
done

echo ""

# Verify installation
echo -e "${YELLOW}Verifying installation...${NC}"
VERIFIED=0
FAILED=0

for src_file in "${FOUND_FILES[@]}"; do
    dest_path="${FILE_MAP[$src_file]}"
    dest_full="$PROJECT_ROOT/$dest_path"

    if [[ -f "$dest_full" ]]; then
        # Check file is not empty
        if [[ -s "$dest_full" ]]; then
            echo -e "  ${GREEN}✓${NC} Verified: $dest_path"
            ((VERIFIED++))
        else
            echo -e "  ${RED}✗${NC} Empty file: $dest_path"
            ((FAILED++))
        fi
    else
        echo -e "  ${RED}✗${NC} Not found: $dest_path"
        ((FAILED++))
    fi
done

echo ""

# Summary
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Summary:${NC}"
echo -e "  Files installed: ${GREEN}$INSTALLED${NC}"
echo -e "  Files skipped:   ${BLUE}$SKIPPED${NC}"
echo -e "  Files verified:  ${GREEN}$VERIFIED${NC}"
if [[ $FAILED -gt 0 ]]; then
    echo -e "  Files failed:    ${RED}$FAILED${NC}"
fi
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

if [[ $FAILED -gt 0 ]]; then
    echo -e "${RED}Installation completed with errors.${NC}"
    exit 1
fi

# Run build verification
echo -e "${YELLOW}Running build verification...${NC}"
echo ""

cd "$PROJECT_ROOT"

if npm run build; then
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           Installation completed successfully!               ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
else
    echo ""
    echo -e "${RED}Build failed. Please check for TypeScript errors.${NC}"
    exit 1
fi
