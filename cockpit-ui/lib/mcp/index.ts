/**
 * MCP Tool Fabric - Main Export
 *
 * Central export point for all MCP tool fabric components.
 */

// Types
export * from './types';

// Schemas (export only the Zod schemas, not the inferred types which would conflict with types.ts)
export {
  // Shared schemas
  GateStatusSchema,
  GateResultSchema,
  ActorSchema,
  TargetSchema,
  DateRangeSchema,
  LeadPrioritySchema,
  LeadStageSchema,
  KPICategorySchema,
  TriggerTypeSchema,
  WorkflowStatusSchema,
  TenantStatusSchema,
  TrendSchema,
  // Response envelope schemas
  MCPErrorSchema,
  GovernanceMetadataSchema,
  ResponseMetaSchema,
  createMCPResponseSchema,
  // Tool schemas
  ListTenantsInputSchema,
  TenantSummarySchema,
  ListTenantsOutputSchema,
  GetGovernanceStatusInputSchema,
  GatesMapSchema,
  GetGovernanceStatusOutputSchema,
  RefreshProofInputSchema,
  RefreshProofOutputSchema,
  LogProofEventInputSchema,
  LogProofEventOutputSchema,
  GetPipelineSummaryInputSchema,
  PipelineStageSchema,
  GetPipelineSummaryOutputSchema,
  GetKPISnapshotInputSchema,
  KPISchema,
  GetKPISnapshotOutputSchema,
  GetCriticalLeadsInputSchema,
  LeadSummarySchema,
  GetCriticalLeadsOutputSchema,
  GetLeadDetailsInputSchema,
  LeadEventSchema,
  LeadDetailSchema,
  GetLeadDetailsOutputSchema,
  UpdateLeadStatusInputSchema,
  UpdateLeadStatusOutputSchema,
  TriggerWorkflowInputSchema,
  TriggerWorkflowOutputSchema,
  GetWidgetDataInputSchema,
  GetWidgetDataOutputSchema,
  GetAgentContextInputSchema,
  AgentPermissionSchema,
  GetAgentContextOutputSchema,
  ToolSchemaDefinition,
  ToolDefinitionSchema,
  MCPManifestSchema,
} from './schemas';

// Governance
export {
  DEMO_TENANT_ID,
  DEFAULT_GATE_ID,
  MCP_VERSION,
  extractAuthContext,
  generateHash,
  generateProofHash,
  logProofEvent,
  logToolInvocation,
  getProofLedger,
  getLatestProofHash,
  getDemoGovernanceStatus,
  calculateTrustIndex,
} from './governance';

// Utilities
export {
  createSuccessResponse,
  createErrorResponse,
  withGovernance,
  parseRequestBody,
  getCurrentTimestamp,
  generateId,
  filterLeadsByPriority,
  sortLeads,
  getLeadHistory,
  DEMO_TENANTS,
  DEMO_LEADS,
  DEMO_KPIS,
  DEMO_PIPELINE_STAGES,
  DEMO_WORKFLOWS,
  DEMO_WIDGETS,
  DEMO_AGENTS,
} from './utils';
