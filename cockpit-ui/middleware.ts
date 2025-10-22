// middleware.ts
// Root middleware guard for /api/mcp/* endpoints
// Enforces X-Atlas-Key authentication and feature flags

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimits = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if Atlas Federation is enabled
 */
function isFederationEnabled(): boolean {
  return process.env.ATLAS_FEDERATION_ENABLED === "true";
}

/**
 * Verify X-Atlas-Key authentication
 */
function verifyAuth(request: NextRequest): { valid: boolean; error?: string } {
  const atlasKey = request.headers.get("X-Atlas-Key");
  const sharedKey = process.env.TOWER_SHARED_KEY;

  // Development bypass
  if (process.env.NODE_ENV === "development" && !atlasKey) {
    return { valid: true };
  }

  // Missing shared key configuration
  if (!sharedKey) {
    return { valid: false, error: "server_misconfigured" };
  }

  // Missing or invalid key
  if (!atlasKey || atlasKey !== sharedKey) {
    return { valid: false, error: "unauthorized" };
  }

  return { valid: true };
}

/**
 * Rate limiting per tenant
 */
function checkTenantRateLimit(request: NextRequest): boolean {
  const tenantId = request.headers.get("x-tenant-id") || "default";
  const now = Date.now();
  const key = tenantId;
  const maxPerMin = 100;

  const limit = rateLimits.get(key);

  if (!limit || limit.resetAt < now) {
    rateLimits.set(key, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (limit.count >= maxPerMin) {
    return false;
  }

  limit.count++;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip non-MCP routes
  if (!pathname.startsWith("/api/mcp/")) {
    return NextResponse.next();
  }

  // Allow /api/mcp/resources and /api/mcp/tools (discovery endpoints)
  // These are read-only and safe for public access
  if (pathname === "/api/mcp/resources" || pathname === "/api/mcp/tools") {
    return NextResponse.next();
  }

  // Check federation feature flag for sync endpoints
  if (
    pathname.startsWith("/api/mcp/sync/") ||
    pathname.startsWith("/api/mcp/federation")
  ) {
    if (!isFederationEnabled()) {
      return NextResponse.json(
        {
          error: "federation_disabled",
          message: "Atlas Federation is disabled. Set ATLAS_FEDERATION_ENABLED=true to enable.",
        },
        { status: 503 }
      );
    }
  }

  // Verify authentication
  const auth = verifyAuth(request);
  if (!auth.valid) {
    if (auth.error === "server_misconfigured") {
      return NextResponse.json(
        { error: "server_error", message: "Server authentication not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "unauthorized", message: "Valid X-Atlas-Key required" },
      {
        status: 401,
        headers: {
          "WWW-Authenticate": "X-Atlas-Key",
        },
      }
    );
  }

  // Check rate limit
  if (!checkTenantRateLimit(request)) {
    const tenantId = request.headers.get("x-tenant-id") || "default";
    console.warn(`Rate limit exceeded for tenant: ${tenantId}`);

    return NextResponse.json(
      {
        error: "rate_limited",
        message: "Rate limit exceeded (100 requests/minute per tenant)",
        tenant: tenantId,
      },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
        },
      }
    );
  }

  // Log tenant access
  const tenantId = request.headers.get("x-tenant-id") || "default";
  console.log(`[MCP] ${request.method} ${pathname} - tenant: ${tenantId}`);

  return NextResponse.next();
}

export const config = {
  matcher: "/api/mcp/:path*",
};
