/**
 * MCP Tool: getLeadDetails
 *
 * POST /api/mcp/tools/getLeadDetails
 * Get detailed information about a specific lead including optional history.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractAuthContext,
  logToolInvocation,
  createSuccessResponse,
  createErrorResponse,
  parseRequestBody,
  DEMO_LEADS,
  getLeadHistory,
} from '@/lib/mcp';
import { GetLeadDetailsInputSchema } from '@/lib/mcp/schemas';

export const runtime = 'nodejs';

const TOOL_NAME = 'getLeadDetails';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const authContext = extractAuthContext(request.headers);

  try {
    // Parse and validate input
    const rawInput = await parseRequestBody<Record<string, unknown>>(request);
    const input = GetLeadDetailsInputSchema.parse(rawInput);

    // Find lead by ID
    const lead = DEMO_LEADS.find(l => l.id === input.lead_id);

    if (!lead) {
      const governance = await logToolInvocation(TOOL_NAME, authContext, input, false);

      return NextResponse.json(
        createErrorResponse(
          TOOL_NAME,
          'NOT_FOUND',
          `Lead with ID ${input.lead_id} not found`,
          governance,
          startTime,
          { lead: null }
        ),
        { status: 404 }
      );
    }

    // Build lead details
    const leadDetails: Record<string, unknown> = {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      stage: lead.stage,
      amount_rm: lead.amount_rm,
      data: lead.data,
    };

    // Include history if requested
    if (input.include_history) {
      leadDetails.history = getLeadHistory(lead.id);
    }

    // Log tool invocation
    const governance = await logToolInvocation(TOOL_NAME, authContext, input, true);

    // Build response
    const data = {
      lead: leadDetails,
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
        { lead: null }
      ),
      { status: 400 }
    );
  }
}
