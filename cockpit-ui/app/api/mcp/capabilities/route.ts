import { NextResponse } from 'next/server';

/**
 * GET /api/mcp/capabilities
 *
 * Discovery endpoint for MCP server capabilities.
 * Used by ChatGPT Actions and multi-agent orchestration.
 */
export async function GET() {
  const capabilities = {
    name: 'Qontrek MCP Server',
    version: '1.0.0',
    description: 'Model Context Protocol server for Qontrek payment recovery operations',

    // Server capabilities
    capabilities: {
      tenant: {
        description: 'Tenant data management and pipeline analytics',
        operations: ['getTenantData', 'listTenants'],
        dataTypes: ['TenantStats', 'TenantList']
      },
      workflow: {
        description: 'N8N workflow execution and automation',
        operations: ['executeWorkflow', 'listWorkflows'],
        integrations: ['n8n']
      },
      whatsapp: {
        description: 'WhatsApp messaging via WhatChimp',
        operations: ['sendWhatsAppMessage', 'getMessageStatus', 'sendBulkWhatsApp'],
        integrations: ['whatchimp'],
        features: ['malaysian-phone-formatting', 'template-messages', 'dry-run-mode']
      },
      export: {
        description: 'Report generation and export',
        operations: ['exportReport', 'listReports'],
        formats: ['csv', 'pdf', 'excel'],
        storage: ['supabase-storage']
      },
      governance: {
        description: 'Governance gate management',
        operations: ['getGateStatus'],
        gates: ['G0', 'G13', 'G14', 'G15', 'G16', 'G17', 'G18', 'G19']
      }
    },

    // Integration status
    integrations: {
      supabase: {
        configured: !!process.env.SUPABASE_URL,
        features: ['rls', 'rest-api', 'storage']
      },
      n8n: {
        configured: !!process.env.N8N_WEBHOOK_URL,
        features: ['webhooks', 'workflows']
      },
      whatchimp: {
        configured: !!(process.env.WHATCHIMP_KEY || process.env.WHATCHIMP_API_TOKEN),
        features: ['template-messages', 'delivery-status']
      },
      slack: {
        configured: !!process.env.SLACK_WEBHOOK_URL,
        features: ['notifications']
      }
    },

    // Safety features
    safety: {
      dryRunEnabled: process.env.DRY_RUN !== '0',
      description: 'DRY_RUN=1 by default prevents real API calls'
    },

    // Demo tenants available
    demoTenants: [
      { id: 'voltek', name: 'Voltek Solar', totalRM: 180400 },
      { id: 'perodua', name: 'Perodua', totalRM: 520000 },
      { id: 'takaful', name: 'Takaful Insurance', totalRM: 89000 },
      { id: 'cidb', name: 'CIDB Malaysia', totalRM: 1250000 }
    ],

    // API endpoints
    endpoints: {
      execute: '/api/mcp/execute',
      tools: '/api/mcp/tools',
      capabilities: '/api/mcp/capabilities',
      healthz: '/api/mcp/healthz',
      governance: '/api/mcp/governance'
    },

    // OpenAPI info for ChatGPT Actions
    openapi: {
      version: '3.0.0',
      servers: [
        {
          url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          description: 'Qontrek MCP Server'
        }
      ]
    },

    timestamp: new Date().toISOString()
  };

  return NextResponse.json(capabilities);
}
