import { z } from 'zod';

export const VoltekLeadSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  system_size: z.number(),
  project_value: z.number(),
  outstanding_amount: z.number(),
  stage: z.enum(['80% Pending', '20% Pending', 'NEM Stuck', 'Booking']),
  days_overdue: z.number(),
  last_contact: z.string(),
  next_action: z.string(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

export type VoltekLead = z.infer<typeof VoltekLeadSchema>;

export const VoltekResponseSchema = z.object({
  metadata: z.object({
    generated_at: z.string(),
    total_recoverable: z.number(),
    data_source: z.string(),
    version: z.string(),
  }),
  summary: z.object({
    total_recoverable: z.number(),
    pending_80_count: z.number(),
    pending_80_value: z.number(),
    pending_20_count: z.number(),
    pending_20_value: z.number(),
    nem_stuck_count: z.number(),
    nem_stuck_value: z.number(),
  }),
  leads: z.array(VoltekLeadSchema),
});

export type VoltekResponse = z.infer<typeof VoltekResponseSchema>;
