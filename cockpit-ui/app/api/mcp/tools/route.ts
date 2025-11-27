/**
 * MCP Tools Discovery Endpoint
 *
 * GET /api/mcp/tools
 * Returns the MCP tool manifest for client discovery.
 */

import { NextRequest, NextResponse } from 'next/server';
import toolsManifest from '@/lib/mcp/tools.json';
import {
  createGovernanceContext,
  extractTenantFromJWT,
  getDefaultTenant,
} from '@/lib/mcp/governance';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const tenantId = extractTenantFromJWT(request.headers.get('authorization')) || getDefaultTenant();
  const governance = createGovernanceContext(tenantId, 'G13');

  // Build the full URL base
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  // Enrich manifest with full URLs
  const enrichedManifest = {
    ...toolsManifest,
    base_url: `${baseUrl}/api/mcp/tools`,
    tools: toolsManifest.tools.map(tool => ({
      ...tool,
      endpoint: `${baseUrl}${tool.endpoint}`,
    })),
    metadata: {
      ...toolsManifest.metadata,
      generated_at: new Date().toISOString(),
    },
  };

  return NextResponse.json({
    success: true,
    data: enrichedManifest,
    error: null,
    governance,
  }, {
    headers: {
      'Cache-Control': 'public, max-age=300',
      'X-MCP-Version': toolsManifest.version,
    },
  });
}

/**
 * POST /api/mcp/tools
 * Invoke a tool by name (alternative to direct endpoint access).
 */
export async function POST(request: NextRequest) {
  const tenantId = extractTenantFromJWT(request.headers.get('authorization')) || getDefaultTenant();
  const governance = createGovernanceContext(tenantId, 'G13');

  try {
    const body = await request.json();
    const { tool, input } = body;

    if (!tool || typeof tool !== 'string') {
      return NextResponse.json({
        success: false,
        data: null,
        error: {
          code: 'E001',
          message: 'Missing or invalid tool name',
        },
        governance,
      }, { status: 400 });
    }

    // Find the tool in manifest
    const toolDef = toolsManifest.tools.find(t => t.name === tool);
    if (!toolDef) {
      return NextResponse.json({
        success: false,
        data: null,
        error: {
          code: 'E004',
          message: `Tool not found: ${tool}`,
          details: {
            available_tools: toolsManifest.tools.map(t => t.name),
          },
        },
        governance,
      }, { status: 404 });
    }

    // Forward to the tool endpoint
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const toolUrl = `${protocol}://${host}${toolDef.endpoint}`;

    const toolResponse = await fetch(toolUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify(input || {}),
    });

    const result = await toolResponse.json();
    return NextResponse.json(result, { status: toolResponse.status });

  } catch (error) {
    return NextResponse.json({
      success: false,
      data: null,
      error: {
        code: 'E006',
        message: (error as Error).message,
      },
      governance,
    }, { status: 500 });
  }
}
