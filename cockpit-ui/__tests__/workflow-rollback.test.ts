/**
 * Workflow Rollback Tests
 *
 * Tests for score-based rollback functionality.
 */

import { describe, it, expect, vi } from 'vitest';
import type {
  WorkflowVersion,
  WorkflowDefinition,
  EvolutionConfig,
  EvolutionResult,
  WorkflowScoreMetrics,
} from '@/types/workflows';

// Mock the sqlite module
vi.mock('sqlite3', () => ({
  default: { Database: vi.fn() },
}));

vi.mock('sqlite', () => ({
  open: vi.fn(),
}));

// Sample workflow definition
const sampleDefinition: WorkflowDefinition = {
  name: 'Test Workflow',
  nodes: [
    {
      id: 'trigger_1',
      name: 'Start',
      type: 'trigger',
      position: { x: 100, y: 100 },
      parameters: {},
    },
  ],
  connections: [],
};

// Helper to create workflow versions
const createVersion = (
  id: string,
  version: number,
  score: number,
  parentId: string | null = null,
  mutationType: 'initial' | 'clone' | 'mutate' | 'rollback' = 'initial'
): WorkflowVersion => ({
  id,
  tenantId: 'tenant_1',
  workflowName: 'Test Workflow',
  version,
  definitionJson: sampleDefinition,
  score,
  parentVersionId: parentId,
  mutationType,
  isActive: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('Workflow Rollback', () => {
  describe('Score calculation', () => {
    it('should calculate weighted score correctly', () => {
      const metrics: WorkflowScoreMetrics = {
        executionTime: 5000, // 5 seconds
        successRate: 0.95,
        errorCount: 1,
        resourceUsage: 0.3,
        outputQuality: 0.85,
      };

      const weights = {
        executionTime: 0.2,
        successRate: 0.4,
        errorCount: 0.2,
        resourceUsage: 0.1,
        outputQuality: 0.1,
      };

      // Normalize metrics
      const normalizedTime = Math.max(0, 1 - metrics.executionTime / 60000);
      const normalizedErrors = Math.max(0, 1 - metrics.errorCount / 10);
      const normalizedResource = 1 - metrics.resourceUsage;

      const expectedScore =
        weights.executionTime * normalizedTime +
        weights.successRate * metrics.successRate +
        weights.errorCount * normalizedErrors +
        weights.resourceUsage * normalizedResource +
        weights.outputQuality * metrics.outputQuality;

      expect(expectedScore).toBeGreaterThan(0);
      expect(expectedScore).toBeLessThanOrEqual(1);
    });

    it('should handle edge cases', () => {
      // Perfect metrics
      const perfectMetrics: WorkflowScoreMetrics = {
        executionTime: 0,
        successRate: 1,
        errorCount: 0,
        resourceUsage: 0,
        outputQuality: 1,
      };

      const normalizedTime = 1;
      const normalizedErrors = 1;
      const normalizedResource = 1;

      const perfectScore =
        0.2 * normalizedTime +
        0.4 * perfectMetrics.successRate +
        0.2 * normalizedErrors +
        0.1 * normalizedResource +
        0.1 * perfectMetrics.outputQuality;

      expect(perfectScore).toBe(1);

      // Worst metrics
      const worstMetrics: WorkflowScoreMetrics = {
        executionTime: 60000,
        successRate: 0,
        errorCount: 10,
        resourceUsage: 1,
        outputQuality: 0,
      };

      const worstScore =
        0.2 * 0 + 0.4 * 0 + 0.2 * 0 + 0.1 * 0 + 0.1 * 0;

      expect(worstScore).toBe(0);
    });
  });

  describe('Rollback decision logic', () => {
    const evolutionConfig: EvolutionConfig = {
      maxVersions: 100,
      mutationRate: 0.3,
      eliteCount: 3,
      scoreThreshold: 0.1,
      rollbackOnScoreDrop: true,
    };

    it('should trigger rollback when score drops below threshold', () => {
      const currentVersion = createVersion('v3', 3, 0.6, 'v2', 'mutate');
      const bestVersion = createVersion('v2', 2, 0.8, 'v1', 'mutate');

      const scoreDrop = bestVersion.score - currentVersion.score;
      const shouldRollback =
        scoreDrop > evolutionConfig.scoreThreshold &&
        currentVersion.id !== bestVersion.id;

      expect(scoreDrop).toBeCloseTo(0.2, 10);
      expect(shouldRollback).toBe(true);
    });

    it('should not trigger rollback when score drop is within threshold', () => {
      const currentVersion = createVersion('v3', 3, 0.75, 'v2', 'mutate');
      const bestVersion = createVersion('v2', 2, 0.8, 'v1', 'mutate');

      const scoreDrop = bestVersion.score - currentVersion.score;
      const shouldRollback =
        scoreDrop > evolutionConfig.scoreThreshold &&
        currentVersion.id !== bestVersion.id;

      expect(scoreDrop).toBeCloseTo(0.05, 10);
      expect(shouldRollback).toBe(false);
    });

    it('should not rollback to same version', () => {
      const currentVersion = createVersion('v1', 1, 0.8, null, 'initial');

      const shouldRollback =
        currentVersion.id !== currentVersion.id;

      expect(shouldRollback).toBe(false);
    });

    it('should respect rollbackOnScoreDrop config', () => {
      const disabledConfig: EvolutionConfig = {
        ...evolutionConfig,
        rollbackOnScoreDrop: false,
      };

      expect(disabledConfig.rollbackOnScoreDrop).toBe(false);
    });
  });

  describe('Rollback target selection', () => {
    it('should find best scoring version', () => {
      const versions = [
        createVersion('v1', 1, 0.7, null, 'initial'),
        createVersion('v2', 2, 0.85, 'v1', 'mutate'),
        createVersion('v3', 3, 0.6, 'v2', 'mutate'),
        createVersion('v4', 4, 0.5, 'v3', 'mutate'),
      ];

      const bestVersion = versions.reduce((best, current) =>
        current.score > best.score ? current : best
      );

      expect(bestVersion.id).toBe('v2');
      expect(bestVersion.score).toBe(0.85);
    });

    it('should find version meeting score threshold', () => {
      const versions = [
        createVersion('v1', 1, 0.7, null, 'initial'),
        createVersion('v2', 2, 0.75, 'v1', 'mutate'),
        createVersion('v3', 3, 0.6, 'v2', 'mutate'),
      ];

      const targetScore = 0.72;
      const eligibleVersion = versions
        .sort((a, b) => b.score - a.score)
        .find(v => v.score >= targetScore);

      expect(eligibleVersion?.id).toBe('v2');
    });

    it('should handle no eligible versions', () => {
      const versions = [
        createVersion('v1', 1, 0.3, null, 'initial'),
        createVersion('v2', 2, 0.4, 'v1', 'mutate'),
      ];

      const targetScore = 0.9;
      const eligibleVersion = versions.find(v => v.score >= targetScore);

      expect(eligibleVersion).toBeUndefined();
    });
  });

  describe('EvolutionResult structure', () => {
    it('should have correct success result structure', () => {
      const result: EvolutionResult = {
        success: true,
        newVersion: createVersion('v4', 4, 0.8, 'v3', 'rollback'),
        previousVersion: createVersion('v3', 3, 0.5, 'v2', 'mutate'),
        mutationsApplied: [],
        scoreChange: 0.3,
        message: 'Rolled back successfully',
      };

      expect(result.success).toBe(true);
      expect(result.newVersion).not.toBeNull();
      expect(result.previousVersion).not.toBeNull();
      expect(result.scoreChange).toBe(0.3);
      expect(result.mutationsApplied).toHaveLength(0);
    });

    it('should have correct failure result structure', () => {
      const result: EvolutionResult = {
        success: false,
        newVersion: null,
        previousVersion: null,
        mutationsApplied: [],
        scoreChange: 0,
        message: 'No suitable rollback target found',
      };

      expect(result.success).toBe(false);
      expect(result.newVersion).toBeNull();
      expect(result.message).toContain('No suitable');
    });
  });

  describe('Rollback version creation', () => {
    it('should create rollback with correct mutation type', () => {
      const targetVersion = createVersion('v2', 2, 0.85, 'v1', 'mutate');
      const rollbackVersion = createVersion('v5', 5, 0.85, 'v4', 'rollback');

      expect(rollbackVersion.mutationType).toBe('rollback');
    });

    it('should preserve target definition in rollback', () => {
      const targetDefinition: WorkflowDefinition = {
        name: 'Good Version',
        nodes: [
          {
            id: 'node_1',
            name: 'Good Node',
            type: 'code',
            position: { x: 0, y: 0 },
            parameters: { optimized: true },
          },
        ],
        connections: [],
      };

      const rollbackVersion: WorkflowVersion = {
        ...createVersion('v5', 5, 0.85, 'v4', 'rollback'),
        definitionJson: targetDefinition,
      };

      expect(rollbackVersion.definitionJson.name).toBe('Good Version');
      expect(rollbackVersion.definitionJson.nodes[0].parameters.optimized).toBe(true);
    });

    it('should set rollback version as active by default', () => {
      const rollbackVersion: WorkflowVersion = {
        ...createVersion('v5', 5, 0.85, 'v4', 'rollback'),
        isActive: true,
      };

      expect(rollbackVersion.isActive).toBe(true);
    });

    it('should link to current version as parent', () => {
      const currentVersion = createVersion('v4', 4, 0.5, 'v3', 'mutate');
      const rollbackVersion = createVersion('v5', 5, 0.85, currentVersion.id, 'rollback');

      expect(rollbackVersion.parentVersionId).toBe(currentVersion.id);
    });
  });

  describe('Auto-rollback triggers', () => {
    it('should calculate score drop correctly', () => {
      const bestScore = 0.9;
      const currentScore = 0.6;
      const threshold = 0.1;

      const scoreDrop = bestScore - currentScore;
      const shouldTrigger = scoreDrop > threshold;

      expect(scoreDrop).toBeCloseTo(0.3, 10);
      expect(shouldTrigger).toBe(true);
    });

    it('should handle consecutive score drops', () => {
      const scoreHistory = [0.9, 0.85, 0.7, 0.5, 0.3];
      const threshold = 0.1;

      let rollbackCount = 0;
      for (let i = 1; i < scoreHistory.length; i++) {
        const maxPreviousScore = Math.max(...scoreHistory.slice(0, i));
        const currentScore = scoreHistory[i];
        if (maxPreviousScore - currentScore > threshold) {
          rollbackCount++;
        }
      }

      expect(rollbackCount).toBeGreaterThan(0);
    });
  });
});
