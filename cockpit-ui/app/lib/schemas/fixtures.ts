import { z } from "zod";

export const ConfidenceSchema = z.object({
  install_success_rate: z.number().min(0).max(1),
  refund_sla_days: z.number().min(0),
  proof_ref: z.string(),
  schema_version: z.string().default("v1"),
  generated_at: z.string().default(() => new Date().toISOString()),
});

export const TriggerSchema = z.object({
  event: z.string(),
  condition: z.string(),
  action: z.string(),
  proof_ref: z.string(),
  schema_version: z.string().default("v1"),
  generated_at: z.string().default(() => new Date().toISOString()),
});

export const ForecastSchema = z.object({
  period: z.string(),
  predicted_value: z.number(),
  confidence_interval: z.tuple([z.number(), z.number()]),
  proof_ref: z.string(),
  schema_version: z.string().default("v1"),
  generated_at: z.string().default(() => new Date().toISOString()),
});

export const CreditBurnSchema = z.object({
  credit_used: z.number().min(0),
  credit_remaining: z.number().min(0),
  burn_rate_per_day: z.number().min(0),
  estimated_depletion_date: z.string().nullable(),
  proof_ref: z.string(),
  schema_version: z.string().default("v1"),
  generated_at: z.string().default(() => new Date().toISOString()),
});

export const LeaderboardSchema = z.object({
  rank: z.number().int().positive(),
  entity: z.string(),
  score: z.number(),
  metric: z.string(),
  proof_ref: z.string(),
  schema_version: z.string().default("v1"),
  generated_at: z.string().default(() => new Date().toISOString()),
});

export const ReflexMetricsSchema = z.object({
  response_time_ms: z.number().min(0),
  success_count: z.number().int().min(0),
  failure_count: z.number().int().min(0),
  avg_latency_ms: z.number().min(0),
  proof_ref: z.string(),
  schema_version: z.string().default("v1"),
  generated_at: z.string().default(() => new Date().toISOString()),
});

export type Confidence = z.infer<typeof ConfidenceSchema>;
export type Trigger = z.infer<typeof TriggerSchema>;
export type Forecast = z.infer<typeof ForecastSchema>;
export type CreditBurn = z.infer<typeof CreditBurnSchema>;
export type Leaderboard = z.infer<typeof LeaderboardSchema>;
export type ReflexMetrics = z.infer<typeof ReflexMetricsSchema>;
