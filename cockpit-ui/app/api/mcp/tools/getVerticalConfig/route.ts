// app/api/mcp/tools/getVerticalConfig/route.ts
// GET /api/mcp/tools/getVerticalConfig?vertical_id=solar
// Returns vertical template configuration

import { NextRequest, NextResponse } from 'next/server';
import {
  verticalRegistry,
  isValidVerticalId,
  type VerticalId,
  type VerticalConfigResponse,
} from '@/lib/verticals';

/**
 * GET /api/mcp/tools/getVerticalConfig
 *
 * Returns the complete configuration for a specific vertical.
 * Used by MCP tools and dashboard components.
 *
 * Query Parameters:
 * - vertical_id: The ID of the vertical (solar, takaful, ecommerce, training, construction, automotive)
 * - include_mock_data: Optional boolean to include mock data in response
 *
 * Returns:
 * - 200: Vertical template configuration
 * - 400: Invalid or missing vertical_id
 * - 404: Vertical not found
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const verticalId = searchParams.get('vertical_id');
    const includeMockData = searchParams.get('include_mock_data') === 'true';

    // Validate vertical_id parameter
    if (!verticalId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing required parameter: vertical_id',
          available_verticals: verticalRegistry.toMCPResponse().verticals,
        },
        { status: 400 }
      );
    }

    // Validate vertical ID format
    if (!isValidVerticalId(verticalId)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid vertical_id: ${verticalId}`,
          available_verticals: verticalRegistry.toMCPResponse().verticals,
        },
        { status: 400 }
      );
    }

    // Get template from registry
    const template = verticalRegistry.getTemplate(verticalId as VerticalId);

    if (!template) {
      return NextResponse.json(
        {
          ok: false,
          error: `Vertical not found: ${verticalId}`,
          available_verticals: verticalRegistry.toMCPResponse().verticals,
        },
        { status: 404 }
      );
    }

    // Build response
    const response: VerticalConfigResponse & { mock_data?: Record<string, unknown> } = {
      ok: true,
      data: template,
    };

    // Include mock data if requested
    if (includeMockData) {
      const mockData = verticalRegistry.getMockData(verticalId as VerticalId);
      if (mockData) {
        response.mock_data = mockData;
      }
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('getVerticalConfig API error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mcp/tools/getVerticalConfig (no params)
 * Returns list of all available verticals when no vertical_id is provided
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { vertical_id, include_mock_data } = body;

    // If no vertical_id, return list of all verticals
    if (!vertical_id) {
      return NextResponse.json({
        ok: true,
        data: verticalRegistry.toMCPResponse(),
      });
    }

    // Validate vertical ID format
    if (!isValidVerticalId(vertical_id)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid vertical_id: ${vertical_id}`,
          available_verticals: verticalRegistry.toMCPResponse().verticals,
        },
        { status: 400 }
      );
    }

    // Get template from registry
    const template = verticalRegistry.getTemplate(vertical_id as VerticalId);

    if (!template) {
      return NextResponse.json(
        {
          ok: false,
          error: `Vertical not found: ${vertical_id}`,
          available_verticals: verticalRegistry.toMCPResponse().verticals,
        },
        { status: 404 }
      );
    }

    // Build response
    const response: VerticalConfigResponse & { mock_data?: Record<string, unknown> } = {
      ok: true,
      data: template,
    };

    // Include mock data if requested
    if (include_mock_data) {
      const mockData = verticalRegistry.getMockData(vertical_id as VerticalId);
      if (mockData) {
        response.mock_data = mockData;
      }
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('getVerticalConfig API error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
