export interface CfoMarginPoint {
  month: string;
  margin: number;
  revenue: number;
  gross_profit: number;
}

export interface CfoBreakdown {
  costs: Array<{ category: string; value: number }>;
  unit_economics: Array<{ metric: string; value: number; unit: string }>;
  runway: { months: number; burn_rate: number; cash_on_hand: number };
}

export interface CfoProfitabilityResponse {
  generated_at: string;
  margins: CfoMarginPoint[];
  breakdown: CfoBreakdown;
}

export interface CfoException {
  id: string;
  type: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  value: number;
  threshold: number;
  detected_at: string;
}

export interface CfoExceptionsResponse {
  generated_at: string;
  exceptions: CfoException[];
}

export interface CfoRiskItem {
  id: string;
  customer: string;
  stage: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  impact_rm: number;
  probability: number;
  owner: string;
  days_exposed: number;
  next_action: string;
}

export interface CfoRiskSummaryResponse {
  generated_at: string;
  stages: string[];
  risks: CfoRiskItem[];
}

export function buildProfitabilityFallback(): CfoProfitabilityResponse {
  return {
    generated_at: new Date().toISOString(),
    margins: [
      { month: "Oct 24", margin: 24, revenue: 510000, gross_profit: 122400 },
      { month: "Nov 24", margin: 27, revenue: 535000, gross_profit: 144450 },
      { month: "Dec 24", margin: 30, revenue: 560000, gross_profit: 168000 },
      { month: "Jan 25", margin: 32, revenue: 585000, gross_profit: 187200 },
      { month: "Feb 25", margin: 34, revenue: 612000, gross_profit: 208080 },
    ],
    breakdown: {
      costs: [
        { category: "Hardware procurement", value: 212000 },
        { category: "Installation & labor", value: 118000 },
        { category: "Engineering & QA", value: 64000 },
        { category: "Ops & support", value: 38000 },
      ],
      unit_economics: [
        { metric: "CAC", value: 2800, unit: "RM" },
        { metric: "Payback", value: 12, unit: "months" },
        { metric: "Gross margin", value: 34, unit: "%" },
      ],
      runway: {
        months: 11,
        burn_rate: 186000,
        cash_on_hand: 2076000,
      },
    },
  };
}

export function buildExceptionsFallback(): CfoExceptionsResponse {
  const now = Date.now();
  return {
    generated_at: new Date(now).toISOString(),
    exceptions: [
      {
        id: "EXC-2409",
        type: "Large outstanding deposit",
        severity: "HIGH",
        description: "RM 41.6k handover deposit pending beyond 21 days.",
        value: 41600,
        threshold: 15000,
        detected_at: new Date(now - 1000 * 60 * 65).toISOString(),
      },
      {
        id: "EXC-2410",
        type: "Negative cash variance",
        severity: "MEDIUM",
        description: "Ops cost variance exceeded control limit · lattice build-out.",
        value: 18200,
        threshold: 10000,
        detected_at: new Date(now - 1000 * 60 * 120).toISOString(),
      },
      {
        id: "EXC-2411",
        type: "FX exposure",
        severity: "LOW",
        description: "SGD procurement not hedged · monitor if USD climbs above 4.90.",
        value: 7200,
        threshold: 10000,
        detected_at: new Date(now - 1000 * 60 * 175).toISOString(),
      },
    ],
  };
}

export function buildRiskFallback(): CfoRiskSummaryResponse {
  const now = Date.now();
  return {
    generated_at: new Date(now).toISOString(),
    stages: ["pending_80", "pending_20", "pending_handover"],
    risks: [
      {
        id: "RISK-3201",
        customer: "Aurora Residences",
        stage: "pending_80",
        severity: "HIGH",
        impact_rm: 41600,
        probability: 0.7,
        owner: "Finance",
        days_exposed: 19,
        next_action: "Escalate to CFO · prepare legal draft",
      },
      {
        id: "RISK-3202",
        customer: "EcoFab Manufacturing",
        stage: "pending_20",
        severity: "MEDIUM",
        impact_rm: 12200,
        probability: 0.45,
        owner: "Collections",
        days_exposed: 12,
        next_action: "Schedule CFO call · align with ops",
      },
      {
        id: "RISK-3203",
        customer: "Seri Impian Residence",
        stage: "pending_handover",
        severity: "LOW",
        impact_rm: 6600,
        probability: 0.25,
        owner: "Operations",
        days_exposed: 6,
        next_action: "Confirm handover checklist · ready site",
      },
    ],
  };
}
