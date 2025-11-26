/**
 * Tenant Ontology Unit Tests
 *
 * Tests the ontology service, API routes, and validation logic.
 * Validates tenant isolation, data integrity, and MCP tool compliance.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
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
  clearOntologyStore,
  mcpGetTenantOntology,
  mcpUpdateTenantOntology,
  DEFAULT_ONTOLOGY,
} from '@/lib/ontology';
import type {
  TenantOntology,
  TenantOntologyRow,
  OntologyEntity,
  OntologyWorkflow,
  OntologyMetric,
} from '@/types/ontology';

// =============================================================================
// Test Data
// =============================================================================

const VALID_TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const INVALID_TENANT_ID = 'not-a-uuid';

const SAMPLE_ENTITY: OntologyEntity = {
  id: 'lead',
  name: 'Lead',
  description: 'A potential customer',
  attributes: [
    { name: 'id', type: 'uuid', required: true },
    { name: 'email', type: 'string', required: true },
    { name: 'phone', type: 'string', required: false },
    { name: 'status', type: 'enum', required: true },
    { name: 'created_at', type: 'datetime', required: true },
  ],
  relationships: [
    {
      name: 'owner',
      targetEntity: 'user',
      cardinality: 'many-to-one',
      foreignKey: 'owner_id',
    },
  ],
  tags: ['crm', 'sales'],
};

const SAMPLE_WORKFLOW: OntologyWorkflow = {
  id: 'lead-qualification',
  name: 'Lead Qualification',
  description: 'Qualifies leads through stages',
  entityId: 'lead',
  stages: [
    { id: 'new', name: 'New', order: 0, transitions: ['contacted'] },
    { id: 'contacted', name: 'Contacted', order: 1, transitions: ['qualified', 'disqualified'] },
    { id: 'qualified', name: 'Qualified', order: 2, transitions: ['converted'] },
    { id: 'disqualified', name: 'Disqualified', order: 3, transitions: [] },
    { id: 'converted', name: 'Converted', order: 4, transitions: [] },
  ],
  triggers: [
    { type: 'event', config: { event: 'lead.created' } },
  ],
  active: true,
};

const SAMPLE_METRIC: OntologyMetric = {
  id: 'conversion-rate',
  name: 'Lead Conversion Rate',
  description: 'Percentage of leads converted to customers',
  entityId: 'lead',
  aggregation: 'percentage',
  field: 'status',
  filters: [
    { field: 'status', operator: 'eq', value: 'converted' },
  ],
  unit: '%',
  category: 'sales',
};

// =============================================================================
// UUID Validation Tests
// =============================================================================

describe('UUID Validation', () => {
  it('should accept valid UUID v4', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
  });

  it('should reject invalid UUIDs', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
    expect(isValidUUID('')).toBe(false);
    expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false);
  });
});

// =============================================================================
// Entity Validation Tests
// =============================================================================

describe('Entity Validation', () => {
  it('should validate a correct entity', () => {
    expect(() => validateEntity(SAMPLE_ENTITY)).not.toThrow();
  });

  it('should reject entity without id', () => {
    const invalid = { ...SAMPLE_ENTITY, id: '' };
    expect(() => validateEntity(invalid)).toThrow('Entity must have a valid id');
  });

  it('should reject entity without name', () => {
    const invalid = { ...SAMPLE_ENTITY, name: '' };
    expect(() => validateEntity(invalid)).toThrow('Entity must have a valid name');
  });

  it('should reject entity without attributes array', () => {
    const invalid = { ...SAMPLE_ENTITY, attributes: 'not-array' } as any;
    expect(() => validateEntity(invalid)).toThrow('must have an attributes array');
  });
});

// =============================================================================
// Workflow Validation Tests
// =============================================================================

describe('Workflow Validation', () => {
  it('should validate a correct workflow', () => {
    expect(() => validateWorkflow(SAMPLE_WORKFLOW)).not.toThrow();
  });

  it('should reject workflow without id', () => {
    const invalid = { ...SAMPLE_WORKFLOW, id: '' };
    expect(() => validateWorkflow(invalid)).toThrow('Workflow must have a valid id');
  });

  it('should reject workflow without entityId', () => {
    const invalid = { ...SAMPLE_WORKFLOW, entityId: '' };
    expect(() => validateWorkflow(invalid)).toThrow('must have a valid entityId');
  });

  it('should reject workflow without stages array', () => {
    const invalid = { ...SAMPLE_WORKFLOW, stages: 'not-array' } as any;
    expect(() => validateWorkflow(invalid)).toThrow('must have a stages array');
  });
});

// =============================================================================
// Metric Validation Tests
// =============================================================================

describe('Metric Validation', () => {
  it('should validate a correct metric', () => {
    expect(() => validateMetric(SAMPLE_METRIC)).not.toThrow();
  });

  it('should reject metric without id', () => {
    const invalid = { ...SAMPLE_METRIC, id: '' };
    expect(() => validateMetric(invalid)).toThrow('Metric must have a valid id');
  });

  it('should reject metric without entityId', () => {
    const invalid = { ...SAMPLE_METRIC, entityId: '' };
    expect(() => validateMetric(invalid)).toThrow('must have a valid entityId');
  });

  it('should reject metric without aggregation', () => {
    const invalid = { ...SAMPLE_METRIC, aggregation: '' } as any;
    expect(() => validateMetric(invalid)).toThrow('must have an aggregation type');
  });
});

// =============================================================================
// Full Ontology Validation Tests
// =============================================================================

describe('Ontology Validation', () => {
  it('should validate a complete ontology', () => {
    const ontology: TenantOntology = {
      tenantId: VALID_TENANT_ID,
      domain: 'crm',
      entities: [SAMPLE_ENTITY],
      workflows: [SAMPLE_WORKFLOW],
      metrics: [SAMPLE_METRIC],
      updatedAt: new Date().toISOString(),
    };

    expect(() => validateOntology(ontology)).not.toThrow();
  });

  it('should reject ontology with invalid tenant ID', () => {
    const ontology: TenantOntology = {
      tenantId: INVALID_TENANT_ID,
      domain: 'crm',
      entities: [],
      workflows: [],
      metrics: [],
      updatedAt: new Date().toISOString(),
    };

    expect(() => validateOntology(ontology)).toThrow('Invalid or missing tenant ID');
  });

  it('should reject ontology with non-array entities', () => {
    const ontology = {
      tenantId: VALID_TENANT_ID,
      domain: 'crm',
      entities: 'not-array',
      workflows: [],
      metrics: [],
      updatedAt: new Date().toISOString(),
    } as any;

    expect(() => validateOntology(ontology)).toThrow('entities must be an array');
  });
});

// =============================================================================
// Row Conversion Tests
// =============================================================================

describe('Row Conversion', () => {
  it('should convert database row to TenantOntology', () => {
    const row: TenantOntologyRow = {
      tenant_id: VALID_TENANT_ID,
      domain: 'crm',
      entities: [SAMPLE_ENTITY],
      workflows: [SAMPLE_WORKFLOW],
      metrics: [SAMPLE_METRIC],
      updated_at: '2024-01-01T00:00:00Z',
    };

    const ontology = rowToOntology(row);

    expect(ontology.tenantId).toBe(VALID_TENANT_ID);
    expect(ontology.domain).toBe('crm');
    expect(ontology.entities).toHaveLength(1);
    expect(ontology.updatedAt).toBe('2024-01-01T00:00:00Z');
  });

  it('should convert TenantOntology to database row', () => {
    const ontology: TenantOntology = {
      tenantId: VALID_TENANT_ID,
      domain: 'crm',
      entities: [SAMPLE_ENTITY],
      workflows: [SAMPLE_WORKFLOW],
      metrics: [SAMPLE_METRIC],
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const row = ontologyToRow(ontology);

    expect(row.tenant_id).toBe(VALID_TENANT_ID);
    expect(row.domain).toBe('crm');
    expect(row.entities).toHaveLength(1);
    expect(row.updated_at).toBe('2024-01-01T00:00:00Z');
  });
});

// =============================================================================
// Ontology Service Tests
// =============================================================================

describe('Ontology Service', () => {
  beforeEach(() => {
    clearOntologyStore();
  });

  it('should return null for non-existent tenant', async () => {
    const result = await getTenantOntology(VALID_TENANT_ID);
    expect(result).toBeNull();
  });

  it('should create and retrieve ontology', async () => {
    const created = await upsertTenantOntology(VALID_TENANT_ID, {
      domain: 'crm',
      entities: [SAMPLE_ENTITY],
      workflows: [SAMPLE_WORKFLOW],
      metrics: [SAMPLE_METRIC],
    });

    expect(created.tenantId).toBe(VALID_TENANT_ID);
    expect(created.domain).toBe('crm');
    expect(created.entities).toHaveLength(1);

    const retrieved = await getTenantOntology(VALID_TENANT_ID);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.tenantId).toBe(VALID_TENANT_ID);
  });

  it('should update existing ontology', async () => {
    // Create initial
    await upsertTenantOntology(VALID_TENANT_ID, {
      domain: 'crm',
      entities: [SAMPLE_ENTITY],
    });

    // Update with new entity
    const newEntity: OntologyEntity = {
      id: 'customer',
      name: 'Customer',
      attributes: [{ name: 'id', type: 'uuid', required: true }],
    };

    const updated = await upsertTenantOntology(VALID_TENANT_ID, {
      entities: [SAMPLE_ENTITY, newEntity],
    });

    expect(updated.entities).toHaveLength(2);
    expect(updated.domain).toBe('crm'); // Preserved from initial
  });

  it('should delete ontology', async () => {
    await upsertTenantOntology(VALID_TENANT_ID, {
      domain: 'crm',
    });

    const deleted = await deleteTenantOntology(VALID_TENANT_ID);
    expect(deleted).toBe(true);

    const retrieved = await getTenantOntology(VALID_TENANT_ID);
    expect(retrieved).toBeNull();
  });

  it('should return false when deleting non-existent', async () => {
    const deleted = await deleteTenantOntology(VALID_TENANT_ID);
    expect(deleted).toBe(false);
  });

  it('should reject invalid tenant ID', async () => {
    await expect(
      upsertTenantOntology(INVALID_TENANT_ID, { domain: 'crm' })
    ).rejects.toThrow('Invalid tenant ID format');
  });

  it('should use default values for empty ontology', async () => {
    const created = await upsertTenantOntology(VALID_TENANT_ID, {});

    expect(created.domain).toBe(DEFAULT_ONTOLOGY.domain);
    expect(created.entities).toEqual([]);
    expect(created.workflows).toEqual([]);
    expect(created.metrics).toEqual([]);
  });
});

// =============================================================================
// Tenant Isolation Tests
// =============================================================================

describe('Tenant Isolation', () => {
  const TENANT_A = '550e8400-e29b-41d4-a716-446655440001';
  const TENANT_B = '550e8400-e29b-41d4-a716-446655440002';

  beforeEach(() => {
    clearOntologyStore();
  });

  it('should isolate ontologies between tenants', async () => {
    // Create ontology for Tenant A
    await upsertTenantOntology(TENANT_A, {
      domain: 'crm',
      entities: [SAMPLE_ENTITY],
    });

    // Create different ontology for Tenant B
    await upsertTenantOntology(TENANT_B, {
      domain: 'ecommerce',
      entities: [
        {
          id: 'product',
          name: 'Product',
          attributes: [{ name: 'sku', type: 'string', required: true }],
        },
      ],
    });

    // Verify isolation
    const ontologyA = await getTenantOntology(TENANT_A);
    const ontologyB = await getTenantOntology(TENANT_B);

    expect(ontologyA?.domain).toBe('crm');
    expect(ontologyA?.entities[0].id).toBe('lead');

    expect(ontologyB?.domain).toBe('ecommerce');
    expect(ontologyB?.entities[0].id).toBe('product');
  });

  it('should not affect other tenants on delete', async () => {
    await upsertTenantOntology(TENANT_A, { domain: 'crm' });
    await upsertTenantOntology(TENANT_B, { domain: 'ecommerce' });

    await deleteTenantOntology(TENANT_A);

    const ontologyA = await getTenantOntology(TENANT_A);
    const ontologyB = await getTenantOntology(TENANT_B);

    expect(ontologyA).toBeNull();
    expect(ontologyB).not.toBeNull();
    expect(ontologyB?.domain).toBe('ecommerce');
  });
});

// =============================================================================
// MCP Tool Tests
// =============================================================================

describe('MCP Tools', () => {
  beforeEach(() => {
    clearOntologyStore();
  });

  describe('mcpGetTenantOntology', () => {
    it('should return error for non-existent tenant', async () => {
      const result = await mcpGetTenantOntology({ tenantId: VALID_TENANT_ID });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('not found');
      expect(result.schemaVersion).toBeDefined();
    });

    it('should return ontology for existing tenant', async () => {
      await upsertTenantOntology(VALID_TENANT_ID, {
        domain: 'crm',
        entities: [SAMPLE_ENTITY],
      });

      const result = await mcpGetTenantOntology({ tenantId: VALID_TENANT_ID });

      expect(result.ok).toBe(true);
      expect(result.data?.domain).toBe('crm');
      expect(result.schemaVersion).toBeDefined();
    });

    it('should return error for invalid tenant ID', async () => {
      const result = await mcpGetTenantOntology({ tenantId: INVALID_TENANT_ID });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid tenant ID');
    });
  });

  describe('mcpUpdateTenantOntology', () => {
    it('should create new ontology', async () => {
      const result = await mcpUpdateTenantOntology({
        tenantId: VALID_TENANT_ID,
        domain: 'crm',
        entities: [SAMPLE_ENTITY],
        workflows: [SAMPLE_WORKFLOW],
        metrics: [SAMPLE_METRIC],
      });

      expect(result.ok).toBe(true);
      expect(result.data?.tenantId).toBe(VALID_TENANT_ID);
      expect(result.data?.domain).toBe('crm');
      expect(result.schemaVersion).toBeDefined();
    });

    it('should update existing ontology', async () => {
      await mcpUpdateTenantOntology({
        tenantId: VALID_TENANT_ID,
        domain: 'crm',
      });

      const result = await mcpUpdateTenantOntology({
        tenantId: VALID_TENANT_ID,
        domain: 'ecommerce',
      });

      expect(result.ok).toBe(true);
      expect(result.data?.domain).toBe('ecommerce');
    });

    it('should return error for invalid tenant ID', async () => {
      const result = await mcpUpdateTenantOntology({
        tenantId: INVALID_TENANT_ID,
        domain: 'crm',
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid tenant ID');
    });
  });
});

// =============================================================================
// Schema Version Tests
// =============================================================================

describe('Schema Version', () => {
  it('should include schemaVersion in all MCP responses', async () => {
    const getResult = await mcpGetTenantOntology({ tenantId: VALID_TENANT_ID });
    expect(getResult.schemaVersion).toMatch(/^\d+\.\d+\.\d+$/);

    const updateResult = await mcpUpdateTenantOntology({
      tenantId: VALID_TENANT_ID,
      domain: 'crm',
    });
    expect(updateResult.schemaVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
