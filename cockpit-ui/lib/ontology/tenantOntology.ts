/**
 * Tenant Ontology Service
 *
 * Provides operations for managing tenant-specific domain ontologies.
 * Supports both database persistence (Supabase) and file-based fallback.
 */

import type {
  TenantOntology,
  TenantOntologyRow,
  OntologyEntity,
  OntologyWorkflow,
  OntologyMetric,
  UpdateOntologyRequest,
} from '@/types/ontology';

// =============================================================================
// Constants
// =============================================================================

const SCHEMA_VERSION = '1.0.0';

/**
 * Default empty ontology template
 */
export const DEFAULT_ONTOLOGY: Omit<TenantOntology, 'tenantId' | 'updatedAt'> = {
  domain: 'default',
  entities: [],
  workflows: [],
  metrics: [],
};

// =============================================================================
// In-Memory Store (Fallback when Supabase is not available)
// =============================================================================

/**
 * In-memory store for tenant ontologies.
 * Used as fallback when database is unavailable or for testing.
 */
const ontologyStore = new Map<string, TenantOntology>();

// =============================================================================
// Core Operations
// =============================================================================

/**
 * Retrieves the ontology for a specific tenant.
 *
 * @param tenantId - The UUID of the tenant
 * @returns The tenant's ontology or null if not found
 */
export async function getTenantOntology(
  tenantId: string
): Promise<TenantOntology | null> {
  // Validate tenant ID format
  if (!isValidUUID(tenantId)) {
    throw new Error(`Invalid tenant ID format: ${tenantId}`);
  }

  // Check in-memory store first (for fallback/testing)
  const cached = ontologyStore.get(tenantId);
  if (cached) {
    return cached;
  }

  // If no Supabase client available, return null
  // In production, this would query the database
  return null;
}

/**
 * Creates or updates the ontology for a specific tenant.
 *
 * @param tenantId - The UUID of the tenant
 * @param update - The ontology data to set
 * @returns The updated tenant ontology
 */
export async function upsertTenantOntology(
  tenantId: string,
  update: UpdateOntologyRequest
): Promise<TenantOntology> {
  // Validate tenant ID format
  if (!isValidUUID(tenantId)) {
    throw new Error(`Invalid tenant ID format: ${tenantId}`);
  }

  // Get existing ontology or create new one
  const existing = await getTenantOntology(tenantId);
  const now = new Date().toISOString();

  const ontology: TenantOntology = {
    tenantId,
    domain: update.domain ?? existing?.domain ?? DEFAULT_ONTOLOGY.domain,
    entities: update.entities ?? existing?.entities ?? DEFAULT_ONTOLOGY.entities,
    workflows: update.workflows ?? existing?.workflows ?? DEFAULT_ONTOLOGY.workflows,
    metrics: update.metrics ?? existing?.metrics ?? DEFAULT_ONTOLOGY.metrics,
    updatedAt: now,
  };

  // Validate the ontology structure
  validateOntology(ontology);

  // Store in memory (fallback)
  ontologyStore.set(tenantId, ontology);

  return ontology;
}

/**
 * Deletes the ontology for a specific tenant.
 *
 * @param tenantId - The UUID of the tenant
 * @returns True if deleted, false if not found
 */
export async function deleteTenantOntology(tenantId: string): Promise<boolean> {
  // Validate tenant ID format
  if (!isValidUUID(tenantId)) {
    throw new Error(`Invalid tenant ID format: ${tenantId}`);
  }

  return ontologyStore.delete(tenantId);
}

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Validates a complete tenant ontology structure.
 *
 * @param ontology - The ontology to validate
 * @throws Error if validation fails
 */
export function validateOntology(ontology: TenantOntology): void {
  // Validate tenant ID
  if (!ontology.tenantId || !isValidUUID(ontology.tenantId)) {
    throw new Error('Invalid or missing tenant ID');
  }

  // Validate domain
  if (!ontology.domain || typeof ontology.domain !== 'string') {
    throw new Error('Invalid or missing domain');
  }

  // Validate entities array
  if (!Array.isArray(ontology.entities)) {
    throw new Error('entities must be an array');
  }
  ontology.entities.forEach(validateEntity);

  // Validate workflows array
  if (!Array.isArray(ontology.workflows)) {
    throw new Error('workflows must be an array');
  }
  ontology.workflows.forEach(validateWorkflow);

  // Validate metrics array
  if (!Array.isArray(ontology.metrics)) {
    throw new Error('metrics must be an array');
  }
  ontology.metrics.forEach(validateMetric);
}

/**
 * Validates an entity definition.
 */
export function validateEntity(entity: OntologyEntity): void {
  if (!entity.id || typeof entity.id !== 'string') {
    throw new Error('Entity must have a valid id');
  }
  if (!entity.name || typeof entity.name !== 'string') {
    throw new Error('Entity must have a valid name');
  }
  if (!Array.isArray(entity.attributes)) {
    throw new Error(`Entity ${entity.id} must have an attributes array`);
  }
}

/**
 * Validates a workflow definition.
 */
export function validateWorkflow(workflow: OntologyWorkflow): void {
  if (!workflow.id || typeof workflow.id !== 'string') {
    throw new Error('Workflow must have a valid id');
  }
  if (!workflow.name || typeof workflow.name !== 'string') {
    throw new Error('Workflow must have a valid name');
  }
  if (!workflow.entityId || typeof workflow.entityId !== 'string') {
    throw new Error(`Workflow ${workflow.id} must have a valid entityId`);
  }
  if (!Array.isArray(workflow.stages)) {
    throw new Error(`Workflow ${workflow.id} must have a stages array`);
  }
}

/**
 * Validates a metric definition.
 */
export function validateMetric(metric: OntologyMetric): void {
  if (!metric.id || typeof metric.id !== 'string') {
    throw new Error('Metric must have a valid id');
  }
  if (!metric.name || typeof metric.name !== 'string') {
    throw new Error('Metric must have a valid name');
  }
  if (!metric.entityId || typeof metric.entityId !== 'string') {
    throw new Error(`Metric ${metric.id} must have a valid entityId`);
  }
  if (!metric.aggregation) {
    throw new Error(`Metric ${metric.id} must have an aggregation type`);
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Validates UUID format.
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Converts database row to TenantOntology object.
 */
export function rowToOntology(row: TenantOntologyRow): TenantOntology {
  return {
    tenantId: row.tenant_id,
    domain: row.domain,
    entities: row.entities,
    workflows: row.workflows,
    metrics: row.metrics,
    updatedAt: row.updated_at,
  };
}

/**
 * Converts TenantOntology to database row format.
 */
export function ontologyToRow(ontology: TenantOntology): TenantOntologyRow {
  return {
    tenant_id: ontology.tenantId,
    domain: ontology.domain,
    entities: ontology.entities,
    workflows: ontology.workflows,
    metrics: ontology.metrics,
    updated_at: ontology.updatedAt,
  };
}

/**
 * Gets the current schema version.
 */
export function getSchemaVersion(): string {
  return SCHEMA_VERSION;
}

// =============================================================================
// MCP Tool Implementations
// =============================================================================

/**
 * MCP tool: getTenantOntology
 * Retrieves the complete ontology for a tenant.
 */
export async function mcpGetTenantOntology(input: {
  tenantId: string;
}): Promise<{
  ok: boolean;
  data?: TenantOntology;
  error?: string;
  schemaVersion: string;
}> {
  try {
    const ontology = await getTenantOntology(input.tenantId);

    if (!ontology) {
      return {
        ok: false,
        error: `Ontology not found for tenant: ${input.tenantId}`,
        schemaVersion: SCHEMA_VERSION,
      };
    }

    return {
      ok: true,
      data: ontology,
      schemaVersion: SCHEMA_VERSION,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      schemaVersion: SCHEMA_VERSION,
    };
  }
}

/**
 * MCP tool: updateTenantOntology
 * Creates or updates the ontology for a tenant.
 */
export async function mcpUpdateTenantOntology(input: {
  tenantId: string;
  domain?: string;
  entities?: OntologyEntity[];
  workflows?: OntologyWorkflow[];
  metrics?: OntologyMetric[];
}): Promise<{
  ok: boolean;
  data?: TenantOntology;
  error?: string;
  schemaVersion: string;
}> {
  try {
    const ontology = await upsertTenantOntology(input.tenantId, {
      domain: input.domain,
      entities: input.entities,
      workflows: input.workflows,
      metrics: input.metrics,
    });

    return {
      ok: true,
      data: ontology,
      schemaVersion: SCHEMA_VERSION,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      schemaVersion: SCHEMA_VERSION,
    };
  }
}

/**
 * Clears the in-memory ontology store (for testing).
 */
export function clearOntologyStore(): void {
  ontologyStore.clear();
}

/**
 * Gets all ontologies from the in-memory store (for testing/debugging).
 */
export function getAllOntologies(): Map<string, TenantOntology> {
  return new Map(ontologyStore);
}
