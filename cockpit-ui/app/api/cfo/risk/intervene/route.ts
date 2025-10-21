import { NextResponse } from "next/server";
import { appendProofLog } from "../../../_lib/proofStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entry = {
      ...body,
      recorded_at: new Date().toISOString(),
    };

    await appendProofLog("cfo_risk_interventions.json", entry);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to record CFO risk intervention", error);
    return NextResponse.json(
      { error: "Unable to record intervention" },
      { status: 500 },
    );
  }
}
