// app/api/mcp/telemetry/route.ts
// UI telemetry event collection endpoint

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const TELEMETRY_LOG = path.join(process.cwd(), "public/mcp/telemetry.log.jsonl");

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

    // Log to console
    console.log("[UI TELEMETRY]", JSON.stringify(entry));

    // Append to JSONL log file
    try {
      const logDir = path.dirname(TELEMETRY_LOG);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      fs.appendFileSync(TELEMETRY_LOG, JSON.stringify(entry) + "\n");
    } catch (fsError) {
      console.error("Failed to write telemetry log:", fsError);
      // Don't fail the request if logging fails
    }

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

export async function GET() {
  try {
    // Read recent telemetry events
    if (!fs.existsSync(TELEMETRY_LOG)) {
      return NextResponse.json({ events: [], count: 0 });
    }

    const content = fs.readFileSync(TELEMETRY_LOG, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    const events = lines.slice(-100).map((line) => JSON.parse(line)); // Last 100 events

    return NextResponse.json({
      events,
      count: events.length,
      total: lines.length,
    });
  } catch (error) {
    console.error("Telemetry read error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
