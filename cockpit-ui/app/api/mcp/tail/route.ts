import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * GET /api/mcp/tail
 *
 * Returns tail of MCP logs with rate limiting and size caps.
 * Adds X-RateLimit-* headers for governance evidence.
 */

// Simple in-memory rate limiter (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  maxLines: 1000, // Max lines per response
};

/**
 * Check rate limit for client
 */
function checkRateLimit(clientId: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(clientId);

  // Reset window if expired
  if (!record || now >= record.resetAt) {
    const resetAt = now + RATE_LIMIT.windowMs;
    rateLimitStore.set(clientId, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: RATE_LIMIT.maxRequests - 1,
      resetAt,
    };
  }

  // Check if limit exceeded
  if (record.count >= RATE_LIMIT.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  // Increment count
  record.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT.maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Get client identifier
 */
function getClientId(request: NextRequest): string {
  // Use IP address + user agent for identification
  const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  return `${ip}_${ua.substring(0, 50)}`;
}

export async function GET(request: NextRequest) {
  const clientId = getClientId(request);

  // Check rate limit
  const rateLimit = checkRateLimit(clientId);

  // Add rate limit headers
  const headers = new Headers({
    'X-RateLimit-Limit': RATE_LIMIT.maxRequests.toString(),
    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
  });

  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
    headers.set('Retry-After', retryAfter.toString());

    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter },
      { status: 429, headers }
    );
  }

  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const lines = Math.min(
      parseInt(searchParams.get('lines') || '100'),
      RATE_LIMIT.maxLines
    );
    const filter = searchParams.get('filter');

    // Read log file
    const logPath = join(
      process.cwd(),
      '..',
      'logs',
      'mcp',
      'runtime.jsonl'
    );

    let content: string;
    try {
      content = await readFile(logPath, 'utf-8');
    } catch (error) {
      return NextResponse.json(
        { logs: [], message: 'No logs available' },
        { headers }
      );
    }

    // Parse JSONL
    let logLines = content
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Apply filter if provided
    if (filter) {
      const filterLower = filter.toLowerCase();
      logLines = logLines.filter(log =>
        JSON.stringify(log).toLowerCase().includes(filterLower)
      );
    }

    // Get last N lines
    const tailLines = logLines.slice(-lines);

    // Add content headers
    headers.set('X-Log-Lines-Total', logLines.length.toString());
    headers.set('X-Log-Lines-Returned', tailLines.length.toString());

    return NextResponse.json(
      {
        logs: tailLines,
        meta: {
          total: logLines.length,
          returned: tailLines.length,
          filtered: !!filter,
        },
      },
      { headers }
    );

  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500, headers }
    );
  }
}
