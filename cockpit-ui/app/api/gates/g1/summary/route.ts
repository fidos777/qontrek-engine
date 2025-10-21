import { NextResponse } from "next/server";
import { readProofJson } from "../../../_lib/proofStore";
import {
  Gate1SummaryResponse,
  buildGate1Fallback,
} from "../data";

export async function GET() {
  const data = await readProofJson<Gate1SummaryResponse>(
    "gates/g1_dashboard.json",
    buildGate1Fallback(),
  );

  return NextResponse.json(data);
}
