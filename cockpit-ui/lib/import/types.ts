// lib/import/types.ts
// Shared types for the import data flow

export type ProfileType = "voltek_v19_9" | "vesb_prj_f0003_rev01";

export interface G2Fixture {
  summary: {
    pending_80_value: number;
    pending_20_value: number;
    pending_handover_value: number;
    total_recoverable: number;
  };
  kpi: {
    recovery_rate_7d: number;
    recovery_rate_30d: number;
    average_days_to_payment: number;
    escalation_rate: number;
  };
  critical_leads: Array<{
    id?: string;
    name: string;
    stage: string;
    amount: number;
    days_overdue?: number;
    last_contact?: string;
    next_action?: string;
  }>;
  active_reminders?: Array<{
    id: string;
    name: string;
    stage: string;
    amount: number;
    days_overdue: number;
    next_action: string;
  }>;
  recent_success: Array<{
    name: string;
    stage?: string;
    amount: number;
    days_to_pay: number;
    paid_at?: string;
  }>;
}

export interface ImportStep {
  id: number;
  title: string;
  status: "pending" | "active" | "complete";
}

export interface ColumnMapping {
  source: string;
  target: string;
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  value?: any;
}

export interface ParsedData {
  rows: Array<Record<string, any>>;
  columns: string[];
  profile?: ProfileType;
}

export interface SiteSurveySection {
  label: string;
  fields: Record<string, string>;
}

export interface SiteSurveyData {
  sections: {
    A: SiteSurveySection;
    B: SiteSurveySection;
    C: SiteSurveySection;
    D: SiteSurveySection;
    E: SiteSurveySection;
    F: SiteSurveySection;
    G: SiteSurveySection;
  };
}

export type Signals = {
  etag?: string;
  ack_age_ms?: number;
  schema_pass?: boolean;
  freshness_ms?: number;
  mode?: "demo" | "live";
};

export function computeScore(s: Signals): number {
  const etag = s.etag ? 100 : 50;
  const ack = s.ack_age_ms != null ? Math.max(0, 100 - s.ack_age_ms / 600) : 50;
  const schem = s.schema_pass ? 100 : 0;
  const fresh = s.freshness_ms != null ? Math.max(0, 100 - s.freshness_ms / 600) : 50;
  const weights = { etag: 0.3, ack: 0.3, schem: 0.2, fresh: 0.2 };
  const total = etag * weights.etag + ack * weights.ack + schem * weights.schem + fresh * weights.fresh;
  return Math.round(Math.min(100, Math.max(0, total)));
}

export const canonicalStringify = (v: any) => JSON.stringify(v, Object.keys(v).sort());

export const maskName = (n: string) => n.replace(/(\w)\w+(\s+)(\w)\w+/, "$1.$2$3.");
export const maskPhone = (p: string) => p.replace(/^(\d{2})\d+(\d{2})$/, "$1•• ••$2");
