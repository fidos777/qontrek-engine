// app/api/mcp/telemetry/route.ts
// UI telemetry event collection endpoint (Secure with PII scrubbing)

import { NextRequest, NextResponse } from "next/server";
import { writeLog, pruneLogs } from "@/lib/logs/logger";
import { redact } from "@/lib/logs/scrub";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, timestamp, ...payload } = body;

    if (!event) {
      return NextResponse.json(
        { error: "event name required" },
        { status: 400 }
      );
    }

    // Create telemetry entry
    const entry = {
      event,
      timestamp: timestamp || Date.now(),
      ...payload,
    };

    // Scrub PII before logging
    const scrubbed = redact(entry);

    // Log to console
    console.log("[UI TELEMETRY]", JSON.stringify(scrubbed));

    // Write to secure log with rotation
    writeLog(scrubbed);

    // Prune old logs (async, don't block)
    setImmediate(() => pruneLogs());

    return NextResponse.json({
      ok: true,
      event,
      timestamp: entry.timestamp,
    });
  } catch (error) {
    console.error("Telemetry error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET moved to /api/mcp/events/log (authenticated endpoint)
