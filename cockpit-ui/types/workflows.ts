// types/workflows.ts
// Evolutionary Workflow Engine type contracts

/**
 * Mutation types for workflow evolution
 */
export type MutationType = 'clone' | 'mutate' | 'rollback' | 'initial';

/**
 * Workflow node types supported in n8n-compatible definitions
 */
export type WorkflowNodeType =
  | 'trigger'
  | 'webhook'
  | 'http_request'
  | 'code'
  | 'conditional'
  | 'loop'
  | 'merge'
  | 'split'
  | 'delay'
  | 'set'
  | 'function';

/**
 * A single node in a workflow definition
 */
export interface WorkflowNode {
  id: string;
  name: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  parameters: Record<string, unknown>;
  credentials?: Record<string, string>;
  disabled?: boolean;
}

/**
 * Connection between workflow nodes
 */
export interface WorkflowConnection {
  sourceNodeId: string;
  sourceOutput: number;
  targetNodeId: string;
  targetInput: number;
}

/**
 * n8n-compatible workflow definition
 */
export interface WorkflowDefinition {
  name: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  settings?: {
    executionOrder?: 'v1' | 'v2';
    saveManualExecutions?: boolean;
    callerPolicy?: 'any' | 'none' | 'workflowsFromSameOwner';
    timezone?: string;
  };
  staticData?: Record<string, unknown>;
  tags?: string[];
}

/**
 * Stored workflow version record
 */
export interface WorkflowVersion {
  id: string;
  tenantId: string;
  workflowName: string;
  version: number;
  definitionJson: WorkflowDefinition;
  score: number;
  parentVersionId: string | null;
  mutationType: MutationType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mutation rules for workflow evolution
 */
export interface MutationRule {
  id: string;
  name: string;
  description: string;
  probability: number;
  apply: (definition: WorkflowDefinition) => WorkflowDefinition;
}

/**
 * Evolution configuration
 */
export interface EvolutionConfig {
  maxVersions: number;
  mutationRate: number;
  eliteCount: number;
  scoreThreshold: number;
  rollbackOnScoreDrop: boolean;
}

/**
 * Result of a workflow evolution operation
 */
export interface EvolutionResult {
  success: boolean;
  newVersion: WorkflowVersion | null;
  previousVersion: WorkflowVersion | null;
  mutationsApplied: string[];
  scoreChange: number;
  message: string;
}

/**
 * Request payload for evolve endpoint
 */
export interface EvolveWorkflowRequest {
  tenantId: string;
  workflowName: string;
  action: 'clone' | 'mutate' | 'rollback';
  targetScore?: number;
  mutationRules?: string[];
}

/**
 * Response from evolve endpoint
 */
export interface EvolveWorkflowResponse {
  ok: boolean;
  result: EvolutionResult;
  timestamp: string;
}

/**
 * Request for listing workflow versions
 */
export interface ListWorkflowVersionsRequest {
  tenantId: string;
  workflowName?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'version' | 'score' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Response for listing workflow versions
 */
export interface ListWorkflowVersionsResponse {
  ok: boolean;
  versions: WorkflowVersion[];
  total: number;
  hasMore: boolean;
}

/**
 * Workflow execution score metrics
 */
export interface WorkflowScoreMetrics {
  executionTime: number;
  successRate: number;
  errorCount: number;
  resourceUsage: number;
  outputQuality: number;
}

/**
 * Score calculation weights
 */
export interface ScoreWeights {
  executionTime: number;
  successRate: number;
  errorCount: number;
  resourceUsage: number;
  outputQuality: number;
}
