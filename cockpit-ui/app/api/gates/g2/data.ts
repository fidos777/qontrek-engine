export interface Gate2Summary {
  pending_80_count: number;
  pending_80_value: number;
  pending_20_count: number;
  pending_20_value: number;
  pending_handover_count: number;
  pending_handover_value: number;
  total_recoverable: number;
}

export interface Gate2Lead {
  id: string;
  name: string;
  stage: string;
  amount: number;
  days_overdue: number;
  last_contact: string;
  next_action: string;
}

export interface Gate2Reminder {
  id: string;
  name: string;
  stage: string;
  amount: number;
  days_overdue: number;
  next_action: string;
}

export interface Gate2Success {
  name: string;
  stage: string;
  amount: number;
  days_to_pay: number;
}

export interface Gate2SummaryResponse {
  summary: Gate2Summary;
  critical_leads: Gate2Lead[];
  active_reminders: Gate2Reminder[];
  recent_success: Gate2Success[];
}

export function buildGate2Fallback(): Gate2SummaryResponse {
  const summary: Gate2Summary = {
    pending_80_count: 6,
    pending_80_value: 6 * 42000 * 0.8,
    pending_20_count: 4,
    pending_20_value: 4 * 39000 * 0.2,
    pending_handover_count: 3,
    pending_handover_value: 3 * 41000 * 0.2,
    total_recoverable: 0,
  };

  summary.total_recoverable =
    summary.pending_80_value +
    summary.pending_20_value +
    summary.pending_handover_value;

  const now = Date.now();
  const daysAgo = (days: number) =>
    `${days}d ago`;

  return {
    summary,
    critical_leads: [
      {
        id: "FIN-1180",
        name: "Aurora Residences",
        stage: "PENDING_80",
        amount: 52000 * 0.8,
        days_overdue: 19,
        last_contact: daysAgo(8),
        next_action: "Personal call · CFO escalation",
      },
      {
        id: "FIN-1186",
        name: "EcoFab Manufacturing",
        stage: "PENDING_20",
        amount: 61000 * 0.2,
        days_overdue: 23,
        last_contact: daysAgo(11),
        next_action: "Legal reminder · Draft LOD",
      },
    ],
    active_reminders: [
      {
        id: "FIN-1191",
        name: "Vista Hotels Bhd",
        stage: "PENDING_20",
        amount: 48000 * 0.2,
        days_overdue: 9,
        next_action: "Day 9 SMS reminder queued",
      },
      {
        id: "FIN-1194",
        name: "Seri Impian Residence",
        stage: "PENDING_HANDOVER",
        amount: 33000 * 0.2,
        days_overdue: 6,
        next_action: "Site handover scheduling",
      },
    ],
    recent_success: [
      {
        name: "Golden Bay Logistics",
        stage: "PENDING_80",
        amount: 54000 * 0.8,
        days_to_pay: 3,
      },
      {
        name: "Majestic Realty",
        stage: "PENDING_HANDOVER",
        amount: 38000 * 0.2,
        days_to_pay: 5,
      },
    ],
  };
}
