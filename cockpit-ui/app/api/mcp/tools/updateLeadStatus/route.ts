/**
 * MCP Tool: updateLeadStatus
 *
 * POST /api/mcp/tools/updateLeadStatus
 * Update the status of a lead and log the change to the proof chain.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractAuthContext,
  logToolInvocation,
  createSuccessResponse,
  createErrorResponse,
  parseRequestBody,
  getCurrentTimestamp,
  DEMO_LEADS,
  logProofEvent,
} from '@/lib/mcp';
import { UpdateLeadStatusInputSchema } from '@/lib/mcp/schemas';

export const runtime = 'nodejs';

const TOOL_NAME = 'updateLeadStatus';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const authContext = extractAuthContext(request.headers);

  try {
    // Parse and validate input
    const rawInput = await parseRequestBody<Record<string, unknown>>(request);
    const input = UpdateLeadStatusInputSchema.parse(rawInput);

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
          { success: false, lead_id: input.lead_id, new_status: '', updated_at: '' }
        ),
        { status: 404 }
      );
    }

    // Log the status change to proof chain
    await logProofEvent(
      authContext.tenant_id,
      'lead_status_update',
      { id: authContext.user_id, type: authContext.is_demo ? 'system' : 'user' },
      { id: input.lead_id, type: 'lead', name: lead.name },
      {
        old_status: lead.stage,
        new_status: input.status,
        notes: input.notes,
      }
    );

    // In demo mode, we just return success
    // In production, this would update the database
    const updatedAt = getCurrentTimestamp();

    // Log tool invocation
    const governance = await logToolInvocation(TOOL_NAME, authContext, input, true);

    // Build response
    const data = {
      success: true,
      lead_id: input.lead_id,
      new_status: input.status,
      updated_at: updatedAt,
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
        { success: false, lead_id: '', new_status: '', updated_at: '' }
      ),
      { status: 400 }
    );
  }
}
