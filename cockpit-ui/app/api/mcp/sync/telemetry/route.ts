// app/api/mcp/sync/telemetry/route.ts
// Manual Telemetry Sync Endpoint - Controlled batch upload for demo safety

import { NextResponse } from "next/server";
import { runTelemetrySync } from "@/app/jobs/telemetry_sync";
import { isFederationEnabled } from "@/lib/config";

export async function POST(req: Request) {
  // Check federation flag
  if (!isFederationEnabled()) {
    return NextResponse.json(
      {
        error: "federation_disabled",
        message: "Atlas Federation is disabled. Set ATLAS_FEDERATION_ENABLED=true to enable telemetry sync.",
      },
      { status: 503 }
    );
  }

  try {
    console.log("📊 Manual telemetry sync initiated via API");

    const result = await runTelemetrySync();

    if (!result.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "sync_failed",
          message: "Telemetry sync failed",
          details: result,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      ack: true,
      uploaded: result.uploaded,
      timestamp: new Date().toISOString(),
      message: `Successfully uploaded ${result.uploaded} telemetry events to Tower`,
    });
  } catch (error) {
    console.error("Telemetry sync API error:", error);

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
      message: "Telemetry sync is disabled",
    });
  }

  return NextResponse.json({
    enabled: true,
    endpoint: "/api/mcp/sync/telemetry",
    method: "POST",
    message: "Telemetry sync is enabled. POST to trigger manual sync.",
  });
}
