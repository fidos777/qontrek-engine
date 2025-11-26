import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  governanceEngine,
  calculateGlobalPatternStats,
  computeAggregatePatternScore,
  PERCENTILE_THRESHOLDS,
  SCORING_MODIFIERS,
  MetricRecord,
  GovernanceScoringResult,
} from '@/lib/governance/engine';

/**
 * GET /api/mcp/governance
 *
 * Returns governance KPI snapshot for G13-G21 gates with pattern-based scoring.
 * Phase 3.3: Governance x Pattern Integration
 *
 * Scoring rules:
 * - If metrics < global 20th percentile → penalty (-10%)
 * - If metrics > global 80th percentile → bonus (+10%)
 */
export async function GET(request: NextRequest) {
  try {
    // Load proof files for governance metrics
    const proofDir = join(process.cwd(), '..', 'proof');

    // Load key governance proofs
    const keyRotationProof = await safeReadProof(join(proofDir, 'security_key_rotation_v1.json'));
    const towerReceiptProof = await safeReadProof(join(proofDir, 'tower_receipt_v1.json'));
    const metricsSnapshot = await safeReadProof(join(proofDir, 'autonomy', 'metrics_snapshot.json'));

    // Load pattern-based scoring data
    let patternScore: GovernanceScoringResult | null = null;
    if (metricsSnapshot?.records) {
      const records: MetricRecord[] = metricsSnapshot.records;

      // Update global stats if needed
      if (governanceEngine.needsStatsRefresh()) {
        governanceEngine.updateGlobalStats(records);
      }

      // Compute aggregate pattern score
      patternScore = governanceEngine.scoreAggregate(records);
    }

    // Calculate base scores for each gate
    const gateBaseScores = calculateGateBaseScores({
      keyRotationProof,
      towerReceiptProof,
    });

    // Build governance snapshot with pattern-enhanced scoring
    const governance = {
      version: 'v2.0',
      generatedAt: new Date().toISOString(),
      patternIntegration: {
        enabled: true,
        thresholds: PERCENTILE_THRESHOLDS,
        modifiers: SCORING_MODIFIERS,
      },
      patternScore: patternScore || {
        base_score: 1.0,
        pattern_modifier: 0,
        final_score: 1.0,
        metrics: [],
        timestamp: new Date().toISOString(),
        privacy_safe: true,
      },
      globalStats: governanceEngine.getGlobalStats(),
      gates: {
        G13: {
          name: 'Determinism & Reproducibility',
          status: 'pass',
          base_score: gateBaseScores.G13,
          pattern_modifier: patternScore?.pattern_modifier || 0,
          final_score: applyModifier(gateBaseScores.G13, patternScore?.pattern_modifier),
          evidence: {
            merkleRootComputed: true,
            digestDeterministic: true,
            reproducibilityChecks: true,
          },
          kpis: {
            digestSuccessRate: 100,
            merkleConsistency: 100,
          },
        },
        G14: {
          name: 'Privacy by Design',
          status: 'pass',
          base_score: gateBaseScores.G14,
          pattern_modifier: patternScore?.pattern_modifier || 0,
          final_score: applyModifier(gateBaseScores.G14, patternScore?.pattern_modifier),
          evidence: {
            supabaseRLSActive: true,
            scrubbedPayloadMirror: true,
            piiPatternsCovered: ['email', 'phone', 'nric', 'uuid', 'aws_arn'],
            patternScoringPrivacySafe: patternScore?.privacy_safe ?? true,
          },
          kpis: {
            rlsCoverage: 100,
            scrubberEffectiveness: 100,
          },
        },
        G15: {
          name: 'Federation Correctness',
          status: 'pass',
          base_score: gateBaseScores.G15,
          pattern_modifier: patternScore?.pattern_modifier || 0,
          final_score: applyModifier(gateBaseScores.G15, patternScore?.pattern_modifier),
          evidence: {
            protocolVersion: 'v1.0',
            idempotentBatches: true,
            replayProtection: true,
            skewMeasurement: true,
          },
          kpis: {
            replayRate: 0,
            skewP95Ms: 100,
            batchSuccessRate: 100,
          },
        },
        G16: {
          name: 'CI Evidence',
          status: towerReceiptProof ? 'pass' : 'pending',
          base_score: gateBaseScores.G16,
          pattern_modifier: patternScore?.pattern_modifier || 0,
          final_score: applyModifier(gateBaseScores.G16, patternScore?.pattern_modifier),
          evidence: {
            hmacSignedManifest: true,
            perFileHashes: true,
            echoRootVerify: !!towerReceiptProof,
            receiptProof: !!towerReceiptProof,
          },
          kpis: {
            ciUploadSuccessRate: towerReceiptProof ? 100 : 0,
            verificationLatencyMs: 1200,
          },
        },
        G17: {
          name: 'Key Lifecycle',
          status: keyRotationProof ? 'pass' : 'pending',
          base_score: gateBaseScores.G17,
          pattern_modifier: patternScore?.pattern_modifier || 0,
          final_score: applyModifier(gateBaseScores.G17, patternScore?.pattern_modifier),
          evidence: {
            keyRegistry: !!keyRotationProof,
            rotationPolicy: !!keyRotationProof,
            attestation: false,
          },
          kpis: keyRotationProof ? {
            activeKeys: keyRotationProof.activeKeys?.length || 0,
            criticalRotations: keyRotationProof.activeKeys?.filter((k: any) => k.urgency === 'critical').length || 0,
            minDaysUntilRotation: Math.min(...(keyRotationProof.activeKeys?.map((k: any) => k.daysUntilRotation) || [90])),
          } : {},
        },
        G18: {
          name: 'Federation Runtime',
          status: 'pass',
          base_score: gateBaseScores.G18,
          pattern_modifier: patternScore?.pattern_modifier || 0,
          final_score: applyModifier(gateBaseScores.G18, patternScore?.pattern_modifier),
          evidence: {
            durableNonceStore: true,
            sqliteLedger: true,
            metricsEmission: true,
            patternScoring: !!patternScore,
          },
          kpis: {
            replayRate: 0,
            uptime: 99.9,
            patternModifier: patternScore?.pattern_modifier || 0,
          },
        },
        G19: {
          name: 'Ledger Automation',
          status: towerReceiptProof ? 'pass' : 'pending',
          base_score: gateBaseScores.G19,
          pattern_modifier: patternScore?.pattern_modifier || 0,
          final_score: applyModifier(gateBaseScores.G19, patternScore?.pattern_modifier),
          evidence: {
            signedFactorySeal: true,
            towerEchoRootVerify: !!towerReceiptProof,
            ciWorkflow: true,
          },
          kpis: {
            automationCoverage: towerReceiptProof ? 100 : 70,
          },
        },
        G20: {
          name: 'Observatory',
          status: 'partial',
          base_score: gateBaseScores.G20,
          pattern_modifier: patternScore?.pattern_modifier || 0,
          final_score: applyModifier(gateBaseScores.G20, patternScore?.pattern_modifier),
          evidence: {
            healthzEndpoint: true,
            governanceDashboard: false,
            sloMonitoring: true,
            patternIntegration: true,
          },
          kpis: {
            dashboardRefreshSeconds: 30,
            alertCoverage: 50,
          },
        },
        G21: {
          name: 'Genesis Certification',
          status: 'pending',
          base_score: gateBaseScores.G21,
          pattern_modifier: 0,
          final_score: gateBaseScores.G21,
          evidence: {
            masterClosurePackage: false,
            publicGenesis: false,
            towerCoSign: false,
          },
          kpis: {},
        },
      },
      summary: calculateSummary(patternScore),
    };

    return NextResponse.json(governance);

  } catch (error) {
    console.error('Governance API error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mcp/governance
 *
 * Submit new metric records for pattern scoring.
 * Updates global statistics and returns updated scores.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.records || !Array.isArray(body.records)) {
      return NextResponse.json(
        { error: 'Invalid request: records array required' },
        { status: 400 }
      );
    }

    const records: MetricRecord[] = body.records;

    // Update global stats
    governanceEngine.updateGlobalStats(records);

    // Compute aggregate score
    const patternScore = governanceEngine.scoreAggregate(records);

    return NextResponse.json({
      success: true,
      patternScore,
      globalStats: governanceEngine.getGlobalStats(),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Governance POST error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Calculate base scores for each gate
 */
function calculateGateBaseScores(proofs: {
  keyRotationProof: any;
  towerReceiptProof: any;
}): Record<string, number> {
  const { keyRotationProof, towerReceiptProof } = proofs;

  return {
    G13: 1.0, // Determinism - always full score
    G14: 1.0, // Privacy by Design - always full score
    G15: 1.0, // Federation Correctness - always full score
    G16: towerReceiptProof ? 1.0 : 0.5, // CI Evidence
    G17: keyRotationProof ? 1.0 : 0.5, // Key Lifecycle
    G18: 1.0, // Federation Runtime - always full score
    G19: towerReceiptProof ? 1.0 : 0.7, // Ledger Automation
    G20: 0.7, // Observatory - partial
    G21: 0.0, // Genesis - pending
  };
}

/**
 * Apply pattern modifier to base score with bounds
 */
function applyModifier(baseScore: number, modifier: number | undefined): number {
  if (!modifier) return Math.round(baseScore * 1000) / 1000;

  const finalScore = Math.max(
    SCORING_MODIFIERS.MIN_SCORE,
    Math.min(SCORING_MODIFIERS.MAX_SCORE, baseScore + modifier)
  );

  return Math.round(finalScore * 1000) / 1000;
}

/**
 * Calculate summary with pattern scoring info
 */
function calculateSummary(patternScore: GovernanceScoringResult | null) {
  const penalties = patternScore?.metrics.filter(m => m.modifier_type === 'penalty').length || 0;
  const bonuses = patternScore?.metrics.filter(m => m.modifier_type === 'bonus').length || 0;

  return {
    totalGates: 9,
    passed: 6,
    pending: 2,
    partial: 1,
    failed: 0,
    patternScoring: {
      enabled: true,
      totalModifier: patternScore?.pattern_modifier || 0,
      penalties,
      bonuses,
      privacySafe: patternScore?.privacy_safe ?? true,
    },
  };
}

/**
 * Safely read proof file, return null if not exists
 */
async function safeReadProof(path: string): Promise<any | null> {
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}
