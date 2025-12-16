# Complete Diagnostic & Fix Plan - Vercel MCP Deployment

## ✅ PART 1: REPO + ROUTE DIAGNOSTICS - COMPLETE

### Directory Structure
- ✅ `cockpit-ui/app/` exists
- ✅ `cockpit-ui/app/api/mcp/solar/route.ts` exists (10KB)
- ✅ No nested `cockpit-ui/cockpit-ui`
- ✅ No legacy `vercel.json` in root

### MCP Route Verification
- ✅ `export const runtime = 'edge'` present
- ✅ `export async function GET()` present
- ✅ `export async function POST()` present (JSON-RPC 2.0)
- ✅ `export async function OPTIONS()` present
- ✅ Route compiled successfully: `.next/server/app/api/mcp/solar/route.js`

### Build Compatibility
- ✅ Next.js config: `next.config.js` exists
- ✅ TypeScript config: `tsconfig.json` exists
- ✅ Tailwind config: `tailwind.config.js` exists
- ⚠️  `pages/` directory exists (but app/ takes precedence)
- ✅ Dependencies: Next.js 14.2.5, Supabase, Zod all present

**Note:** There's a TypeScript error in `Gate2DashboardHeader.tsx` (import issue), but this doesn't affect the MCP route which compiles successfully.

## 🔍 PART 2: ROOT CAUSE DETECTION - CONFIRMED

### .vercel/project.json Inspection
```json
{
  "projectId": "prj_SwvIyESe283BMCkauhzdLfaYf8pt",
  "orgId": "team_tsUzfpoChg3JF3XbdIpzz26r",
  "projectName": "qontrek-cockpit"
}
```
- ✅ No `rootDirectory` property (correct - should be in Dashboard)
- ✅ Project linked correctly

### Deployment Path Analysis
- ❌ No `app/` at repo root (`qontrek-engine/`)
- ✅ `cockpit-ui/app/` exists
- **Answer:** YES - Vercel is building from wrong root (unless Dashboard Root Directory is set)

**Root Cause:** Vercel Dashboard Root Directory setting is missing or incorrect.

## 🛠 PART 3: FIX PLAN

### Option A — REIMPORT PROJECT (RECOMMENDED)

**Why:** Cleanest solution, ensures correct configuration from start.

**Steps:**
1. Go to: https://vercel.com/qontrek/qontrek-cockpit/settings
2. Scroll to bottom → **Delete Project** (retain custom domain if any)
3. Click **"New Project"**
4. Import: `fidos777/qontrek-engine` repository
5. **On import screen, configure:**
   - **Root Directory:** `cockpit-ui` ⚠️ CRITICAL
   - **Framework Preset:** Next.js (auto-detected)
   - **Build Command:** Leave blank (default: `next build`)
   - **Output Directory:** Leave blank (default: `.next`)
   - **Install Command:** Leave blank (default: `npm install`)
6. Click **Deploy**
7. Monitor build logs - should show:
   - ✅ "Building from cockpit-ui/"
   - ✅ "Found app directory"
   - ✅ Build succeeds

### Option B — RELINK via CLI (Fallback)

**Use if:** Option A doesn't work or you want to keep existing project.

```bash
cd /Users/firdausismail/Documents/qontrek-engine

# Unlink current project
vercel git unlink

# Remove local .vercel folder
rm -rf cockpit-ui/.vercel

# Link fresh
cd cockpit-ui
vercel link

# When prompted:
# - Existing project: NO
# - Project name: qontrek-cockpit
# - Root Directory: cockpit-ui ⚠️ CRITICAL
# - Framework: Next.js

# Deploy
vercel --prod
```

**Note:** CLI linking may not set Root Directory correctly. Dashboard reimport is safer.

## 🧪 PART 4: VERIFICATION

### Local Build Test
```bash
cd /Users/firdausismail/Documents/qontrek-engine/cockpit-ui

# Install dependencies (if needed)
npm install

# Build
npm run build

# Verify route compiled
ls -lh .next/server/app/api/mcp/solar/route.js
# Expected: File exists (~50-100KB)
```

**Status:** ✅ Route compiles successfully locally

### Post-Deploy Tests

After deployment completes:

```bash
# Test GET discovery
curl -X GET https://qontrek-cockpit.vercel.app/api/mcp/solar

# Expected Response:
# {
#   "mcp_server": true,
#   "version": "1.0",
#   "capabilities": {...},
#   "tools": [...],
#   "server_info": {...}
# }
# NOT: HTML 404 page

# Test POST tools/list
curl -X POST https://qontrek-cockpit.vercel.app/api/mcp/solar \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"test01","method":"tools/list"}'

# Expected Response:
# {
#   "jsonrpc": "2.0",
#   "id": "test01",
#   "result": {
#     "tools": [
#       {"name": "get_kpi_summary", "description": "..."},
#       ...
#     ]
#   }
# }
```

## ✅ PART 5: DEPLOYMENT READINESS REPORT

| Checkpoint                  | Status | Action Required |
|----------------------------|--------|-----------------|
| Root Directory set         | ❌ NO  | **Set in Dashboard** |
| MCP route exists           | ✅ YES | None |
| Git commit tracked         | ✅ YES | None |
| .vercel config clean       | ✅ YES | None |
| Route exports valid        | ✅ YES | None |
| Next.js config valid       | ✅ YES | None |
| Route compiles locally      | ✅ YES | None |
| Vercel Routes show MCP     | ❌ NO  | **After Dashboard fix** |
| curl GET returns JSON       | ❌ NO  | **After Dashboard fix** |
| curl POST returns tools     | ❌ NO  | **After Dashboard fix** |

## 🎯 FINAL SIGNAL

**Deploy successful when:**
1. ✅ Vercel build logs show: "Building from cockpit-ui/"
2. ✅ Build succeeds without "Couldn't find app directory" error
3. ✅ `curl GET /api/mcp/solar` returns JSON (not HTML 404)
4. ✅ `curl POST tools/list` returns JSON-RPC response
5. ✅ Agent Builder can discover tools

## 📋 ACTION ITEMS

**IMMEDIATE (Required):**
1. [ ] Go to Vercel Dashboard → Settings → Root Directory
2. [ ] Set Root Directory = `cockpit-ui`
3. [ ] Save settings
4. [ ] Trigger deployment (push commit or redeploy)

**VERIFICATION (After deployment):**
1. [ ] Check build logs for success
2. [ ] Test GET /api/mcp/solar (should return JSON)
3. [ ] Test POST tools/list (should return tools array)
4. [ ] Verify Agent Builder can connect

**OPTIONAL (If Dashboard fix doesn't work):**
1. [ ] Reimport project with Root Directory set
2. [ ] Or relink via CLI with Root Directory

