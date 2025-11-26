// app/api/mcp/manifest/route.ts

import { NextResponse } from 'next/server';
import type { MCPManifestTool } from '@/types/mcp';

const qontrekHeaders = () => ({
  'X-Qontrek-MCP-Version': '1.0.0',
  'X-Qontrek-Tenant': 'system',
  'X-Qontrek-RequestId': crypto.randomUUID(),
});

const tools: MCPManifestTool[] = [
  {
    name: 'listTenants',
    endpoint: '/api/mcp/tenants',
    method: 'GET',
    description: 'List all Qontrek tenants with basic metadata.',
    returns: 'Object with tenants array and count.',
  },
  {
    name: 'getPipelineSummary',
    endpoint: '/api/mcp/pipeline',
    method: 'GET',
    description:
      'Get recoverable revenue, stuck pipeline and lead volume summary for active tenants.',
    returns: 'Object with summary (totalRecoverable, totalStuck, totalLeads).',
  },
  {
    name: 'getCriticalLeads',
    endpoint: '/api/mcp/leads',
    method: 'GET',
    description: 'Get list of critical / hot leads across tenants.',
    returns: 'Object with leads array and count.',
  },
  {
    name: 'getGovernanceStatus',
    endpoint: '/api/mcp/governance',
    method: 'GET',
    description: 'Get overall governance score and gate status.',
    returns: 'Governance object including overallScore and gate breakdown.',
  },
  {
    name: 'refreshProof',
    endpoint: '/api/mcp/proof/refresh',
    method: 'POST',
    description:
      'Trigger a proof refresh and Tower acknowledgement for the current Qontrek node.',
    returns:
      'Object containing proof and tower acknowledgement with acknowledged=true.',
  },
  {
    name: 'getHealthStatus',
    endpoint: '/api/mcp/healthz',
    method: 'GET',
    description:
      'Check MCP health, including status=healthy and component-level diagnostics.',
    returns: 'Health object with status and components.',
  },
  {
    name: 'getLogs',
    endpoint: '/api/mcp/tail',
    method: 'GET',
    description: 'Retrieve recent MCP operation logs for debugging and audit.',
    parameters: [
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Number of log entries to return.',
        default: 50,
      },
      {
        name: 'level',
        type: 'string',
        required: false,
        description: 'Filter by log level.',
        enum: ['error', 'warn', 'info', 'debug', 'all'],
        default: 'all',
      },
    ],
    returns: 'Array of log entries with timestamp, level, and message.',
  },
  {
    name: 'getManifest',
    endpoint: '/api/mcp/manifest',
    method: 'GET',
    description: 'Return this manifest: tools, version, and metadata.',
    returns: 'Object with tools array, tool count and metadata.',
  },
];

export async function GET() {
  try {
    const body = {
      version: '1.0.0',
      toolCount: tools.length,
      tools,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(body, {
      headers: qontrekHeaders(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: (error as Error).message,
      },
      {
        status: 500,
        headers: qontrekHeaders(),
      },
    );
  }
}
