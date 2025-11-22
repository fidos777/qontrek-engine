// types/voltek.ts
// Voltek Energy Lead types for Gate 2 Payment Recovery

import { z } from 'zod';

// Zod schema for runtime validation
export const VoltekLeadSchema = z.object({
  id: z.string().min(1, 'Lead ID is required'),
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  system_size: z.number().positive('System size must be positive'),
  project_value: z.number().nonnegative('Project value must be non-negative'),
  outstanding_amount: z.number().nonnegative('Outstanding amount must be non-negative'),
  stage: z.enum(['80% Pending', '20% Pending', 'NEM Stuck', 'Booking', 'Completed']),
  days_overdue: z.number().int().nonnegative('Days overdue must be non-negative'),
  last_contact: z.string().min(1, 'Last contact date is required'),
  next_action: z.string().min(1, 'Next action is required'),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

// TypeScript type inferred from Zod schema
export type VoltekLead = z.infer<typeof VoltekLeadSchema>;

// API response envelope for Voltek leads
export interface VoltekLeadsResponse {
  ok: boolean;
  rel: string;
  source: 'real' | 'fallback';
  path?: string;
  schemaVersion: string;
  data: {
    summary: {
      total_recoverable: number;
      total_leads: number;
      high_priority_count: number;
      avg_days_overdue: number;
    };
    leads: VoltekLead[];
  };
}
