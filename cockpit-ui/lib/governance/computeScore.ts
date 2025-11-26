/**
 * Governance Score Computation
 *
 * Computes overall governance score from individual gate results.
 * Supports weighted scoring and adaptive thresholds.
 */

import { join } from 'path';
import { buildEvaluationContext, evaluateAllGates } from './evaluateGates';
import { ALL_RULES, getTotalWeight } from './rules';
import type { GateId, GateResult, GovernanceScore, GateStatus } from './types';

/**
 * Compute summary statistics from gate results
 */
function computeSummary(gates: Record<GateId, GateResult>): GovernanceScore['summary'] {
  const gateValues = Object.values(gates);

  return {
    totalGates: gateValues.length,
    passed: gateValues.filter((g) => g.status === 'pass').length,
    partial: gateValues.filter((g) => g.status === 'partial').length,
    pending: gateValues.filter((g) => g.status === 'pending').length,
    failed: gateValues.filter((g) => g.status === 'fail').length,
  };
}

/**
 * Compute weighted score from gate results
 */
function computeWeightedScore(gates: Record<GateId, GateResult>): number {
  const totalWeight = getTotalWeight();

  let weightedSum = 0;
  for (const rule of ALL_RULES) {
    const gate = gates[rule.id];
    if (gate) {
      weightedSum += gate.score * rule.weight;
    }
  }

  // Normalize to ensure weights sum to 1.0
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

/**
 * Compute simple average score
 */
function computeAverageScore(gates: Record<GateId, GateResult>): number {
  const gateValues = Object.values(gates);
  if (gateValues.length === 0) return 0;

  const sum = gateValues.reduce((acc, gate) => acc + gate.score, 0);
  return Math.round((sum / gateValues.length) * 100) / 100;
}

/**
 * Main function to compute full governance score
 */
export async function computeGovernanceScore(proofDir?: string): Promise<GovernanceScore> {
  // Default to ../proof relative to cockpit-ui
  const effectiveProofDir = proofDir || join(process.cwd(), '..', 'proof');

  // Build context and evaluate all gates
  const context = await buildEvaluationContext(effectiveProofDir);
  const gates = await evaluateAllGates(context);

  // Compute scores
  const overallScore = computeAverageScore(gates);
  const weightedScore = computeWeightedScore(gates);
  const summary = computeSummary(gates);

  return {
    overallScore,
    weightedScore,
    gates,
    summary,
    version: 'v2.0',
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Compute score for specific tenant
 * (Useful for multi-tenant deployments)
 */
export async function computeTenantGovernanceScore(
  tenantId: string,
  proofDir?: string
): Promise<GovernanceScore & { tenantId: string }> {
  const score = await computeGovernanceScore(proofDir);
  return {
    ...score,
    tenantId,
  };
}

/**
 * Quick health check - returns simplified score
 */
export async function getGovernanceHealth(proofDir?: string): Promise<{
  healthy: boolean;
  score: number;
  criticalGates: GateId[];
}> {
  const score = await computeGovernanceScore(proofDir);

  // Gates that must pass for healthy status
  const criticalGateIds: GateId[] = ['G13', 'G14', 'G17'];
  const criticalGates: GateId[] = [];

  for (const gateId of criticalGateIds) {
    const gate = score.gates[gateId];
    if (gate && (gate.status === 'fail' || gate.status === 'pending')) {
      criticalGates.push(gateId);
    }
  }

  return {
    healthy: score.overallScore >= 70 && criticalGates.length === 0,
    score: score.overallScore,
    criticalGates,
  };
}

/**
 * Get gate status color for UI
 */
export function getStatusColor(status: GateStatus): string {
  switch (status) {
    case 'pass':
      return 'green';
    case 'partial':
      return 'yellow';
    case 'pending':
      return 'blue';
    case 'fail':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Format score for display
 */
export function formatScore(score: number): string {
  if (score >= 90) return `${score}% (Excellent)`;
  if (score >= 70) return `${score}% (Good)`;
  if (score >= 50) return `${score}% (Fair)`;
  return `${score}% (Needs Improvement)`;
}
