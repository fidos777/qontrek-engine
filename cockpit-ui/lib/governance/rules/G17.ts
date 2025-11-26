/**
 * G17: Key Lifecycle
 *
 * Validates key management including rotation policy enforcement,
 * key registry maintenance, and attestation readiness.
 */

import type { GateRule, GateEvaluationContext, GateResult } from '../types';

export const G17Rule: GateRule = {
  id: 'G17',
  name: 'Key Lifecycle',
  description: 'Ensures proper key rotation, registry management, and lifecycle compliance',
  weight: 0.12,

  async evaluate(context: GateEvaluationContext): Promise<GateResult> {
    const evidence: Record<string, boolean | string | number> = {
      keyRegistry: false,
      rotationPolicy: false,
      attestation: false,
      criticalRotations: 0,
    };

    let score = 0;
    const kpis: Record<string, number> = {
      activeKeys: 0,
      criticalRotations: 0,
      minDaysUntilRotation: 90,
    };

    if (context.keyRotationProof) {
      // Key registry check
      evidence.keyRegistry = true;
      score += 30;

      // Rotation policy check
      if (context.keyRotationProof.rotationPolicy) {
        evidence.rotationPolicy = true;
        evidence.maxAgeDays = context.keyRotationProof.rotationPolicy.maxAgeDays;
        evidence.warningDays = context.keyRotationProof.rotationPolicy.warningDays;
        score += 25;
      }

      // Active keys analysis
      if (context.keyRotationProof.activeKeys?.length > 0) {
        kpis.activeKeys = context.keyRotationProof.activeKeys.length;

        // Check for critical rotations
        const criticalKeys = context.keyRotationProof.activeKeys.filter(
          (k) => k.urgency === 'critical' || k.urgency === 'overdue'
        );
        kpis.criticalRotations = criticalKeys.length;
        evidence.criticalRotations = criticalKeys.length;

        // Calculate minimum days until rotation
        const daysArray = context.keyRotationProof.activeKeys.map((k) => k.daysUntilRotation);
        kpis.minDaysUntilRotation = Math.min(...daysArray);

        // Score based on key health
        if (criticalKeys.length === 0) {
          score += 30;
        } else if (criticalKeys.length <= 1) {
          score += 15;
        } else {
          score += 5;
        }

        // Bonus for well-managed rotation
        if (kpis.minDaysUntilRotation > 14) {
          score += 15;
        } else if (kpis.minDaysUntilRotation > 7) {
          score += 10;
        }
      }

      // Attestation (optional - Sigstore/COSIGN)
      // This is a stretch goal, so we don't penalize for missing it
      evidence.attestation = false;
    }

    let status: 'pass' | 'partial' | 'pending' | 'fail';
    if (score >= 90) {
      status = 'pass';
    } else if (score >= 60) {
      status = 'partial';
    } else if (score >= 30) {
      status = 'pending';
    } else {
      status = 'fail';
    }

    return {
      name: G17Rule.name,
      status,
      score,
      evidence,
      kpis,
      evaluatedAt: new Date().toISOString(),
    };
  },
};

export default G17Rule;
