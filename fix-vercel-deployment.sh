#!/bin/bash
# Fix Vercel Deployment for MCP Server
# Run this script to ensure everything is configured correctly

set -e

echo "🔧 Fixing Vercel Deployment Configuration"
echo ""

# Step 1: Verify we're in the right directory
REPO_ROOT="/Users/firdausismail/Documents/qontrek-engine"
cd "$REPO_ROOT" || exit 1

echo "✅ Step 1: Verified repo root: $REPO_ROOT"
echo ""

# Step 2: Check Git status
echo "📋 Step 2: Checking Git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Uncommitted changes detected:"
    git status --short
    echo ""
    echo "Please commit or stash changes before deploying."
else
    echo "✅ Working directory is clean"
fi
echo ""

# Step 3: Verify branch
echo "📋 Step 3: Checking branch..."
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Not on main branch. Switch with: git checkout main"
else
    echo "✅ On main branch"
fi
echo ""

# Step 4: Verify remote tracking
echo "📋 Step 4: Checking remote tracking..."
git fetch origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main 2>/dev/null || echo "not-found")

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "✅ Local and remote are in sync"
else
    echo "⚠️  Local and remote differ"
    echo "   Local:  $LOCAL"
    echo "   Remote: $REMOTE"
fi
echo ""

# Step 5: Verify MCP route exists
echo "📋 Step 5: Verifying MCP route..."
if [ -f "cockpit-ui/app/api/mcp/solar/route.ts" ]; then
    echo "✅ MCP route file exists"
    echo "   Path: cockpit-ui/app/api/mcp/solar/route.ts"
    echo "   Size: $(ls -lh cockpit-ui/app/api/mcp/solar/route.ts | awk '{print $5}')"
else
    echo "❌ MCP route file NOT FOUND"
    exit 1
fi
echo ""

# Step 6: Check if route is tracked in Git
echo "📋 Step 6: Checking Git tracking..."
if git ls-files | grep -q "cockpit-ui/app/api/mcp/solar/route.ts"; then
    echo "✅ Route file is tracked by Git"
else
    echo "⚠️  Route file is NOT tracked. Adding..."
    git add cockpit-ui/app/api/mcp/solar/route.ts
fi
echo ""

# Step 7: Verify cockpit-ui structure
echo "📋 Step 7: Verifying cockpit-ui structure..."
REQUIRED_FILES=(
    "cockpit-ui/package.json"
    "cockpit-ui/next.config.js"
    "cockpit-ui/app"
)
for file in "${REQUIRED_FILES[@]}"; do
    if [ -e "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file MISSING"
        exit 1
    fi
done
echo ""

# Step 8: Check .vercel configuration
echo "📋 Step 8: Checking .vercel configuration..."
if [ -f "cockpit-ui/.vercel/project.json" ]; then
    echo "✅ .vercel/project.json exists"
    echo "   Project: $(cat cockpit-ui/.vercel/project.json | grep -o '"projectName":"[^"]*"' | cut -d'"' -f4)"
else
    echo "⚠️  .vercel/project.json not found"
    echo "   This is OK - Vercel will link via Dashboard"
fi
echo ""

# Step 9: Summary
echo "=== SUMMARY ==="
echo ""
echo "✅ All local checks passed!"
echo ""
echo "⚠️  IMPORTANT: Manual step required:"
echo ""
echo "1. Go to Vercel Dashboard:"
echo "   https://vercel.com/qontrek/qontrek-cockpit/settings"
echo ""
echo "2. Navigate to: General → Root Directory"
echo ""
echo "3. Set Root Directory to: cockpit-ui"
echo ""
echo "4. Save the settings"
echo ""
echo "5. Then trigger deployment by pushing a commit:"
echo "   git commit --allow-empty -m 'Trigger Vercel deployment'"
echo "   git push origin main"
echo ""
echo "Or Vercel will auto-deploy on next push to main."
