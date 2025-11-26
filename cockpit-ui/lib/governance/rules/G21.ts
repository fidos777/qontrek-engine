/**
 * G21: Genesis Certification
 *
 * Validates genesis certification requirements including master closure package,
 * public genesis record, and tower co-sign.
 */

import type { GateRule, GateEvaluationContext, GateResult } from '../types';

export const G21Rule: GateRule = {
  id: 'G21',
  name: 'Genesis Certification',
  description: 'Ensures genesis certification with master closure and tower co-sign',
  weight: 0.07,

  async evaluate(context: GateEvaluationContext): Promise<GateResult> {
    const evidence: Record<string, boolean | string | number> = {
      masterClosurePackage: false,
      publicGenesis: false,
      towerCoSign: false,
    };

    let score = 0;
    const kpis: Record<string, number> = {
      certificationProgress: 0,
    };

    // Master closure package check
    // This requires all other gates to pass first
    const hasKeyProof = !!context.keyRotationProof;
    const hasTowerProof = !!context.towerReceiptProof;

    if (hasKeyProof && hasTowerProof) {
      evidence.masterClosurePackage = true;
      score += 40;
    } else if (hasKeyProof || hasTowerProof) {
      score += 20;
    }

    // Public genesis check
    // This would require a published genesis record
    if (context.towerReceiptProof?.status === 'verified') {
      evidence.publicGenesis = true;
      score += 30;
    }

    // Tower co-sign check
    if (
      context.towerReceiptProof?.signatures?.towerSignature &&
      context.towerReceiptProof?.signatures?.factorySignature
    ) {
      evidence.towerCoSign = true;
      score += 30;
    }

    // Calculate certification progress
    const certifiedFeatures = [
      evidence.masterClosurePackage,
      evidence.publicGenesis,
      evidence.towerCoSign,
    ].filter(Boolean).length;
    kpis.certificationProgress = Math.round((certifiedFeatures / 3) * 100);

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
      name: G21Rule.name,
      status,
      score,
      evidence,
      kpis,
      evaluatedAt: new Date().toISOString(),
    };
  },
};

export default G21Rule;
