/**
 * Governance Engine Types
 *
 * Type definitions for the adaptive governance scoring engine.
 * Supports G13-G21 gates with configurable rules and evidence.
 */

export type GateStatus = 'pass' | 'partial' | 'pending' | 'fail';

export type GateId = 'G13' | 'G14' | 'G15' | 'G16' | 'G17' | 'G18' | 'G19' | 'G20' | 'G21';

export interface GateEvidence {
  [key: string]: boolean | string | number | string[];
}

export interface GateKPIs {
  [key: string]: number;
}

export interface GateEvaluationContext {
  proofDir: string;
  keyRotationProof: KeyRotationProof | null;
  towerReceiptProof: TowerReceiptProof | null;
  nonceStats?: NonceStats;
  alertMetrics?: AlertMetrics;
}

export interface KeyRotationProof {
  schema: string;
  version: string;
  generatedAt: string;
  rotationPolicy: {
    maxAgeDays: number;
    warningDays: number;
    gracePeriodDays: number;
  };
  activeKeys: Array<{
    kid: string;
    scope: string;
    algorithm: string;
    createdAt: string;
    rotatesAt: string;
    daysUntilRotation: number;
    urgency: 'ok' | 'warning' | 'critical' | 'overdue';
  }>;
  retiredKeys: Array<{
    kid: string;
    scope: string;
    retiredAt?: string;
  }>;
}

export interface TowerReceiptProof {
  receiptId: string;
  manifestHash: string;
  echoRoot: string;
  uploadedAt: string;
  verifiedAt?: string;
  status: 'pending' | 'received' | 'verified' | 'rejected';
  manifest: {
    version: string;
    files: Array<{ path: string; sha256: string }>;
    merkleRoot: string;
  };
  signatures: {
    factorySignature: string;
    towerSignature?: string;
    towerKid?: string;
  };
}

export interface NonceStats {
  activeNonces: number;
  expiredNonces: number;
  byContext: Record<string, number>;
  replayRate: number;
}

export interface AlertMetrics {
  activeAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  alertCoverage: number;
}

export interface GateResult {
  name: string;
  status: GateStatus;
  score: number; // 0-100
  evidence: GateEvidence;
  kpis: GateKPIs;
  evaluatedAt: string;
}

export interface GateRule {
  id: GateId;
  name: string;
  description: string;
  weight: number; // 0-1, contribution to overall score
  evaluate: (context: GateEvaluationContext) => Promise<GateResult>;
}

export interface GovernanceScore {
  overallScore: number; // 0-100
  weightedScore: number; // 0-100
  gates: Record<GateId, GateResult>;
  summary: {
    totalGates: number;
    passed: number;
    partial: number;
    pending: number;
    failed: number;
  };
  version: string;
  generatedAt: string;
}

export interface GovernanceScoreRecord {
  tenant_id: string;
  gate_id: GateId;
  score: number;
  status: GateStatus;
  evidence: GateEvidence;
  kpis: GateKPIs;
  updated_at: string;
}
