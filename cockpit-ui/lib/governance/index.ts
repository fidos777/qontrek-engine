/**
 * Governance Engine
 *
 * Adaptive scoring engine for G13-G21 governance gates.
 * Provides scoring, evaluation, and health check capabilities.
 */

// Core exports
export {
  computeGovernanceScore,
  computeTenantGovernanceScore,
  getGovernanceHealth,
  getStatusColor,
  formatScore,
} from './computeScore';

export {
  buildEvaluationContext,
  evaluateGate,
  evaluateAllGates,
  evaluateGatesWithRules,
} from './evaluateGates';

// Rules exports
export { ALL_RULES, getRuleById, getTotalWeight } from './rules';

// Type exports
export type {
  GateStatus,
  GateId,
  GateEvidence,
  GateKPIs,
  GateEvaluationContext,
  GateResult,
  GateRule,
  GovernanceScore,
  GovernanceScoreRecord,
  KeyRotationProof,
  TowerReceiptProof,
  NonceStats,
  AlertMetrics,
} from './types';
