# MCP Solar API Test Commands

## Local Testing (http://localhost:3000)

### 1. GET Discovery (MCP Server Info)
```bash
curl -X GET http://localhost:3000/api/mcp/solar \
  -H "Content-Type: application/json"
```

### 2. JSON-RPC: tools/list
```bash
curl -X POST http://localhost:3000/api/mcp/solar \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### 3. JSON-RPC: tools/call (get_kpi_summary)
```bash
curl -X POST http://localhost:3000/api/mcp/solar \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_kpi_summary","arguments":{}}}'
```

### 4. JSON-RPC: tools/call (get_critical_leads)
```bash
curl -X POST http://localhost:3000/api/mcp/solar \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_critical_leads","arguments":{"limit":10}}}'
```

### 5. JSON-RPC: tools/call (get_recent_activity)
```bash
curl -X POST http://localhost:3000/api/mcp/solar \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"get_recent_activity","arguments":{"project_no":"VESB/RESI/IN/2024/07/0315"}}}'
```

## Production Testing (Vercel)

Replace `http://localhost:3000` with `https://qontrek-cockpit.vercel.app` in all commands above.

## Quick Test Script

Run the automated test script:
```bash
./app/api/mcp/solar/test-mcp.sh http://localhost:3000
# or for production:
./app/api/mcp/solar/test-mcp.sh https://qontrek-cockpit.vercel.app
```
