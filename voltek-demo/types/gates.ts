// types/gates.ts
export type SourceFlag = "real" | "fallback";

export interface G2Summary {
  pending_80_count: number;
  pending_80_value: number;
  pending_20_count: number;
  pending_20_value: number;
  pending_handover_count: number;
  pending_handover_value: number;
  total_recoverable: number;
}

export interface G2Lead {
  id: string;
  name: string;
  stage: string;
  amount: number;
  days_overdue: number;
  last_contact: string;
  next_action: string;
  phone: string;
  system_size?: number;
  project_value?: number;
}

export interface G2Reminder {
  id: string;
  name: string;
  stage: string;
  amount: number;
  days_overdue: number;
  next_action: string;
  last_reminder: string;
}

export interface G2Success {
  id: string;
  name: string;
  stage: string;
  amount: number;
  days_to_pay: number;
  paid_at: string;
  reminder_sent?: string;
}

export interface G2KPI {
  recovery_rate_7d: number;
  recovery_rate_30d: number;
  average_days_to_payment: number;
  escalation_rate?: number;
}

export interface G2Data {
  dashboard: string;
  version: string;
  generated_at: string;
  ui_status: string;
  summary: G2Summary;
  critical_leads: G2Lead[];
  active_reminders: G2Reminder[];
  recent_success: G2Success[];
  kpi: G2KPI;
}

export interface G2Response {
  ok: boolean;
  rel: string;
  source: SourceFlag;
  path?: string;
  schemaVersion?: string;
  data?: G2Data;
}
