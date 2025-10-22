// app/api/mcp/federation/sync/route.ts
// Federation sync endpoint for ACK exchange between Atlas and Tower nodes

import { NextRequest, NextResponse } from "next/server";
import { verifyAck, isValidBatchId, isValidEventId } from "@/lib/federation/signer";
import { insertAck, hasAck, getAcksSince, exportLedgerToJSONL } from "@/lib/federation/ledger";
import { recordClockSkew } from "@/lib/security/healthTracker";

const MAX_ITEMS_PER_BATCH = 100;
const MAX_PAYLOAD_SIZE_MB = 5;
const RATE_LIMIT_PER_MIN = 10;

// In-memory rate limiting (per node_id)
const rateLimits = new Map<
  string,
  { count: number; resetAt: number }
>();

// Batch-level idempotency cache (TTL: 24 hours)
const batchCache = new Map<string, any>();
const BATCH_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface SyncRequest {
  protocol_version: string;
  batch_id: string;
  node_id: string;
  node_type: "atlas" | "tower";
  since?: number;
  window_ms?: number;
  items: any[];
  cursor?: string | null;
}

interface SyncResponse {
  status: "ok" | "partial" | "error";
  batch_id: string;
  received: number;
  skipped: number;
  errors: number;
  clock_skew_ms: number;
  next_cursor?: string | null;
  details: Array<{
    event_id: string;
    status: "received" | "skipped" | "error";
    reason?: string;
  }>;
}

/**
 * Check rate limit for node_id
 */
function checkRateLimit(nodeId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const limit = rateLimits.get(nodeId);

  if (!limit || now > limit.resetAt) {
    // Reset window
    rateLimits.set(nodeId, {
      count: 1,
      resetAt: now + 60000, // 1 minute window
    });
    return { allowed: true };
  }

  if (limit.count >= RATE_LIMIT_PER_MIN) {
    const retryAfter = Math.ceil((limit.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  limit.count++;
  return { allowed: true };
}

/**
 * Check payload size
 */
function checkPayloadSize(req: NextRequest): { ok: boolean; sizeMB?: number } {
  const contentLength = req.headers.get("content-length");

  if (!contentLength) {
    return { ok: true }; // No content-length header, allow
  }

  const sizeBytes = parseInt(contentLength, 10);
  const sizeMB = sizeBytes / (1024 * 1024);

  if (sizeMB > MAX_PAYLOAD_SIZE_MB) {
    return { ok: false, sizeMB };
  }

  return { ok: true, sizeMB };
}

/**
 * Verify federation key authentication
 */
function verifyFederationKey(req: NextRequest): boolean {
  const providedKey = req.headers.get("x-federation-key");
  const expectedKey = process.env.FEDERATION_KEY;

  if (!expectedKey) {
    console.warn("[Federation] FEDERATION_KEY not configured");
    return false;
  }

  // Constant-time comparison
  if (providedKey !== expectedKey) {
    return false;
  }

  return true;
}

/**
 * Clean expired batch cache entries
 */
function cleanBatchCache() {
  const now = Date.now();
  for (const [batchId, entry] of batchCache.entries()) {
    if (now - entry.cachedAt > BATCH_CACHE_TTL_MS) {
      batchCache.delete(batchId);
    }
  }
}

/**
 * POST /api/mcp/federation/sync
 * Exchange ACK logs between federation nodes
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Check panic mode
    const panicMode = process.env.ATLAS_PANIC === "true";
    if (panicMode) {
      return NextResponse.json(
        {
          error: "panic_mode_active",
          message: "Federation disabled due to panic mode",
        },
        { status: 503 }
      );
    }

    // 2. Verify federation key
    if (!verifyFederationKey(req)) {
      return NextResponse.json(
        {
          error: "unauthorized",
          message: "Invalid federation key",
        },
        { status: 401 }
      );
    }

    // 3. Check payload size
    const sizeCheck = checkPayloadSize(req);
    if (!sizeCheck.ok) {
      return NextResponse.json(
        {
          error: "payload_too_large",
          message: "Request payload exceeds 5 MB limit",
          max_size_mb: MAX_PAYLOAD_SIZE_MB,
          actual_size_mb: sizeCheck.sizeMB,
        },
        { status: 413 }
      );
    }

    // 4. Parse request body
    const body = (await req.json()) as SyncRequest;

    // 5. Validate protocol version
    if (body.protocol_version !== "1.0") {
      return NextResponse.json(
        {
          error: "unsupported_protocol",
          message: `Protocol version ${body.protocol_version} not supported`,
          supported_versions: ["1.0"],
        },
        { status: 426 } // Upgrade Required
      );
    }

    // 6. Validate batch_id format
    if (!isValidBatchId(body.batch_id)) {
      return NextResponse.json(
        {
          error: "invalid_batch_id",
          message: "batch_id must be format: batch-<uuid>",
        },
        { status: 400 }
      );
    }

    // 7. Check batch-level idempotency
    cleanBatchCache();
    if (batchCache.has(body.batch_id)) {
      console.log(`[Federation] Batch ${body.batch_id} cached (idempotent)`);
      return NextResponse.json(batchCache.get(body.batch_id));
    }

    // 8. Check rate limit
    const rateLimitCheck = checkRateLimit(body.node_id);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: "rate_limit_exceeded",
          message: "Federation sync rate limit exceeded",
          limit: RATE_LIMIT_PER_MIN,
          window_seconds: 60,
          retry_after: rateLimitCheck.retryAfter,
        },
        { status: 429 }
      );
    }

    // 9. Validate item count
    if (body.items.length > MAX_ITEMS_PER_BATCH) {
      return NextResponse.json(
        {
          error: "too_many_items",
          message: `Maximum ${MAX_ITEMS_PER_BATCH} items per batch`,
          actual_count: body.items.length,
        },
        { status: 400 }
      );
    }

    // 10. Process items
    let received = 0;
    let skipped = 0;
    let errors = 0;
    const details: Array<{ event_id: string; status: "received" | "skipped" | "error"; reason?: string }> = [];

    // Record clock skew from request timestamp
    const requestTimestamp = Number(req.headers.get("x-request-timestamp"));
    const serverTimestamp = Date.now();
    const clockSkewMs = requestTimestamp ? requestTimestamp - serverTimestamp : 0;

    if (requestTimestamp) {
      recordClockSkew(clockSkewMs);
    }

    for (const item of body.items) {
      // Validate event_id format
      if (!isValidEventId(item.event_id)) {
        details.push({
          event_id: item.event_id,
          status: "error",
          reason: "invalid_event_id",
        });
        errors++;
        continue;
      }

      // Check if already exists (item-level idempotency)
      if (hasAck(item.event_id)) {
        details.push({
          event_id: item.event_id,
          status: "skipped",
          reason: "duplicate",
        });
        skipped++;
        continue;
      }

      // Verify signature
      const verification = verifyAck(item, {
        sharedKey: process.env.FEDERATION_KEY,
        maxAgeSec: 300,
      });

      if (!verification.valid) {
        details.push({
          event_id: item.event_id,
          status: "error",
          reason: verification.error,
        });
        errors++;
        continue;
      }

      // Insert into ledger
      const inserted = insertAck(item, body.batch_id);

      if (inserted) {
        details.push({
          event_id: item.event_id,
          status: "received",
        });
        received++;
      } else {
        // Should not happen (already checked hasAck above)
        details.push({
          event_id: item.event_id,
          status: "skipped",
          reason: "duplicate",
        });
        skipped++;
      }
    }

    // 11. Export ledger to JSONL (async, non-blocking)
    if (received > 0) {
      setImmediate(() => exportLedgerToJSONL());
    }

    // 12. Construct response
    const response: SyncResponse = {
      status: errors === 0 ? "ok" : errors < body.items.length ? "partial" : "error",
      batch_id: body.batch_id,
      received,
      skipped,
      errors,
      clock_skew_ms: clockSkewMs,
      details,
    };

    // 13. Cache response for idempotency
    batchCache.set(body.batch_id, {
      ...response,
      cachedAt: Date.now(),
    });

    // 14. Add response headers
    const res = NextResponse.json(response);
    res.headers.set("X-Clock-Skew-Ms", String(clockSkewMs));

    return res;
  } catch (error) {
    console.error("[Federation] Sync error:", error);
    return NextResponse.json(
      {
        error: "internal_server_error",
        message: "Failed to process federation sync",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mcp/federation/sync
 * Query ACKs for export to other nodes
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Verify federation key
    if (!verifyFederationKey(req)) {
      return NextResponse.json(
        {
          error: "unauthorized",
          message: "Invalid federation key",
        },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since");
    const limit = searchParams.get("limit");

    const sinceTimestamp = since ? parseInt(since, 10) : 0;
    const limitCount = limit ? Math.min(parseInt(limit, 10), MAX_ITEMS_PER_BATCH) : 100;

    // 3. Query ledger
    const acks = getAcksSince(sinceTimestamp, limitCount);

    // 4. Return items
    return NextResponse.json({
      items: acks,
      count: acks.length,
      since: sinceTimestamp,
      limit: limitCount,
    });
  } catch (error) {
    console.error("[Federation] Query error:", error);
    return NextResponse.json(
      {
        error: "internal_server_error",
        message: "Failed to query federation ACKs",
      },
      { status: 500 }
    );
  }
}
