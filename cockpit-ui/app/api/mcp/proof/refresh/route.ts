// app/api/mcp/proof/refresh/route.ts

import { NextResponse } from 'next/server';
import { createProofRefreshResponse, demoProof } from '@/lib/mcp/demo-data';
import type { MCPProofRefreshResponse } from '@/types/mcp';

const qontrekHeaders = () => ({
  'X-Qontrek-MCP-Version': '1.0.0',
  'X-Qontrek-Tenant': 'system',
  'X-Qontrek-RequestId': crypto.randomUUID(),
});

// POST: generate new proof + tower ack
export async function POST() {
  try {
    const data: MCPProofRefreshResponse = createProofRefreshResponse();

    // For test expectations:
    // - data.tower.acknowledged === true
    return NextResponse.json(data, {
      headers: qontrekHeaders(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: (error as Error).message,
      },
      {
        status: 500,
        headers: qontrekHeaders(),
      },
    );
  }
}

// GET: return latest known proof (demo)
export async function GET() {
  try {
    const data = {
      proof: demoProof,
    };

    // For test expectations:
    // - data.proof.id exists
    return NextResponse.json(data, {
      headers: qontrekHeaders(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: (error as Error).message,
      },
      {
        status: 500,
        headers: qontrekHeaders(),
      },
    );
  }
}
