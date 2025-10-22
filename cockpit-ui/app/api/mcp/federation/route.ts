// app/api/mcp/federation/route.ts
// Federation Registry Endpoint - List all federated nodes and capabilities

import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    const federationPath = join(process.cwd(), "public", "mcp", "federation.json");
    const federation = JSON.parse(readFileSync(federationPath, "utf-8"));

    // Add runtime status
    const enriched = {
      ...federation,
      runtime: {
        uptime_ms: process.uptime() * 1000,
        pid: process.pid,
        node_env: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(enriched, {
      headers: {
        "Cache-Control": "public, max-age=30",
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "federation_not_found", message: "Run 'npm run atlas:build' to generate federation registry" },
      { status: 404 }
    );
  }
}
