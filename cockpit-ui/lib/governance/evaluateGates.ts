/**
 * Gate Evaluation Engine
 *
 * Evaluates all governance gates and returns individual results.
 * Provides context loading and parallel evaluation.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { ALL_RULES } from './rules';
import type {
  GateEvaluationContext,
  GateResult,
  GateId,
  KeyRotationProof,
  TowerReceiptProof,
  NonceStats,
  AlertMetrics,
} from './types';

/**
 * Safely read JSON proof file
 */
async function safeReadProof<T>(path: string): Promise<T | null> {
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Build evaluation context from proof files
 */
export async function buildEvaluationContext(proofDir: string): Promise<GateEvaluationContext> {
  const [keyRotationProof, towerReceiptProof] = await Promise.all([
    safeReadProof<KeyRotationProof>(join(proofDir, 'security_key_rotation_v1.json')),
    safeReadProof<TowerReceiptProof>(join(proofDir, 'tower_receipt_v1.json')),
  ]);

  // Try to load nonce stats if available
  let nonceStats: NonceStats | undefined = undefined;
  try {
    const nonceStatsPath = join(proofDir, 'nonce_stats_v1.json');
    const loaded = await safeReadProof<NonceStats>(nonceStatsPath);
    if (loaded) nonceStats = loaded;
  } catch {
    // Nonce stats are optional
  }

  // Try to load alert metrics if available
  let alertMetrics: AlertMetrics | undefined = undefined;
  try {
    const alertMetricsPath = join(proofDir, 'alert_metrics_v1.json');
    const loaded = await safeReadProof<AlertMetrics>(alertMetricsPath);
    if (loaded) alertMetrics = loaded;
  } catch {
    // Alert metrics are optional
  }

  return {
    proofDir,
    keyRotationProof,
    towerReceiptProof,
    nonceStats,
    alertMetrics,
  };
}

/**
 * Evaluate a single gate
 */
export async function evaluateGate(
  gateId: GateId,
  context: GateEvaluationContext
): Promise<GateResult | null> {
  const rule = ALL_RULES.find((r) => r.id === gateId);
  if (!rule) {
    return null;
  }

  return rule.evaluate(context);
}

/**
 * Evaluate all gates in parallel
 */
export async function evaluateAllGates(
  context: GateEvaluationContext
): Promise<Record<GateId, GateResult>> {
  const results = await Promise.all(
    ALL_RULES.map(async (rule) => {
      const result = await rule.evaluate(context);
      return { id: rule.id, result };
    })
  );

  return results.reduce(
    (acc, { id, result }) => {
      acc[id] = result;
      return acc;
    },
    {} as Record<GateId, GateResult>
  );
}

/**
 * Evaluate gates with custom rule set
 */
export async function evaluateGatesWithRules(
  context: GateEvaluationContext,
  ruleIds: GateId[]
): Promise<Record<GateId, GateResult>> {
  const rulesToEvaluate = ALL_RULES.filter((r) => ruleIds.includes(r.id));

  const results = await Promise.all(
    rulesToEvaluate.map(async (rule) => {
      const result = await rule.evaluate(context);
      return { id: rule.id, result };
    })
  );

  return results.reduce(
    (acc, { id, result }) => {
      acc[id] = result;
      return acc;
    },
    {} as Record<GateId, GateResult>
  );
}
