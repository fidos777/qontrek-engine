// app/api/mcp/governance/route.ts

import { NextResponse } from 'next/server';

const qontrekHeaders = () => ({
  'X-Qontrek-MCP-Version': '1.0.0',
  'X-Qontrek-Tenant': 'system',
  'X-Qontrek-RequestId': crypto.randomUUID(),
});

/**
 * GET /api/mcp/governance
 *
 * Returns governance KPI snapshot for MCP schema.
 */
export async function GET() {
  try {
    const data = {
      overallScore: 87,
      gates: [
        { id: 'G13', status: 'pass', score: 9 },
        { id: 'G14', status: 'pass', score: 8 },
        { id: 'G15', status: 'fail', score: 4 },
        { id: 'G16', status: 'pass', score: 7 },
        { id: 'G17', status: 'pass', score: 10 },
      ],
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(data, { headers: qontrekHeaders() });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      {
        status: 500,
        headers: qontrekHeaders(),
      },
    );
  }
}
