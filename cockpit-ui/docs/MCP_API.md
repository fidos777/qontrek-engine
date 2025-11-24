# Qontrek MCP Server API Documentation

## Overview

The Qontrek Model Context Protocol (MCP) server provides a unified interface for multi-tenant payment recovery operations, workflow orchestration, and WhatsApp automation.

**Base URL:** `https://your-domain.com/api/mcp`
**Version:** 1.0.0
**Protocol:** HTTPS with CORS support

## Authentication

Currently, the MCP server operates without authentication for development. Production deployment will require bearer tokens.

## Endpoints

### 1. Execute Tool

**POST** `/api/mcp/execute`

Execute any available MCP tool with parameters.

#### Request
```json
{
  "tool": "string",     // Tool name
  "params": "object"    // Tool-specific parameters
}
```

#### Response
```json
{
  "success": true,
  "tool": "string",
  "data": "object",
  "requestId": "string",
  "timestamp": "ISO 8601",
  "executionTime": "number"
}
```

#### Available Tools

##### getTenantData
Fetch tenant payment recovery pipeline data.

**Parameters:**
- `tenantId` (string, required): One of: voltek, perodua, cidb, takaful

**Example:**
```bash
curl -X POST https://your-domain.com/api/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "getTenantData",
    "params": {
      "tenantId": "voltek"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tenantId": "voltek",
    "name": "Voltek Solar Malaysia",
    "totalRecoverable": 180400,
    "criticalLeads": 12,
    "avgDaysOverdue": 18.5,
    "recoveryRate": 68.5,
    "invoices": {
      "pending80": 96000,
      "pending20": 24000,
      "handover": 60400
    }
  }
}
```

##### executeWorkflow
Trigger N8N workflow execution.

**Parameters:**
- `workflowName` (string, required): payment_reminder, escalation, report_generation, sync_governance
- `data` (object, optional): Workflow payload

**Example:**
```bash
curl -X POST https://your-domain.com/api/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "executeWorkflow",
    "params": {
      "workflowName": "payment_reminder",
      "data": {
        "tenantId": "voltek",
        "leadIds": ["lead_001", "lead_002"]
      }
    }
  }'
```

##### sendWhatsAppMessage
Send WhatsApp message via WhatChimp.

**Parameters:**
- `to` (string, required): Malaysian phone number (60xxx or 0xxx)
- `message` (string, required): Message content
- `templateId` (string, optional): WhatsApp template ID

**Example:**
```bash
curl -X POST https://your-domain.com/api/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "sendWhatsAppMessage",
    "params": {
      "to": "0123456789",
      "message": "Payment reminder: Your invoice RM 8,000 is overdue by 21 days"
    }
  }'
```

##### exportReport
Generate and export tenant reports.

**Parameters:**
- `format` (string, required): csv, pdf, excel
- `tenantId` (string, required): Tenant identifier
- `dateRange` (object, optional): Date filter with start/end

**Example:**
```bash
curl -X POST https://your-domain.com/api/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "exportReport",
    "params": {
      "format": "pdf",
      "tenantId": "voltek",
      "dateRange": {
        "start": "2024-01-01",
        "end": "2024-12-31"
      }
    }
  }'
```

### 2. Get Capabilities

**GET** `/api/mcp/capabilities`

Discover server capabilities and configuration.

**Response:**
```json
{
  "name": "Qontrek MCP Server",
  "version": "1.0.0",
  "capabilities": {
    "tenant": true,
    "workflow": true,
    "whatsapp": true,
    "export": true,
    "governance": true
  },
  "endpoints": {
    "execute": "/api/mcp/execute",
    "tools": "/api/mcp/tools",
    "capabilities": "/api/mcp/capabilities"
  }
}
```

### 3. List Tools

**GET** `/api/mcp/tools`

Get detailed schema for all available tools.

**Response:**
```json
{
  "tools": [
    {
      "name": "getTenantData",
      "description": "Fetch tenant pipeline data",
      "category": "tenant",
      "inputSchema": { ... },
      "outputSchema": { ... }
    },
    // ... other tools
  ]
}
```

## Environment Variables
```bash
# Required for production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WHATCHIMP_KEY=your-whatchimp-api-key
WHATCHIMP_PHONE_ID=your-phone-id
N8N_WEBHOOK_URL=https://your-n8n.com

# Safety flags
DRY_RUN=1  # Set to 0 for production
NODE_ENV=development
```

## Rate Limiting

- Default: 100 requests per minute
- Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

## Error Handling

All errors follow this format:
```json
{
  "success": false,
  "error": "string",
  "code": "string",
  "requestId": "string"
}
```

Common error codes:
- `TOOL_NOT_FOUND` - Invalid tool name
- `INVALID_PARAMS` - Missing or invalid parameters
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Demo Data

The following demo tenants are always available:
- `voltek` - RM 180,400 pipeline
- `perodua` - RM 520,000 pipeline
- `cidb` - RM 1,250,000 pipeline
- `takaful` - RM 89,000 pipeline
