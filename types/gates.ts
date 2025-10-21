// types/gates.ts (READ-ONLY - Don't modify)

export type SourceFlag = "real" | "fallback";

export interface BaseEnvelope<T> {
  ok: boolean;
  rel: string;                // e.g., "g2_dashboard_v19.1.json"
  source: SourceFlag;         // "real" | "fallback"
  path?: string;              // file path for debug
  schemaVersion: string;      // "1.0.0"
  data: T;
}

// Gate 2: Payment Recovery
export interface G2Summary {
  total_recoverable: number;
  kpi?: Record<string, number | string>;
}
export interface G2Payload {
  summary: G2Summary;
  critical_leads: Array<Record<string, unknown>>;
  active_reminders: Array<Record<string, unknown>>;
  recent_success: Array<Record<string, unknown>>;
}
export type G2Response = BaseEnvelope<G2Payload>;

// Gate 1: Decision Engine
export interface G1Payload {
  summary: Record<string, number | string>;
  top_items: Array<Record<string, unknown>>;
}
export type G1Response = BaseEnvelope<G1Payload>;

// Gate 0: Lead Qualification
export interface G0Payload {
  summary: Record<string, number | string>;
  activity: Array<Record<string, unknown>>;
}
export type G0Response = BaseEnvelope<G0Payload>;

// CFO Lens
export interface CFOTab {
  id: string;
  title: string;
  metrics: Record<string, number | string>;
}
export interface CFOPayload {
  tabs: CFOTab[];
  summary?: Record<string, number | string>;
}
export type CFOResponse = BaseEnvelope<CFOPayload>;

// Docs Tracker
export interface DocsRow {
  id: string;
  name: string;
  status: "pending" | "approved" | "rejected" | "in_review";
  updated_at?: string;
}
export interface DocsPayload {
  items: DocsRow[];
}
export type DocsResponse = BaseEnvelope<DocsPayload>;
