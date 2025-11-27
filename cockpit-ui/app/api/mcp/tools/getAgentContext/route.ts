/**
 * MCP Tool: getAgentContext
 *
 * POST /api/mcp/tools/getAgentContext
 * Get the context for an AI agent including persona, available tools, and permissions.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractAuthContext,
  logToolInvocation,
  createSuccessResponse,
  createErrorResponse,
  parseRequestBody,
  DEMO_TENANTS,
  DEMO_AGENTS,
} from '@/lib/mcp';
import { GetAgentContextInputSchema } from '@/lib/mcp/schemas';

export const runtime = 'nodejs';

const TOOL_NAME = 'getAgentContext';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const authContext = extractAuthContext(request.headers);

  try {
    // Parse and validate input
    const rawInput = await parseRequestBody<Record<string, unknown>>(request);
    const input = GetAgentContextInputSchema.parse(rawInput ?? {});

    // Get agent config or default
    const agentId = input.agent_id || 'default';
    const agentConfig = DEMO_AGENTS[agentId as keyof typeof DEMO_AGENTS] || DEMO_AGENTS.default;

    // Get tenant info
    const tenant = DEMO_TENANTS.find(t => t.id === authContext.tenant_id) || DEMO_TENANTS[0];

    // Log tool invocation
    const governance = await logToolInvocation(TOOL_NAME, authContext, input, true);

    // Build response
    const data = {
      persona: agentConfig.persona,
      tools: [...agentConfig.tools],
      permissions: [...agentConfig.permissions] as string[],
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
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
        { persona: '', tools: [], permissions: [], tenant: { id: '', name: '', slug: '' } }
      ),
      { status: 400 }
    );
  }
}
