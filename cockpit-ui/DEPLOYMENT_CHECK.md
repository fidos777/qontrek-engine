# Vercel Deployment Check - MCP Solar API

## ✅ Configuration Status

### Project Structure
- ✅ `cockpit-ui/package.json` exists
- ✅ `cockpit-ui/app/api/mcp/solar/route.ts` exists (370 lines)
- ✅ `cockpit-ui/tsconfig.json` exists
- ✅ No nested `cockpit-ui/cockpit-ui/` folder

### Route Configuration
- ✅ `export const runtime = 'edge'` - Edge Runtime enabled
- ✅ `export async function GET()` - MCP discovery endpoint
- ✅ `export async function POST()` - JSON-RPC 2.0 handler
- ✅ `export async function OPTIONS()` - CORS preflight

### Vercel Configuration
- ✅ `.vercel/project.json` links to `qontrek-cockpit` project
- ✅ No `rootDirectory` override in `.vercel/project.json`
- ✅ No conflicting `vercel.json` in `cockpit-ui/`
- ℹ️  `vercel.json` at root is for deploying from parent directory

### Package Configuration
- ✅ `"build": "next build"` script exists
- ✅ Dependencies include: `next`, `@supabase/supabase-js`, `zod`

## 🚀 Deployment Instructions

### Deploy from cockpit-ui/ (Recommended)
```bash
cd /Users/firdausismail/Documents/qontrek-engine/cockpit-ui
vercel --prod
```

This will:
- Use `cockpit-ui/` as the Next.js project root
- Deploy route at `/api/mcp/solar`
- Use Edge Runtime for the route

### Alternative: Deploy from root
```bash
cd /Users/firdausismail/Documents/qontrek-engine
vercel --prod
```

This will:
- Use `vercel.json` with `rootDirectory: "cockpit-ui"`
- Also deploy correctly

## 🧪 Post-Deployment Tests

### Test GET Discovery
```bash
curl -X GET https://qontrek-cockpit.vercel.app/api/mcp/solar
```

Expected response:
```json
{
  "mcp_server": true,
  "version": "1.0",
  "capabilities": {
    "jsonrpc": true,
    "tool_calling": true,
    "edge_runtime": true
  },
  "tools": [...],
  "server_info": {...}
}
```

### Test JSON-RPC tools/list
```bash
curl -X POST https://qontrek-cockpit.vercel.app/api/mcp/solar \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"test01","method":"tools/list"}'
```

Expected response:
```json
{
  "jsonrpc": "2.0",
  "id": "test01",
  "result": {
    "tools": [
      {"name": "get_kpi_summary", "description": "..."},
      ...
    ]
  }
}
```

## 🔍 Troubleshooting

If GET returns 404:
1. Check Vercel deployment logs
2. Verify route file is in `app/api/mcp/solar/route.ts`
3. Ensure Edge Runtime is enabled
4. Check Vercel project settings for correct root directory

If tools/list fails:
1. Verify JSON-RPC format is correct
2. Check CORS headers are present
3. Review Vercel function logs
