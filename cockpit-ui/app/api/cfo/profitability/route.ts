import { NextResponse } from "next/server";
import { readProofJson } from "../../_lib/proofStore";
import {
  CfoProfitabilityResponse,
  buildProfitabilityFallback,
} from "../data";

export async function GET() {
  const data = await readProofJson<CfoProfitabilityResponse>(
    "cfo_profitability.json",
    buildProfitabilityFallback(),
  );

  return NextResponse.json(data);
}
