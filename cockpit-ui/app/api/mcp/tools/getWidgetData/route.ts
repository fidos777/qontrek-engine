/**
 * MCP Tool: getWidgetData
 *
 * POST /api/mcp/tools/getWidgetData
 * Get rendered data for a specific dashboard widget type.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractAuthContext,
  logToolInvocation,
  createSuccessResponse,
  createErrorResponse,
  parseRequestBody,
  getCurrentTimestamp,
  DEMO_WIDGETS,
} from '@/lib/mcp';
import { GetWidgetDataInputSchema } from '@/lib/mcp/schemas';

export const runtime = 'nodejs';

const TOOL_NAME = 'getWidgetData';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const authContext = extractAuthContext(request.headers);

  try {
    // Parse and validate input
    const rawInput = await parseRequestBody<Record<string, unknown>>(request);
    const input = GetWidgetDataInputSchema.parse(rawInput);

    // Get widget data
    const widgetData = DEMO_WIDGETS[input.widget_type as keyof typeof DEMO_WIDGETS];

    if (!widgetData) {
      const governance = await logToolInvocation(TOOL_NAME, authContext, input, false);

      // Return available widget types in error
      const availableWidgets = Object.keys(DEMO_WIDGETS);

      return NextResponse.json(
        createErrorResponse(
          TOOL_NAME,
          'NOT_FOUND',
          `Widget type '${input.widget_type}' not found. Available: ${availableWidgets.join(', ')}`,
          governance,
          startTime,
          { widget_type: input.widget_type, data: {}, rendered_at: '' }
        ),
        { status: 404 }
      );
    }

    // Apply config transformations if provided
    let data = { ...widgetData };
    if (input.config) {
      // In production, this would apply widget-specific config transformations
      data = { ...data, ...input.config };
    }

    // Log tool invocation
    const governance = await logToolInvocation(TOOL_NAME, authContext, input, true);

    // Build response
    const response = {
      widget_type: input.widget_type,
      data,
      rendered_at: getCurrentTimestamp(),
    };

    return NextResponse.json(
      createSuccessResponse(TOOL_NAME, response, governance, startTime)
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
        { widget_type: '', data: {}, rendered_at: '' }
      ),
      { status: 400 }
    );
  }
}
