/**
 * Tenant Ontology Types for Qontrek MCP v2.0
 *
 * Defines the structure for tenant-specific domain ontologies
 * including entities, workflows, and metrics definitions.
 */

// =============================================================================
// Core Ontology Types
// =============================================================================

/**
 * Represents an entity within the tenant's domain ontology.
 * Entities are the core business objects (e.g., Lead, Customer, Invoice).
 */
export interface OntologyEntity {
  /** Unique identifier for the entity */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of the entity's purpose */
  description?: string;
  /** Entity attributes/fields */
  attributes: OntologyAttribute[];
  /** Relationships to other entities */
  relationships?: OntologyRelationship[];
  /** Metadata tags for categorization */
  tags?: string[];
}

/**
 * Represents an attribute/field of an entity.
 */
export interface OntologyAttribute {
  /** Attribute name */
  name: string;
  /** Data type (string, number, boolean, date, uuid, jsonb, etc.) */
  type: OntologyAttributeType;
  /** Whether the attribute is required */
  required?: boolean;
  /** Default value if not provided */
  defaultValue?: unknown;
  /** Validation constraints */
  constraints?: OntologyConstraint[];
  /** Human-readable description */
  description?: string;
}

/**
 * Supported attribute data types
 */
export type OntologyAttributeType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'uuid'
  | 'jsonb'
  | 'array'
  | 'enum';

/**
 * Validation constraint for an attribute
 */
export interface OntologyConstraint {
  /** Type of constraint */
  type: 'min' | 'max' | 'pattern' | 'enum' | 'unique' | 'foreign_key';
  /** Constraint value */
  value: unknown;
  /** Error message when constraint fails */
  message?: string;
}

/**
 * Relationship between entities
 */
export interface OntologyRelationship {
  /** Name of the relationship */
  name: string;
  /** Target entity ID */
  targetEntity: string;
  /** Relationship cardinality */
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  /** Foreign key field name */
  foreignKey?: string;
  /** Description of the relationship */
  description?: string;
}

// =============================================================================
// Workflow Types
// =============================================================================

/**
 * Represents a workflow within the tenant's domain.
 * Workflows define business processes and their stages.
 */
export interface OntologyWorkflow {
  /** Unique identifier for the workflow */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of the workflow purpose */
  description?: string;
  /** Entity this workflow operates on */
  entityId: string;
  /** Workflow stages/steps */
  stages: OntologyWorkflowStage[];
  /** Trigger conditions for the workflow */
  triggers?: OntologyWorkflowTrigger[];
  /** Whether the workflow is active */
  active: boolean;
}

/**
 * A stage within a workflow
 */
export interface OntologyWorkflowStage {
  /** Stage identifier */
  id: string;
  /** Stage name */
  name: string;
  /** Stage description */
  description?: string;
  /** Order of the stage (0-indexed) */
  order: number;
  /** Allowed transitions from this stage */
  transitions?: string[];
  /** Actions to execute at this stage */
  actions?: OntologyWorkflowAction[];
}

/**
 * Trigger condition for a workflow
 */
export interface OntologyWorkflowTrigger {
  /** Trigger type */
  type: 'event' | 'schedule' | 'condition' | 'manual';
  /** Trigger configuration */
  config: Record<string, unknown>;
}

/**
 * Action to execute within a workflow stage
 */
export interface OntologyWorkflowAction {
  /** Action type */
  type: 'notify' | 'update' | 'create' | 'webhook' | 'script';
  /** Action configuration */
  config: Record<string, unknown>;
}

// =============================================================================
// Metric Types
// =============================================================================

/**
 * Represents a metric definition within the tenant's domain.
 * Metrics define KPIs and measurements for business intelligence.
 */
export interface OntologyMetric {
  /** Unique identifier for the metric */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what the metric measures */
  description?: string;
  /** Entity the metric is calculated from */
  entityId: string;
  /** Metric calculation type */
  aggregation: OntologyAggregationType;
  /** Field to aggregate (for non-count aggregations) */
  field?: string;
  /** Filter conditions for the metric */
  filters?: OntologyMetricFilter[];
  /** Time dimension for the metric */
  timeDimension?: string;
  /** Unit of measurement */
  unit?: string;
  /** Metric category for grouping */
  category?: string;
}

/**
 * Supported aggregation types for metrics
 */
export type OntologyAggregationType =
  | 'count'
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'distinct_count'
  | 'percentage'
  | 'ratio';

/**
 * Filter condition for a metric
 */
export interface OntologyMetricFilter {
  /** Field to filter on */
  field: string;
  /** Filter operator */
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'is_null' | 'is_not_null';
  /** Filter value */
  value: unknown;
}

// =============================================================================
// Tenant Ontology Container
// =============================================================================

/**
 * Complete tenant ontology definition.
 * Contains all entities, workflows, and metrics for a tenant's domain.
 */
export interface TenantOntology {
  /** Tenant UUID */
  tenantId: string;
  /** Domain identifier (e.g., 'crm', 'ecommerce', 'finance') */
  domain: string;
  /** Entity definitions */
  entities: OntologyEntity[];
  /** Workflow definitions */
  workflows: OntologyWorkflow[];
  /** Metric definitions */
  metrics: OntologyMetric[];
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Database row representation of tenant ontology
 */
export interface TenantOntologyRow {
  /** Tenant UUID (primary key) */
  tenant_id: string;
  /** Domain identifier */
  domain: string;
  /** Entity definitions as JSONB */
  entities: OntologyEntity[];
  /** Workflow definitions as JSONB */
  workflows: OntologyWorkflow[];
  /** Metric definitions as JSONB */
  metrics: OntologyMetric[];
  /** Last update timestamp */
  updated_at: string;
}

// =============================================================================
// API Request/Response Types
// =============================================================================

/**
 * Request payload for updating tenant ontology
 */
export interface UpdateOntologyRequest {
  /** Domain identifier */
  domain?: string;
  /** Entity definitions to set */
  entities?: OntologyEntity[];
  /** Workflow definitions to set */
  workflows?: OntologyWorkflow[];
  /** Metric definitions to set */
  metrics?: OntologyMetric[];
}

/**
 * Response envelope for ontology API
 */
export interface OntologyResponse {
  /** Operation success flag */
  ok: boolean;
  /** Response data */
  data?: TenantOntology;
  /** Error message if ok=false */
  error?: string;
  /** Schema version for compatibility */
  schemaVersion: string;
}

// =============================================================================
// MCP Tool Types
// =============================================================================

/**
 * MCP tool definition for ontology operations
 */
export interface OntologyMcpTool {
  /** Tool name */
  name: string;
  /** Tool description */
  description: string;
  /** Input schema */
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * MCP tool input for getTenantOntology
 */
export interface GetTenantOntologyInput {
  /** Tenant ID to retrieve ontology for */
  tenantId: string;
}

/**
 * MCP tool input for updateTenantOntology
 */
export interface UpdateTenantOntologyInput {
  /** Tenant ID to update */
  tenantId: string;
  /** Domain to set */
  domain?: string;
  /** Entities to set */
  entities?: OntologyEntity[];
  /** Workflows to set */
  workflows?: OntologyWorkflow[];
  /** Metrics to set */
  metrics?: OntologyMetric[];
}
