import { NextResponse } from "next/server";
import { readProofJson } from "../../_lib/proofStore";

interface TrustSummary {
  trust_index: number;
  uptime_7d: number;
  history: Array<{ time: string; trust: number }>;
  generated_at: string;
}

const fallback: TrustSummary = {
  trust_index: 99.4,
  uptime_7d: 99.87,
  generated_at: new Date().toISOString(),
  history: Array.from({ length: 12 }).map((_, index) => ({
    time: `T-${11 - index}h`,
    trust: 99 + Math.random(),
  })),
};

export async function GET() {
  const summary = await readProofJson<TrustSummary>(
    "trust_summary.json",
    fallback,
  );
  return NextResponse.json(summary);
}
