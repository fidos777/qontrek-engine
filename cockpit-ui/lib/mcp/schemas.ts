/**
 * MCP Tool Fabric - Zod Schemas
 *
 * Input/Output validation schemas for all MCP tools.
 * Used for request validation and response serialization.
 */

import { z } from 'zod';

// =============================================================================
// SHARED SCHEMAS
// =============================================================================

export const GateStatusSchema = z.enum(['pass', 'fail', 'warn', 'pending']);

export const GateResultSchema = z.object({
  status: GateStatusSchema,
  message: z.string(),
  evidence: z.record(z.string(), z.unknown()).optional(),
});

export const ActorSchema = z.object({
  id: z.string(),
  type: z.enum(['user', 'system', 'agent']),
  name: z.string().optional(),
});

export const TargetSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string().optional(),
});

export const DateRangeSchema = z.object({
  from: z.string(),
  to: z.string(),
});

export const LeadPrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export const LeadStageSchema = z.enum(['new', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']);
export const KPICategorySchema = z.enum(['recovery', 'conversion', 'engagement', 'all']);
export const TriggerTypeSchema = z.enum(['manual', 'event']);
export const WorkflowStatusSchema = z.enum(['queued', 'running', 'completed', 'failed']);
export const TenantStatusSchema = z.enum(['active', 'suspended', 'pending', 'archived']);
export const TrendSchema = z.enum(['up', 'down', 'stable']);

// =============================================================================
// RESPONSE ENVELOPE SCHEMAS
// =============================================================================

export const MCPErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export const GovernanceMetadataSchema = z.object({
  proof_hash: z.string(),
  gate_id: z.string(),
  logged_at: z.string(),
});

export const ResponseMetaSchema = z.object({
  tool: z.string(),
  version: z.string(),
  duration_ms: z.number(),
});

export function createMCPResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema,
    error: MCPErrorSchema.optional(),
    governance: GovernanceMetadataSchema,
    meta: ResponseMetaSchema,
  });
}

// =============================================================================
// 1. listTenants
// =============================================================================

export const ListTenantsInputSchema = z.object({
  filter: z.enum(['active', 'all']).optional().default('active'),
  limit: z.number().min(1).max(100).optional().default(50),
});

export const TenantSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  status: TenantStatusSchema,
});

export const ListTenantsOutputSchema = z.object({
  tenants: z.array(TenantSummarySchema),
  total: z.number(),
});

// =============================================================================
// 2. getGovernanceStatus
// =============================================================================

export const GetGovernanceStatusInputSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  include_evidence: z.boolean().optional().default(false),
});

export const GatesMapSchema = z.object({
  G13: GateResultSchema,
  G14: GateResultSchema,
  G15: GateResultSchema,
  G16: GateResultSchema,
  G17: GateResultSchema,
  G18: GateResultSchema,
  G19: GateResultSchema,
  G20: GateResultSchema,
  G21: GateResultSchema,
});

export const GetGovernanceStatusOutputSchema = z.object({
  gates: GatesMapSchema,
  trust_index: z.number().min(0).max(100),
  last_updated: z.string(),
});

// =============================================================================
// 3. refreshProof
// =============================================================================

export const RefreshProofInputSchema = z.object({
  tenant_id: z.string().uuid(),
  force: z.boolean().optional().default(false),
});

export const RefreshProofOutputSchema = z.object({
  proof_id: z.string().uuid(),
  hash: z.string(),
  refreshed_at: z.string(),
});

// =============================================================================
// 4. logProofEvent
// =============================================================================

export const LogProofEventInputSchema = z.object({
  event_type: z.string().min(1),
  actor: ActorSchema,
  target: TargetSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const LogProofEventOutputSchema = z.object({
  event_id: z.string().uuid(),
  proof_hash: z.string(),
  timestamp: z.string(),
});

// =============================================================================
// 5. getPipelineSummary
// =============================================================================

export const GetPipelineSummaryInputSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  stage: z.string().optional(),
  date_range: DateRangeSchema.optional(),
});

export const PipelineStageSchema = z.object({
  name: z.string(),
  count: z.number(),
  value_rm: z.number(),
  avg_days: z.number(),
});

export const GetPipelineSummaryOutputSchema = z.object({
  stages: z.array(PipelineStageSchema),
  total_value_rm: z.number(),
  total_leads: z.number(),
});

// =============================================================================
// 6. getKPISnapshot
// =============================================================================

export const GetKPISnapshotInputSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  category: KPICategorySchema.optional().default('all'),
});

export const KPISchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
  target: z.number(),
  unit: z.string(),
  trend: TrendSchema,
});

export const GetKPISnapshotOutputSchema = z.object({
  kpis: z.array(KPISchema),
  as_of: z.string(),
});

// =============================================================================
// 7. getCriticalLeads
// =============================================================================

export const GetCriticalLeadsInputSchema = z.object({
  priority: LeadPrioritySchema.optional().default('critical'),
  limit: z.number().min(1).max(100).optional().default(10),
  sort_by: z.enum(['value', 'days_overdue']).optional().default('days_overdue'),
});

export const LeadSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  phone: z.string(),
  stage: z.string(),
  amount_rm: z.number(),
  days_overdue: z.number(),
  next_action: z.string(),
});

export const GetCriticalLeadsOutputSchema = z.object({
  leads: z.array(LeadSummarySchema),
  total: z.number(),
});

// =============================================================================
// 8. getLeadDetails
// =============================================================================

export const GetLeadDetailsInputSchema = z.object({
  lead_id: z.string().uuid(),
  include_history: z.boolean().optional().default(false),
});

export const LeadEventSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  description: z.string(),
  timestamp: z.string(),
  actor: z.string().optional(),
});

export const LeadDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  stage: LeadStageSchema,
  amount_rm: z.number(),
  data: z.record(z.string(), z.unknown()),
  history: z.array(LeadEventSchema).optional(),
});

export const GetLeadDetailsOutputSchema = z.object({
  lead: LeadDetailSchema,
});

// =============================================================================
// 9. updateLeadStatus
// =============================================================================

export const UpdateLeadStatusInputSchema = z.object({
  lead_id: z.string().uuid(),
  status: z.string().min(1),
  notes: z.string().optional(),
});

export const UpdateLeadStatusOutputSchema = z.object({
  success: z.boolean(),
  lead_id: z.string().uuid(),
  new_status: z.string(),
  updated_at: z.string(),
});

// =============================================================================
// 10. triggerWorkflow
// =============================================================================

export const TriggerWorkflowInputSchema = z.object({
  workflow_id: z.string().min(1),
  trigger_type: TriggerTypeSchema,
  context: z.record(z.string(), z.unknown()).optional(),
});

export const TriggerWorkflowOutputSchema = z.object({
  execution_id: z.string().uuid(),
  workflow_id: z.string(),
  status: WorkflowStatusSchema,
  started_at: z.string(),
});

// =============================================================================
// 11. getWidgetData
// =============================================================================

export const GetWidgetDataInputSchema = z.object({
  widget_type: z.string().min(1),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const GetWidgetDataOutputSchema = z.object({
  widget_type: z.string(),
  data: z.record(z.string(), z.unknown()),
  rendered_at: z.string(),
});

// =============================================================================
// 12. getAgentContext
// =============================================================================

export const GetAgentContextInputSchema = z.object({
  agent_id: z.string().optional(),
});

export const AgentPermissionSchema = z.enum(['read', 'write', 'admin', 'execute']);

export const GetAgentContextOutputSchema = z.object({
  persona: z.string(),
  tools: z.array(z.string()),
  permissions: z.array(AgentPermissionSchema),
  tenant: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  }),
});

// =============================================================================
// TOOL MANIFEST SCHEMA
// =============================================================================

export const ToolSchemaDefinition = z.object({
  type: z.string(),
  properties: z.record(z.string(), z.unknown()).optional(),
  required: z.array(z.string()).optional(),
});

export const ToolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  input_schema: ToolSchemaDefinition,
  output_schema: ToolSchemaDefinition,
});

export const MCPManifestSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  tools: z.array(ToolDefinitionSchema),
});

// =============================================================================
// TYPE EXPORTS (inferred from schemas)
// =============================================================================

export type ListTenantsInput = z.infer<typeof ListTenantsInputSchema>;
export type ListTenantsOutput = z.infer<typeof ListTenantsOutputSchema>;
export type GetGovernanceStatusInput = z.infer<typeof GetGovernanceStatusInputSchema>;
export type GetGovernanceStatusOutput = z.infer<typeof GetGovernanceStatusOutputSchema>;
export type RefreshProofInput = z.infer<typeof RefreshProofInputSchema>;
export type RefreshProofOutput = z.infer<typeof RefreshProofOutputSchema>;
export type LogProofEventInput = z.infer<typeof LogProofEventInputSchema>;
export type LogProofEventOutput = z.infer<typeof LogProofEventOutputSchema>;
export type GetPipelineSummaryInput = z.infer<typeof GetPipelineSummaryInputSchema>;
export type GetPipelineSummaryOutput = z.infer<typeof GetPipelineSummaryOutputSchema>;
export type GetKPISnapshotInput = z.infer<typeof GetKPISnapshotInputSchema>;
export type GetKPISnapshotOutput = z.infer<typeof GetKPISnapshotOutputSchema>;
export type GetCriticalLeadsInput = z.infer<typeof GetCriticalLeadsInputSchema>;
export type GetCriticalLeadsOutput = z.infer<typeof GetCriticalLeadsOutputSchema>;
export type GetLeadDetailsInput = z.infer<typeof GetLeadDetailsInputSchema>;
export type GetLeadDetailsOutput = z.infer<typeof GetLeadDetailsOutputSchema>;
export type UpdateLeadStatusInput = z.infer<typeof UpdateLeadStatusInputSchema>;
export type UpdateLeadStatusOutput = z.infer<typeof UpdateLeadStatusOutputSchema>;
export type TriggerWorkflowInput = z.infer<typeof TriggerWorkflowInputSchema>;
export type TriggerWorkflowOutput = z.infer<typeof TriggerWorkflowOutputSchema>;
export type GetWidgetDataInput = z.infer<typeof GetWidgetDataInputSchema>;
export type GetWidgetDataOutput = z.infer<typeof GetWidgetDataOutputSchema>;
export type GetAgentContextInput = z.infer<typeof GetAgentContextInputSchema>;
export type GetAgentContextOutput = z.infer<typeof GetAgentContextOutputSchema>;
