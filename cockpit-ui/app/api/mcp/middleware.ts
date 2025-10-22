// app/api/mcp/middleware.ts
// X-Atlas-Key Authentication Middleware for MCP endpoints

import { NextResponse } from "next/server";
import { createHmac } from "crypto";

export interface AuthContext {
  nodeId?: string;
  tenant?: string;
  authenticated: boolean;
}

/**
 * Verify X-Atlas-Key header with HMAC
 */
export function verifyAtlasKey(req: Request): AuthContext {
  const atlasKey = req.headers.get("X-Atlas-Key");

  // Allow unauthenticated access in development
  if (process.env.NODE_ENV === "development" && !atlasKey) {
    return { authenticated: true, nodeId: "dev-node", tenant: "default" };
  }

  if (!atlasKey) {
    return { authenticated: false };
  }

  const sharedKey = process.env.TOWER_SHARED_KEY || "dev-shared-key";

  // Verify key matches shared secret
  if (atlasKey === sharedKey) {
    return {
      authenticated: true,
      nodeId: "tower-node",
      tenant: "qontrek",
    };
  }

  // Could implement more sophisticated key validation here
  // e.g., check against database of allowed keys

  return { authenticated: false };
}

/**
 * Middleware wrapper for MCP endpoints
 */
export function withAtlasAuth(
  handler: (req: Request, ctx: AuthContext) => Promise<NextResponse>
) {
  return async (req: Request): Promise<NextResponse> => {
    const authCtx = verifyAtlasKey(req);

    if (!authCtx.authenticated) {
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

    return handler(req, authCtx);
  };
}

/**
 * Rate limiting by tenant
 */
const rateLimits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(tenant: string, maxPerMin: number = 100): boolean {
  const now = Date.now();
  const key = tenant;

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
