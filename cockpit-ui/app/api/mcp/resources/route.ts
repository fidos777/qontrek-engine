// app/api/mcp/resources/route.ts
// MCP Resources Endpoint - List all available proof resources with ETags and schemas

import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    const resourcesPath = join(process.cwd(), "public", "mcp", "resources.json");
    const resources = JSON.parse(readFileSync(resourcesPath, "utf-8"));

    return NextResponse.json(resources, {
      headers: {
        "Cache-Control": "public, max-age=60",
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "registry_not_found", message: "Run 'npm run atlas:build' to generate registry" },
      { status: 404 }
    );
  }
}
