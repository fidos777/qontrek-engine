// API endpoint to get vertical configuration
// GET /api/mcp/tools/getVerticalConfig?vertical_id=solar

import { NextRequest, NextResponse } from "next/server";
import { getVerticalTemplate, isValidVerticalId, getAllVerticalsMeta } from "@/lib/verticals/templates";
import type { VerticalConfigResponse } from "@/lib/verticals/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const verticalId = searchParams.get("vertical_id");

  // If no vertical_id provided, return list of all verticals
  if (!verticalId) {
    const verticals = getAllVerticalsMeta();
    return NextResponse.json({
      ok: true,
      verticals,
      timestamp: new Date().toISOString(),
    });
  }

  // Validate vertical ID
  if (!isValidVerticalId(verticalId)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Invalid vertical_id: ${verticalId}`,
        validVerticals: getAllVerticalsMeta().map((v) => v.id),
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // Get vertical template
  const vertical = getVerticalTemplate(verticalId);

  if (!vertical) {
    return NextResponse.json(
      {
        ok: false,
        error: `Vertical not found: ${verticalId}`,
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    );
  }

  const response: VerticalConfigResponse = {
    ok: true,
    vertical,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response);
}
