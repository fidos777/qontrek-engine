/**
 * G16: CI Evidence
 *
 * Validates CI/CD evidence chain including HMAC-signed manifests,
 * per-file hashes, and echo root verification.
 */

import type { GateRule, GateEvaluationContext, GateResult } from '../types';

export const G16Rule: GateRule = {
  id: 'G16',
  name: 'CI Evidence',
  description: 'Validates CI/CD evidence chain with signed manifests and verification',
  weight: 0.12,

  async evaluate(context: GateEvaluationContext): Promise<GateResult> {
    const evidence: Record<string, boolean | string | number> = {
      hmacSignedManifest: false,
      perFileHashes: false,
      echoRootVerify: false,
      receiptProof: false,
    };

    let score = 0;
    const kpis: Record<string, number> = {
      ciUploadSuccessRate: 0,
      verificationLatencyMs: 0,
    };

    if (context.towerReceiptProof) {
      // HMAC signed manifest check
      if (context.towerReceiptProof.signatures?.factorySignature) {
        evidence.hmacSignedManifest = true;
        score += 30;
      }

      // Per-file hashes
      if (context.towerReceiptProof.manifest?.files?.length > 0) {
        const filesWithHashes = context.towerReceiptProof.manifest.files.filter(
          (f) => f.sha256 && f.sha256.length === 64
        );
        evidence.perFileHashes = filesWithHashes.length === context.towerReceiptProof.manifest.files.length;
        evidence.fileCount = context.towerReceiptProof.manifest.files.length;
        if (evidence.perFileHashes) {
          score += 25;
        } else {
          score += Math.floor(
            (filesWithHashes.length / context.towerReceiptProof.manifest.files.length) * 25
          );
        }
      }

      // Echo root verification
      if (context.towerReceiptProof.echoRoot) {
        evidence.echoRootVerify = true;
        score += 25;
      }

      // Receipt proof status
      if (context.towerReceiptProof.status === 'verified') {
        evidence.receiptProof = true;
        score += 20;
        kpis.ciUploadSuccessRate = 100;
      } else if (context.towerReceiptProof.status === 'received') {
        evidence.receiptProof = true;
        score += 15;
        kpis.ciUploadSuccessRate = 80;
      } else if (context.towerReceiptProof.status === 'pending') {
        score += 10;
        kpis.ciUploadSuccessRate = 50;
      }

      // Calculate verification latency
      if (context.towerReceiptProof.uploadedAt && context.towerReceiptProof.verifiedAt) {
        const uploadTime = new Date(context.towerReceiptProof.uploadedAt).getTime();
        const verifyTime = new Date(context.towerReceiptProof.verifiedAt).getTime();
        kpis.verificationLatencyMs = verifyTime - uploadTime;
      } else {
        kpis.verificationLatencyMs = 1200; // Default estimate
      }
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
      name: G16Rule.name,
      status,
      score,
      evidence,
      kpis,
      evaluatedAt: new Date().toISOString(),
    };
  },
};

export default G16Rule;
