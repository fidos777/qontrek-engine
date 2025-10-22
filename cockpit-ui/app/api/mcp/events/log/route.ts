// app/api/mcp/events/log/route.ts
// Authenticated log tail API with size caps and rate limiting

import { NextRequest, NextResponse } from "next/server";
import { readLogTail } from "@/lib/logs/logger";
import { redact } from "@/lib/logs/scrub";

// Rate limiting per tenant
const tailRateLimits = new Map<string, { count: number; resetAt: number }>();
const MAX_TAIL_REQUESTS_PER_MIN = 10;
const MAX_RESPONSE_SIZE_MB = 2;

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

  // Rate limiting per tenant
  const tenantId = req.headers.get("x-tenant-id") || "default";
  const now = Date.now();
  const bucket = tailRateLimits.get(tenantId);

  if (!bucket || bucket.resetAt < now) {
    tailRateLimits.set(tenantId, { count: 1, resetAt: now + 60000 });
  } else if (bucket.count >= MAX_TAIL_REQUESTS_PER_MIN) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: `Tail API rate limit exceeded (${MAX_TAIL_REQUESTS_PER_MIN} requests/minute per tenant)`,
      },
      {
        status: 429,
        headers: { "Retry-After": "60" },
      }
    );
  } else {
    bucket.count++;
  }

  try {
    // Get tail parameter (default 100)
    const url = new URL(req.url);
    const tail = Number(url.searchParams.get("tail") || "100");
    const limit = Math.min(Math.max(1, tail), 1000); // Cap at 1000 entries

    // Read log entries
    const entries = readLogTail(limit);

    // Scrub PII from entries
    const scrubbed = entries.map((entry) => redact(entry));

    // Check response size before sending
    const responseData = {
      entries: scrubbed,
      count: scrubbed.length,
      tail: limit,
      timestamp: now,
      size_capped: false,
    };

    const responseSize = JSON.stringify(responseData).length;
    const maxSizeBytes = MAX_RESPONSE_SIZE_MB * 1024 * 1024;

    // If response too large, reduce entries
    if (responseSize > maxSizeBytes) {
      // Reduce to fit within size limit
      const avgEntrySize = responseSize / scrubbed.length;
      const maxEntries = Math.floor(maxSizeBytes / avgEntrySize);
      const truncated = scrubbed.slice(0, maxEntries);

      return NextResponse.json({
        entries: truncated,
        count: truncated.length,
        tail: limit,
        timestamp: now,
        size_capped: true,
        size_cap_mb: MAX_RESPONSE_SIZE_MB,
        message: `Response truncated to ${MAX_RESPONSE_SIZE_MB}MB limit`,
      });
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Log tail error:", error);
    return NextResponse.json(
      { error: "internal_error", message: String(error) },
      { status: 500 }
    );
  }
}
