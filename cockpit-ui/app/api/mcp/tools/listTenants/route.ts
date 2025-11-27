/**
 * MCP Tool: listTenants
 *
 * POST /api/mcp/tools/listTenants
 * List all tenants accessible to the current user.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractAuthContext,
  logToolInvocation,
  createSuccessResponse,
  createErrorResponse,
  parseRequestBody,
  getCurrentTimestamp,
  DEMO_TENANTS,
} from '@/lib/mcp';
import { ListTenantsInputSchema } from '@/lib/mcp/schemas';

export const runtime = 'nodejs';

const TOOL_NAME = 'listTenants';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const authContext = extractAuthContext(request.headers);

  try {
    // Parse and validate input
    const rawInput = await parseRequestBody<Record<string, unknown>>(request);
    const input = ListTenantsInputSchema.parse(rawInput ?? {});

    // Filter tenants based on input
    let tenants = [...DEMO_TENANTS];

    if (input.filter === 'active') {
      tenants = tenants.filter(t => t.status === 'active');
    }

    if (input.limit) {
      tenants = tenants.slice(0, input.limit);
    }

    // Log tool invocation
    const governance = await logToolInvocation(TOOL_NAME, authContext, input, true);

    // Build response
    const data = {
      tenants: tenants.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.status,
      })),
      total: tenants.length,
    };

    return NextResponse.json(
      createSuccessResponse(TOOL_NAME, data, governance, startTime)
    );
  } catch (error) {
    const governance = await logToolInvocation(TOOL_NAME, authContext, {}, false);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      createErrorResponse(
        TOOL_NAME,
        'VALIDATION_ERROR',
        errorMessage,
        governance,
        startTime,
        { tenants: [], total: 0 }
      ),
      { status: 400 }
    );
  }
}
