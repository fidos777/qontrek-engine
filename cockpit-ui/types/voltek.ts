// types/voltek.ts
// Type definitions for Voltek Recovery Dashboard

export type VoltekStage = '20% Pending' | '80% Pending' | 'Completed';
export type VoltekPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface VoltekLead {
  id: string;
  name: string;
  phone: string;
  system_size: number;
  project_value: number;
  outstanding_amount: number;
  stage: VoltekStage;
  days_overdue: number;
  last_contact: string;
  next_action: string;
  priority: VoltekPriority;
}

export interface VoltekSummary {
  total_recoverable: number;
  pending_80: number;
  pending_20: number;
  critical_count: number;
  total_leads: number;
}

export interface VoltekPayload {
  summary: VoltekSummary;
  leads: VoltekLead[];
}
