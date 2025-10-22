// app/api/mcp/rate-limit/route.ts
// Rate limit status endpoint

import { NextRequest, NextResponse } from "next/server";

// In-memory rate limit tracking (simplified for demo)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get("x-tenant-id") || "default";
    const limit = 100; // 100 req/min

    // Get current rate limit for tenant
    const now = Date.now();
    const bucket = rateLimitStore.get(tenantId);

    if (!bucket || bucket.resetAt < now) {
      // No bucket or expired, return 0
      return NextResponse.json({
        tenant: tenantId,
        current: 0,
        limit,
        resetAt: now + 60000, // Next minute
      });
    }

    return NextResponse.json({
      tenant: tenantId,
      current: bucket.count,
      limit,
      resetAt: bucket.resetAt,
      remaining: Math.max(0, limit - bucket.count),
    });
  } catch (error) {
    console.error("Rate limit check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper to increment rate limit (called by middleware)
export function incrementRateLimit(tenantId: string): boolean {
  const limit = 100;
  const now = Date.now();
  const bucket = rateLimitStore.get(tenantId);

  if (!bucket || bucket.resetAt < now) {
    // Create new bucket
    rateLimitStore.set(tenantId, {
      count: 1,
      resetAt: now + 60000, // 1 minute from now
    });
    return true; // Allow
  }

  if (bucket.count >= limit) {
    return false; // Rate limited
  }

  bucket.count++;
  return true; // Allow
}
