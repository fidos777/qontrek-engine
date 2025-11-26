// app/api/mcp/leads/route.ts

import { NextResponse } from 'next/server';
import { demoLeads } from '@/lib/mcp/demo-data';

const qontrekHeaders = () => ({
  'X-Qontrek-MCP-Version': '1.0.0',
  'X-Qontrek-Tenant': 'system',
  'X-Qontrek-RequestId': crypto.randomUUID(),
});

export async function GET() {
  try {
    const data = {
      leads: demoLeads,
      count: demoLeads.length,
    };

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
