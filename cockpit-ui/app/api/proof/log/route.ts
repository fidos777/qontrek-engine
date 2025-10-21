import { NextResponse } from "next/server";
import { appendProofLog } from "../../_lib/proofStore";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const entry = {
      ...payload,
      recorded_at: new Date().toISOString(),
    };

    await appendProofLog("logs/operational_actions.json", entry);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to append proof log", error);
    return NextResponse.json(
      { error: "Failed to write proof log" },
      { status: 500 },
    );
  }
}
