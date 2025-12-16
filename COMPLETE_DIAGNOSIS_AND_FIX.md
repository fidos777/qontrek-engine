# Complete Vercel MCP Deployment Diagnosis & Fix

## 🔍 DIAGNOSIS SUMMARY

### ✅ What's Working
1. **Repo Structure**: ✅ Correct
   - `cockpit-ui/app/` exists
   - `cockpit-ui/app/api/mcp/solar/route.ts` exists and is valid
   - `cockpit-ui/package.json` has Next.js configured
   - `cockpit-ui/next.config.js` is valid

2. **Git Status**: ✅ Clean
   - Branch: `main`
   - Tracking: `origin/main` (in sync)
   - Remote: `https://github.com/fidos777/qontrek-engine.git`
   - MCP route is committed and tracked
   - No uncommitted changes

3. **MCP Route**: ✅ Valid
   - `export const runtime = 'edge'` ✅
   - `GET()` handler ✅
   - `POST()` handler ✅
   - `OPTIONS()` handler ✅

### ❌ Root Cause Identified

**Problem:** Vercel Dashboard Root Directory setting is missing or incorrect.

**Symptom:** 
- Error: "Couldn't find any `pages` or `app` directory"
- GET /api/mcp/solar returns HTML 404

**Why:**
- Vercel is looking for `app/` at repo root (`qontrek-engine/`)
- Actual Next.js app is at `cockpit-ui/app/`
- Vercel needs `rootDirectory = "cockpit-ui"` in Dashboard settings

**Current State:**
- Repo root has: `cockpit-ui/`, `agents/`, `config/`, etc. (NO `app/` at root)
- Next.js app is at: `cockpit-ui/app/`
- Vercel expects: Either `app/` at root OR `rootDirectory` configured

## ✅ FIX INSTRUCTIONS

### Step 1: Configure Vercel Dashboard (REQUIRED)

1. Open: https://vercel.com/qontrek/qontrek-cockpit/settings
2. Navigate to: **General** section
3. Find: **Root Directory** field
4. Set to: `cockpit-ui` (exactly, no slashes)
5. Click **Save**

**Important:** This is a Dashboard-only setting. No vercel.json needed.

### Step 2: Trigger Deployment

After setting Root Directory:

```bash
cd /Users/firdausismail/Documents/qontrek-engine

# Verify everything is ready
git status
git branch -vv

# Trigger deployment with empty commit
git commit --allow-empty -m "Trigger Vercel deployment - rootDirectory configured"
git push origin main
```

Or just push your next commit:
```bash
git push origin main
```

### Step 3: Verify Deployment

After deployment completes (check Vercel Dashboard):

```bash
# Test GET discovery
curl -X GET https://qontrek-cockpit.vercel.app/api/mcp/solar

# Expected: JSON with mcp_server: true, tools array
# NOT: HTML 404

# Test POST tools/list  
curl -X POST https://qontrek-cockpit.vercel.app/api/mcp/solar \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"test01","method":"tools/list"}'

# Expected: JSON-RPC result with tools array
```

## 📋 VALIDATION CHECKLIST

Run these commands to verify:

```bash
cd /Users/firdausismail/Documents/qontrek-engine

# 1. Git status
git status
# ✅ Expected: "working tree clean"

# 2. Branch tracking
git branch -vv
# ✅ Expected: "* main ... [origin/main] ..."

# 3. Remote
git remote -v
# ✅ Expected: origin → github.com/fidos777/qontrek-engine.git

# 4. Structure
ls -la cockpit-ui/app/api/mcp/solar/route.ts
# ✅ Expected: File exists

# 5. Commits
git log --oneline -1
# ✅ Expected: Recent commit
```

## 🎯 EXPECTED RESULTS

After fix:

1. ✅ Vercel build succeeds (no "Couldn't find app directory")
2. ✅ GET /api/mcp/solar returns MCP discovery JSON
3. ✅ POST tools/list returns JSON-RPC response
4. ✅ Agent Builder can discover and load tools

## 📝 NOTES

- **No vercel.json needed** - Root Directory is Dashboard-only setting
- **Git-based deploy** - Vercel auto-deploys on push to main
- **Edge Runtime** - Already configured in route.ts
- **CORS headers** - Already configured in route.ts

