import { NextResponse } from "next/server";
import * as tools from "@/lib/mcp/tools";

type ToolName = keyof typeof tools;

export async function POST(req: Request) {
  try {
    const { tool, params } = await req.json();

    if (!tool || !(tool in tools)) {
      return NextResponse.json(
        { success: false, error: "Unknown tool: " + tool },
        { status: 400 }
      );
    }

    const toolFn = tools[tool as ToolName];
    const result = await toolFn(params || {});

    return NextResponse.json({ success: true, result });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json(
      { success: false, error },
      { status: 500 }
    );
  }
}
