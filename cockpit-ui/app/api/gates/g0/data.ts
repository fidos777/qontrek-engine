export type Gate0Decision = "AUTO_APPROVE" | "MANUAL_REVIEW" | "AUTO_REJECT";

export interface Gate0Lead {
  id: string;
  name: string;
  score: number;
  decision: Gate0Decision;
  flags: string[];
  tnb_bill: number;
  source: string;
  created_at: string;
}

export interface Gate0SummaryResponse {
  summary: {
    auto_approved: number;
    pending_review: number;
    auto_rejected: number;
    today_total: number;
  };
  pending_review: Gate0Lead[];
  recent_approvals: Gate0Lead[];
}

export function buildGate0Fallback(): Gate0SummaryResponse {
  return {
    summary: {
      auto_approved: 9,
      pending_review: 3,
      auto_rejected: 2,
      today_total: 14,
    },
    pending_review: [
      {
        id: "LD-2401",
        name: "Greenhaven Industries",
        score: 64,
        decision: "MANUAL_REVIEW",
        flags: ["tnb_bill_mismatch", "first-installment_pending"],
        tnb_bill: 1880,
        source: "Referral · Sarawak",
        created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
      {
        id: "LD-2402",
        name: "NeoSolar JV",
        score: 59,
        decision: "MANUAL_REVIEW",
        flags: ["site_survey_required"],
        tnb_bill: 2250,
        source: "B2B Landing",
        created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      },
      {
        id: "LD-2403",
        name: "Urban Sky Residence",
        score: 52,
        decision: "MANUAL_REVIEW",
        flags: ["cashflow_variance"],
        tnb_bill: 430,
        source: "Meta Ads",
        created_at: new Date(Date.now() - 1000 * 60 * 135).toISOString(),
      },
    ],
    recent_approvals: [
      {
        id: "LD-2338",
        name: "Sunrise Retail Hub",
        score: 91,
        decision: "AUTO_APPROVE",
        flags: [],
        tnb_bill: 3120,
        source: "Referral",
        created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      },
      {
        id: "LD-2339",
        name: "Everblue Manufacturing",
        score: 88,
        decision: "AUTO_APPROVE",
        flags: [],
        tnb_bill: 2750,
        source: "Partner API",
        created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      },
    ],
  };
}
