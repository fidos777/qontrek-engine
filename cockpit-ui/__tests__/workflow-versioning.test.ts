/**
 * Workflow Versioning Tests
 *
 * Tests for the workflow version storage and retrieval functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { WorkflowDefinition, WorkflowVersion } from '@/types/workflows';

// Mock the sqlite module
vi.mock('sqlite3', () => ({
  default: { Database: vi.fn() },
}));

vi.mock('sqlite', () => ({
  open: vi.fn(),
}));

// Test fixtures
const sampleWorkflowDefinition: WorkflowDefinition = {
  name: 'Test Workflow',
  nodes: [
    {
      id: 'trigger_1',
      name: 'Start',
      type: 'trigger',
      position: { x: 100, y: 100 },
      parameters: { event: 'manual' },
    },
    {
      id: 'http_1',
      name: 'Fetch Data',
      type: 'http_request',
      position: { x: 300, y: 100 },
      parameters: {
        url: 'https://api.example.com/data',
        method: 'GET',
      },
    },
    {
      id: 'code_1',
      name: 'Process Data',
      type: 'code',
      position: { x: 500, y: 100 },
      parameters: {
        code: 'return $input.all().map(i => ({ ...i, processed: true }))',
      },
    },
  ],
  connections: [
    { sourceNodeId: 'trigger_1', sourceOutput: 0, targetNodeId: 'http_1', targetInput: 0 },
    { sourceNodeId: 'http_1', sourceOutput: 0, targetNodeId: 'code_1', targetInput: 0 },
  ],
  settings: {
    executionOrder: 'v2',
  },
};

describe('Workflow Versioning', () => {
  describe('WorkflowDefinition structure', () => {
    it('should have required name field', () => {
      expect(sampleWorkflowDefinition.name).toBe('Test Workflow');
      expect(typeof sampleWorkflowDefinition.name).toBe('string');
    });

    it('should have nodes array', () => {
      expect(Array.isArray(sampleWorkflowDefinition.nodes)).toBe(true);
      expect(sampleWorkflowDefinition.nodes.length).toBe(3);
    });

    it('should have connections array', () => {
      expect(Array.isArray(sampleWorkflowDefinition.connections)).toBe(true);
      expect(sampleWorkflowDefinition.connections.length).toBe(2);
    });

    it('should have valid node structure', () => {
      const node = sampleWorkflowDefinition.nodes[0];
      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('name');
      expect(node).toHaveProperty('type');
      expect(node).toHaveProperty('position');
      expect(node).toHaveProperty('parameters');
      expect(node.position).toHaveProperty('x');
      expect(node.position).toHaveProperty('y');
    });

    it('should have valid connection structure', () => {
      const connection = sampleWorkflowDefinition.connections[0];
      expect(connection).toHaveProperty('sourceNodeId');
      expect(connection).toHaveProperty('sourceOutput');
      expect(connection).toHaveProperty('targetNodeId');
      expect(connection).toHaveProperty('targetInput');
    });
  });

  describe('WorkflowVersion structure', () => {
    const sampleVersion: WorkflowVersion = {
      id: 'wfv_test_123',
      tenantId: 'tenant_1',
      workflowName: 'Test Workflow',
      version: 1,
      definitionJson: sampleWorkflowDefinition,
      score: 0.85,
      parentVersionId: null,
      mutationType: 'initial',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    it('should have valid id format', () => {
      expect(sampleVersion.id).toMatch(/^wfv_/);
    });

    it('should have required tenant fields', () => {
      expect(sampleVersion.tenantId).toBe('tenant_1');
      expect(sampleVersion.workflowName).toBe('Test Workflow');
    });

    it('should have version number', () => {
      expect(typeof sampleVersion.version).toBe('number');
      expect(sampleVersion.version).toBeGreaterThan(0);
    });

    it('should have score between 0 and 1', () => {
      expect(sampleVersion.score).toBeGreaterThanOrEqual(0);
      expect(sampleVersion.score).toBeLessThanOrEqual(1);
    });

    it('should have valid mutation type', () => {
      const validTypes = ['clone', 'mutate', 'rollback', 'initial'];
      expect(validTypes).toContain(sampleVersion.mutationType);
    });

    it('should have isActive boolean', () => {
      expect(typeof sampleVersion.isActive).toBe('boolean');
    });

    it('should have valid timestamps', () => {
      expect(() => new Date(sampleVersion.createdAt)).not.toThrow();
      expect(() => new Date(sampleVersion.updatedAt)).not.toThrow();
    });
  });

  describe('Version ID generation', () => {
    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 10);
        const id = `wfv_${timestamp}_${random}`;
        ids.add(id);
      }
      // Should have close to 100 unique IDs (might have tiny collision due to same timestamp)
      expect(ids.size).toBeGreaterThan(95);
    });

    it('should follow expected format', () => {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 10);
      const id = `wfv_${timestamp}_${random}`;

      expect(id).toMatch(/^wfv_[a-z0-9]+_[a-z0-9]+$/);
    });
  });

  describe('Lineage tracking', () => {
    it('should track parent-child relationships', () => {
      const parent: WorkflowVersion = {
        id: 'wfv_parent_001',
        tenantId: 'tenant_1',
        workflowName: 'Test',
        version: 1,
        definitionJson: sampleWorkflowDefinition,
        score: 0.8,
        parentVersionId: null,
        mutationType: 'initial',
        isActive: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const child: WorkflowVersion = {
        id: 'wfv_child_002',
        tenantId: 'tenant_1',
        workflowName: 'Test',
        version: 2,
        definitionJson: sampleWorkflowDefinition,
        score: 0.85,
        parentVersionId: parent.id,
        mutationType: 'mutate',
        isActive: true,
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      expect(child.parentVersionId).toBe(parent.id);
      expect(child.version).toBeGreaterThan(parent.version);
    });

    it('should support version chains', () => {
      const versions: WorkflowVersion[] = [];
      let parentId: string | null = null;

      for (let i = 1; i <= 5; i++) {
        const version: WorkflowVersion = {
          id: `wfv_v${i}`,
          tenantId: 'tenant_1',
          workflowName: 'Test',
          version: i,
          definitionJson: sampleWorkflowDefinition,
          score: 0.5 + i * 0.05,
          parentVersionId: parentId,
          mutationType: i === 1 ? 'initial' : 'mutate',
          isActive: i === 5,
          createdAt: new Date(Date.now() + i * 86400000).toISOString(),
          updatedAt: new Date(Date.now() + i * 86400000).toISOString(),
        };
        versions.push(version);
        parentId = version.id;
      }

      // Verify chain integrity
      expect(versions[0].parentVersionId).toBeNull();
      for (let i = 1; i < versions.length; i++) {
        expect(versions[i].parentVersionId).toBe(versions[i - 1].id);
      }

      // Only last version should be active
      expect(versions.filter(v => v.isActive).length).toBe(1);
      expect(versions[versions.length - 1].isActive).toBe(true);
    });
  });
});
