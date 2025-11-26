/**
 * Workflow Engine Exports
 *
 * Main entry point for the Evolutionary Workflow Engine.
 */

// Core wrapper functions
export {
  cloneWorkflow,
  mutateWorkflow,
  rollbackWorkflow,
  scoreWorkflow,
  checkAutoRollback,
  getMutationRules,
  getDefaultEvolutionConfig,
  MUTATION_RULES,
} from './wrapper';

// Storage functions
export {
  generateVersionId,
  storeWorkflowVersion,
  getWorkflowVersion,
  getActiveWorkflowVersion,
  getLatestWorkflowVersion,
  getBestScoringVersion,
  listWorkflowVersions,
  updateWorkflowScore,
  setActiveVersion,
  getWorkflowVersionById,
  getVersionLineage,
  closeDatabase,
} from './store';

// Re-export types
export type {
  WorkflowVersion,
  WorkflowDefinition,
  WorkflowNode,
  WorkflowConnection,
  MutationType,
  MutationRule,
  EvolutionConfig,
  EvolutionResult,
  EvolveWorkflowRequest,
  EvolveWorkflowResponse,
  ListWorkflowVersionsRequest,
  ListWorkflowVersionsResponse,
  WorkflowScoreMetrics,
  ScoreWeights,
} from '@/types/workflows';
