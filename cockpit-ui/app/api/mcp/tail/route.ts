import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { createRateLimiter } from '@/lib/redis/rateLimiter';

/**
 * GET /api/mcp/tail
 *
 * Returns tail of MCP logs with rate limiting and size caps.
 * Adds X-RateLimit-* headers for governance evidence.
 */

// Redis-backed rate limiter configuration
const RATE_LIMIT_CONFIG = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  keyPrefix: 'mcp:tail',
};

const MAX_LINES = 1000; // Max lines per response

// Create rate limiter instance
const rateLimiter = createRateLimiter(RATE_LIMIT_CONFIG);

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

  // Check rate limit using Redis
  const rateLimitResult = await rateLimiter.check(clientId);
  const rateLimitHeaders = rateLimiter.getHeaders(rateLimitResult);

  // Add rate limit headers
  const headers = new Headers(rateLimitHeaders);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimitHeaders['Retry-After'] },
      { status: 429, headers }
    );
  }

  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const lines = Math.min(
      parseInt(searchParams.get('lines') || '100'),
      MAX_LINES
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
