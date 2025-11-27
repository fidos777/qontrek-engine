/**
 * MCP Tool: getKPISnapshot
 *
 * POST /api/mcp/tools/getKPISnapshot
 * Get current KPI values across recovery, conversion, and engagement metrics.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractAuthContext,
  logToolInvocation,
  createSuccessResponse,
  createErrorResponse,
  parseRequestBody,
  getCurrentTimestamp,
  DEMO_KPIS,
} from '@/lib/mcp';
import { GetKPISnapshotInputSchema } from '@/lib/mcp/schemas';

export const runtime = 'nodejs';

const TOOL_NAME = 'getKPISnapshot';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const authContext = extractAuthContext(request.headers);

  try {
    // Parse and validate input
    const rawInput = await parseRequestBody<Record<string, unknown>>(request);
    const input = GetKPISnapshotInputSchema.parse(rawInput ?? {});

    // Define KPI type with all trend options
    type KPIItem = {
      id: string;
      name: string;
      value: number;
      target: number;
      unit: string;
      trend: 'up' | 'down' | 'stable';
    };

    // Get KPIs based on category
    let kpis: KPIItem[] = [];

    if (input.category === 'all' || !input.category) {
      kpis = [
        ...DEMO_KPIS.recovery,
        ...DEMO_KPIS.conversion,
        ...DEMO_KPIS.engagement,
      ] as KPIItem[];
    } else if (input.category === 'recovery') {
      kpis = DEMO_KPIS.recovery as KPIItem[];
    } else if (input.category === 'conversion') {
      kpis = DEMO_KPIS.conversion as KPIItem[];
    } else if (input.category === 'engagement') {
      kpis = DEMO_KPIS.engagement as KPIItem[];
    }

    // Log tool invocation
    const governance = await logToolInvocation(TOOL_NAME, authContext, input, true);

    // Build response
    const data = {
      kpis,
      as_of: getCurrentTimestamp(),
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
        { kpis: [], as_of: getCurrentTimestamp() }
      ),
      { status: 400 }
    );
  }
}
