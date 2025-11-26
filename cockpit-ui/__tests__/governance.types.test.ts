import { describe, it, expect } from 'vitest';
import type {
  GateStatus,
  GateId,
  GateEvidence,
  GateKPIs,
  GateResult,
  GateRule,
  GovernanceScore,
  GovernanceScoreRecord,
  GateEvaluationContext,
  KeyRotationProof,
  TowerReceiptProof,
} from '@/lib/governance/types';

describe('Governance Types', () => {
  describe('GateStatus', () => {
    it('should accept valid status values', () => {
      const validStatuses: GateStatus[] = ['pass', 'partial', 'pending', 'fail'];
      expect(validStatuses).toHaveLength(4);
    });
  });

  describe('GateId', () => {
    it('should accept valid gate IDs', () => {
      const validIds: GateId[] = [
        'G13', 'G14', 'G15', 'G16', 'G17', 'G18', 'G19', 'G20', 'G21',
      ];
      expect(validIds).toHaveLength(9);
    });
  });

  describe('GateResult', () => {
    it('should have correct structure', () => {
      const result: GateResult = {
        name: 'Test Gate',
        status: 'pass',
        score: 85,
        evidence: { testEvidence: true },
        kpis: { testKpi: 100 },
        evaluatedAt: new Date().toISOString(),
      };

      expect(result.name).toBe('Test Gate');
      expect(result.status).toBe('pass');
      expect(result.score).toBe(85);
      expect(result.evidence.testEvidence).toBe(true);
      expect(result.kpis.testKpi).toBe(100);
      expect(new Date(result.evaluatedAt).getTime()).not.toBeNaN();
    });
  });

  describe('GovernanceScore', () => {
    it('should have correct structure', () => {
      const score: GovernanceScore = {
        overallScore: 75,
        weightedScore: 78,
        gates: {
          G13: {
            name: 'Test',
            status: 'pass',
            score: 100,
            evidence: {},
            kpis: {},
            evaluatedAt: new Date().toISOString(),
          },
        } as Record<GateId, GateResult>,
        summary: {
          totalGates: 9,
          passed: 6,
          partial: 2,
          pending: 1,
          failed: 0,
        },
        version: 'v2.0',
        generatedAt: new Date().toISOString(),
      };

      expect(score.overallScore).toBe(75);
      expect(score.weightedScore).toBe(78);
      expect(score.summary.totalGates).toBe(9);
      expect(score.version).toBe('v2.0');
    });
  });

  describe('GovernanceScoreRecord', () => {
    it('should have correct structure for database', () => {
      const record: GovernanceScoreRecord = {
        tenant_id: 'tenant-123',
        gate_id: 'G13',
        score: 85,
        status: 'pass',
        evidence: { test: true },
        kpis: { metric: 100 },
        updated_at: new Date().toISOString(),
      };

      expect(record.tenant_id).toBe('tenant-123');
      expect(record.gate_id).toBe('G13');
      expect(record.score).toBe(85);
      expect(record.status).toBe('pass');
    });
  });

  describe('KeyRotationProof', () => {
    it('should have correct structure', () => {
      const proof: KeyRotationProof = {
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
            rotatesAt: new Date().toISOString(),
            daysUntilRotation: 30,
            urgency: 'ok',
          },
        ],
        retiredKeys: [],
      };

      expect(proof.schema).toBe('security_key_rotation_v1');
      expect(proof.rotationPolicy.maxAgeDays).toBe(90);
      expect(proof.activeKeys).toHaveLength(1);
    });
  });

  describe('TowerReceiptProof', () => {
    it('should have correct structure', () => {
      const proof: TowerReceiptProof = {
        receiptId: 'receipt-123',
        manifestHash: 'hash-abc',
        echoRoot: 'root-xyz',
        uploadedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        status: 'verified',
        manifest: {
          version: 'v1.0',
          files: [
            { path: 'file.ts', sha256: 'a'.repeat(64) },
          ],
          merkleRoot: 'merkle-root',
        },
        signatures: {
          factorySignature: 'factory-sig',
          towerSignature: 'tower-sig',
          towerKid: 'tower-key-1',
        },
      };

      expect(proof.receiptId).toBe('receipt-123');
      expect(proof.status).toBe('verified');
      expect(proof.manifest.files).toHaveLength(1);
      expect(proof.signatures.factorySignature).toBeDefined();
      expect(proof.signatures.towerSignature).toBeDefined();
    });
  });

  describe('GateEvaluationContext', () => {
    it('should allow optional fields', () => {
      const context: GateEvaluationContext = {
        proofDir: '/path/to/proof',
        keyRotationProof: null,
        towerReceiptProof: null,
      };

      expect(context.proofDir).toBe('/path/to/proof');
      expect(context.keyRotationProof).toBeNull();
      expect(context.nonceStats).toBeUndefined();
      expect(context.alertMetrics).toBeUndefined();
    });
  });
});
