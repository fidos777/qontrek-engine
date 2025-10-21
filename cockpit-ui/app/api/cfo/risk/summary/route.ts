import { NextResponse } from "next/server";
import { readProofJson } from "../../../_lib/proofStore";
import {
  CfoRiskSummaryResponse,
  buildRiskFallback,
} from "../../data";

export async function GET() {
  const data = await readProofJson<CfoRiskSummaryResponse>(
    "cfo_risk_matrix.json",
    buildRiskFallback(),
  );

  return NextResponse.json(data);
}
