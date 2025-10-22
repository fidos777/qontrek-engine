// app/api/mcp/sync/tower/route.ts
// Manual Tower Sync Endpoint - Controlled synchronization for demo safety

import { NextResponse } from "next/server";
import { runTowerSync } from "@/app/jobs/tower_sync";
import { isFederationEnabled } from "@/lib/config";

export async function POST(req: Request) {
  // Check federation flag
  if (!isFederationEnabled()) {
    return NextResponse.json(
      {
        error: "federation_disabled",
        message: "Atlas Federation is disabled. Set ATLAS_FEDERATION_ENABLED=true to enable Tower sync.",
      },
      { status: 503 }
    );
  }

  try {
    console.log("🔄 Manual Tower sync initiated via API");

    const result = await runTowerSync();

    if (!result.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "sync_failed",
          message: "Tower sync failed",
          details: result,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      ack: true,
      merged: result.merged,
      errors: result.errors,
      timestamp: new Date().toISOString(),
      message: `Successfully synced ${result.merged} events from Tower`,
    });
  } catch (error) {
    console.error("Tower sync API error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "sync_error",
        message: String(error),
      },
      { status: 500 }
    );
  }
}

// GET to check sync status
export async function GET() {
  if (!isFederationEnabled()) {
    return NextResponse.json({
      enabled: false,
      message: "Tower sync is disabled",
    });
  }

  return NextResponse.json({
    enabled: true,
    endpoint: "/api/mcp/sync/tower",
    method: "POST",
    message: "Tower sync is enabled. POST to trigger manual sync.",
  });
}
