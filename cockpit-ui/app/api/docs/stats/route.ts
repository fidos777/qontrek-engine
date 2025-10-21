import { NextResponse } from "next/server";
import { readProofJson } from "../../_lib/proofStore";

interface DocsStats {
  complete: number;
  missing: number;
  sla_breaches: number;
  generated_at: string;
}

const fallback: DocsStats = {
  complete: 18,
  missing: 3,
  sla_breaches: 1,
  generated_at: new Date().toISOString(),
};

export async function GET() {
  const stats = await readProofJson<DocsStats>("docs_stats.json", fallback);
  return NextResponse.json(stats);
}
