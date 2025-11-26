import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  GateEvaluationContext,
  GateResult,
  GovernanceScore,
  GateId,
  KeyRotationProof,
  TowerReceiptProof,
} from '@/lib/governance/types';

// Mock the fs/promises module
vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn().mockRejectedValue(new Error('File not found')),
  };
});

// Import after mocking
import {
  computeGovernanceScore,
  getGovernanceHealth,
  getStatusColor,
  formatScore,
} from '@/lib/governance/computeScore';

import {
  buildEvaluationContext,
  evaluateGate,
  evaluateAllGates,
} from '@/lib/governance/evaluateGates';

import { ALL_RULES, getRuleById, getTotalWeight } from '@/lib/governance/rules';

describe('Governance Engine', () => {
  describe('Rules Configuration', () => {
    it('should have 9 rules for G13-G21', () => {
      expect(ALL_RULES).toHaveLength(9);
    });

    it('should have rules in correct order', () => {
      const expectedOrder: GateId[] = [
        'G13', 'G14', 'G15', 'G16', 'G17', 'G18', 'G19', 'G20', 'G21',
      ];
      const actualOrder = ALL_RULES.map((r) => r.id);
      expect(actualOrder).toEqual(expectedOrder);
    });

    it('should have weights summing approximately to 1.0', () => {
      const totalWeight = getTotalWeight();
      expect(totalWeight).toBeGreaterThan(0.95);
      expect(totalWeight).toBeLessThanOrEqual(1.0);
    });

    it('should find rule by ID', () => {
      const g13 = getRuleById('G13');
      expect(g13).toBeDefined();
      expect(g13?.name).toBe('Determinism & Reproducibility');
    });

    it('should return undefined for unknown rule ID', () => {
      const unknown = getRuleById('G99' as GateId);
      expect(unknown).toBeUndefined();
    });
  });

  describe('Gate Evaluation', () => {
    const mockContext: GateEvaluationContext = {
      proofDir: '/mock/proof',
      keyRotationProof: null,
      towerReceiptProof: null,
      nonceStats: undefined,
      alertMetrics: undefined,
    };

    it('should evaluate G13 without proof files', async () => {
      const result = await evaluateGate('G13', mockContext);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Determinism & Reproducibility');
      expect(result?.score).toBeGreaterThanOrEqual(0);
      expect(result?.score).toBeLessThanOrEqual(100);
      expect(['pass', 'partial', 'pending', 'fail']).toContain(result?.status);
    });

    it('should evaluate all gates', async () => {
      const results = await evaluateAllGates(mockContext);
      expect(Object.keys(results)).toHaveLength(9);

      for (const gateId of ['G13', 'G14', 'G15', 'G16', 'G17', 'G18', 'G19', 'G20', 'G21'] as GateId[]) {
        expect(results[gateId]).toBeDefined();
        expect(results[gateId].score).toBeGreaterThanOrEqual(0);
        expect(results[gateId].score).toBeLessThanOrEqual(100);
      }
    });

    it('should include evidence in gate results', async () => {
      const result = await evaluateGate('G14', mockContext);
      expect(result?.evidence).toBeDefined();
      expect(typeof result?.evidence).toBe('object');
    });

    it('should include KPIs in gate results', async () => {
      const result = await evaluateGate('G14', mockContext);
      expect(result?.kpis).toBeDefined();
      expect(typeof result?.kpis).toBe('object');
    });

    it('should include timestamp in gate results', async () => {
      const result = await evaluateGate('G13', mockContext);
      expect(result?.evaluatedAt).toBeDefined();
      expect(new Date(result!.evaluatedAt).getTime()).not.toBeNaN();
    });
  });

  describe('Gate Evaluation with Proofs', () => {
    const mockKeyRotationProof: KeyRotationProof = {
      schema: 'security_key_rotation_v1',
      version: 'v1.0',
      generatedAt: new Date().toISOString(),
      rotationPolicy: {
        maxAgeDays: 90,
        warningDays: 14,
        gracePeriodDays: 7,
      },
      activeKeys: [
        {
          kid: 'key-1',
          scope: 'factory',
          algorithm: 'HMAC-SHA256',
          createdAt: new Date().toISOString(),
          rotatesAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          daysUntilRotation: 30,
          urgency: 'ok',
        },
      ],
      retiredKeys: [],
    };

    const mockTowerReceiptProof: TowerReceiptProof = {
      receiptId: 'receipt-123',
      manifestHash: 'abc123def456',
      echoRoot: 'root-hash-789',
      uploadedAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      status: 'verified',
      manifest: {
        version: 'v1.0',
        files: [
          { path: 'file1.ts', sha256: 'a'.repeat(64) },
          { path: 'file2.ts', sha256: 'b'.repeat(64) },
        ],
        merkleRoot: 'merkle-root-hash',
      },
      signatures: {
        factorySignature: 'factory-sig',
        towerSignature: 'tower-sig',
        towerKid: 'tower-key-1',
      },
    };

    const contextWithProofs: GateEvaluationContext = {
      proofDir: '/mock/proof',
      keyRotationProof: mockKeyRotationProof,
      towerReceiptProof: mockTowerReceiptProof,
      nonceStats: {
        activeNonces: 100,
        expiredNonces: 50,
        byContext: { federation: 80, ack: 20 },
        replayRate: 0,
      },
      alertMetrics: {
        activeAlerts: 0,
        criticalAlerts: 0,
        warningAlerts: 1,
        alertCoverage: 90,
      },
    };

    it('should score higher with valid proofs', async () => {
      const withProofs = await evaluateGate('G17', contextWithProofs);
      const withoutProofs = await evaluateGate('G17', {
        ...contextWithProofs,
        keyRotationProof: null,
      });

      expect(withProofs?.score).toBeGreaterThan(withoutProofs?.score || 0);
    });

    it('should mark G21 higher with tower co-sign', async () => {
      const result = await evaluateGate('G21', contextWithProofs);
      expect(result?.evidence.towerCoSign).toBe(true);
    });

    it('should detect zero replay rate', async () => {
      const result = await evaluateGate('G15', contextWithProofs);
      expect(result?.kpis.replayRate).toBe(0);
    });
  });

  describe('Score Computation', () => {
    it('should compute governance score', async () => {
      const score = await computeGovernanceScore();

      expect(score.version).toBe('v2.0');
      expect(score.generatedAt).toBeDefined();
      expect(score.overallScore).toBeGreaterThanOrEqual(0);
      expect(score.overallScore).toBeLessThanOrEqual(100);
      expect(score.weightedScore).toBeGreaterThanOrEqual(0);
      expect(score.weightedScore).toBeLessThanOrEqual(100);
    });

    it('should include summary statistics', async () => {
      const score = await computeGovernanceScore();

      expect(score.summary.totalGates).toBe(9);
      expect(score.summary.passed).toBeGreaterThanOrEqual(0);
      expect(score.summary.partial).toBeGreaterThanOrEqual(0);
      expect(score.summary.pending).toBeGreaterThanOrEqual(0);
      expect(score.summary.failed).toBeGreaterThanOrEqual(0);

      const total = score.summary.passed + score.summary.partial +
                    score.summary.pending + score.summary.failed;
      expect(total).toBe(9);
    });

    it('should include all gate results', async () => {
      const score = await computeGovernanceScore();

      expect(Object.keys(score.gates)).toHaveLength(9);
      for (const gateId of ['G13', 'G14', 'G15', 'G16', 'G17', 'G18', 'G19', 'G20', 'G21']) {
        expect(score.gates[gateId as GateId]).toBeDefined();
      }
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const health = await getGovernanceHealth();

      expect(typeof health.healthy).toBe('boolean');
      expect(health.score).toBeGreaterThanOrEqual(0);
      expect(health.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(health.criticalGates)).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    it('should return correct status colors', () => {
      expect(getStatusColor('pass')).toBe('green');
      expect(getStatusColor('partial')).toBe('yellow');
      expect(getStatusColor('pending')).toBe('blue');
      expect(getStatusColor('fail')).toBe('red');
    });

    it('should format scores correctly', () => {
      expect(formatScore(95)).toContain('Excellent');
      expect(formatScore(75)).toContain('Good');
      expect(formatScore(55)).toContain('Fair');
      expect(formatScore(35)).toContain('Needs Improvement');
    });
  });
});
