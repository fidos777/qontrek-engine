/**
 * MCP Types
 *
 * TypeScript type definitions for MCP Tool Fabric.
 * Re-exports Zod-inferred types and adds additional type helpers.
 */

// Re-export all types from schemas
export type {
  MCPEnvelope,
  JWTClaims,
  ListTenantsInput,
  ListTenantsOutput,
  Tenant,
  GetGovernanceStatusInput,
  GetGovernanceStatusOutput,
  GateStatus,
  RefreshProofInput,
  RefreshProofOutput,
  GetPipelineSummaryInput,
  GetPipelineSummaryOutput,
  PipelineStage,
  GetCriticalLeadsInput,
  GetCriticalLeadsOutput,
  Lead,
  GetLeadDetailsInput,
  GetLeadDetailsOutput,
  LeadActivity,
  LeadHistory,
  UpdateLeadStatusInput,
  UpdateLeadStatusOutput,
  GetKPISnapshotInput,
  GetKPISnapshotOutput,
  KPIMetric,
  TriggerWorkflowInput,
  TriggerWorkflowOutput,
  LogProofEventInput,
  LogProofEventOutput,
  GetWidgetDataInput,
  GetWidgetDataOutput,
  GetAgentContextInput,
  GetAgentContextOutput,
  AgentTool,
} from './schemas';

export type { GovernanceContext, MCPLogEntry } from './governance';

/**
 * MCP Tool definition for discovery
 */
export interface MCPToolDefinition {
  name: string;
  description: string;
  version: string;
  category: 'tenant' | 'governance' | 'leads' | 'pipeline' | 'workflow' | 'agent' | 'widget';
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  output_schema: {
    type: 'object';
    properties: Record<string, unknown>;
  };
  rate_limit?: {
    requests: number;
    window_seconds: number;
  };
  requires_auth: boolean;
  governance_gate: string;
}

/**
 * MCP Discovery manifest
 */
export interface MCPManifest {
  version: string;
  name: string;
  description: string;
  base_url: string;
  tools: MCPToolDefinition[];
  governance: {
    lineage_gate: string;
    audit_enabled: boolean;
    pii_scrubbing: boolean;
  };
  authentication: {
    type: 'jwt' | 'api_key' | 'oauth2';
    tenant_claim: string;
  };
}

/**
 * Tool invocation request
 */
export interface ToolInvocationRequest<T = unknown> {
  tool: string;
  input: T;
  context?: {
    trace_id?: string;
    parent_lineage?: string[];
  };
}

/**
 * Tool invocation response
 */
export interface ToolInvocationResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  } | null;
  governance: {
    tenant_id: string;
    request_id: string;
    timestamp: string;
    gate: string;
    lineage: string[];
  };
}

/**
 * Workflow definition
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  triggers: Array<{
    type: 'manual' | 'scheduled' | 'event';
    config: Record<string, unknown>;
  }>;
  steps: Array<{
    id: string;
    name: string;
    tool: string;
    input_mapping: Record<string, string>;
    on_success?: string;
    on_failure?: string;
  }>;
}

/**
 * Workflow execution state
 */
export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  triggered_at: string;
  started_at?: string;
  completed_at?: string;
  current_step?: string;
  steps_completed: string[];
  output?: Record<string, unknown>;
  error?: {
    step_id: string;
    code: string;
    message: string;
  };
}

/**
 * Widget configuration
 */
export interface WidgetConfig {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'list' | 'custom';
  title: string;
  data_source: {
    tool: string;
    params: Record<string, unknown>;
  };
  refresh_interval_seconds?: number;
  display_options?: Record<string, unknown>;
}

/**
 * Agent session
 */
export interface AgentSession {
  id: string;
  tenant_id: string;
  started_at: string;
  last_activity: string;
  requests_count: number;
  tools_used: string[];
  compliance_level: 'standard' | 'strict' | 'audit';
}
