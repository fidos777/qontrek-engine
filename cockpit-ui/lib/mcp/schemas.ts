/**
 * MCP Tool Schemas
 *
 * Zod validators for all MCP tool inputs and outputs.
 * Part of Qontrek OS Layer 2 - MCP Tool Fabric.
 */

import { z } from 'zod';

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

/** Standard MCP response envelope */
export const MCPEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.nullable(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.unknown()).optional(),
    }).nullable(),
    governance: z.object({
      tenant_id: z.string(),
      request_id: z.string(),
      timestamp: z.string().datetime(),
      gate: z.string(),
      lineage: z.array(z.string()),
    }),
  });

/** JWT claims for tenant extraction */
export const JWTClaimsSchema = z.object({
  tenant_id: z.string().min(1),
  sub: z.string().optional(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

// =============================================================================
// TOOL: listTenants
// =============================================================================

export const ListTenantsInputSchema = z.object({
  filter: z.enum(['all', 'active', 'suspended']).default('active'),
  limit: z.number().int().min(1).max(100).default(50),
});

export const TenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'suspended', 'pending']),
  created_at: z.string().datetime(),
  config: z.object({
    tier: z.enum(['free', 'pro', 'enterprise']),
    features: z.array(z.string()),
  }),
});

export const ListTenantsOutputSchema = z.object({
  tenants: z.array(TenantSchema),
  total: z.number(),
  has_more: z.boolean(),
});

// =============================================================================
// TOOL: getGovernanceStatus
// =============================================================================

export const GetGovernanceStatusInputSchema = z.object({
  gates: z.array(z.string().regex(/^G\d+$/)).optional(),
  include_evidence: z.boolean().default(true),
});

export const GateStatusSchema = z.object({
  gate_id: z.string(),
  name: z.string(),
  status: z.enum(['pass', 'pending', 'partial', 'failed']),
  evidence: z.record(z.union([z.boolean(), z.string(), z.number(), z.array(z.string())])).optional(),
  kpis: z.record(z.union([z.string(), z.number()])).optional(),
  last_checked: z.string().datetime(),
});

export const GetGovernanceStatusOutputSchema = z.object({
  gates: z.array(GateStatusSchema),
  summary: z.object({
    total: z.number(),
    passed: z.number(),
    pending: z.number(),
    partial: z.number(),
    failed: z.number(),
  }),
  health_score: z.number().min(0).max(100),
});

// =============================================================================
// TOOL: refreshProof
// =============================================================================

export const RefreshProofInputSchema = z.object({
  proof_type: z.enum([
    'tower_receipt',
    'key_rotation',
    'governance_snapshot',
    'audit_mirror',
    'federation_sync',
    'all',
  ]),
  force: z.boolean().default(false),
});

export const RefreshProofOutputSchema = z.object({
  proof_type: z.string(),
  path: z.string(),
  hash: z.string(),
  generated_at: z.string().datetime(),
  previous_hash: z.string().nullable(),
});

// =============================================================================
// TOOL: getPipelineSummary
// =============================================================================

export const GetPipelineSummaryInputSchema = z.object({
  pipeline_id: z.string().optional(),
  time_range: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
});

export const PipelineStageSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'paused', 'failed', 'completed']),
  items_count: z.number(),
  value: z.number(),
  conversion_rate: z.number().min(0).max(100),
});

export const GetPipelineSummaryOutputSchema = z.object({
  pipeline_id: z.string(),
  name: z.string(),
  stages: z.array(PipelineStageSchema),
  totals: z.object({
    items: z.number(),
    value: z.number(),
    avg_conversion: z.number(),
  }),
  last_updated: z.string().datetime(),
});

// =============================================================================
// TOOL: getCriticalLeads
// =============================================================================

export const GetCriticalLeadsInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  priority: z.enum(['critical', 'high', 'medium', 'all']).default('critical'),
  sort_by: z.enum(['value', 'urgency', 'created_at']).default('urgency'),
});

export const LeadSchema = z.object({
  id: z.string(),
  name: z.string(),
  company: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  value: z.number(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  assigned_to: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const GetCriticalLeadsOutputSchema = z.object({
  leads: z.array(LeadSchema),
  total: z.number(),
  total_value: z.number(),
  has_more: z.boolean(),
});

// =============================================================================
// TOOL: getLeadDetails
// =============================================================================

export const GetLeadDetailsInputSchema = z.object({
  lead_id: z.string().min(1),
  include_history: z.boolean().default(true),
  include_activities: z.boolean().default(true),
});

export const LeadActivitySchema = z.object({
  id: z.string(),
  type: z.enum(['call', 'email', 'meeting', 'note', 'status_change']),
  description: z.string(),
  performed_by: z.string(),
  performed_at: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

export const LeadHistorySchema = z.object({
  id: z.string(),
  field: z.string(),
  old_value: z.string().nullable(),
  new_value: z.string(),
  changed_by: z.string(),
  changed_at: z.string().datetime(),
});

export const GetLeadDetailsOutputSchema = z.object({
  lead: LeadSchema,
  activities: z.array(LeadActivitySchema).optional(),
  history: z.array(LeadHistorySchema).optional(),
  related_leads: z.array(z.object({
    id: z.string(),
    name: z.string(),
    relation: z.string(),
  })).optional(),
});

// =============================================================================
// TOOL: updateLeadStatus
// =============================================================================

export const UpdateLeadStatusInputSchema = z.object({
  lead_id: z.string().min(1),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']),
  note: z.string().max(1000).optional(),
});

export const UpdateLeadStatusOutputSchema = z.object({
  lead_id: z.string(),
  previous_status: z.string(),
  new_status: z.string(),
  updated_at: z.string().datetime(),
  updated_by: z.string(),
});

// =============================================================================
// TOOL: getKPISnapshot
// =============================================================================

export const GetKPISnapshotInputSchema = z.object({
  category: z.enum(['sales', 'governance', 'operations', 'finance', 'all']).default('all'),
  time_range: z.enum(['today', 'week', 'month', 'quarter', 'year']).default('month'),
});

export const KPIMetricSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  trend: z.enum(['up', 'down', 'stable']),
  change_percent: z.number(),
  target: z.number().optional(),
  target_met: z.boolean().optional(),
});

export const GetKPISnapshotOutputSchema = z.object({
  category: z.string(),
  time_range: z.string(),
  metrics: z.array(KPIMetricSchema),
  generated_at: z.string().datetime(),
});

// =============================================================================
// TOOL: triggerWorkflow
// =============================================================================

export const TriggerWorkflowInputSchema = z.object({
  workflow_id: z.string().min(1),
  trigger_type: z.enum(['manual', 'scheduled', 'event']),
  payload: z.record(z.unknown()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

export const TriggerWorkflowOutputSchema = z.object({
  execution_id: z.string(),
  workflow_id: z.string(),
  status: z.enum(['queued', 'running', 'completed', 'failed']),
  triggered_at: z.string().datetime(),
  estimated_completion: z.string().datetime().optional(),
});

// =============================================================================
// TOOL: logProofEvent
// =============================================================================

export const LogProofEventInputSchema = z.object({
  event_type: z.enum([
    'audit_entry',
    'governance_check',
    'compliance_event',
    'security_event',
    'federation_sync',
  ]),
  severity: z.enum(['info', 'warning', 'error', 'critical']).default('info'),
  message: z.string().min(1).max(2000),
  metadata: z.record(z.unknown()).optional(),
});

export const LogProofEventOutputSchema = z.object({
  event_id: z.string(),
  logged_at: z.string().datetime(),
  proof_hash: z.string(),
  lineage_updated: z.boolean(),
});

// =============================================================================
// TOOL: getWidgetData
// =============================================================================

export const GetWidgetDataInputSchema = z.object({
  widget_id: z.string().min(1),
  params: z.record(z.unknown()).optional(),
  refresh: z.boolean().default(false),
});

export const GetWidgetDataOutputSchema = z.object({
  widget_id: z.string(),
  widget_type: z.string(),
  data: z.record(z.unknown()),
  cached: z.boolean(),
  cache_ttl: z.number().optional(),
  rendered_at: z.string().datetime(),
});

// =============================================================================
// TOOL: getAgentContext
// =============================================================================

export const GetAgentContextInputSchema = z.object({
  context_type: z.enum(['full', 'summary', 'permissions', 'history']).default('full'),
  include_tools: z.boolean().default(true),
});

export const AgentToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  available: z.boolean(),
  rate_limit: z.object({
    requests: z.number(),
    window_seconds: z.number(),
  }).optional(),
});

export const GetAgentContextOutputSchema = z.object({
  agent_id: z.string(),
  tenant_id: z.string(),
  permissions: z.array(z.string()),
  available_tools: z.array(AgentToolSchema).optional(),
  session: z.object({
    started_at: z.string().datetime(),
    requests_count: z.number(),
    last_activity: z.string().datetime(),
  }),
  governance: z.object({
    compliance_level: z.string(),
    active_gates: z.array(z.string()),
  }),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type MCPEnvelope<T> = z.infer<ReturnType<typeof MCPEnvelopeSchema<z.ZodType<T>>>>;
export type JWTClaims = z.infer<typeof JWTClaimsSchema>;

export type ListTenantsInput = z.infer<typeof ListTenantsInputSchema>;
export type ListTenantsOutput = z.infer<typeof ListTenantsOutputSchema>;
export type Tenant = z.infer<typeof TenantSchema>;

export type GetGovernanceStatusInput = z.infer<typeof GetGovernanceStatusInputSchema>;
export type GetGovernanceStatusOutput = z.infer<typeof GetGovernanceStatusOutputSchema>;
export type GateStatus = z.infer<typeof GateStatusSchema>;

export type RefreshProofInput = z.infer<typeof RefreshProofInputSchema>;
export type RefreshProofOutput = z.infer<typeof RefreshProofOutputSchema>;

export type GetPipelineSummaryInput = z.infer<typeof GetPipelineSummaryInputSchema>;
export type GetPipelineSummaryOutput = z.infer<typeof GetPipelineSummaryOutputSchema>;
export type PipelineStage = z.infer<typeof PipelineStageSchema>;

export type GetCriticalLeadsInput = z.infer<typeof GetCriticalLeadsInputSchema>;
export type GetCriticalLeadsOutput = z.infer<typeof GetCriticalLeadsOutputSchema>;
export type Lead = z.infer<typeof LeadSchema>;

export type GetLeadDetailsInput = z.infer<typeof GetLeadDetailsInputSchema>;
export type GetLeadDetailsOutput = z.infer<typeof GetLeadDetailsOutputSchema>;
export type LeadActivity = z.infer<typeof LeadActivitySchema>;
export type LeadHistory = z.infer<typeof LeadHistorySchema>;

export type UpdateLeadStatusInput = z.infer<typeof UpdateLeadStatusInputSchema>;
export type UpdateLeadStatusOutput = z.infer<typeof UpdateLeadStatusOutputSchema>;

export type GetKPISnapshotInput = z.infer<typeof GetKPISnapshotInputSchema>;
export type GetKPISnapshotOutput = z.infer<typeof GetKPISnapshotOutputSchema>;
export type KPIMetric = z.infer<typeof KPIMetricSchema>;

export type TriggerWorkflowInput = z.infer<typeof TriggerWorkflowInputSchema>;
export type TriggerWorkflowOutput = z.infer<typeof TriggerWorkflowOutputSchema>;

export type LogProofEventInput = z.infer<typeof LogProofEventInputSchema>;
export type LogProofEventOutput = z.infer<typeof LogProofEventOutputSchema>;

export type GetWidgetDataInput = z.infer<typeof GetWidgetDataInputSchema>;
export type GetWidgetDataOutput = z.infer<typeof GetWidgetDataOutputSchema>;

export type GetAgentContextInput = z.infer<typeof GetAgentContextInputSchema>;
export type GetAgentContextOutput = z.infer<typeof GetAgentContextOutputSchema>;
export type AgentTool = z.infer<typeof AgentToolSchema>;
