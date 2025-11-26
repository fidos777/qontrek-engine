// app/api/mcp/healthz/route.ts

import { NextResponse } from 'next/server';

const qontrekHeaders = () => ({
  'X-Qontrek-MCP-Version': '1.0.0',
  'X-Qontrek-Tenant': 'system',
  'X-Qontrek-RequestId': crypto.randomUUID(),
});

/**
 * GET /api/mcp/healthz
 *
 * Health check endpoint for MCP.
 */
export async function GET() {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        mcp: 'ok',
        tower: 'ok',
      },
    };

    return NextResponse.json(health, {
      headers: qontrekHeaders(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: qontrekHeaders(),
      },
    );
  }
}
