# ChatGPT Actions Integration Guide

## Quick Start

1. **Copy the OpenAPI Schema** below
2. **Open ChatGPT** -> Create new GPT -> Actions
3. **Paste schema** and configure
4. **Test with** "Check Voltek payment recovery pipeline"

## OpenAPI Schema for ChatGPT Actions
```yaml
openapi: 3.1.0
info:
  title: Qontrek MCP Server
  description: Payment recovery orchestration for Malaysian SMEs
  version: 1.0.0
servers:
  - url: https://your-vercel-app.vercel.app
    description: Production server
paths:
  /api/mcp/capabilities:
    get:
      operationId: getCapabilities
      summary: Get server capabilities
      responses:
        '200':
          description: Server capabilities
          content:
            application/json:
              schema:
                type: object

  /api/mcp/tools:
    get:
      operationId: listTools
      summary: List available tools
      responses:
        '200':
          description: Tool definitions
          content:
            application/json:
              schema:
                type: object

  /api/mcp/execute:
    post:
      operationId: executeTool
      summary: Execute MCP tool
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                tool:
                  type: string
                  enum: [getTenantData, listTenants, executeWorkflow, listWorkflows, sendWhatsAppMessage, getMessageStatus, exportReport]
                params:
                  type: object
      responses:
        '200':
          description: Tool execution result
          content:
            application/json:
              schema:
                type: object
```

## GPT Instructions Template
```markdown
You are a Qontrek Payment Recovery Assistant for Malaysian SMEs.

## Your Capabilities:
- Check payment recovery pipelines (Voltek, Perodua, CIDB, Takaful)
- Trigger payment reminders via WhatsApp
- Execute escalation workflows
- Generate recovery reports (CSV, PDF, Excel)
- Monitor governance gates (G13-G18)

## Available Tools:
1. getTenantData - Check tenant pipeline (RM values, leads, recovery rate)
2. executeWorkflow - Trigger N8N automations
3. sendWhatsAppMessage - Send payment reminders
4. exportReport - Generate reports

## Example Queries:
- "What's Voltek's total recoverable amount?"
- "Send payment reminder to 0123456789"
- "Generate PDF report for Voltek"
- "Execute escalation workflow for overdue accounts"

Always use getTenantData first to check current pipeline status before taking actions.
```

## Testing Your GPT

### Test 1: Check Pipeline
**User:** "What's Voltek's payment recovery status?"
**Expected:** GPT calls getTenantData with tenantId="voltek"

### Test 2: Send Reminder
**User:** "Send payment reminder to 0123456789 for RM 8,000"
**Expected:** GPT calls sendWhatsAppMessage (DRY_RUN mode by default)

### Test 3: Generate Report
**User:** "Generate a CSV report for Voltek"
**Expected:** GPT calls exportReport with format="csv", tenantId="voltek"

## Production Deployment

1. **Deploy to Vercel:**
```bash
cd cockpit-ui
vercel --prod
```

2. **Update OpenAPI schema** with production URL

3. **Set environment variables** in Vercel:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - WHATCHIMP_KEY (for WhatsApp)
   - N8N_WEBHOOK_URL (for workflows)
   - DRY_RUN=0 (for production)

4. **Test production endpoint:**
```bash
curl https://your-app.vercel.app/api/mcp/capabilities
```

## Security Considerations

- **Rate limiting:** 100 requests/minute
- **CORS:** Configured for ChatGPT domains
- **DRY_RUN:** Default enabled to prevent accidental sends
- **Authentication:** Coming in v2 (bearer tokens)
