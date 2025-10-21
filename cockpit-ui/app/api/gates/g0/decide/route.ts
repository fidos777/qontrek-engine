import { NextResponse } from "next/server";
import {
  readProofJson,
  writeProofJson,
  appendProofLog,
} from "../../../_lib/proofStore";
import {
  Gate0SummaryResponse,
  Gate0Decision,
  buildGate0Fallback,
} from "../data";

type ManualAction = "APPROVE" | "REJECT";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const leadId: string | undefined = body?.leadId;
    const decision: ManualAction | undefined = body?.decision;

    if (!leadId || !decision) {
      return NextResponse.json(
        { error: "leadId and decision are required" },
        { status: 400 },
      );
    }

    const dataset = await readProofJson<Gate0SummaryResponse>(
      "gates/g0_dashboard.json",
      buildGate0Fallback(),
    );

    const pendingIndex = dataset.pending_review.findIndex(
      (item) => item.id === leadId,
    );

    if (pendingIndex === -1) {
      return NextResponse.json(
        { error: "Lead not found in manual review queue" },
        { status: 404 },
      );
    }

    const [lead] = dataset.pending_review.splice(pendingIndex, 1);
    dataset.summary.pending_review = dataset.pending_review.length;

    if (decision === "APPROVE") {
      const autoApproveDecision: Gate0Decision = "AUTO_APPROVE";
      dataset.summary.auto_approved += 1;
      dataset.recent_approvals = [
        {
          ...lead,
          decision: autoApproveDecision,
          created_at: new Date().toISOString(),
        },
        ...dataset.recent_approvals,
      ].slice(0, 10);
    } else {
      dataset.summary.auto_rejected += 1;
    }

    await writeProofJson("gates/g0_dashboard.json", dataset);
    await appendProofLog("logs/gate0_manual_decisions.json", {
      lead_id: leadId,
      decision,
      recorded_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, summary: dataset.summary });
  } catch (error) {
    console.error("Gate 0 decision update failed", error);
    return NextResponse.json(
      { error: "Failed to update decision" },
      { status: 500 },
    );
  }
}
