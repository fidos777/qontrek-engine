import { describe, it, expect } from 'vitest';
import type { GateEvaluationContext } from '@/lib/governance/types';

import { G13Rule } from '@/lib/governance/rules/G13';
import { G14Rule } from '@/lib/governance/rules/G14';
import { G15Rule } from '@/lib/governance/rules/G15';
import { G16Rule } from '@/lib/governance/rules/G16';
import { G17Rule } from '@/lib/governance/rules/G17';
import { G18Rule } from '@/lib/governance/rules/G18';
import { G19Rule } from '@/lib/governance/rules/G19';
import { G20Rule } from '@/lib/governance/rules/G20';
import { G21Rule } from '@/lib/governance/rules/G21';

describe('Governance Rules', () => {
  const emptyContext: GateEvaluationContext = {
    proofDir: '/mock/proof',
    keyRotationProof: null,
    towerReceiptProof: null,
  };

  describe('G13: Determinism & Reproducibility', () => {
    it('should have correct metadata', () => {
      expect(G13Rule.id).toBe('G13');
      expect(G13Rule.name).toBe('Determinism & Reproducibility');
      expect(G13Rule.weight).toBe(0.12);
    });

    it('should evaluate without proofs', async () => {
      const result = await G13Rule.evaluate(emptyContext);
      expect(result.status).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('G14: Privacy by Design', () => {
    it('should have correct metadata', () => {
      expect(G14Rule.id).toBe('G14');
      expect(G14Rule.name).toBe('Privacy by Design');
      expect(G14Rule.weight).toBe(0.15);
    });

    it('should always pass RLS check', async () => {
      const result = await G14Rule.evaluate(emptyContext);
      expect(result.evidence.supabaseRLSActive).toBe(true);
    });

    it('should track PII patterns', async () => {
      const result = await G14Rule.evaluate(emptyContext);
      expect(Array.isArray(result.evidence.piiPatternsCovered)).toBe(true);
      expect((result.evidence.piiPatternsCovered as string[]).length).toBeGreaterThan(5);
    });
  });

  describe('G15: Federation Correctness', () => {
    it('should have correct metadata', () => {
      expect(G15Rule.id).toBe('G15');
      expect(G15Rule.name).toBe('Federation Correctness');
      expect(G15Rule.weight).toBe(0.12);
    });

    it('should track replay protection', async () => {
      const contextWithNonce: GateEvaluationContext = {
        ...emptyContext,
        nonceStats: {
          activeNonces: 50,
          expiredNonces: 10,
          byContext: {},
          replayRate: 0,
        },
      };
      const result = await G15Rule.evaluate(contextWithNonce);
      expect(result.evidence.replayProtection).toBe(true);
      expect(result.kpis.replayRate).toBe(0);
    });
  });

  describe('G16: CI Evidence', () => {
    it('should have correct metadata', () => {
      expect(G16Rule.id).toBe('G16');
      expect(G16Rule.name).toBe('CI Evidence');
      expect(G16Rule.weight).toBe(0.12);
    });

    it('should detect HMAC signed manifest', async () => {
      const contextWithReceipt: GateEvaluationContext = {
        ...emptyContext,
        towerReceiptProof: {
          receiptId: 'test-123',
          manifestHash: 'hash',
          echoRoot: 'root',
          uploadedAt: new Date().toISOString(),
          status: 'verified',
          manifest: {
            version: 'v1.0',
            files: [{ path: 'file.ts', sha256: 'a'.repeat(64) }],
            merkleRoot: 'merkle',
          },
          signatures: {
            factorySignature: 'factory-sig',
            towerSignature: 'tower-sig',
          },
        },
      };
      const result = await G16Rule.evaluate(contextWithReceipt);
      expect(result.evidence.hmacSignedManifest).toBe(true);
    });
  });

  describe('G17: Key Lifecycle', () => {
    it('should have correct metadata', () => {
      expect(G17Rule.id).toBe('G17');
      expect(G17Rule.name).toBe('Key Lifecycle');
      expect(G17Rule.weight).toBe(0.12);
    });

    it('should detect key registry presence', async () => {
      const contextWithKeys: GateEvaluationContext = {
        ...emptyContext,
        keyRotationProof: {
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
        },
      };
      const result = await G17Rule.evaluate(contextWithKeys);
      expect(result.evidence.keyRegistry).toBe(true);
      expect(result.evidence.rotationPolicy).toBe(true);
    });
  });

  describe('G18: Federation Runtime', () => {
    it('should have correct metadata', () => {
      expect(G18Rule.id).toBe('G18');
      expect(G18Rule.name).toBe('Federation Runtime');
      expect(G18Rule.weight).toBe(0.10);
    });

    it('should always have SQLite ledger', async () => {
      const result = await G18Rule.evaluate(emptyContext);
      expect(result.evidence.sqliteLedger).toBe(true);
    });
  });

  describe('G19: Ledger Automation', () => {
    it('should have correct metadata', () => {
      expect(G19Rule.id).toBe('G19');
      expect(G19Rule.name).toBe('Ledger Automation');
      expect(G19Rule.weight).toBe(0.10);
    });

    it('should assume CI workflow is configured', async () => {
      const result = await G19Rule.evaluate(emptyContext);
      expect(result.evidence.ciWorkflow).toBe(true);
    });
  });

  describe('G20: Observatory', () => {
    it('should have correct metadata', () => {
      expect(G20Rule.id).toBe('G20');
      expect(G20Rule.name).toBe('Observatory');
      expect(G20Rule.weight).toBe(0.10);
    });

    it('should detect health endpoints', async () => {
      const result = await G20Rule.evaluate(emptyContext);
      expect(result.evidence.healthzEndpoint).toBe(true);
      expect(result.evidence.governanceDashboard).toBe(true);
      expect(result.evidence.sloMonitoring).toBe(true);
    });
  });

  describe('G21: Genesis Certification', () => {
    it('should have correct metadata', () => {
      expect(G21Rule.id).toBe('G21');
      expect(G21Rule.name).toBe('Genesis Certification');
      expect(G21Rule.weight).toBe(0.07);
    });

    it('should start with pending status without proofs', async () => {
      const result = await G21Rule.evaluate(emptyContext);
      expect(['pending', 'fail']).toContain(result.status);
    });

    it('should detect tower co-sign', async () => {
      const contextWithFullProofs: GateEvaluationContext = {
        ...emptyContext,
        keyRotationProof: {
          schema: 'test',
          version: 'v1.0',
          generatedAt: new Date().toISOString(),
          rotationPolicy: { maxAgeDays: 90, warningDays: 14, gracePeriodDays: 7 },
          activeKeys: [],
          retiredKeys: [],
        },
        towerReceiptProof: {
          receiptId: 'test',
          manifestHash: 'hash',
          echoRoot: 'root',
          uploadedAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString(),
          status: 'verified',
          manifest: {
            version: 'v1.0',
            files: [],
            merkleRoot: 'merkle',
          },
          signatures: {
            factorySignature: 'factory-sig',
            towerSignature: 'tower-sig',
          },
        },
      };
      const result = await G21Rule.evaluate(contextWithFullProofs);
      expect(result.evidence.towerCoSign).toBe(true);
    });
  });
});
