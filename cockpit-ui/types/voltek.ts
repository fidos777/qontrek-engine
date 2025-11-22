// types/voltek.ts
// Voltek Recovery Dashboard Types
// Based on RM180k reconstruction from fragmented files

export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type Stage = "80% Pending" | "20% Pending" | "NEM Stuck" | "Booking";

export interface VoltekLead {
  id: string;
  name: string;
  phone: string;
  system_size: number;
  project_value: number;
  outstanding_amount: number;
  stage: Stage;
  days_overdue: number;
  last_contact: string;
  next_action: string;
  priority: Priority;
}

export interface VoltekSummary {
  total_recoverable: number;
  pending_80_count: number;
  pending_80_value: number;
  pending_20_count: number;
  pending_20_value: number;
  nem_stuck_count: number;
  nem_stuck_value: number;
  booking_pending_count: number;
  booking_pending_value: number;
  large_projects_count: number;
  large_projects_value: number;
}

export interface VoltekMetadata {
  generated_at: string;
  total_recoverable: number;
  data_source: string;
  version: string;
  reconstruction_method: string;
  confidence: string;
}

export interface VoltekRecoveryData {
  metadata: VoltekMetadata;
  summary: VoltekSummary;
  leads: VoltekLead[];
}

// KPI display configuration
export interface VoltekKPI {
  id: string;
  label: string;
  value: number;
  icon: "money" | "clock" | "alert" | "check";
  color: "green" | "blue" | "yellow" | "red";
  format: "currency" | "number" | "percentage";
}
