/**
 * Cross-Tenant Pattern Aggregator
 *
 * Implements meta-learning pattern aggregation across tenants.
 * CRITICAL: All data must be anonymized before aggregation.
 * No tenant-sensitive information (PII, brand identifiers, customer data) is stored.
 */

import { scrubPII } from '@/lib/security/scrubber';

/**
 * Pattern key format: category.metric
 * Examples: conversion.funnel_drop_rate, engagement.response_time_p95
 */
export const PATTERN_KEY_REGEX = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/**
 * Valid gate identifiers
 */
export const VALID_GATES = [
  'G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10',
  'G11', 'G12', 'G13', 'G14', 'G15', 'G16', 'G17', 'G18', 'G19', 'G20', 'G21',
] as const;

export type GateId = typeof VALID_GATES[number];

/**
 * Minimum sample count required for pattern to be considered valid
 * This threshold ensures k-anonymity (patterns cannot be traced to individual tenants)
 */
export const MIN_SAMPLE_COUNT = 5;

/**
 * Pattern aggregate stored in database
 */
export interface PatternAggregate {
  id?: number;
  pattern_key: string;
  pattern_value: PatternValue;
  source_gate: GateId;
  sample_count: number;
  confidence_score: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Anonymized pattern value structure
 */
export interface PatternValue {
  /** Statistical aggregates - never raw values */
  aggregates: {
    count?: number;
    sum?: number;
    mean?: number;
    median?: number;
    stdDev?: number;
    min?: number;
    max?: number;
    p50?: number;
    p75?: number;
    p90?: number;
    p95?: number;
    p99?: number;
  };
  /** Distribution buckets for histograms */
  distribution?: {
    buckets: Array<{ min: number; max: number; count: number }>;
  };
  /** Categorical frequency (anonymized labels only) */
  categories?: Record<string, number>;
  /** Trend indicators */
  trend?: {
    direction: 'up' | 'down' | 'stable';
    changePercent: number;
    periodDays: number;
  };
  /** Pattern metadata */
  meta?: {
    lastCalculated: string;
    algorithm: string;
    version: string;
  };
}

/**
 * Input for aggregating a new data point
 */
export interface AggregationInput {
  pattern_key: string;
  source_gate: GateId;
  value: number | string | Record<string, number>;
  timestamp?: string;
}

/**
 * Global pattern insight for external consumption
 */
export interface GlobalInsight {
  pattern_key: string;
  source_gate: GateId;
  insight: {
    type: 'benchmark' | 'trend' | 'anomaly' | 'recommendation';
    summary: string;
    value: number | string;
    confidence: number;
  };
  sample_count: number;
  updated_at: string;
}

/**
 * Validation result for pattern input
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates pattern key format
 */
export function validatePatternKey(key: string): boolean {
  return PATTERN_KEY_REGEX.test(key);
}

/**
 * Validates gate identifier
 */
export function validateGate(gate: string): gate is GateId {
  return VALID_GATES.includes(gate as GateId);
}

/**
 * Validates aggregation input
 */
export function validateAggregationInput(input: AggregationInput): ValidationResult {
  const errors: string[] = [];

  if (!input.pattern_key) {
    errors.push('pattern_key is required');
  } else if (!validatePatternKey(input.pattern_key)) {
    errors.push('pattern_key must be in format category.metric (e.g., conversion.rate)');
  }

  if (!input.source_gate) {
    errors.push('source_gate is required');
  } else if (!validateGate(input.source_gate)) {
    errors.push(`source_gate must be one of: ${VALID_GATES.join(', ')}`);
  }

  if (input.value === undefined || input.value === null) {
    errors.push('value is required');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Anonymizes input value to ensure no PII is stored
 */
export function anonymizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return scrubPII(value, { patterns: 'extended' });
  }
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(anonymizeValue);
    }
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = anonymizeValue(v);
    }
    return result;
  }
  return value;
}

/**
 * Calculates running statistics for numeric aggregation
 */
export function calculateRunningStats(
  existing: PatternValue | null,
  newValue: number,
  existingCount: number
): PatternValue {
  const aggregates = existing?.aggregates || {};
  const newCount = existingCount + 1;

  // Running mean calculation
  const oldMean = aggregates.mean || 0;
  const newMean = oldMean + (newValue - oldMean) / newCount;

  // Running variance (Welford's algorithm)
  const oldM2 = (aggregates.stdDev || 0) ** 2 * existingCount;
  const delta = newValue - oldMean;
  const delta2 = newValue - newMean;
  const newM2 = oldM2 + delta * delta2;
  const newStdDev = newCount > 1 ? Math.sqrt(newM2 / newCount) : 0;

  // Min/Max tracking
  const newMin = Math.min(aggregates.min ?? newValue, newValue);
  const newMax = Math.max(aggregates.max ?? newValue, newValue);

  return {
    aggregates: {
      ...aggregates,
      count: newCount,
      mean: newMean,
      stdDev: newStdDev,
      min: newMin,
      max: newMax,
    },
    meta: {
      lastCalculated: new Date().toISOString(),
      algorithm: 'welford_running_stats',
      version: '1.0.0',
    },
  };
}

/**
 * Merges categorical counts
 */
export function mergeCategoryCounts(
  existing: Record<string, number> | undefined,
  newCategories: Record<string, number>
): Record<string, number> {
  const result: Record<string, number> = { ...existing };
  for (const [key, count] of Object.entries(newCategories)) {
    // Anonymize category keys
    const safeKey = scrubPII(key, { patterns: 'extended' });
    result[safeKey] = (result[safeKey] || 0) + count;
  }
  return result;
}

/**
 * Calculates confidence score based on sample count and variance
 */
export function calculateConfidence(sampleCount: number, stdDev?: number, mean?: number): number {
  // Base confidence from sample count (asymptotic to 1)
  const countConfidence = 1 - Math.exp(-sampleCount / 20);

  // Variance confidence (lower relative variance = higher confidence)
  let varianceConfidence = 1;
  if (stdDev !== undefined && mean !== undefined && mean !== 0) {
    const coefficientOfVariation = stdDev / Math.abs(mean);
    varianceConfidence = 1 / (1 + coefficientOfVariation);
  }

  // Combined confidence score
  return Math.min(1, countConfidence * 0.7 + varianceConfidence * 0.3);
}

/**
 * In-memory pattern store for testing and development
 * Production should use Supabase
 */
export class PatternAggregateStore {
  private patterns: Map<string, PatternAggregate> = new Map();

  private getKey(patternKey: string, sourceGate: GateId): string {
    return `${patternKey}:${sourceGate}`;
  }

  /**
   * Aggregates a new data point into the pattern store
   */
  async aggregate(input: AggregationInput): Promise<PatternAggregate> {
    const validation = validateAggregationInput(input);
    if (!validation.valid) {
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }

    const key = this.getKey(input.pattern_key, input.source_gate);
    const existing = this.patterns.get(key);

    // Anonymize input value
    const safeValue = anonymizeValue(input.value);

    let patternValue: PatternValue;
    let sampleCount: number;

    if (typeof safeValue === 'number') {
      patternValue = calculateRunningStats(
        existing?.pattern_value || null,
        safeValue,
        existing?.sample_count || 0
      );
      sampleCount = (existing?.sample_count || 0) + 1;
    } else if (typeof safeValue === 'object' && safeValue !== null) {
      // Categorical aggregation
      const categories = mergeCategoryCounts(
        existing?.pattern_value?.categories,
        safeValue as Record<string, number>
      );
      patternValue = {
        aggregates: { count: (existing?.sample_count || 0) + 1 },
        categories,
        meta: {
          lastCalculated: new Date().toISOString(),
          algorithm: 'category_merge',
          version: '1.0.0',
        },
      };
      sampleCount = (existing?.sample_count || 0) + 1;
    } else {
      throw new Error('Unsupported value type for aggregation');
    }

    const confidence = calculateConfidence(
      sampleCount,
      patternValue.aggregates.stdDev,
      patternValue.aggregates.mean
    );

    const aggregate: PatternAggregate = {
      id: existing?.id || this.patterns.size + 1,
      pattern_key: input.pattern_key,
      pattern_value: patternValue,
      source_gate: input.source_gate,
      sample_count: sampleCount,
      confidence_score: confidence,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.patterns.set(key, aggregate);
    return aggregate;
  }

  /**
   * Retrieves pattern aggregate by key and gate
   */
  async get(patternKey: string, sourceGate: GateId): Promise<PatternAggregate | null> {
    const key = this.getKey(patternKey, sourceGate);
    return this.patterns.get(key) || null;
  }

  /**
   * Lists all patterns, optionally filtered by gate
   */
  async list(sourceGate?: GateId): Promise<PatternAggregate[]> {
    const patterns = Array.from(this.patterns.values());
    if (sourceGate) {
      return patterns.filter(p => p.source_gate === sourceGate);
    }
    return patterns;
  }

  /**
   * Lists patterns with minimum sample count (ensures k-anonymity)
   */
  async listWithMinSamples(minCount: number = MIN_SAMPLE_COUNT): Promise<PatternAggregate[]> {
    return Array.from(this.patterns.values()).filter(p => p.sample_count >= minCount);
  }

  /**
   * Generates global insights from aggregated patterns
   */
  async generateGlobalInsights(): Promise<GlobalInsight[]> {
    const insights: GlobalInsight[] = [];
    const patterns = await this.listWithMinSamples();

    for (const pattern of patterns) {
      const { pattern_key, source_gate, pattern_value, sample_count, confidence_score, updated_at } = pattern;

      // Generate benchmark insight if we have statistical data
      if (pattern_value.aggregates.mean !== undefined) {
        insights.push({
          pattern_key,
          source_gate,
          insight: {
            type: 'benchmark',
            summary: `Cross-tenant benchmark for ${pattern_key}`,
            value: pattern_value.aggregates.mean,
            confidence: confidence_score,
          },
          sample_count,
          updated_at: updated_at || new Date().toISOString(),
        });
      }

      // Generate trend insight if available
      if (pattern_value.trend) {
        insights.push({
          pattern_key,
          source_gate,
          insight: {
            type: 'trend',
            summary: `${pattern_value.trend.direction === 'up' ? 'Increasing' :
                      pattern_value.trend.direction === 'down' ? 'Decreasing' : 'Stable'} trend detected`,
            value: pattern_value.trend.changePercent,
            confidence: confidence_score * 0.9, // Slightly lower confidence for trends
          },
          sample_count,
          updated_at: updated_at || new Date().toISOString(),
        });
      }

      // Generate anomaly insight for high variance patterns
      if (pattern_value.aggregates.stdDev !== undefined && pattern_value.aggregates.mean !== undefined) {
        const cv = pattern_value.aggregates.stdDev / Math.abs(pattern_value.aggregates.mean || 1);
        if (cv > 0.5) {
          insights.push({
            pattern_key,
            source_gate,
            insight: {
              type: 'anomaly',
              summary: 'High variance detected across tenants',
              value: cv,
              confidence: confidence_score * 0.8,
            },
            sample_count,
            updated_at: updated_at || new Date().toISOString(),
          });
        }
      }
    }

    return insights;
  }

  /**
   * Clears all patterns (for testing)
   */
  clear(): void {
    this.patterns.clear();
  }
}

/**
 * Default singleton instance
 */
export const patternStore = new PatternAggregateStore();

/**
 * Predefined pattern keys for common metrics
 */
export const PATTERN_KEYS = {
  // Conversion patterns
  CONVERSION_FUNNEL_DROP: 'conversion.funnel_drop_rate',
  CONVERSION_LEAD_QUALITY: 'conversion.lead_quality_score',
  CONVERSION_TIME_TO_CLOSE: 'conversion.time_to_close_days',

  // Engagement patterns
  ENGAGEMENT_RESPONSE_TIME: 'engagement.response_time_seconds',
  ENGAGEMENT_MESSAGE_RATE: 'engagement.message_rate_per_day',
  ENGAGEMENT_SESSION_DURATION: 'engagement.session_duration_minutes',

  // Payment patterns
  PAYMENT_RECOVERY_RATE: 'payment.recovery_rate',
  PAYMENT_AVERAGE_DELAY: 'payment.average_delay_days',
  PAYMENT_DEFAULT_RISK: 'payment.default_risk_score',

  // Operations patterns
  OPERATIONS_ERROR_RATE: 'operations.error_rate',
  OPERATIONS_LATENCY_P95: 'operations.latency_p95_ms',
  OPERATIONS_THROUGHPUT: 'operations.throughput_per_minute',

  // Governance patterns
  GOVERNANCE_COMPLIANCE_SCORE: 'governance.compliance_score',
  GOVERNANCE_AUDIT_FREQUENCY: 'governance.audit_frequency_days',
} as const;
