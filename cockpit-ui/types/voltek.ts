import { z } from 'zod';

// Zod schemas for validation
export const VoltekLeadSchema = z.object({
  id: z.string(),
  name: z.string(),
  stage: z.enum(['80% Pending', '20% Pending', 'NEM Stuck', 'Booking']),
  outstanding_amount: z.number(),
  system_size: z.number(),
  days_overdue: z.number(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  contact_name: z.string(),
  contact_phone: z.string(),
  last_action: z.string(),
  next_action: z.string(),
  notes: z.string(),
});

export const VoltekSummarySchema = z.object({
  total_recoverable: z.number(),
  pending_80: z.number(),
  pending_20: z.number(),
  nem_stuck: z.number(),
  booking_pending: z.number(),
  critical_count: z.number(),
});

export const VoltekMetadataSchema = z.object({
  version: z.string(),
  generated_at: z.string(),
  source: z.string(),
});

export const VoltekResponseSchema = z.object({
  metadata: VoltekMetadataSchema,
  summary: VoltekSummarySchema,
  leads: z.array(VoltekLeadSchema),
});

// TypeScript types inferred from Zod schemas
export type VoltekLead = z.infer<typeof VoltekLeadSchema>;
export type VoltekSummary = z.infer<typeof VoltekSummarySchema>;
export type VoltekMetadata = z.infer<typeof VoltekMetadataSchema>;
export type VoltekResponse = z.infer<typeof VoltekResponseSchema>;
