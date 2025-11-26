/**
 * Governance Scoring Engine
 *
 * Implements pattern-based scoring with percentile modifiers for governance gates.
 * Phase 3.3: Governance x Pattern Integration
 *
 * Scoring rules:
 * - If metrics < global 20th percentile → penalty (subtract modifier)
 * - If metrics > global 80th percentile → bonus (add modifier)
 */

import { scrubObject, scrubPII } from '@/lib/security/scrubber';

// Percentile thresholds
export const PERCENTILE_THRESHOLDS = {
  PENALTY: 20,   // Below 20th percentile → penalty
  BONUS: 80,     // Above 80th percentile → bonus
} as const;

// Scoring modifiers
export const SCORING_MODIFIERS = {
  PENALTY: -0.1,  // -10% score penalty
  BONUS: 0.1,     // +10% score bonus
  MAX_SCORE: 1.0, // Maximum normalized score
  MIN_SCORE: 0.0, // Minimum normalized score
} as const;

/**
 * Metric record for pattern analysis
 */
export interface MetricRecord {
  recorded_at: string;
  tenant_id: string;
  channel: string;
  success_rate: number;
  retry_rate: number;
  dlq_depth: number;
  jitter_ms_avg: number;
  metric_id: string;
}

/**
 * Global pattern statistics for percentile calculations
 */
export interface GlobalPatternStats {
  success_rate: PercentileStats;
  retry_rate: PercentileStats;
  dlq_depth: PercentileStats;
  jitter_ms_avg: PercentileStats;
}

/**
 * Percentile statistics for a metric
 */
export interface PercentileStats {
  p20: number;
  p50: number;
  p80: number;
  min: number;
  max: number;
  count: number;
}

/**
 * Scoring result for a single metric
 */
export interface MetricScoringResult {
  metric_name: string;
  raw_value: number;
  percentile_rank: number;
  modifier: number;
  modifier_type: 'penalty' | 'bonus' | 'none';
}

/**
 * Overall governance scoring result
 */
export interface GovernanceScoringResult {
  base_score: number;
  pattern_modifier: number;
  final_score: number;
  metrics: MetricScoringResult[];
  timestamp: string;
  privacy_safe: boolean;
}

/**
 * Governance gate with pattern-enhanced scoring
 */
export interface GovernanceGate {
  name: string;
  status: 'pass' | 'partial' | 'pending' | 'fail';
  base_score: number;
  pattern_score: number;
  final_score: number;
  evidence: Record<string, any>;
  kpis: Record<string, number>;
  scoring_details?: MetricScoringResult[];
}

/**
 * Compute percentile value from sorted array
 */
export function computePercentileValue(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];

  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sortedValues[lower];
  }

  // Linear interpolation
  const fraction = index - lower;
  return sortedValues[lower] + fraction * (sortedValues[upper] - sortedValues[lower]);
}

/**
 * Compute the percentile rank of a value within a dataset
 * Returns 0-100 where higher is always "better" for the metric
 *
 * @param value - The value to rank
 * @param sortedValues - The dataset to compare against (must be sorted ascending)
 * @param lowerIsBetter - If true, lower values get higher percentile ranks
 */
export function computePercentileRank(value: number, sortedValues: number[], lowerIsBetter = false): number {
  if (sortedValues.length === 0) return 50;
  if (sortedValues.length === 1) {
    if (value === sortedValues[0]) return 50;
    return value < sortedValues[0] ? (lowerIsBetter ? 100 : 0) : (lowerIsBetter ? 0 : 100);
  }

  // Count how many values are below our value
  let countBelow = 0;
  for (const v of sortedValues) {
    if (v < value) {
      countBelow++;
    }
  }

  // Basic percentile: what percentage of values are below this value
  const rawPercentile = (countBelow / sortedValues.length) * 100;

  // If lower is better, invert the percentile (low values get high rank)
  return lowerIsBetter ? (100 - rawPercentile) : rawPercentile;
}

/**
 * Calculate global pattern statistics from metric records
 */
export function calculateGlobalPatternStats(records: MetricRecord[]): GlobalPatternStats {
  if (records.length === 0) {
    return createEmptyStats();
  }

  const successRates = records.map(r => r.success_rate).sort((a, b) => a - b);
  const retryRates = records.map(r => r.retry_rate).sort((a, b) => a - b);
  const dlqDepths = records.map(r => r.dlq_depth).sort((a, b) => a - b);
  const jitterMsAvgs = records.map(r => r.jitter_ms_avg).sort((a, b) => a - b);

  return {
    success_rate: calculatePercentileStats(successRates),
    retry_rate: calculatePercentileStats(retryRates),
    dlq_depth: calculatePercentileStats(dlqDepths),
    jitter_ms_avg: calculatePercentileStats(jitterMsAvgs),
  };
}

/**
 * Calculate percentile stats from sorted values
 */
function calculatePercentileStats(sortedValues: number[]): PercentileStats {
  if (sortedValues.length === 0) {
    return { p20: 0, p50: 0, p80: 0, min: 0, max: 0, count: 0 };
  }

  return {
    p20: computePercentileValue(sortedValues, 20),
    p50: computePercentileValue(sortedValues, 50),
    p80: computePercentileValue(sortedValues, 80),
    min: sortedValues[0],
    max: sortedValues[sortedValues.length - 1],
    count: sortedValues.length,
  };
}

/**
 * Create empty stats object
 */
function createEmptyStats(): GlobalPatternStats {
  const emptyStats = { p20: 0, p50: 0, p80: 0, min: 0, max: 0, count: 0 };
  return {
    success_rate: { ...emptyStats },
    retry_rate: { ...emptyStats },
    dlq_depth: { ...emptyStats },
    jitter_ms_avg: { ...emptyStats },
  };
}

/**
 * Compute scoring modifier based on percentile rank
 *
 * @param percentileRank - The percentile rank (0-100)
 * @returns modifier value (negative for penalty, positive for bonus, 0 for none)
 */
export function computeScoringModifier(percentileRank: number): {
  modifier: number;
  type: 'penalty' | 'bonus' | 'none';
} {
  if (percentileRank < PERCENTILE_THRESHOLDS.PENALTY) {
    return { modifier: SCORING_MODIFIERS.PENALTY, type: 'penalty' };
  }
  if (percentileRank > PERCENTILE_THRESHOLDS.BONUS) {
    return { modifier: SCORING_MODIFIERS.BONUS, type: 'bonus' };
  }
  return { modifier: 0, type: 'none' };
}

/**
 * Score a single metric against global patterns
 */
export function scoreMetric(
  metricName: string,
  value: number,
  globalStats: PercentileStats,
  lowerIsBetter = false
): MetricScoringResult {
  // Build sorted values from percentile stats (approximation)
  const approximateSortedValues = approximateSortedFromStats(globalStats);

  // Calculate percentile rank
  const percentileRank = computePercentileRank(value, approximateSortedValues, lowerIsBetter);

  // Get modifier
  const { modifier, type } = computeScoringModifier(percentileRank);

  return {
    metric_name: metricName,
    raw_value: value,
    percentile_rank: Math.round(percentileRank * 100) / 100,
    modifier,
    modifier_type: type,
  };
}

/**
 * Approximate sorted values from percentile stats for ranking
 * This is a simplified approach - in production, you'd store all values
 */
function approximateSortedFromStats(stats: PercentileStats): number[] {
  if (stats.count === 0) return [];
  if (stats.count === 1) return [stats.p50];

  // Create representative points for percentile calculation
  return [stats.min, stats.p20, stats.p50, stats.p80, stats.max].filter(v => v !== undefined);
}

/**
 * Compute pattern-based governance score from metrics
 */
export function computePatternScore(
  metrics: MetricRecord,
  globalStats: GlobalPatternStats
): GovernanceScoringResult {
  const scoringResults: MetricScoringResult[] = [];

  // Score success_rate (higher is better)
  scoringResults.push(
    scoreMetric('success_rate', metrics.success_rate, globalStats.success_rate, false)
  );

  // Score retry_rate (lower is better)
  scoringResults.push(
    scoreMetric('retry_rate', metrics.retry_rate, globalStats.retry_rate, true)
  );

  // Score dlq_depth (lower is better)
  scoringResults.push(
    scoreMetric('dlq_depth', metrics.dlq_depth, globalStats.dlq_depth, true)
  );

  // Score jitter_ms_avg (lower is better)
  scoringResults.push(
    scoreMetric('jitter_ms_avg', metrics.jitter_ms_avg, globalStats.jitter_ms_avg, true)
  );

  // Calculate total pattern modifier
  const totalModifier = scoringResults.reduce((sum, r) => sum + r.modifier, 0);

  // Base score starts at 1.0 (100%)
  const baseScore = 1.0;

  // Apply modifier with bounds
  const finalScore = Math.max(
    SCORING_MODIFIERS.MIN_SCORE,
    Math.min(SCORING_MODIFIERS.MAX_SCORE, baseScore + totalModifier)
  );

  return {
    base_score: baseScore,
    pattern_modifier: Math.round(totalModifier * 1000) / 1000,
    final_score: Math.round(finalScore * 1000) / 1000,
    metrics: scoringResults,
    timestamp: new Date().toISOString(),
    privacy_safe: true, // No PII in scoring results
  };
}

/**
 * Compute aggregate governance score across multiple metric records
 */
export function computeAggregatePatternScore(
  records: MetricRecord[],
  globalStats: GlobalPatternStats
): GovernanceScoringResult {
  if (records.length === 0) {
    return {
      base_score: 1.0,
      pattern_modifier: 0,
      final_score: 1.0,
      metrics: [],
      timestamp: new Date().toISOString(),
      privacy_safe: true,
    };
  }

  // Average metrics across records
  const avgMetrics: MetricRecord = {
    recorded_at: new Date().toISOString(),
    tenant_id: 'aggregate',
    channel: 'aggregate',
    success_rate: average(records.map(r => r.success_rate)),
    retry_rate: average(records.map(r => r.retry_rate)),
    dlq_depth: average(records.map(r => r.dlq_depth)),
    jitter_ms_avg: average(records.map(r => r.jitter_ms_avg)),
    metric_id: 'aggregate',
  };

  return computePatternScore(avgMetrics, globalStats);
}

/**
 * Calculate average of numbers
 */
function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Apply pattern score to a governance gate
 */
export function applyPatternScoreToGate(
  gate: Omit<GovernanceGate, 'pattern_score' | 'final_score'>,
  patternScore: GovernanceScoringResult
): GovernanceGate {
  const patternModifier = patternScore.pattern_modifier;
  const finalScore = Math.max(
    SCORING_MODIFIERS.MIN_SCORE,
    Math.min(SCORING_MODIFIERS.MAX_SCORE, gate.base_score + patternModifier)
  );

  return {
    ...gate,
    pattern_score: patternModifier,
    final_score: Math.round(finalScore * 1000) / 1000,
    scoring_details: patternScore.metrics,
  };
}

/**
 * Privacy-safe scoring: Ensure no PII leaks in scoring results
 */
export function ensurePrivacySafe(result: GovernanceScoringResult): GovernanceScoringResult {
  // Scrub any potentially sensitive data in the result
  // The scoring results should not contain PII, but we verify anyway
  const scrubbed = scrubObject(result as any);

  return {
    ...scrubbed,
    privacy_safe: true,
  };
}

/**
 * Validate metric record has no PII before processing
 */
export function validateMetricPrivacy(record: MetricRecord): boolean {
  // Check tenant_id doesn't contain PII
  const tenantScrubbed = scrubPII(record.tenant_id);
  if (tenantScrubbed !== record.tenant_id) {
    return false;
  }

  // Check channel doesn't contain PII
  const channelScrubbed = scrubPII(record.channel);
  if (channelScrubbed !== record.channel) {
    return false;
  }

  // Check metric_id doesn't contain PII
  const metricIdScrubbed = scrubPII(record.metric_id);
  if (metricIdScrubbed !== record.metric_id) {
    return false;
  }

  return true;
}

/**
 * Governance Engine class for stateful operations
 */
export class GovernanceEngine {
  private globalStats: GlobalPatternStats | null = null;
  private lastStatsUpdate: Date | null = null;
  private statsUpdateIntervalMs = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.globalStats = createEmptyStats();
  }

  /**
   * Update global pattern statistics from metric records
   */
  updateGlobalStats(records: MetricRecord[]): void {
    this.globalStats = calculateGlobalPatternStats(records);
    this.lastStatsUpdate = new Date();
  }

  /**
   * Get current global stats
   */
  getGlobalStats(): GlobalPatternStats {
    return this.globalStats || createEmptyStats();
  }

  /**
   * Check if stats need refresh
   */
  needsStatsRefresh(): boolean {
    if (!this.lastStatsUpdate) return true;
    return Date.now() - this.lastStatsUpdate.getTime() > this.statsUpdateIntervalMs;
  }

  /**
   * Score metrics against current global patterns
   */
  score(metrics: MetricRecord): GovernanceScoringResult {
    if (!this.globalStats) {
      return {
        base_score: 1.0,
        pattern_modifier: 0,
        final_score: 1.0,
        metrics: [],
        timestamp: new Date().toISOString(),
        privacy_safe: true,
      };
    }

    const result = computePatternScore(metrics, this.globalStats);
    return ensurePrivacySafe(result);
  }

  /**
   * Score aggregate metrics
   */
  scoreAggregate(records: MetricRecord[]): GovernanceScoringResult {
    if (!this.globalStats) {
      return {
        base_score: 1.0,
        pattern_modifier: 0,
        final_score: 1.0,
        metrics: [],
        timestamp: new Date().toISOString(),
        privacy_safe: true,
      };
    }

    const result = computeAggregatePatternScore(records, this.globalStats);
    return ensurePrivacySafe(result);
  }

  /**
   * Get scoring explanation for a value
   */
  explainScore(metricName: string, value: number, lowerIsBetter = false): string {
    const stats = this.getMetricStats(metricName);
    if (!stats || stats.count === 0) {
      return `No global data available for ${metricName}`;
    }

    const sortedValues = approximateSortedFromStats(stats);
    const percentileRank = computePercentileRank(value, sortedValues, lowerIsBetter);
    const { type } = computeScoringModifier(percentileRank);

    if (type === 'penalty') {
      return `${metricName}=${value} is below 20th percentile (rank: ${percentileRank.toFixed(1)}%), penalty applied`;
    }
    if (type === 'bonus') {
      return `${metricName}=${value} is above 80th percentile (rank: ${percentileRank.toFixed(1)}%), bonus applied`;
    }
    return `${metricName}=${value} is within normal range (rank: ${percentileRank.toFixed(1)}%)`;
  }

  /**
   * Get stats for a specific metric
   */
  private getMetricStats(metricName: string): PercentileStats | null {
    if (!this.globalStats) return null;
    return (this.globalStats as any)[metricName] || null;
  }
}

// Export singleton instance
export const governanceEngine = new GovernanceEngine();
