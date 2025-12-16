# Vercel Deployment Checklist

## Pre-Deployment Verification

Run these commands to verify everything is ready:

```bash
cd /Users/firdausismail/Documents/qontrek-engine

# 1. Check Git status
git status
# Expected: "nothing to commit, working tree clean"

# 2. Check branch tracking
git branch -vv
# Expected: "* main ... [origin/main] ..."

# 3. Check remote
git remote -v
# Expected: origin → https://github.com/fidos777/qontrek-engine.git

# 4. Verify structure
tree -L 3 cockpit-ui 2>/dev/null || find cockpit-ui -maxdepth 3 -type d | head -15
# Expected: cockpit-ui/app/... cockpit-ui/package.json

# 5. Verify MCP route
ls -lh cockpit-ui/app/api/mcp/solar/route.ts
# Expected: File exists, ~10KB

# 6. Check commits
git log --oneline -3
# Expected: Recent commits including MCP route
```

## Vercel Dashboard Configuration

**CRITICAL:** Set Root Directory in Vercel Dashboard:

1. Go to: https://vercel.com/qontrek/qontrek-cockpit/settings
2. Scroll to: **General** section
3. Find: **Root Directory** field
4. Set to: `cockpit-ui` (without leading/trailing slashes)
5. Click **Save**

## Trigger Deployment

After setting Root Directory in Dashboard:

```bash
# Option 1: Empty commit to trigger deploy
git commit --allow-empty -m "Trigger Vercel deployment with rootDirectory fix"
git push origin main

# Option 2: Just push if you have changes
git push origin main
```

## Post-Deployment Verification

After deployment completes (check Vercel Dashboard):

```bash
# 1. Test GET discovery
curl -X GET https://qontrek-cockpit.vercel.app/api/mcp/solar

# Expected: JSON response with mcp_server: true, tools array, etc.
# NOT: HTML 404 page

# 2. Test POST tools/list
curl -X POST https://qontrek-cockpit.vercel.app/api/mcp/solar \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"test01","method":"tools/list"}'

# Expected: JSON-RPC response with result.tools array
# NOT: Error or HTML

# 3. Check Vercel logs (via Dashboard)
# Go to: https://vercel.com/qontrek/qontrek-cockpit/deployments
# Click latest deployment → Functions → View Logs
# Expected: Build succeeds, no "Couldn't find app directory" error
```

## Troubleshooting

### If GET returns 404 HTML:
- ✅ Check Vercel Dashboard: Root Directory = `cockpit-ui`
- ✅ Check deployment logs for build errors
- ✅ Verify route file is in Git: `git ls-files | grep route.ts`

### If build fails with "Couldn't find app directory":
- ✅ Root Directory must be set to `cockpit-ui` in Dashboard
- ✅ Not `cockpit-ui/` (no trailing slash)
- ✅ Not empty/blank

### If tools/list returns error:
- ✅ Check route.ts exports are correct
- ✅ Verify JSON-RPC format matches spec
- ✅ Check Vercel function logs for runtime errors

