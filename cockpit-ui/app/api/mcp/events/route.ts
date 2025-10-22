// app/api/mcp/events/route.ts
// MCP Events Endpoint - List event definitions and stream live proof events

import { NextResponse } from "next/server";
import { readFileSync, appendFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";

const EVENTS_REGISTRY_PATH = join(process.cwd(), "public", "mcp", "events.json");
const EVENTS_LOG_PATH = join(process.cwd(), "public", "mcp", "events.log.jsonl");

export async function GET(req: Request) {
  const url = new URL(req.url);
  const stream = url.searchParams.get("stream");
  const since = url.searchParams.get("since"); // Support ?since=<id> for Tower sync

  // If stream=true, return recent events from log
  if (stream === "true") {
    try {
      if (!existsSync(EVENTS_LOG_PATH)) {
        return NextResponse.json(
          { events: [], message: "No events logged yet" },
          { headers: { "Cache-Control": "no-store" } }
        );
      }

      const log = readFileSync(EVENTS_LOG_PATH, "utf-8");
      let events = log
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      // Filter by "since" timestamp or signature
      if (since) {
        const sinceValue = since;
        const sinceIndex = events.findIndex(
          (e: any) => e.signature === sinceValue || e.timestamp?.toString() === sinceValue
        );
        if (sinceIndex !== -1) {
          events = events.slice(sinceIndex + 1); // Return events after "since"
        }
      }

      return NextResponse.json(
        { events, count: events.length, since: since || null },
        { headers: { "Cache-Control": "no-store" } }
      );
    } catch (error) {
      return NextResponse.json(
        { error: "failed_to_read_events", message: String(error) },
        { status: 500 }
      );
    }
  }

  // Default: return event definitions
  try {
    const registry = JSON.parse(readFileSync(EVENTS_REGISTRY_PATH, "utf-8"));

    return NextResponse.json(registry, {
      headers: {
        "Cache-Control": "public, max-age=60",
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "registry_not_found", message: "Run 'npm run atlas:build' to generate registry" },
      { status: 404 }
    );
  }
}

// POST endpoint for appending events (internal use)
export async function POST(req: Request) {
  try {
    const event = await req.json();

    // Validate event structure
    if (!event.type || !event.timestamp) {
      return NextResponse.json(
        { error: "invalid_event", message: "Event must have 'type' and 'timestamp'" },
        { status: 400 }
      );
    }

    // Ensure log file exists
    if (!existsSync(EVENTS_LOG_PATH)) {
      writeFileSync(EVENTS_LOG_PATH, "");
    }

    // Append event to log
    appendFileSync(EVENTS_LOG_PATH, JSON.stringify(event) + "\n");

    return NextResponse.json(
      { ok: true, event },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "failed_to_log_event", message: String(error) },
      { status: 500 }
    );
  }
}
