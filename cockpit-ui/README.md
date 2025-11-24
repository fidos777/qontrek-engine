## 📊 Current Status

**Implemented:**
- ✅ Gate 0: Lead Qualification Dashboard (G19.4)
- ✅ Gate 2: Payment Recovery Dashboard (G19.2)
- ✅ CFO Lens: 5-Tab Financial Dashboard (G19.3)

**Pending:**
- ⏳ Gate 1: Decision Engine
- ⏳ Document Tracker

---

**Last Updated:** 2025-10-21  
**Version:** G19.4  

## 🎯 Gate 0 – Lead Qualification (G19.4)

The Gate 0 dashboard helps sales teams manage and qualify inbound leads effectively.

### Features

**Route:** `/gates/g0`

**3 Lead Panels:**
1. **Hot Leads** – High-priority leads (score ≥ 80) requiring immediate action  
2. **Warm Leads** – Qualified leads (score 60–79) ready for follow-up  
3. **Cold Leads** – Initial contacts (score < 60) for nurturing  

**Summary KPIs:**
- Total Leads  
- Conversion Rate  
- Average Response Time  
- Qualified Rate  

**Recent Activity Table:**
- Company & Contact information  
- Lead status with color-coded badges  
- Lead score  
- Source (Website, LinkedIn, Referral, etc.)  
- Response time metrics  
- Last contact timestamp  

**Technical Implementation:**
- 3-panel layout with color-coded status indicators (Red/Yellow/Blue)  
- Lead scoring and classification system  
- Responsive grid layout (stacks on mobile, 3 columns on desktop)  
- Accessible markup with aria-labels for panel navigation  
- Table headers with scope="col" attributes  
- Same dev-only fixture fallback pattern as other gates  

**Endpoint:** `/api/gates/g0/summary` → Returns `G0Response (BaseEnvelope<G0Payload>)`

**Tests:**
- Mapping contract tests (envelope + structure)  
- Fixture contract tests (type validation)  
✅ 6/6 tests passing  

**Expected Telemetry:**
```json
{"event":"proof_load","rel":"g0_dashboard_v19.1.json","source":"real","timestamp":"2025-10-21T12:00:00.000Z"}
```

## MCP Server

The Qontrek MCP (Model Context Protocol) server provides a unified API for AI agents to interact with the payment recovery system.

### Features

- **Multi-tenant support** - Voltek, Perodua, CIDB, Takaful
- **Pipeline analytics** - Real-time recovery metrics
- **WhatsApp automation** - WhatChimp integration
- **Workflow orchestration** - N8N integration
- **Report generation** - CSV, PDF, Excel exports
- **ChatGPT ready** - OpenAPI compatible

### Quick Start
```bash
# Install dependencies
cd cockpit-ui
npm install

# Start dev server
npm run dev

# Test MCP endpoint
curl http://localhost:3000/api/mcp/capabilities
```

### Available Tools

| Tool | Description | Example |
|------|-------------|---------|
| getTenantData | Fetch tenant pipeline | `{"tool": "getTenantData", "params": {"tenantId": "voltek"}}` |
| executeWorkflow | Trigger N8N workflow | `{"tool": "executeWorkflow", "params": {"workflowName": "payment_reminder"}}` |
| sendWhatsAppMessage | Send WhatsApp | `{"tool": "sendWhatsAppMessage", "params": {"to": "0123456789", "message": "Test"}}` |
| exportReport | Generate report | `{"tool": "exportReport", "params": {"format": "pdf", "tenantId": "voltek"}}` |

### Documentation

- [MCP API Documentation](docs/MCP_API.md)
- [ChatGPT Integration Guide](docs/CHATGPT_INTEGRATION.md)

### Environment Variables

Create `.env.local` from `.env.example`:
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Safety

By default, `DRY_RUN=1` prevents actual API calls. Set `DRY_RUN=0` for production.
