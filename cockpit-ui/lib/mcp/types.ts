/**
 * MCP Tool Fabric - Type Definitions
 *
 * TypeScript interfaces for all MCP tools in the Qontrek ecosystem.
 * These types define the contract between MCP tools and their consumers.
 */

// =============================================================================
// CORE RESPONSE ENVELOPE
// =============================================================================

/**
 * Governance metadata included in every response
 */
export interface GovernanceMetadata {
  proof_hash: string;
  gate_id: string;
  logged_at: string;
}

/**
 * Response metadata for observability
 */
export interface ResponseMeta {
  tool: string;
  version: string;
  duration_ms: number;
}

/**
 * Error details for failed operations
 */
export interface MCPError {
  code: string;
  message: string;
}

/**
 * Standard response envelope for all MCP tools
 */
export interface MCPResponse<T> {
  success: boolean;
  data: T;
  error?: MCPError;
  governance: GovernanceMetadata;
  meta: ResponseMeta;
}

// =============================================================================
// TENANT TYPES
// =============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'pending' | 'archived';
  settings?: Record<string, unknown>;
  created_at?: string;
}

// listTenants
export interface ListTenantsInput {
  filter?: 'active' | 'all';
  limit?: number;
}

export interface ListTenantsOutput {
  tenants: Array<Pick<Tenant, 'id' | 'name' | 'slug' | 'status'>>;
  total: number;
}

// =============================================================================
// GOVERNANCE TYPES
// =============================================================================

export type GateStatus = 'pass' | 'fail' | 'warn' | 'pending';

export interface GateResult {
  status: GateStatus;
  message: string;
  evidence?: Record<string, unknown>;
}

export interface GatesMap {
  G13: GateResult;
  G14: GateResult;
  G15: GateResult;
  G16: GateResult;
  G17: GateResult;
  G18: GateResult;
  G19: GateResult;
  G20: GateResult;
  G21: GateResult;
}

// getGovernanceStatus
export interface GetGovernanceStatusInput {
  tenant_id?: string;
  include_evidence?: boolean;
}

export interface GetGovernanceStatusOutput {
  gates: GatesMap;
  trust_index: number;
  last_updated: string;
}

// refreshProof
export interface RefreshProofInput {
  tenant_id: string;
  force?: boolean;
}

export interface RefreshProofOutput {
  proof_id: string;
  hash: string;
  refreshed_at: string;
}

// logProofEvent
export interface Actor {
  id: string;
  type: 'user' | 'system' | 'agent';
  name?: string;
}

export interface Target {
  id: string;
  type: string;
  name?: string;
}

export interface LogProofEventInput {
  event_type: string;
  actor: Actor;
  target: Target;
  metadata?: Record<string, unknown>;
}

export interface LogProofEventOutput {
  event_id: string;
  proof_hash: string;
  timestamp: string;
}

// =============================================================================
// PIPELINE TYPES
// =============================================================================

export interface PipelineStage {
  name: string;
  count: number;
  value_rm: number;
  avg_days: number;
}

// getPipelineSummary
export interface DateRange {
  from: string;
  to: string;
}

export interface GetPipelineSummaryInput {
  tenant_id?: string;
  stage?: string;
  date_range?: DateRange;
}

export interface GetPipelineSummaryOutput {
  stages: PipelineStage[];
  total_value_rm: number;
  total_leads: number;
}

// =============================================================================
// KPI TYPES
// =============================================================================

export type KPICategory = 'recovery' | 'conversion' | 'engagement' | 'all';

export interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

// getKPISnapshot
export interface GetKPISnapshotInput {
  tenant_id?: string;
  category?: KPICategory;
}

export interface GetKPISnapshotOutput {
  kpis: KPI[];
  as_of: string;
}

// =============================================================================
// LEAD TYPES
// =============================================================================

export type LeadPriority = 'critical' | 'high' | 'medium' | 'low';
export type LeadStage = 'new' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

export interface LeadSummary {
  id: string;
  name: string;
  phone: string;
  stage: string;
  amount_rm: number;
  days_overdue: number;
  next_action: string;
}

export interface LeadDetail {
  id: string;
  name: string;
  phone: string;
  email: string;
  stage: LeadStage;
  amount_rm: number;
  data: Record<string, unknown>;
  history?: LeadEvent[];
}

export interface LeadEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  actor?: string;
}

// getCriticalLeads
export interface GetCriticalLeadsInput {
  priority?: LeadPriority;
  limit?: number;
  sort_by?: 'value' | 'days_overdue';
}

export interface GetCriticalLeadsOutput {
  leads: LeadSummary[];
  total: number;
}

// getLeadDetails
export interface GetLeadDetailsInput {
  lead_id: string;
  include_history?: boolean;
}

export interface GetLeadDetailsOutput {
  lead: LeadDetail;
}

// updateLeadStatus
export interface UpdateLeadStatusInput {
  lead_id: string;
  status: string;
  notes?: string;
}

export interface UpdateLeadStatusOutput {
  success: boolean;
  lead_id: string;
  new_status: string;
  updated_at: string;
}

// =============================================================================
// WORKFLOW TYPES
// =============================================================================

export type TriggerType = 'manual' | 'event';
export type WorkflowStatus = 'queued' | 'running' | 'completed' | 'failed';

// triggerWorkflow
export interface TriggerWorkflowInput {
  workflow_id: string;
  trigger_type: TriggerType;
  context?: Record<string, unknown>;
}

export interface TriggerWorkflowOutput {
  execution_id: string;
  workflow_id: string;
  status: WorkflowStatus;
  started_at: string;
}

// =============================================================================
// WIDGET TYPES
// =============================================================================

// getWidgetData
export interface GetWidgetDataInput {
  widget_type: string;
  config?: Record<string, unknown>;
}

export interface GetWidgetDataOutput {
  widget_type: string;
  data: Record<string, unknown>;
  rendered_at: string;
}

// =============================================================================
// AGENT TYPES
// =============================================================================

// getAgentContext
export interface GetAgentContextInput {
  agent_id?: string;
}

export type AgentPermission = 'read' | 'write' | 'admin' | 'execute';

export interface GetAgentContextOutput {
  persona: string;
  tools: string[];
  permissions: AgentPermission[];
  tenant: Pick<Tenant, 'id' | 'name' | 'slug'>;
}

// =============================================================================
// TOOL MANIFEST TYPES
// =============================================================================

export interface ToolSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: ToolSchema;
  output_schema: ToolSchema;
}

export interface MCPManifest {
  name: string;
  version: string;
  description: string;
  tools: ToolDefinition[];
}

// =============================================================================
// JWT & AUTH TYPES
// =============================================================================

export interface JWTClaims {
  sub: string;
  tenant_id: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthContext {
  user_id: string;
  tenant_id: string;
  role: string;
  is_demo: boolean;
}
