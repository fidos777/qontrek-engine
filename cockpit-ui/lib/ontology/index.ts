/**
 * Tenant Ontology Module
 *
 * Exports all ontology-related functionality for Qontrek MCP v2.0.
 */

// Core ontology operations
export {
  getTenantOntology,
  upsertTenantOntology,
  deleteTenantOntology,
  validateOntology,
  validateEntity,
  validateWorkflow,
  validateMetric,
  isValidUUID,
  rowToOntology,
  ontologyToRow,
  getSchemaVersion,
  mcpGetTenantOntology,
  mcpUpdateTenantOntology,
  clearOntologyStore,
  getAllOntologies,
  DEFAULT_ONTOLOGY,
} from './tenantOntology';

// Re-export types for convenience
export type {
  TenantOntology,
  TenantOntologyRow,
  OntologyEntity,
  OntologyAttribute,
  OntologyAttributeType,
  OntologyConstraint,
  OntologyRelationship,
  OntologyWorkflow,
  OntologyWorkflowStage,
  OntologyWorkflowTrigger,
  OntologyWorkflowAction,
  OntologyMetric,
  OntologyAggregationType,
  OntologyMetricFilter,
  UpdateOntologyRequest,
  OntologyResponse,
  OntologyMcpTool,
  GetTenantOntologyInput,
  UpdateTenantOntologyInput,
} from '@/types/ontology';
