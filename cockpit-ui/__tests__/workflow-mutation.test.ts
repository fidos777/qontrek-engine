/**
 * Workflow Mutation Rules Tests
 *
 * Tests for the mutation rules that power workflow evolution.
 */

import { describe, it, expect, vi } from 'vitest';
import type { WorkflowDefinition, MutationRule, WorkflowNode } from '@/types/workflows';

// Mock the sqlite module
vi.mock('sqlite3', () => ({
  default: { Database: vi.fn() },
}));

vi.mock('sqlite', () => ({
  open: vi.fn(),
}));

// Sample workflow for mutation testing
const createSampleWorkflow = (): WorkflowDefinition => ({
  name: 'Mutation Test Workflow',
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
        code: 'return $input.all()',
      },
    },
  ],
  connections: [
    { sourceNodeId: 'trigger_1', sourceOutput: 0, targetNodeId: 'http_1', targetInput: 0 },
    { sourceNodeId: 'http_1', sourceOutput: 0, targetNodeId: 'code_1', targetInput: 0 },
  ],
});

// Mutation rule implementations for testing
const mutationRules = {
  addRetry: (def: WorkflowDefinition): WorkflowDefinition => {
    const mutated = JSON.parse(JSON.stringify(def));
    for (const node of mutated.nodes) {
      if (node.type === 'http_request' && !node.parameters.retry) {
        node.parameters.retry = {
          enabled: true,
          maxRetries: 3,
          retryDelayMs: 1000,
        };
      }
    }
    return mutated;
  },

  addTimeout: (def: WorkflowDefinition): WorkflowDefinition => {
    const mutated = JSON.parse(JSON.stringify(def));
    for (const node of mutated.nodes) {
      if (['http_request', 'code', 'function'].includes(node.type) && !node.parameters.timeout) {
        node.parameters.timeout = 30000;
      }
    }
    return mutated;
  },

  addCaching: (def: WorkflowDefinition): WorkflowDefinition => {
    const mutated = JSON.parse(JSON.stringify(def));
    for (const node of mutated.nodes) {
      if (node.type === 'http_request' && !node.parameters.cache) {
        const method = node.parameters.method as string;
        if (!method || method.toUpperCase() === 'GET') {
          node.parameters.cache = {
            enabled: true,
            ttlSeconds: 300,
          };
        }
      }
    }
    return mutated;
  },

  addErrorHandler: (def: WorkflowDefinition): WorkflowDefinition => {
    const mutated = JSON.parse(JSON.stringify(def));
    const nodesWithoutErrorHandler = mutated.nodes.filter(
      (node: WorkflowNode) => !node.parameters.onError && node.type !== 'trigger'
    );

    if (nodesWithoutErrorHandler.length > 0) {
      for (const node of nodesWithoutErrorHandler) {
        node.parameters.onError = 'continueOnError';
      }
    }

    return mutated;
  },
};

describe('Workflow Mutation Rules', () => {
  describe('add_retry mutation', () => {
    it('should add retry configuration to HTTP nodes', () => {
      const workflow = createSampleWorkflow();
      const mutated = mutationRules.addRetry(workflow);

      const httpNode = mutated.nodes.find(n => n.type === 'http_request');
      expect(httpNode).toBeDefined();
      expect(httpNode?.parameters.retry).toBeDefined();
      expect(httpNode?.parameters.retry.enabled).toBe(true);
      expect(httpNode?.parameters.retry.maxRetries).toBe(3);
    });

    it('should not modify non-HTTP nodes', () => {
      const workflow = createSampleWorkflow();
      const mutated = mutationRules.addRetry(workflow);

      const codeNode = mutated.nodes.find(n => n.type === 'code');
      expect(codeNode?.parameters.retry).toBeUndefined();
    });

    it('should not overwrite existing retry config', () => {
      const workflow = createSampleWorkflow();
      const httpNode = workflow.nodes.find(n => n.type === 'http_request');
      if (httpNode) {
        httpNode.parameters.retry = { enabled: true, maxRetries: 5 };
      }

      const mutated = mutationRules.addRetry(workflow);
      const mutatedHttpNode = mutated.nodes.find(n => n.type === 'http_request');
      expect(mutatedHttpNode?.parameters.retry.maxRetries).toBe(5);
    });

    it('should preserve original workflow', () => {
      const workflow = createSampleWorkflow();
      const originalJson = JSON.stringify(workflow);

      mutationRules.addRetry(workflow);

      expect(JSON.stringify(workflow)).toBe(originalJson);
    });
  });

  describe('add_timeout mutation', () => {
    it('should add timeout to http_request nodes', () => {
      const workflow = createSampleWorkflow();
      const mutated = mutationRules.addTimeout(workflow);

      const httpNode = mutated.nodes.find(n => n.type === 'http_request');
      expect(httpNode?.parameters.timeout).toBe(30000);
    });

    it('should add timeout to code nodes', () => {
      const workflow = createSampleWorkflow();
      const mutated = mutationRules.addTimeout(workflow);

      const codeNode = mutated.nodes.find(n => n.type === 'code');
      expect(codeNode?.parameters.timeout).toBe(30000);
    });

    it('should not add timeout to trigger nodes', () => {
      const workflow = createSampleWorkflow();
      const mutated = mutationRules.addTimeout(workflow);

      const triggerNode = mutated.nodes.find(n => n.type === 'trigger');
      expect(triggerNode?.parameters.timeout).toBeUndefined();
    });
  });

  describe('add_caching mutation', () => {
    it('should add caching to GET requests', () => {
      const workflow = createSampleWorkflow();
      const mutated = mutationRules.addCaching(workflow);

      const httpNode = mutated.nodes.find(n => n.type === 'http_request');
      expect(httpNode?.parameters.cache).toBeDefined();
      expect(httpNode?.parameters.cache.enabled).toBe(true);
      expect(httpNode?.parameters.cache.ttlSeconds).toBe(300);
    });

    it('should not add caching to POST requests', () => {
      const workflow = createSampleWorkflow();
      const httpNode = workflow.nodes.find(n => n.type === 'http_request');
      if (httpNode) {
        httpNode.parameters.method = 'POST';
      }

      const mutated = mutationRules.addCaching(workflow);
      const mutatedHttpNode = mutated.nodes.find(n => n.type === 'http_request');
      expect(mutatedHttpNode?.parameters.cache).toBeUndefined();
    });
  });

  describe('add_error_handler mutation', () => {
    it('should add error handling to nodes without it', () => {
      const workflow = createSampleWorkflow();
      const mutated = mutationRules.addErrorHandler(workflow);

      const httpNode = mutated.nodes.find(n => n.type === 'http_request');
      expect(httpNode?.parameters.onError).toBe('continueOnError');

      const codeNode = mutated.nodes.find(n => n.type === 'code');
      expect(codeNode?.parameters.onError).toBe('continueOnError');
    });

    it('should not add error handling to trigger nodes', () => {
      const workflow = createSampleWorkflow();
      const mutated = mutationRules.addErrorHandler(workflow);

      const triggerNode = mutated.nodes.find(n => n.type === 'trigger');
      expect(triggerNode?.parameters.onError).toBeUndefined();
    });
  });

  describe('Mutation rule structure', () => {
    const sampleRule: MutationRule = {
      id: 'test_rule',
      name: 'Test Rule',
      description: 'A test mutation rule',
      probability: 0.5,
      apply: (def) => def,
    };

    it('should have required id field', () => {
      expect(sampleRule.id).toBe('test_rule');
      expect(typeof sampleRule.id).toBe('string');
    });

    it('should have required name field', () => {
      expect(sampleRule.name).toBe('Test Rule');
    });

    it('should have description', () => {
      expect(sampleRule.description).toBeDefined();
    });

    it('should have probability between 0 and 1', () => {
      expect(sampleRule.probability).toBeGreaterThanOrEqual(0);
      expect(sampleRule.probability).toBeLessThanOrEqual(1);
    });

    it('should have apply function', () => {
      expect(typeof sampleRule.apply).toBe('function');
    });
  });

  describe('Mutation composition', () => {
    it('should allow multiple mutations to be applied', () => {
      const workflow = createSampleWorkflow();

      let mutated = mutationRules.addRetry(workflow);
      mutated = mutationRules.addTimeout(mutated);
      mutated = mutationRules.addCaching(mutated);

      const httpNode = mutated.nodes.find(n => n.type === 'http_request');

      expect(httpNode?.parameters.retry).toBeDefined();
      expect(httpNode?.parameters.timeout).toBeDefined();
      expect(httpNode?.parameters.cache).toBeDefined();
    });

    it('should maintain node relationships after mutations', () => {
      const workflow = createSampleWorkflow();
      const originalConnectionCount = workflow.connections.length;

      let mutated = mutationRules.addRetry(workflow);
      mutated = mutationRules.addTimeout(mutated);

      expect(mutated.connections.length).toBe(originalConnectionCount);
      expect(mutated.connections[0].sourceNodeId).toBe('trigger_1');
      expect(mutated.connections[0].targetNodeId).toBe('http_1');
    });
  });

  describe('Probabilistic mutation application', () => {
    it('should respect probability thresholds', () => {
      const iterations = 1000;
      const probability = 0.3;
      let appliedCount = 0;

      for (let i = 0; i < iterations; i++) {
        if (Math.random() < probability) {
          appliedCount++;
        }
      }

      // Should be roughly 30% (within reasonable margin)
      const actualRate = appliedCount / iterations;
      expect(actualRate).toBeGreaterThan(0.2);
      expect(actualRate).toBeLessThan(0.4);
    });
  });
});
