/**
 * MCP Tool: getPipelineSummary
 *
 * POST /api/mcp/tools/getPipelineSummary
 * Get sales pipeline summary with stage counts, values, and average days.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractAuthContext,
  logToolInvocation,
  createSuccessResponse,
  createErrorResponse,
  parseRequestBody,
  DEMO_PIPELINE_STAGES,
} from '@/lib/mcp';
import { GetPipelineSummaryInputSchema } from '@/lib/mcp/schemas';

export const runtime = 'nodejs';

const TOOL_NAME = 'getPipelineSummary';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const authContext = extractAuthContext(request.headers);

  try {
    // Parse and validate input
    const rawInput = await parseRequestBody<Record<string, unknown>>(request);
    const input = GetPipelineSummaryInputSchema.parse(rawInput ?? {});

    // Filter stages if specified
    let stages = [...DEMO_PIPELINE_STAGES];
    if (input.stage) {
      stages = stages.filter(s => s.name.toLowerCase() === input.stage?.toLowerCase());
    }

    // Calculate totals
    const totalValueRm = stages.reduce((sum, s) => sum + s.value_rm, 0);
    const totalLeads = stages.reduce((sum, s) => sum + s.count, 0);

    // Log tool invocation
    const governance = await logToolInvocation(TOOL_NAME, authContext, input, true);

    // Build response
    const data = {
      stages,
      total_value_rm: totalValueRm,
      total_leads: totalLeads,
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
        { stages: [], total_value_rm: 0, total_leads: 0 }
      ),
      { status: 400 }
    );
  }
}
