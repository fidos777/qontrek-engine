/**
 * Pattern Recommendation Engine Tests
 *
 * Tests for Phase 3.2 of Qontrek MCP v2.3:
 * - Recommendation accuracy
 * - Privacy guarantees (k-anonymity)
 * - Benchmark deviation logic
 * - Trend slope analysis
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculatePercentile,
  calculateZScore,
  calculateTrendSlope,
  analyzePerformance,
  detectOutlier,
  analyzeTrend,
  generateRecommendations,
  verifyKAnonymity,
  scrubTenantIds,
  summarizeRecommendations,
  PatternAggregate,
  GlobalBenchmark,
  TrendPoint,
  Recommendation,
  DEFAULT_CONFIG,
  DEFAULT_BENCHMARKS,
} from '@/lib/patterns/recommend';

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockAggregate = (overrides: Partial<PatternAggregate> = {}): PatternAggregate => ({
  id: 'test_1',
  tenantId: 'tenant_123',
  gateId: 'G0',
  metricName: 'response_time_hours',
  value: 4.0,
  sampleSize: 100,
  windowStart: '2024-01-01T00:00:00Z',
  windowEnd: '2024-01-08T00:00:00Z',
  createdAt: '2024-01-08T00:00:00Z',
  ...overrides,
});

const createMockBenchmark = (overrides: Partial<GlobalBenchmark> = {}): GlobalBenchmark => ({
  gateId: 'G0',
  metricName: 'response_time_hours',
  p50: 2.0,
  p75: 4.0,
  p90: 8.0,
  mean: 3.5,
  stdDev: 2.1,
  sampleCount: 1000,
  updatedAt: '2024-01-08T00:00:00Z',
  ...overrides,
});

const createTrendPoints = (
  values: number[],
  startDate: Date = new Date('2024-01-01')
): TrendPoint[] => {
  return values.map((value, index) => ({
    timestamp: new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000).toISOString(),
    value,
  }));
};

// ============================================================================
// Percentile Calculation Tests
// ============================================================================

describe('calculatePercentile', () => {
  const benchmark = createMockBenchmark();

  it('should calculate percentile correctly for average value', () => {
    // Value at mean should be around 50th percentile
    const percentile = calculatePercentile(3.5, benchmark, true);
    expect(percentile).toBeGreaterThan(45);
    expect(percentile).toBeLessThan(55);
  });

  it('should return low percentile for poor performance (higher-is-worse metric)', () => {
    // High response time = bad = low percentile when lowerIsBetter=true
    const percentile = calculatePercentile(8.0, benchmark, true);
    expect(percentile).toBeLessThan(20);
  });

  it('should return high percentile for good performance (higher-is-worse metric)', () => {
    // Low response time = good = high percentile when lowerIsBetter=true
    const percentile = calculatePercentile(1.0, benchmark, true);
    expect(percentile).toBeGreaterThan(80);
  });

  it('should handle higher-is-better metrics correctly', () => {
    const qualificationBenchmark = createMockBenchmark({
      metricName: 'qualification_rate',
      mean: 0.38,
      stdDev: 0.12,
    });

    // High qualification rate = good = high percentile
    const highPercentile = calculatePercentile(0.5, qualificationBenchmark, false);
    expect(highPercentile).toBeGreaterThan(70);

    // Low qualification rate = bad = low percentile
    const lowPercentile = calculatePercentile(0.2, qualificationBenchmark, false);
    expect(lowPercentile).toBeLessThan(30);
  });
});

// ============================================================================
// Z-Score Calculation Tests
// ============================================================================

describe('calculateZScore', () => {
  const benchmark = createMockBenchmark();

  it('should return 0 for mean value', () => {
    const zScore = calculateZScore(benchmark.mean, benchmark);
    expect(zScore).toBeCloseTo(0, 5);
  });

  it('should return 1 for value one stdDev above mean', () => {
    const zScore = calculateZScore(benchmark.mean + benchmark.stdDev, benchmark);
    expect(zScore).toBeCloseTo(1, 5);
  });

  it('should return -2 for value two stdDevs below mean', () => {
    const zScore = calculateZScore(benchmark.mean - 2 * benchmark.stdDev, benchmark);
    expect(zScore).toBeCloseTo(-2, 5);
  });

  it('should identify outliers correctly', () => {
    // Value 3 standard deviations from mean
    const extremeValue = benchmark.mean + 3 * benchmark.stdDev;
    const zScore = calculateZScore(extremeValue, benchmark);
    expect(Math.abs(zScore)).toBeGreaterThan(DEFAULT_CONFIG.outlierZScoreThreshold);
  });
});

// ============================================================================
// Trend Slope Calculation Tests
// ============================================================================

describe('calculateTrendSlope', () => {
  it('should detect improving trend (positive slope)', () => {
    // Create points with clear positive slope > 0.05 threshold
    // Values: 0.1 to 0.7 over 7 days = slope of 0.1 per day
    const points = createTrendPoints([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]);
    const result = calculateTrendSlope(points);

    expect(result.slope).toBeGreaterThan(0);
    expect(result.direction).toBe('improving');
    expect(result.rSquared).toBeGreaterThan(0.9); // Strong linear correlation
  });

  it('should detect declining trend (negative slope)', () => {
    // Values: 0.7 to 0.1 over 7 days = slope of -0.1 per day
    const points = createTrendPoints([0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1]);
    const result = calculateTrendSlope(points);

    expect(result.slope).toBeLessThan(0);
    expect(result.direction).toBe('declining');
    expect(result.rSquared).toBeGreaterThan(0.9);
  });

  it('should detect stable trend (near-zero slope)', () => {
    const points = createTrendPoints([0.35, 0.36, 0.34, 0.35, 0.36, 0.35, 0.34]);
    const result = calculateTrendSlope(points);

    expect(Math.abs(result.slope)).toBeLessThan(DEFAULT_CONFIG.trendSlopeThreshold);
    expect(result.direction).toBe('stable');
  });

  it('should return stable for insufficient data', () => {
    const points = createTrendPoints([0.3]);
    const result = calculateTrendSlope(points);

    expect(result.slope).toBe(0);
    expect(result.rSquared).toBe(0);
    expect(result.direction).toBe('stable');
  });

  it('should handle noisy data with lower R-squared', () => {
    // Noisy data with general upward trend
    const points = createTrendPoints([0.2, 0.4, 0.25, 0.45, 0.3, 0.5, 0.35]);
    const result = calculateTrendSlope(points);

    expect(result.rSquared).toBeLessThan(0.9);
    expect(result.rSquared).toBeGreaterThan(0);
  });
});

// ============================================================================
// Performance Analysis Tests
// ============================================================================

describe('analyzePerformance', () => {
  it('should generate recommendation for below-average performance', () => {
    const aggregate = createMockAggregate({ value: 6.5 }); // Above mean (worse for response time)
    const benchmark = DEFAULT_BENCHMARKS.find(
      b => b.gateId === 'G0' && b.metricName === 'response_time_hours'
    )!;

    const recommendation = analyzePerformance(aggregate, benchmark);

    expect(recommendation).not.toBeNull();
    expect(recommendation?.category).toBe('performance');
    expect(recommendation?.gateId).toBe('G0');
    expect(recommendation?.evidence.currentValue).toBe(6.5);
  });

  it('should not generate recommendation for above-average performance', () => {
    const aggregate = createMockAggregate({ value: 1.0 }); // Below mean (better for response time)
    const benchmark = DEFAULT_BENCHMARKS.find(
      b => b.gateId === 'G0' && b.metricName === 'response_time_hours'
    )!;

    const recommendation = analyzePerformance(aggregate, benchmark);

    expect(recommendation).toBeNull();
  });

  it('should assign correct priority based on percentile', () => {
    // Critical: very poor performance
    const criticalAggregate = createMockAggregate({ value: 10.0 });
    const benchmark = DEFAULT_BENCHMARKS.find(
      b => b.gateId === 'G0' && b.metricName === 'response_time_hours'
    )!;

    const recommendation = analyzePerformance(criticalAggregate, benchmark);

    expect(recommendation).not.toBeNull();
    expect(['critical', 'high']).toContain(recommendation?.priority);
  });

  it('should include gate-specific optimization suggestions', () => {
    const aggregate = createMockAggregate({
      gateId: 'G2',
      metricName: 'recovery_rate',
      value: 0.25, // Below p50 of 0.45
    });
    const benchmark = DEFAULT_BENCHMARKS.find(
      b => b.gateId === 'G2' && b.metricName === 'recovery_rate'
    )!;

    const recommendation = analyzePerformance(aggregate, benchmark);

    expect(recommendation).not.toBeNull();
    expect(recommendation?.title).toBe('Boost Payment Recovery Rate');
    expect(recommendation?.action).toContain('reminder');
  });
});

// ============================================================================
// Outlier Detection Tests
// ============================================================================

describe('detectOutlier', () => {
  it('should detect significant underperformance as outlier', () => {
    const aggregate = createMockAggregate({
      value: 10.0, // Very high response time
      sampleSize: 100,
    });
    const benchmark = createMockBenchmark();

    const recommendation = detectOutlier(aggregate, benchmark);

    expect(recommendation).not.toBeNull();
    expect(recommendation?.category).toBe('outlier');
    expect(recommendation?.priority).toBe('high');
  });

  it('should not flag normal performance as outlier', () => {
    const aggregate = createMockAggregate({
      value: 3.5, // At mean
      sampleSize: 100,
    });
    const benchmark = createMockBenchmark();

    const recommendation = detectOutlier(aggregate, benchmark);

    expect(recommendation).toBeNull();
  });

  it('should require minimum sample size', () => {
    const aggregate = createMockAggregate({
      value: 10.0,
      sampleSize: 10, // Below threshold
    });
    const benchmark = createMockBenchmark();

    const recommendation = detectOutlier(aggregate, benchmark);

    expect(recommendation).toBeNull();
  });

  it('should not flag positive outliers (overperformance)', () => {
    const aggregate = createMockAggregate({
      value: 0.5, // Very low response time (good)
      sampleSize: 100,
    });
    const benchmark = createMockBenchmark();

    const recommendation = detectOutlier(aggregate, benchmark);

    // Positive outliers (good performance) should not generate recommendations
    expect(recommendation).toBeNull();
  });
});

// ============================================================================
// Trend Analysis Tests
// ============================================================================

describe('analyzeTrend', () => {
  it('should generate recommendation for declining trend', () => {
    const aggregate = createMockAggregate({
      metricName: 'qualification_rate',
      value: 0.10,
    });
    const benchmark = DEFAULT_BENCHMARKS.find(
      b => b.gateId === 'G0' && b.metricName === 'qualification_rate'
    )!;
    // Clear decline: 0.7 to 0.1 over 7 days = -0.1 per day slope
    const trendPoints = createTrendPoints([0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1]);

    const recommendation = analyzeTrend(aggregate, trendPoints, benchmark);

    expect(recommendation).not.toBeNull();
    expect(recommendation?.category).toBe('trend');
    expect(recommendation?.evidence.trendSlope).toBeLessThan(0);
  });

  it('should not generate recommendation for improving trend', () => {
    const aggregate = createMockAggregate({
      metricName: 'qualification_rate',
      value: 0.7,
    });
    const benchmark = DEFAULT_BENCHMARKS.find(
      b => b.gateId === 'G0' && b.metricName === 'qualification_rate'
    )!;
    // Clear improvement: 0.1 to 0.7 over 7 days = +0.1 per day slope
    const trendPoints = createTrendPoints([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]);

    const recommendation = analyzeTrend(aggregate, trendPoints, benchmark);

    expect(recommendation).toBeNull();
  });

  it('should require minimum data points', () => {
    const aggregate = createMockAggregate();
    const benchmark = createMockBenchmark();
    const trendPoints = createTrendPoints([0.3, 0.2]); // Only 2 points

    const recommendation = analyzeTrend(aggregate, trendPoints, benchmark);

    expect(recommendation).toBeNull();
  });

  it('should require minimum confidence (R-squared)', () => {
    const aggregate = createMockAggregate({
      metricName: 'qualification_rate',
      value: 0.3,
    });
    const benchmark = DEFAULT_BENCHMARKS.find(
      b => b.gateId === 'G0' && b.metricName === 'qualification_rate'
    )!;
    // Very noisy data
    const trendPoints = createTrendPoints([0.35, 0.20, 0.40, 0.25, 0.38, 0.22, 0.30]);

    const recommendation = analyzeTrend(aggregate, trendPoints, benchmark);

    // Low R-squared should not generate recommendation
    expect(recommendation).toBeNull();
  });
});

// ============================================================================
// Privacy Guarantee Tests
// ============================================================================

describe('Privacy Guarantees', () => {
  describe('verifyKAnonymity', () => {
    it('should return true when tenant count meets threshold', () => {
      expect(verifyKAnonymity(5, 5)).toBe(true);
      expect(verifyKAnonymity(100, 5)).toBe(true);
    });

    it('should return false when tenant count is below threshold', () => {
      expect(verifyKAnonymity(3, 5)).toBe(false);
      expect(verifyKAnonymity(0, 5)).toBe(false);
    });

    it('should use default threshold from config', () => {
      expect(verifyKAnonymity(5)).toBe(true);
      expect(verifyKAnonymity(4)).toBe(false);
    });
  });

  describe('scrubTenantIds', () => {
    it('should remove tenantId from aggregates', () => {
      const aggregates = [
        createMockAggregate({ tenantId: 'secret_tenant_1' }),
        createMockAggregate({ tenantId: 'secret_tenant_2' }),
      ];

      const scrubbed = scrubTenantIds(aggregates);

      scrubbed.forEach(agg => {
        expect(agg).not.toHaveProperty('tenantId');
      });
    });

    it('should preserve other aggregate properties', () => {
      const aggregate = createMockAggregate({
        id: 'test_id',
        gateId: 'G0',
        metricName: 'test_metric',
        value: 42,
      });

      const [scrubbed] = scrubTenantIds([aggregate]);

      expect(scrubbed.id).toBe('test_id');
      expect(scrubbed.gateId).toBe('G0');
      expect(scrubbed.metricName).toBe('test_metric');
      expect(scrubbed.value).toBe(42);
    });
  });

  describe('Recommendation Privacy', () => {
    it('should never expose tenantId in recommendations', () => {
      const aggregates = [
        createMockAggregate({
          tenantId: 'secret_tenant',
          value: 10.0, // Poor performance to trigger recommendation
        }),
      ];

      const recommendations = generateRecommendations(aggregates);

      recommendations.forEach(rec => {
        const recString = JSON.stringify(rec);
        expect(recString).not.toContain('secret_tenant');
        expect(recString).not.toContain('tenantId');
      });
    });

    it('should not generate recommendations when k-anonymity fails', () => {
      const aggregates = [createMockAggregate({ value: 10.0 })];
      const customBenchmarks = [
        createMockBenchmark({ sampleCount: 3 }), // Below k-anonymity threshold
      ];

      const recommendations = generateRecommendations(
        aggregates,
        new Map(),
        customBenchmarks
      );

      // Should skip benchmarks that don't meet k-anonymity
      expect(recommendations.length).toBe(0);
    });
  });
});

// ============================================================================
// Benchmark Deviation Logic Tests
// ============================================================================

describe('Benchmark Deviation Logic', () => {
  it('should use default benchmarks when custom not provided', () => {
    const aggregates = [
      createMockAggregate({
        gateId: 'G0',
        metricName: 'response_time_hours',
        value: 8.0,
      }),
    ];

    const recommendations = generateRecommendations(aggregates);

    expect(recommendations.length).toBeGreaterThan(0);
    const rec = recommendations[0];
    expect(rec.evidence.benchmarkValue).toBe(DEFAULT_BENCHMARKS.find(
      b => b.gateId === 'G0' && b.metricName === 'response_time_hours'
    )?.mean);
  });

  it('should prefer custom benchmarks over defaults', () => {
    const aggregates = [
      createMockAggregate({
        gateId: 'CUSTOM',
        metricName: 'custom_metric',
        value: 50,
      }),
    ];
    const customBenchmarks = [
      createMockBenchmark({
        gateId: 'CUSTOM',
        metricName: 'custom_metric',
        mean: 100,
        stdDev: 20,
        sampleCount: 1000,
      }),
    ];

    const recommendations = generateRecommendations(
      aggregates,
      new Map(),
      customBenchmarks
    );

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].evidence.benchmarkValue).toBe(100);
  });

  it('should skip aggregates without matching benchmark', () => {
    const aggregates = [
      createMockAggregate({
        gateId: 'UNKNOWN',
        metricName: 'unknown_metric',
        value: 999,
      }),
    ];

    const recommendations = generateRecommendations(aggregates);

    expect(recommendations.length).toBe(0);
  });

  it('should calculate deviation correctly', () => {
    const aggregate = createMockAggregate({ value: 7.7 }); // mean (3.5) + 2 * stdDev (2.1) = 7.7
    const benchmark = createMockBenchmark();

    const recommendation = analyzePerformance(aggregate, benchmark);

    expect(recommendation).not.toBeNull();
    expect(recommendation?.evidence.deviation).toBeCloseTo(2.0, 1);
  });
});

// ============================================================================
// Full Integration Tests
// ============================================================================

describe('generateRecommendations Integration', () => {
  it('should generate multiple recommendation types', () => {
    const aggregates = [
      // Performance issue
      createMockAggregate({
        id: '1',
        gateId: 'G0',
        metricName: 'response_time_hours',
        value: 6.0,
        sampleSize: 100,
      }),
      // Outlier
      createMockAggregate({
        id: '2',
        gateId: 'G2',
        metricName: 'recovery_rate',
        value: 0.15,
        sampleSize: 100,
      }),
    ];

    const trendData = new Map<string, TrendPoint[]>();
    trendData.set('G0_qualification_rate', createTrendPoints([0.35, 0.32, 0.30, 0.28, 0.26, 0.24, 0.22]));

    // Add aggregate for trend
    aggregates.push(createMockAggregate({
      id: '3',
      gateId: 'G0',
      metricName: 'qualification_rate',
      value: 0.22,
      sampleSize: 100,
    }));

    const recommendations = generateRecommendations(aggregates, trendData);

    expect(recommendations.length).toBeGreaterThan(0);

    // Check for different categories
    const categories = new Set(recommendations.map(r => r.category));
    expect(categories.size).toBeGreaterThan(1);
  });

  it('should sort recommendations by priority', () => {
    const aggregates = [
      createMockAggregate({
        id: '1',
        gateId: 'G0',
        metricName: 'response_time_hours',
        value: 4.5, // Medium issue
        sampleSize: 100,
      }),
      createMockAggregate({
        id: '2',
        gateId: 'G2',
        metricName: 'recovery_rate',
        value: 0.10, // Critical issue
        sampleSize: 100,
      }),
    ];

    const recommendations = generateRecommendations(aggregates);

    if (recommendations.length >= 2) {
      const priorityOrder = ['critical', 'high', 'medium', 'low', 'info'];
      for (let i = 1; i < recommendations.length; i++) {
        const prevPriority = priorityOrder.indexOf(recommendations[i - 1].priority);
        const currPriority = priorityOrder.indexOf(recommendations[i].priority);
        expect(currPriority).toBeGreaterThanOrEqual(prevPriority);
      }
    }
  });
});

// ============================================================================
// Summary Statistics Tests
// ============================================================================

describe('summarizeRecommendations', () => {
  it('should calculate correct totals', () => {
    const recommendations: Recommendation[] = [
      {
        id: '1',
        category: 'performance',
        priority: 'high',
        gateId: 'G0',
        metricName: 'test',
        title: 'Test 1',
        description: 'Test',
        impact: 'Test',
        action: 'Test',
        evidence: { currentValue: 1 },
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        category: 'outlier',
        priority: 'critical',
        gateId: 'G2',
        metricName: 'test',
        title: 'Test 2',
        description: 'Test',
        impact: 'Test',
        action: 'Test',
        evidence: { currentValue: 2 },
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        category: 'performance',
        priority: 'high',
        gateId: 'G0',
        metricName: 'test',
        title: 'Test 3',
        description: 'Test',
        impact: 'Test',
        action: 'Test',
        evidence: { currentValue: 3 },
        createdAt: new Date().toISOString(),
      },
    ];

    const summary = summarizeRecommendations(recommendations);

    expect(summary.total).toBe(3);
    expect(summary.byPriority.high).toBe(2);
    expect(summary.byPriority.critical).toBe(1);
    expect(summary.byCategory.performance).toBe(2);
    expect(summary.byCategory.outlier).toBe(1);
    expect(summary.byGate['G0']).toBe(2);
    expect(summary.byGate['G2']).toBe(1);
  });

  it('should handle empty recommendations', () => {
    const summary = summarizeRecommendations([]);

    expect(summary.total).toBe(0);
    expect(summary.byPriority.critical).toBe(0);
    expect(summary.byPriority.high).toBe(0);
    expect(Object.keys(summary.byGate).length).toBe(0);
  });
});
