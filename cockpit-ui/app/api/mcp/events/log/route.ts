// app/api/mcp/events/log/route.ts
// Authenticated log tail API

import { NextRequest, NextResponse } from "next/server";
import { readLogTail } from "@/lib/logs/logger";
import { redact } from "@/lib/logs/scrub";

export async function GET(req: NextRequest) {
  // Verify authentication
  const key = req.headers.get("x-atlas-key");
  const expectedKey = process.env.ATLAS_KEY;

  if (!expectedKey) {
    return NextResponse.json(
      { error: "server_misconfigured", message: "ATLAS_KEY not set" },
      { status: 500 }
    );
  }

  if (key !== expectedKey) {
    return NextResponse.json(
      { error: "unauthorized", message: "Valid X-Atlas-Key required" },
      { status: 401, headers: { "WWW-Authenticate": "X-Atlas-Key" } }
    );
  }

  try {
    // Get tail parameter (default 100)
    const url = new URL(req.url);
    const tail = Number(url.searchParams.get("tail") || "100");
    const limit = Math.min(Math.max(1, tail), 1000); // Cap at 1000

    // Read log entries
    const entries = readLogTail(limit);

    // Scrub PII from entries
    const scrubbed = entries.map((entry) => redact(entry));

    return NextResponse.json({
      entries: scrubbed,
      count: scrubbed.length,
      tail: limit,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Log tail error:", error);
    return NextResponse.json(
      { error: "internal_error", message: String(error) },
      { status: 500 }
    );
  }
}
