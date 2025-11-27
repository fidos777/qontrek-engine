/**
 * MCP Tool: logProofEvent
 *
 * POST /api/mcp/tools/logProofEvent
 * Log an event to the proof chain for audit compliance (G13 lineage tracking).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractAuthContext,
  logToolInvocation,
  createSuccessResponse,
  createErrorResponse,
  parseRequestBody,
  getCurrentTimestamp,
  logProofEvent,
} from '@/lib/mcp';
import { LogProofEventInputSchema } from '@/lib/mcp/schemas';

export const runtime = 'nodejs';

const TOOL_NAME = 'logProofEvent';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const authContext = extractAuthContext(request.headers);

  try {
    // Parse and validate input
    const rawInput = await parseRequestBody<Record<string, unknown>>(request);
    const input = LogProofEventInputSchema.parse(rawInput);

    // Log the proof event
    const result = await logProofEvent(
      authContext.tenant_id,
      input.event_type,
      input.actor,
      input.target,
      input.metadata
    );

    // Log tool invocation
    const governance = await logToolInvocation(TOOL_NAME, authContext, { event_type: input.event_type }, true);

    // Build response
    const data = {
      event_id: result.event_id,
      proof_hash: result.proof_hash,
      timestamp: result.timestamp,
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
        { event_id: '', proof_hash: '', timestamp: getCurrentTimestamp() }
      ),
      { status: 400 }
    );
  }
}
