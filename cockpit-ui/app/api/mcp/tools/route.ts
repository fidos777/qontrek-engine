// app/api/mcp/tools/route.ts
// MCP Tools Endpoint - List all available MCP tools and endpoints

import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    const toolsPath = join(process.cwd(), "public", "mcp", "tools.json");
    const tools = JSON.parse(readFileSync(toolsPath, "utf-8"));

    return NextResponse.json(tools, {
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
