import { NextResponse } from "next/server";
import { readProofJson } from "../../../_lib/proofStore";
import {
  Gate0SummaryResponse,
  buildGate0Fallback,
} from "../data";

export async function GET() {
  const data = await readProofJson<Gate0SummaryResponse>(
    "gates/g0_dashboard.json",
    buildGate0Fallback(),
  );
  return NextResponse.json(data);
}
