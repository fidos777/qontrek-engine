import { NextRequest, NextResponse } from 'next/server';
import {
  getTenantData,
  listTenants,
  executeWorkflow,
  listAvailableWorkflows,
  sendWhatsAppMessage,
  getMessageStatus,
  exportReport
} from '@/lib/mcp/tools';

/**
 * POST /api/mcp/execute
 *
 * Execute MCP tools with parameters.
 *
 * Request body:
 * {
 *   "tool": "getTenantData" | "listTenants" | "executeWorkflow" | etc.,
 *   "params": { ... tool-specific parameters }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tool, params } = body;

    if (!tool) {
      return NextResponse.json(
        { error: 'Missing required field: tool' },
        { status: 400 }
      );
    }

    console.log(`[MCP Execute] Tool: ${tool}`, params);

    let result: unknown;

    switch (tool) {
      // Tenant tools
      case 'getTenantData':
        if (!params?.tenantId) {
          return NextResponse.json(
            { error: 'Missing required param: tenantId' },
            { status: 400 }
          );
        }
        result = await getTenantData(params.tenantId);
        break;

      case 'listTenants':
        result = await listTenants();
        break;

      // Workflow tools
      case 'executeWorkflow':
        if (!params?.workflowName) {
          return NextResponse.json(
            { error: 'Missing required param: workflowName' },
            { status: 400 }
          );
        }
        result = await executeWorkflow(params.workflowName, params.data || {});
        break;

      case 'listWorkflows':
        result = listAvailableWorkflows();
        break;

      // WhatsApp tools
      case 'sendWhatsAppMessage':
        if (!params?.to || !params?.message) {
          return NextResponse.json(
            { error: 'Missing required params: to, message' },
            { status: 400 }
          );
        }
        result = await sendWhatsAppMessage(
          params.to,
          params.message,
          params.templateId
        );
        break;

      case 'getMessageStatus':
        if (!params?.messageId) {
          return NextResponse.json(
            { error: 'Missing required param: messageId' },
            { status: 400 }
          );
        }
        result = await getMessageStatus(params.messageId);
        break;

      // Export tools
      case 'exportReport':
        if (!params?.format || !params?.tenantId) {
          return NextResponse.json(
            { error: 'Missing required params: format, tenantId' },
            { status: 400 }
          );
        }
        result = await exportReport(
          params.format,
          params.tenantId,
          params.dateRange
        );
        break;

      default:
        return NextResponse.json(
          {
            error: `Unknown tool: ${tool}`,
            availableTools: [
              'getTenantData',
              'listTenants',
              'executeWorkflow',
              'listWorkflows',
              'sendWhatsAppMessage',
              'getMessageStatus',
              'exportReport'
            ]
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      tool,
      timestamp: new Date().toISOString(),
      result
    });

  } catch (error) {
    console.error('[MCP Execute] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mcp/execute
 *
 * Returns available tools and their schemas.
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/mcp/execute',
    method: 'POST',
    description: 'Execute MCP tools',
    availableTools: [
      {
        name: 'getTenantData',
        description: 'Fetch tenant pipeline data',
        params: { tenantId: 'string (required)' }
      },
      {
        name: 'listTenants',
        description: 'List all available tenants',
        params: {}
      },
      {
        name: 'executeWorkflow',
        description: 'Execute an N8N workflow',
        params: {
          workflowName: 'string (required)',
          data: 'object (optional)'
        }
      },
      {
        name: 'listWorkflows',
        description: 'List available N8N workflows',
        params: {}
      },
      {
        name: 'sendWhatsAppMessage',
        description: 'Send WhatsApp message via WhatChimp',
        params: {
          to: 'string (required)',
          message: 'string (required)',
          templateId: 'string (optional)'
        }
      },
      {
        name: 'getMessageStatus',
        description: 'Get WhatsApp message delivery status',
        params: { messageId: 'string (required)' }
      },
      {
        name: 'exportReport',
        description: 'Export tenant report',
        params: {
          format: 'csv | pdf | excel (required)',
          tenantId: 'string (required)',
          dateRange: '{ start: string, end: string } (optional)'
        }
      }
    ],
    timestamp: new Date().toISOString()
  });
}
