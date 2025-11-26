/**
 * Pattern Recommendation Engine
 *
 * Analyzes pattern_aggregate data to generate actionable recommendations.
 * Implements Phase 3.2 of Qontrek MCP v2.3.
 *
 * Features:
 * - Performance vs global benchmark comparison
 * - Outlier tenant detection
 * - Trend slope analysis (improving/declining)
 * - Gate-specific optimization suggestions
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Pattern aggregate record from database
 * Represents aggregated metrics for a tenant's gate performance
 */
export interface PatternAggregate {
  id: string;
  tenantId: string;
  gateId: string;                    // e.g., "G0", "G2", "CFO"
  metricName: string;                // e.g., "conversion_rate", "recovery_rate"
  value: number;
  sampleSize: number;
  windowStart: string;               // ISO timestamp
  windowEnd: string;                 // ISO timestamp
  createdAt: string;
}

/**
 * Global benchmark for comparison
 */
export interface GlobalBenchmark {
  gateId: string;
  metricName: string;
  p50: number;                       // Median
  p75: number;                       // 75th percentile
  p90: number;                       // 90th percentile
  mean: number;
  stdDev: number;
  sampleCount: number;
  updatedAt: string;
}

/**
 * Trend data point for slope calculation
 */
export interface TrendPoint {
  timestamp: string;
  value: number;
}

/**
 * Recommendation priority levels
 */
export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Recommendation categories
 */
export type RecommendationCategory =
  | 'performance'
  | 'outlier'
  | 'trend'
  | 'gate_optimization'
  | 'privacy'
  | 'compliance';

/**
 * Individual recommendation
 */
export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  gateId: string;
  metricName: string;
  title: string;
  description: string;
  impact: string;
  action: string;
  evidence: RecommendationEvidence;
  createdAt: string;
}

/**
 * Evidence supporting a recommendation
 * Note: tenantId is NEVER exposed in recommendations for privacy
 */
export interface RecommendationEvidence {
  currentValue: number;
  benchmarkValue?: number;
  deviation?: number;                // Standard deviations from mean
  percentile?: number;               // Position in benchmark distribution
  trendSlope?: number;               // Positive = improving, negative = declining
  trendConfidence?: number;          // R-squared of trend line
  windowDays?: number;
  sampleSize?: number;
}

/**
 * Recommendation engine configuration
 */
export interface RecommendationConfig {
  // Outlier detection thresholds
  outlierZScoreThreshold: number;    // Default: 2.0 standard deviations
  outlierMinSampleSize: number;      // Minimum samples for outlier detection

  // Trend analysis settings
  trendMinDataPoints: number;        // Minimum points for trend calculation
  trendSlopeThreshold: number;       // Significant slope threshold
  trendConfidenceThreshold: number;  // R-squared threshold

  // Benchmark comparison
  benchmarkPercentileWarning: number;  // Below this = warning
  benchmarkPercentileCritical: number; // Below this = critical

  // Privacy settings
  minTenantsForBenchmark: number;    // k-anonymity threshold
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_CONFIG: RecommendationConfig = {
  outlierZScoreThreshold: 2.0,
  outlierMinSampleSize: 30,
  trendMinDataPoints: 7,
  trendSlopeThreshold: 0.05,
  trendConfidenceThreshold: 0.7,
  benchmarkPercentileWarning: 25,
  benchmarkPercentileCritical: 10,
  minTenantsForBenchmark: 5,         // k-anonymity: require at least 5 tenants
};

// ============================================================================
// Gate-Specific Benchmarks (Default Values)
// ============================================================================

/**
 * Default global benchmarks when real data is unavailable
 * These are based on industry standards and can be updated via API
 */
export const DEFAULT_BENCHMARKS: GlobalBenchmark[] = [
  // G0: Lead Qualification
  {
    gateId: 'G0',
    metricName: 'response_time_hours',
    p50: 2.0,
    p75: 4.0,
    p90: 8.0,
    mean: 3.5,
    stdDev: 2.1,
    sampleCount: 1000,
    updatedAt: new Date().toISOString(),
  },
  {
    gateId: 'G0',
    metricName: 'qualification_rate',
    p50: 0.35,
    p75: 0.45,
    p90: 0.55,
    mean: 0.38,
    stdDev: 0.12,
    sampleCount: 1000,
    updatedAt: new Date().toISOString(),
  },
  {
    gateId: 'G0',
    metricName: 'hot_lead_ratio',
    p50: 0.15,
    p75: 0.22,
    p90: 0.30,
    mean: 0.18,
    stdDev: 0.08,
    sampleCount: 1000,
    updatedAt: new Date().toISOString(),
  },
  // G2: Payment Recovery
  {
    gateId: 'G2',
    metricName: 'recovery_rate',
    p50: 0.45,
    p75: 0.55,
    p90: 0.68,
    mean: 0.48,
    stdDev: 0.15,
    sampleCount: 1000,
    updatedAt: new Date().toISOString(),
  },
  {
    gateId: 'G2',
    metricName: 'avg_days_to_recovery',
    p50: 7.0,
    p75: 12.0,
    p90: 21.0,
    mean: 9.5,
    stdDev: 5.2,
    sampleCount: 1000,
    updatedAt: new Date().toISOString(),
  },
  {
    gateId: 'G2',
    metricName: 'reminder_effectiveness',
    p50: 0.25,
    p75: 0.35,
    p90: 0.45,
    mean: 0.28,
    stdDev: 0.10,
    sampleCount: 1000,
    updatedAt: new Date().toISOString(),
  },
  // CFO Lens
  {
    gateId: 'CFO',
    metricName: 'cash_flow_accuracy',
    p50: 0.85,
    p75: 0.90,
    p90: 0.95,
    mean: 0.86,
    stdDev: 0.07,
    sampleCount: 1000,
    updatedAt: new Date().toISOString(),
  },
  {
    gateId: 'CFO',
    metricName: 'forecast_variance',
    p50: 0.12,
    p75: 0.18,
    p90: 0.25,
    mean: 0.14,
    stdDev: 0.06,
    sampleCount: 1000,
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================================
// Recommendation Rules Engine
// ============================================================================

/**
 * Calculate percentile position of a value in the benchmark distribution
 * Uses Z-score approximation for normal distribution
 */
export function calculatePercentile(
  value: number,
  benchmark: GlobalBenchmark,
  lowerIsBetter: boolean = false
): number {
  const zScore = (value - benchmark.mean) / benchmark.stdDev;
  // Approximate percentile from Z-score (standard normal CDF)
  const percentile = 0.5 * (1 + erf(zScore / Math.sqrt(2)));

  // For metrics where lower is better (e.g., response time), invert
  return lowerIsBetter ? (1 - percentile) * 100 : percentile * 100;
}

/**
 * Error function approximation for percentile calculation
 */
function erf(x: number): number {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Calculate Z-score for outlier detection
 */
export function calculateZScore(value: number, benchmark: GlobalBenchmark): number {
  return (value - benchmark.mean) / benchmark.stdDev;
}

/**
 * Calculate trend slope using linear regression
 * Returns slope (change per unit time) and R-squared (confidence)
 */
export function calculateTrendSlope(points: TrendPoint[]): {
  slope: number;
  rSquared: number;
  direction: 'improving' | 'declining' | 'stable';
} {
  if (points.length < 2) {
    return { slope: 0, rSquared: 0, direction: 'stable' };
  }

  // Convert timestamps to numeric x values (days from first point)
  const firstTime = new Date(points[0].timestamp).getTime();
  const data = points.map((p, i) => ({
    x: (new Date(p.timestamp).getTime() - firstTime) / (1000 * 60 * 60 * 24), // Days
    y: p.value,
  }));

  const n = data.length;
  const sumX = data.reduce((acc, p) => acc + p.x, 0);
  const sumY = data.reduce((acc, p) => acc + p.y, 0);
  const sumXY = data.reduce((acc, p) => acc + p.x * p.y, 0);
  const sumXX = data.reduce((acc, p) => acc + p.x * p.x, 0);
  const sumYY = data.reduce((acc, p) => acc + p.y * p.y, 0);

  // Linear regression slope
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  // R-squared (coefficient of determination)
  const meanY = sumY / n;
  const ssTotal = data.reduce((acc, p) => acc + Math.pow(p.y - meanY, 2), 0);
  const ssResidual = data.reduce((acc, p) => {
    const predicted = meanY + slope * (p.x - sumX / n);
    return acc + Math.pow(p.y - predicted, 2);
  }, 0);
  const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

  // Determine direction - use >= to include values at threshold
  let direction: 'improving' | 'declining' | 'stable' = 'stable';
  if (Math.abs(slope) >= DEFAULT_CONFIG.trendSlopeThreshold) {
    direction = slope > 0 ? 'improving' : 'declining';
  }

  return {
    slope: Math.round(slope * 10000) / 10000,
    rSquared: Math.round(rSquared * 100) / 100,
    direction,
  };
}

/**
 * Check if metric is one where lower values are better
 */
function isLowerBetter(metricName: string): boolean {
  const lowerBetterMetrics = [
    'response_time_hours',
    'avg_days_to_recovery',
    'forecast_variance',
    'error_rate',
    'churn_rate',
    'bounce_rate',
  ];
  return lowerBetterMetrics.includes(metricName);
}

/**
 * Get priority based on percentile and trend
 */
function getPriority(
  percentile: number,
  config: RecommendationConfig
): RecommendationPriority {
  if (percentile < config.benchmarkPercentileCritical) return 'critical';
  if (percentile < config.benchmarkPercentileWarning) return 'high';
  if (percentile < 50) return 'medium';
  return 'info';
}

// ============================================================================
// Gate-Specific Optimization Suggestions
// ============================================================================

interface OptimizationSuggestion {
  title: string;
  description: string;
  impact: string;
  action: string;
}

const GATE_OPTIMIZATIONS: Record<string, Record<string, OptimizationSuggestion>> = {
  G0: {
    response_time_hours: {
      title: 'Reduce Lead Response Time',
      description: 'Your lead response time is above the benchmark. Faster responses correlate with higher conversion rates.',
      impact: 'Improving response time by 50% can increase qualification rate by 10-15%.',
      action: 'Configure automated initial responses. Set up lead routing rules to assign to available agents.',
    },
    qualification_rate: {
      title: 'Improve Lead Qualification Rate',
      description: 'Your qualification rate is below average. This may indicate issues with lead source quality or qualification criteria.',
      impact: 'Better qualification saves time on unqualified leads and improves conversion efficiency.',
      action: 'Review lead scoring criteria. Analyze which lead sources produce the highest quality leads.',
    },
    hot_lead_ratio: {
      title: 'Increase Hot Lead Ratio',
      description: 'Proportion of hot leads is below benchmark. Consider refining lead nurturing strategies.',
      impact: 'Higher hot lead ratio directly correlates with improved sales pipeline velocity.',
      action: 'Implement lead nurturing sequences. A/B test messaging to identify what drives engagement.',
    },
  },
  G2: {
    recovery_rate: {
      title: 'Boost Payment Recovery Rate',
      description: 'Your payment recovery rate is below industry average. Optimize your collection workflow.',
      impact: 'Each 5% improvement in recovery rate directly increases cash flow.',
      action: 'Review reminder timing and frequency. Consider offering flexible payment options.',
    },
    avg_days_to_recovery: {
      title: 'Accelerate Payment Recovery',
      description: 'Average days to recovery exceeds benchmark. Faster recovery improves cash flow.',
      impact: 'Reducing recovery time by 3 days can improve cash flow predictability by 15%.',
      action: 'Send earlier reminders. Implement automatic escalation for overdue payments.',
    },
    reminder_effectiveness: {
      title: 'Improve Reminder Effectiveness',
      description: 'Payment reminder effectiveness is below average. Messages may not be reaching customers.',
      impact: 'Better reminder effectiveness reduces need for manual follow-ups.',
      action: 'A/B test reminder messaging and timing. Consider multi-channel approach (SMS + email).',
    },
  },
  CFO: {
    cash_flow_accuracy: {
      title: 'Improve Cash Flow Forecasting',
      description: 'Cash flow forecast accuracy is below benchmark. This can impact financial planning.',
      impact: 'Better forecasting enables more confident investment and growth decisions.',
      action: 'Review revenue recognition timing. Incorporate historical seasonality patterns.',
    },
    forecast_variance: {
      title: 'Reduce Forecast Variance',
      description: 'Your forecast variance is higher than benchmark. Consider more frequent forecast updates.',
      impact: 'Lower variance improves stakeholder confidence and resource allocation.',
      action: 'Implement rolling forecasts. Identify and track leading indicators.',
    },
  },
};

// ============================================================================
// Main Recommendation Generation
// ============================================================================

/**
 * Generate a unique recommendation ID
 */
function generateRecommendationId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Analyze performance against benchmark and generate recommendation
 */
export function analyzePerformance(
  aggregate: PatternAggregate,
  benchmark: GlobalBenchmark,
  config: RecommendationConfig = DEFAULT_CONFIG
): Recommendation | null {
  const lowerIsBetter = isLowerBetter(aggregate.metricName);
  const percentile = calculatePercentile(aggregate.value, benchmark, lowerIsBetter);
  const zScore = calculateZScore(aggregate.value, benchmark);

  // Only generate recommendation if below 50th percentile (or above for lower-is-better)
  if (percentile >= 50) {
    return null;
  }

  const priority = getPriority(percentile, config);
  const optimization = GATE_OPTIMIZATIONS[aggregate.gateId]?.[aggregate.metricName];

  return {
    id: generateRecommendationId(),
    category: 'performance',
    priority,
    gateId: aggregate.gateId,
    metricName: aggregate.metricName,
    title: optimization?.title || `Improve ${aggregate.metricName.replace(/_/g, ' ')}`,
    description: optimization?.description || `Your ${aggregate.metricName.replace(/_/g, ' ')} is at the ${Math.round(percentile)}th percentile.`,
    impact: optimization?.impact || `Improving this metric will enhance overall ${aggregate.gateId} performance.`,
    action: optimization?.action || 'Review current processes and identify optimization opportunities.',
    evidence: {
      currentValue: aggregate.value,
      benchmarkValue: benchmark.mean,
      deviation: Math.round(zScore * 100) / 100,
      percentile: Math.round(percentile),
      sampleSize: aggregate.sampleSize,
    },
    createdAt: new Date().toISOString(),
  };
}

/**
 * Detect if aggregate is an outlier
 * Privacy: Uses aggregate stats only, never exposes individual tenant comparison
 */
export function detectOutlier(
  aggregate: PatternAggregate,
  benchmark: GlobalBenchmark,
  config: RecommendationConfig = DEFAULT_CONFIG
): Recommendation | null {
  if (aggregate.sampleSize < config.outlierMinSampleSize) {
    return null; // Not enough data for reliable outlier detection
  }

  const zScore = calculateZScore(aggregate.value, benchmark);
  const lowerIsBetter = isLowerBetter(aggregate.metricName);

  // For metrics where lower is better (e.g., response time), high z-score = bad
  // For metrics where higher is better (e.g., conversion rate), low z-score = bad
  const isOutlier = lowerIsBetter
    ? zScore > config.outlierZScoreThreshold  // High value = bad for lower-is-better
    : zScore < -config.outlierZScoreThreshold; // Low value = bad for higher-is-better

  if (!isOutlier) {
    return null;
  }

  const optimization = GATE_OPTIMIZATIONS[aggregate.gateId]?.[aggregate.metricName];

  return {
    id: generateRecommendationId(),
    category: 'outlier',
    priority: 'high',
    gateId: aggregate.gateId,
    metricName: aggregate.metricName,
    title: `${aggregate.metricName.replace(/_/g, ' ')} is significantly below average`,
    description: `This metric is ${Math.abs(Math.round(zScore * 10) / 10)} standard deviations below the benchmark mean.`,
    impact: optimization?.impact || 'Significant deviation suggests opportunity for major improvement.',
    action: optimization?.action || 'Investigate root causes and implement corrective measures.',
    evidence: {
      currentValue: aggregate.value,
      benchmarkValue: benchmark.mean,
      deviation: Math.round(zScore * 100) / 100,
      sampleSize: aggregate.sampleSize,
    },
    createdAt: new Date().toISOString(),
  };
}

/**
 * Analyze trend and generate recommendation if declining
 */
export function analyzeTrend(
  aggregate: PatternAggregate,
  trendPoints: TrendPoint[],
  benchmark: GlobalBenchmark,
  config: RecommendationConfig = DEFAULT_CONFIG
): Recommendation | null {
  if (trendPoints.length < config.trendMinDataPoints) {
    return null; // Not enough data points
  }

  const trend = calculateTrendSlope(trendPoints);

  // Only flag declining trends with sufficient confidence
  if (trend.direction !== 'declining' || trend.rSquared < config.trendConfidenceThreshold) {
    return null;
  }

  const lowerIsBetter = isLowerBetter(aggregate.metricName);
  // For lower-is-better metrics, an increasing slope is actually declining performance
  const isActuallyDeclining = lowerIsBetter ? trend.slope > 0 : trend.slope < 0;

  if (!isActuallyDeclining) {
    return null;
  }

  const optimization = GATE_OPTIMIZATIONS[aggregate.gateId]?.[aggregate.metricName];

  return {
    id: generateRecommendationId(),
    category: 'trend',
    priority: 'medium',
    gateId: aggregate.gateId,
    metricName: aggregate.metricName,
    title: `Declining trend in ${aggregate.metricName.replace(/_/g, ' ')}`,
    description: `This metric has been declining over the past ${trendPoints.length} data points with ${Math.round(trend.rSquared * 100)}% confidence.`,
    impact: optimization?.impact || 'Continued decline may significantly impact performance.',
    action: optimization?.action || 'Identify recent changes that may have caused the decline.',
    evidence: {
      currentValue: aggregate.value,
      benchmarkValue: benchmark.mean,
      trendSlope: trend.slope,
      trendConfidence: trend.rSquared,
      windowDays: trendPoints.length,
      sampleSize: aggregate.sampleSize,
    },
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generate all recommendations for a set of pattern aggregates
 * Privacy: Never exposes tenantId in recommendations
 */
export function generateRecommendations(
  aggregates: PatternAggregate[],
  trendData: Map<string, TrendPoint[]> = new Map(),
  customBenchmarks: GlobalBenchmark[] = [],
  config: RecommendationConfig = DEFAULT_CONFIG
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const aggregate of aggregates) {
    // Find matching benchmark - prefer custom benchmarks over defaults
    let benchmark = customBenchmarks.find(
      b => b.gateId === aggregate.gateId && b.metricName === aggregate.metricName
    );

    // Fall back to default benchmarks if no custom benchmark found
    if (!benchmark) {
      benchmark = DEFAULT_BENCHMARKS.find(
        b => b.gateId === aggregate.gateId && b.metricName === aggregate.metricName
      );
    }

    if (!benchmark) {
      continue; // No benchmark available for this metric
    }

    // Check k-anonymity threshold
    if (benchmark.sampleCount < config.minTenantsForBenchmark) {
      continue; // Not enough tenants for privacy-safe comparison
    }

    // Performance analysis
    const performanceRec = analyzePerformance(aggregate, benchmark, config);
    if (performanceRec) {
      recommendations.push(performanceRec);
    }

    // Outlier detection
    const outlierRec = detectOutlier(aggregate, benchmark, config);
    if (outlierRec) {
      recommendations.push(outlierRec);
    }

    // Trend analysis (if trend data available)
    const trendKey = `${aggregate.gateId}_${aggregate.metricName}`;
    const trendPoints = trendData.get(trendKey);
    if (trendPoints) {
      const trendRec = analyzeTrend(aggregate, trendPoints, benchmark, config);
      if (trendRec) {
        recommendations.push(trendRec);
      }
    }
  }

  // Sort by priority
  const priorityOrder: Record<RecommendationPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };

  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

// ============================================================================
// Privacy-Safe Aggregation Helpers
// ============================================================================

/**
 * Verify k-anonymity threshold is met
 * Returns true if aggregation includes enough tenants for privacy
 */
export function verifyKAnonymity(
  tenantCount: number,
  threshold: number = DEFAULT_CONFIG.minTenantsForBenchmark
): boolean {
  return tenantCount >= threshold;
}

/**
 * Scrub tenant identifiers from aggregates before processing
 * Returns aggregates with tenantId hashed/removed
 */
export function scrubTenantIds(aggregates: PatternAggregate[]): Omit<PatternAggregate, 'tenantId'>[] {
  return aggregates.map(({ tenantId, ...rest }) => rest);
}

/**
 * Generate summary statistics for recommendations
 */
export function summarizeRecommendations(recommendations: Recommendation[]): {
  total: number;
  byPriority: Record<RecommendationPriority, number>;
  byCategory: Record<RecommendationCategory, number>;
  byGate: Record<string, number>;
} {
  const summary = {
    total: recommendations.length,
    byPriority: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    } as Record<RecommendationPriority, number>,
    byCategory: {
      performance: 0,
      outlier: 0,
      trend: 0,
      gate_optimization: 0,
      privacy: 0,
      compliance: 0,
    } as Record<RecommendationCategory, number>,
    byGate: {} as Record<string, number>,
  };

  for (const rec of recommendations) {
    summary.byPriority[rec.priority]++;
    summary.byCategory[rec.category]++;
    summary.byGate[rec.gateId] = (summary.byGate[rec.gateId] || 0) + 1;
  }

  return summary;
}
