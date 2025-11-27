/**
 * MCP Tool: getGovernanceStatus
 *
 * POST /api/mcp/tools/getGovernanceStatus
 * Get current governance status including all gate checks (G13-G21) and trust index.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractAuthContext,
  logToolInvocation,
  createSuccessResponse,
  createErrorResponse,
  parseRequestBody,
  getCurrentTimestamp,
  getDemoGovernanceStatus,
  calculateTrustIndex,
} from '@/lib/mcp';
import { GetGovernanceStatusInputSchema } from '@/lib/mcp/schemas';

export const runtime = 'nodejs';

const TOOL_NAME = 'getGovernanceStatus';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const authContext = extractAuthContext(request.headers);

  try {
    // Parse and validate input
    const rawInput = await parseRequestBody<Record<string, unknown>>(request);
    const input = GetGovernanceStatusInputSchema.parse(rawInput ?? {});

    // Get governance status
    const gates = getDemoGovernanceStatus(input.include_evidence);
    const trustIndex = calculateTrustIndex(gates);

    // Log tool invocation
    const governance = await logToolInvocation(TOOL_NAME, authContext, input, true);

    // Build response
    const data = {
      gates,
      trust_index: trustIndex,
      last_updated: getCurrentTimestamp(),
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
        { gates: {}, trust_index: 0, last_updated: getCurrentTimestamp() }
      ),
      { status: 400 }
    );
  }
}
