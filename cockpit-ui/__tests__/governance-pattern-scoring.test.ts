/**
 * Governance Pattern Scoring Tests
 *
 * Phase 3.3: Governance x Pattern Integration
 *
 * Tests:
 * - Modifier correctness (percentile-based penalties/bonuses)
 * - Privacy-safety (no PII leakage in scoring)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  computePercentileValue,
  computePercentileRank,
  computeScoringModifier,
  calculateGlobalPatternStats,
  computePatternScore,
  computeAggregatePatternScore,
  scoreMetric,
  applyPatternScoreToGate,
  ensurePrivacySafe,
  validateMetricPrivacy,
  GovernanceEngine,
  PERCENTILE_THRESHOLDS,
  SCORING_MODIFIERS,
  MetricRecord,
  GlobalPatternStats,
} from '../lib/governance/engine';

// Test fixtures
const createMockMetricRecord = (overrides: Partial<MetricRecord> = {}): MetricRecord => ({
  recorded_at: new Date().toISOString(),
  tenant_id: 'tenant-test',
  channel: 'email',
  success_rate: 0.95,
  retry_rate: 0.02,
  dlq_depth: 1,
  jitter_ms_avg: 100,
  metric_id: 'test-metric-1',
  ...overrides,
});

const createMockRecords = (count: number, modifier: (i: number) => Partial<MetricRecord> = () => ({})): MetricRecord[] => {
  return Array.from({ length: count }, (_, i) => createMockMetricRecord({
    metric_id: `metric-${i}`,
    ...modifier(i),
  }));
};

describe('Percentile Calculations', () => {
  describe('computePercentileValue', () => {
    it('should return 0 for empty array', () => {
      expect(computePercentileValue([], 50)).toBe(0);
    });

    it('should return the value for single-element array', () => {
      expect(computePercentileValue([100], 50)).toBe(100);
      expect(computePercentileValue([100], 20)).toBe(100);
      expect(computePercentileValue([100], 80)).toBe(100);
    });

    it('should calculate 50th percentile (median) correctly', () => {
      const values = [10, 20, 30, 40, 50];
      expect(computePercentileValue(values, 50)).toBe(30);
    });

    it('should calculate 20th percentile correctly', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const p20 = computePercentileValue(values, 20);
      expect(p20).toBeGreaterThanOrEqual(20);
      expect(p20).toBeLessThanOrEqual(30);
    });

    it('should calculate 80th percentile correctly', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const p80 = computePercentileValue(values, 80);
      // 80th percentile of 10 values is around index 7.2, interpolating between 80 and 90
      expect(p80).toBeGreaterThanOrEqual(70);
      expect(p80).toBeLessThanOrEqual(90);
    });

    it('should handle edge percentiles', () => {
      const values = [10, 20, 30, 40, 50];
      expect(computePercentileValue(values, 0)).toBe(10);
      expect(computePercentileValue(values, 100)).toBe(50);
    });
  });

  describe('computePercentileRank', () => {
    it('should return 50 for empty dataset', () => {
      expect(computePercentileRank(100, [])).toBe(50);
    });

    it('should calculate rank correctly (higher is better)', () => {
      const values = [10, 20, 30, 40, 50];
      // When higher is better, we count how many values are BELOW this value
      // Value 50: 4 values are below (10,20,30,40), so 4/5 * 100 = 80
      expect(computePercentileRank(50, values, false)).toBe(80);
      // Value 10: 0 values are below, so 0/5 * 100 = 0
      expect(computePercentileRank(10, values, false)).toBe(0);
    });

    it('should calculate rank correctly (lower is better)', () => {
      const values = [10, 20, 30, 40, 50];
      // When lower is better, we invert: 100 - rawPercentile
      // Value 10: 0 values below, rawPercentile=0, inverted = 100
      expect(computePercentileRank(10, values, true)).toBe(100);
      // Value 50: 4 values below, rawPercentile=80, inverted = 20
      expect(computePercentileRank(50, values, true)).toBe(20);
    });
  });
});

describe('Scoring Modifiers', () => {
  describe('computeScoringModifier', () => {
    it('should apply penalty for values below 20th percentile', () => {
      const result = computeScoringModifier(15);
      expect(result.type).toBe('penalty');
      expect(result.modifier).toBe(SCORING_MODIFIERS.PENALTY);
      expect(result.modifier).toBe(-0.1);
    });

    it('should apply bonus for values above 80th percentile', () => {
      const result = computeScoringModifier(85);
      expect(result.type).toBe('bonus');
      expect(result.modifier).toBe(SCORING_MODIFIERS.BONUS);
      expect(result.modifier).toBe(0.1);
    });

    it('should apply no modifier for values between 20th and 80th percentile', () => {
      const result = computeScoringModifier(50);
      expect(result.type).toBe('none');
      expect(result.modifier).toBe(0);
    });

    it('should handle edge cases at exactly 20th percentile', () => {
      const result = computeScoringModifier(20);
      expect(result.type).toBe('none');
    });

    it('should handle edge cases at exactly 80th percentile', () => {
      const result = computeScoringModifier(80);
      expect(result.type).toBe('none');
    });

    it('should handle 0 percentile', () => {
      const result = computeScoringModifier(0);
      expect(result.type).toBe('penalty');
    });

    it('should handle 100 percentile', () => {
      const result = computeScoringModifier(100);
      expect(result.type).toBe('bonus');
    });
  });

  describe('Threshold constants', () => {
    it('should have correct penalty threshold', () => {
      expect(PERCENTILE_THRESHOLDS.PENALTY).toBe(20);
    });

    it('should have correct bonus threshold', () => {
      expect(PERCENTILE_THRESHOLDS.BONUS).toBe(80);
    });

    it('should have correct modifier values', () => {
      expect(SCORING_MODIFIERS.PENALTY).toBe(-0.1);
      expect(SCORING_MODIFIERS.BONUS).toBe(0.1);
      expect(SCORING_MODIFIERS.MIN_SCORE).toBe(0);
      expect(SCORING_MODIFIERS.MAX_SCORE).toBe(1);
    });
  });
});

describe('Global Pattern Statistics', () => {
  describe('calculateGlobalPatternStats', () => {
    it('should handle empty records', () => {
      const stats = calculateGlobalPatternStats([]);
      expect(stats.success_rate.count).toBe(0);
      expect(stats.retry_rate.count).toBe(0);
      expect(stats.dlq_depth.count).toBe(0);
      expect(stats.jitter_ms_avg.count).toBe(0);
    });

    it('should calculate stats for single record', () => {
      const records = [createMockMetricRecord({ success_rate: 0.9 })];
      const stats = calculateGlobalPatternStats(records);
      expect(stats.success_rate.count).toBe(1);
      expect(stats.success_rate.p50).toBe(0.9);
    });

    it('should calculate percentile stats correctly', () => {
      const records = createMockRecords(10, (i) => ({
        success_rate: (i + 1) / 10, // 0.1, 0.2, ..., 1.0
      }));
      const stats = calculateGlobalPatternStats(records);

      expect(stats.success_rate.count).toBe(10);
      expect(stats.success_rate.min).toBe(0.1);
      expect(stats.success_rate.max).toBe(1.0);
      expect(stats.success_rate.p50).toBeCloseTo(0.55, 1);
    });
  });
});

describe('Pattern Score Computation', () => {
  describe('scoreMetric', () => {
    // Stats with clear spread to test thresholds
    const globalStats = {
      p20: 0.6,
      p50: 0.75,
      p80: 0.9,
      min: 0.4,
      max: 1.0,
      count: 100,
    };

    it('should identify penalty for low success rate', () => {
      // Value below min should be at 0 percentile (penalty)
      const result = scoreMetric('success_rate', 0.3, globalStats, false);
      expect(result.metric_name).toBe('success_rate');
      expect(result.raw_value).toBe(0.3);
      // Very low value should get penalty
      expect(result.modifier_type).toBe('penalty');
    });

    it('should identify bonus for high success rate', () => {
      // Value above max should be at 100 percentile (bonus)
      const result = scoreMetric('success_rate', 1.1, globalStats, false);
      expect(result.modifier_type).toBe('bonus');
    });

    it('should handle lower-is-better metrics correctly', () => {
      const retryStats = {
        p20: 0.02,
        p50: 0.05,
        p80: 0.1,
        min: 0.0,
        max: 0.2,
        count: 100,
      };

      // Very low retry rate (lower than min) is best when lower is better
      const veryLowRetry = scoreMetric('retry_rate', -0.01, retryStats, true);
      expect(veryLowRetry.modifier_type).toBe('bonus');

      // Very high retry rate (above max) is bad when lower is better
      const veryHighRetry = scoreMetric('retry_rate', 0.3, retryStats, true);
      expect(veryHighRetry.modifier_type).toBe('penalty');
    });
  });

  describe('computePatternScore', () => {
    it('should compute overall pattern score', () => {
      const metrics = createMockMetricRecord({
        success_rate: 0.95,
        retry_rate: 0.01,
        dlq_depth: 0,
        jitter_ms_avg: 50,
      });

      const globalStats = calculateGlobalPatternStats(createMockRecords(20));
      const result = computePatternScore(metrics, globalStats);

      expect(result.base_score).toBe(1.0);
      expect(typeof result.pattern_modifier).toBe('number');
      expect(result.final_score).toBeGreaterThanOrEqual(SCORING_MODIFIERS.MIN_SCORE);
      expect(result.final_score).toBeLessThanOrEqual(SCORING_MODIFIERS.MAX_SCORE);
      expect(result.metrics).toHaveLength(4);
      expect(result.privacy_safe).toBe(true);
    });

    it('should bound final score between 0 and 1', () => {
      // Create metrics that would trigger many penalties
      const badMetrics = createMockMetricRecord({
        success_rate: 0.1, // Very low
        retry_rate: 0.9,   // Very high
        dlq_depth: 100,    // Very high
        jitter_ms_avg: 10000, // Very high
      });

      const globalStats = calculateGlobalPatternStats(createMockRecords(20));
      const result = computePatternScore(badMetrics, globalStats);

      expect(result.final_score).toBeGreaterThanOrEqual(SCORING_MODIFIERS.MIN_SCORE);
    });
  });

  describe('computeAggregatePatternScore', () => {
    it('should handle empty records', () => {
      const globalStats = calculateGlobalPatternStats([]);
      const result = computeAggregatePatternScore([], globalStats);

      expect(result.base_score).toBe(1.0);
      expect(result.pattern_modifier).toBe(0);
      expect(result.final_score).toBe(1.0);
    });

    it('should aggregate multiple records', () => {
      const records = createMockRecords(10);
      const globalStats = calculateGlobalPatternStats(records);
      const result = computeAggregatePatternScore(records, globalStats);

      expect(result.metrics).toHaveLength(4);
      expect(result.timestamp).toBeDefined();
    });
  });
});

describe('Gate Scoring', () => {
  describe('applyPatternScoreToGate', () => {
    it('should apply pattern modifier to gate', () => {
      const gate = {
        name: 'Test Gate',
        status: 'pass' as const,
        base_score: 0.8,
        evidence: {},
        kpis: {},
      };

      const patternScore = {
        base_score: 1.0,
        pattern_modifier: 0.1, // Bonus
        final_score: 1.0,
        metrics: [],
        timestamp: new Date().toISOString(),
        privacy_safe: true,
      };

      const result = applyPatternScoreToGate(gate, patternScore);

      expect(result.base_score).toBe(0.8);
      expect(result.pattern_score).toBe(0.1);
      expect(result.final_score).toBe(0.9); // 0.8 + 0.1
    });

    it('should cap final score at maximum', () => {
      const gate = {
        name: 'Test Gate',
        status: 'pass' as const,
        base_score: 0.95,
        evidence: {},
        kpis: {},
      };

      const patternScore = {
        base_score: 1.0,
        pattern_modifier: 0.2,
        final_score: 1.0,
        metrics: [],
        timestamp: new Date().toISOString(),
        privacy_safe: true,
      };

      const result = applyPatternScoreToGate(gate, patternScore);
      expect(result.final_score).toBe(1.0);
    });

    it('should not go below minimum score', () => {
      const gate = {
        name: 'Test Gate',
        status: 'fail' as const,
        base_score: 0.05,
        evidence: {},
        kpis: {},
      };

      const patternScore = {
        base_score: 1.0,
        pattern_modifier: -0.4,
        final_score: 0.6,
        metrics: [],
        timestamp: new Date().toISOString(),
        privacy_safe: true,
      };

      const result = applyPatternScoreToGate(gate, patternScore);
      expect(result.final_score).toBe(0);
    });
  });
});

describe('Privacy Safety Tests', () => {
  describe('ensurePrivacySafe', () => {
    it('should mark result as privacy safe', () => {
      const result = {
        base_score: 1.0,
        pattern_modifier: 0,
        final_score: 1.0,
        metrics: [],
        timestamp: new Date().toISOString(),
        privacy_safe: false,
      };

      const safeResult = ensurePrivacySafe(result);
      expect(safeResult.privacy_safe).toBe(true);
    });

    it('should preserve numeric values', () => {
      const result = {
        base_score: 0.85,
        pattern_modifier: -0.1,
        final_score: 0.75,
        metrics: [
          {
            metric_name: 'success_rate',
            raw_value: 0.95,
            percentile_rank: 75,
            modifier: 0,
            modifier_type: 'none' as const,
          },
        ],
        timestamp: '2025-11-26T10:00:00Z',
        privacy_safe: false,
      };

      const safeResult = ensurePrivacySafe(result);
      expect(safeResult.base_score).toBe(0.85);
      expect(safeResult.pattern_modifier).toBe(-0.1);
      expect(safeResult.final_score).toBe(0.75);
    });
  });

  describe('validateMetricPrivacy', () => {
    it('should pass for clean metric records', () => {
      const record = createMockMetricRecord({
        tenant_id: 'tenant-west',
        channel: 'slack',
        metric_id: 'metric-001',
      });

      expect(validateMetricPrivacy(record)).toBe(true);
    });

    it('should fail for tenant_id with email', () => {
      const record = createMockMetricRecord({
        tenant_id: 'user@example.com',
      });

      expect(validateMetricPrivacy(record)).toBe(false);
    });

    it('should fail for channel with phone number', () => {
      const record = createMockMetricRecord({
        channel: 'sms_+60123456789',
      });

      expect(validateMetricPrivacy(record)).toBe(false);
    });

    it('should fail for metric_id with UUID', () => {
      const record = createMockMetricRecord({
        metric_id: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(validateMetricPrivacy(record)).toBe(false);
    });

    it('should fail for tenant_id with NRIC', () => {
      const record = createMockMetricRecord({
        tenant_id: 'user-920101-14-5678',
      });

      expect(validateMetricPrivacy(record)).toBe(false);
    });

    it('should fail for metric_id with AWS ARN', () => {
      // Use a full ARN format that the scrubber will match
      const record = createMockMetricRecord({
        metric_id: 'arn:aws:iam::123456789012:user/johndoe',
      });

      expect(validateMetricPrivacy(record)).toBe(false);
    });
  });

  describe('Scoring result privacy', () => {
    it('should not leak PII in metric scoring results', () => {
      const records = createMockRecords(5);
      const globalStats = calculateGlobalPatternStats(records);
      const result = computePatternScore(records[0], globalStats);

      // Check that results only contain expected fields
      for (const metric of result.metrics) {
        expect(metric.metric_name).toMatch(/^(success_rate|retry_rate|dlq_depth|jitter_ms_avg)$/);
        expect(typeof metric.raw_value).toBe('number');
        expect(typeof metric.percentile_rank).toBe('number');
        expect(typeof metric.modifier).toBe('number');
        expect(['penalty', 'bonus', 'none']).toContain(metric.modifier_type);
      }
    });

    it('should have privacy_safe flag set to true', () => {
      const records = createMockRecords(10);
      const globalStats = calculateGlobalPatternStats(records);
      const result = computePatternScore(records[0], globalStats);

      expect(result.privacy_safe).toBe(true);
    });
  });
});

describe('GovernanceEngine Class', () => {
  let engine: GovernanceEngine;

  beforeEach(() => {
    engine = new GovernanceEngine();
  });

  describe('initialization', () => {
    it('should start with empty stats', () => {
      const stats = engine.getGlobalStats();
      expect(stats.success_rate.count).toBe(0);
      expect(stats.retry_rate.count).toBe(0);
    });

    it('should need refresh initially', () => {
      expect(engine.needsStatsRefresh()).toBe(true);
    });
  });

  describe('updateGlobalStats', () => {
    it('should update stats from records', () => {
      const records = createMockRecords(10);
      engine.updateGlobalStats(records);

      const stats = engine.getGlobalStats();
      expect(stats.success_rate.count).toBe(10);
    });

    it('should not need refresh after update', () => {
      const records = createMockRecords(10);
      engine.updateGlobalStats(records);

      expect(engine.needsStatsRefresh()).toBe(false);
    });
  });

  describe('score', () => {
    it('should score individual metrics', () => {
      const records = createMockRecords(20);
      engine.updateGlobalStats(records);

      const result = engine.score(records[0]);
      expect(result.base_score).toBe(1.0);
      expect(result.privacy_safe).toBe(true);
    });

    it('should return default score when no stats', () => {
      const metrics = createMockMetricRecord();
      const result = engine.score(metrics);

      expect(result.base_score).toBe(1.0);
      expect(result.pattern_modifier).toBe(0);
      expect(result.final_score).toBe(1.0);
    });
  });

  describe('scoreAggregate', () => {
    it('should score aggregate of multiple records', () => {
      const records = createMockRecords(20);
      engine.updateGlobalStats(records);

      const result = engine.scoreAggregate(records.slice(0, 5));
      expect(result.metrics).toHaveLength(4);
    });
  });

  describe('explainScore', () => {
    it('should explain penalty score', () => {
      const records = createMockRecords(20, (i) => ({
        success_rate: (i + 1) / 20, // 0.05 to 1.0
      }));
      engine.updateGlobalStats(records);

      const explanation = engine.explainScore('success_rate', 0.1, false);
      expect(explanation).toContain('success_rate');
    });

    it('should indicate no data when stats empty', () => {
      const explanation = engine.explainScore('success_rate', 0.5, false);
      expect(explanation).toContain('No global data available');
    });
  });
});

describe('Integration: Full Scoring Flow', () => {
  it('should complete full scoring flow without errors', () => {
    const engine = new GovernanceEngine();

    // Step 1: Create diverse records with clear spread
    const records = createMockRecords(50, (i) => ({
      success_rate: 0.5 + (i / 100),  // 0.5 to 0.99
      retry_rate: Math.max(0, 0.2 - (i / 250)), // 0.2 to 0.0
      dlq_depth: Math.max(0, 10 - Math.floor(i / 5)),
      jitter_ms_avg: 100 + i * 10,
    }));

    // Step 2: Update global stats
    engine.updateGlobalStats(records);

    // Step 3: Score a good performer
    const goodRecord = createMockMetricRecord({
      success_rate: 0.99,
      retry_rate: 0.01,
      dlq_depth: 0,
      jitter_ms_avg: 50,
    });
    const goodScore = engine.score(goodRecord);

    // Step 4: Score a poor performer
    const poorRecord = createMockMetricRecord({
      success_rate: 0.5,
      retry_rate: 0.2,
      dlq_depth: 10,
      jitter_ms_avg: 500,
    });
    const poorScore = engine.score(poorRecord);

    // Step 5: Verify both scores are within valid bounds
    expect(goodScore.final_score).toBeGreaterThanOrEqual(0);
    expect(goodScore.final_score).toBeLessThanOrEqual(1);
    expect(poorScore.final_score).toBeGreaterThanOrEqual(0);
    expect(poorScore.final_score).toBeLessThanOrEqual(1);

    // Step 6: Verify privacy
    expect(goodScore.privacy_safe).toBe(true);
    expect(poorScore.privacy_safe).toBe(true);
  });

  it('should handle edge case with identical records', () => {
    const engine = new GovernanceEngine();

    const records = createMockRecords(10);
    engine.updateGlobalStats(records);

    const result = engine.score(records[0]);

    // All identical records should result in middle percentile
    expect(result.base_score).toBe(1.0);
    expect(result.privacy_safe).toBe(true);
  });
});
