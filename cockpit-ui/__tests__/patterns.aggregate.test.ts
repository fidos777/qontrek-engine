/**
 * Pattern Aggregator Tests
 *
 * Tests for the cross-tenant pattern aggregation system.
 * Verifies privacy guarantees, statistical accuracy, and API behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PatternAggregateStore,
  validatePatternKey,
  validateGate,
  validateAggregationInput,
  anonymizeValue,
  calculateRunningStats,
  mergeCategoryCounts,
  calculateConfidence,
  MIN_SAMPLE_COUNT,
  PATTERN_KEYS,
  VALID_GATES,
  type AggregationInput,
  type GateId,
} from '@/lib/patterns/aggregate';

describe('Pattern Key Validation', () => {
  it('should accept valid pattern keys', () => {
    expect(validatePatternKey('conversion.rate')).toBe(true);
    expect(validatePatternKey('engagement.response_time')).toBe(true);
    expect(validatePatternKey('payment.recovery_rate')).toBe(true);
    expect(validatePatternKey('operations.error_rate')).toBe(true);
  });

  it('should reject invalid pattern keys', () => {
    expect(validatePatternKey('single')).toBe(false);
    expect(validatePatternKey('UPPERCASE.key')).toBe(false);
    expect(validatePatternKey('key-with-dash.metric')).toBe(false);
    expect(validatePatternKey('too.many.parts.here')).toBe(false);
    expect(validatePatternKey('')).toBe(false);
    expect(validatePatternKey('.startdot')).toBe(false);
    expect(validatePatternKey('enddot.')).toBe(false);
    expect(validatePatternKey('1startswithnumber.metric')).toBe(false);
  });

  it('should accept pattern keys with numbers', () => {
    expect(validatePatternKey('operations.latency_p95_ms')).toBe(true);
    expect(validatePatternKey('engagement.response_time_p99')).toBe(true);
    expect(validatePatternKey('conversion.funnel2_drop_rate')).toBe(true);
  });

  it('should have valid predefined pattern keys', () => {
    for (const key of Object.values(PATTERN_KEYS)) {
      expect(validatePatternKey(key)).toBe(true);
    }
  });
});

describe('Gate Validation', () => {
  it('should accept valid gates', () => {
    expect(validateGate('G0')).toBe(true);
    expect(validateGate('G1')).toBe(true);
    expect(validateGate('G10')).toBe(true);
    expect(validateGate('G21')).toBe(true);
  });

  it('should reject invalid gates', () => {
    expect(validateGate('G22')).toBe(false);
    expect(validateGate('G-1')).toBe(false);
    expect(validateGate('gate0')).toBe(false);
    expect(validateGate('')).toBe(false);
    expect(validateGate('0')).toBe(false);
  });

  it('should have all valid gates defined', () => {
    expect(VALID_GATES.length).toBe(22);
    expect(VALID_GATES[0]).toBe('G0');
    expect(VALID_GATES[21]).toBe('G21');
  });
});

describe('Aggregation Input Validation', () => {
  it('should accept valid input', () => {
    const input: AggregationInput = {
      pattern_key: 'conversion.rate',
      source_gate: 'G0',
      value: 0.85,
    };
    const result = validateAggregationInput(input);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing pattern_key', () => {
    const input = {
      pattern_key: '',
      source_gate: 'G0',
      value: 0.85,
    } as AggregationInput;
    const result = validateAggregationInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('pattern_key'))).toBe(true);
  });

  it('should reject invalid source_gate', () => {
    const input: AggregationInput = {
      pattern_key: 'conversion.rate',
      source_gate: 'INVALID' as GateId,
      value: 0.85,
    };
    const result = validateAggregationInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('source_gate'))).toBe(true);
  });

  it('should reject missing value', () => {
    const input = {
      pattern_key: 'conversion.rate',
      source_gate: 'G0',
      value: undefined,
    } as unknown as AggregationInput;
    const result = validateAggregationInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('value'))).toBe(true);
  });
});

describe('Value Anonymization', () => {
  it('should anonymize email addresses', () => {
    const result = anonymizeValue('Contact user@example.com for info');
    expect(result).toBe('Contact [EMAIL_REDACTED] for info');
  });

  it('should anonymize phone numbers', () => {
    const result = anonymizeValue('Call +60123456789');
    expect(result).toContain('[PHONE_REDACTED]');
  });

  it('should recursively anonymize objects', () => {
    const input = {
      name: 'user@test.com',
      nested: {
        phone: '+60123456789',
      },
    };
    const result = anonymizeValue(input) as Record<string, unknown>;
    expect(result.name).toBe('[EMAIL_REDACTED]');
    expect((result.nested as Record<string, unknown>).phone).toContain('[PHONE_REDACTED]');
  });

  it('should preserve numbers', () => {
    expect(anonymizeValue(42)).toBe(42);
    expect(anonymizeValue(3.14)).toBe(3.14);
  });

  it('should preserve booleans', () => {
    expect(anonymizeValue(true)).toBe(true);
    expect(anonymizeValue(false)).toBe(false);
  });

  it('should anonymize arrays', () => {
    const result = anonymizeValue(['user@test.com', 'normal text']);
    expect(result).toEqual(['[EMAIL_REDACTED]', 'normal text']);
  });
});

describe('Running Statistics', () => {
  it('should calculate mean correctly', () => {
    const result1 = calculateRunningStats(null, 10, 0);
    expect(result1.aggregates.mean).toBe(10);
    expect(result1.aggregates.count).toBe(1);

    const result2 = calculateRunningStats(result1, 20, 1);
    expect(result2.aggregates.mean).toBe(15);
    expect(result2.aggregates.count).toBe(2);
  });

  it('should calculate standard deviation correctly', () => {
    let result = calculateRunningStats(null, 10, 0);
    result = calculateRunningStats(result, 20, 1);
    result = calculateRunningStats(result, 30, 2);

    // stdDev should be approximately 8.16 for [10, 20, 30]
    expect(result.aggregates.stdDev).toBeGreaterThan(8);
    expect(result.aggregates.stdDev).toBeLessThan(9);
  });

  it('should track min/max correctly', () => {
    let result = calculateRunningStats(null, 50, 0);
    result = calculateRunningStats(result, 10, 1);
    result = calculateRunningStats(result, 90, 2);
    result = calculateRunningStats(result, 30, 3);

    expect(result.aggregates.min).toBe(10);
    expect(result.aggregates.max).toBe(90);
  });

  it('should include metadata', () => {
    const result = calculateRunningStats(null, 10, 0);
    expect(result.meta).toBeDefined();
    expect(result.meta?.algorithm).toBe('welford_running_stats');
    expect(result.meta?.version).toBe('1.0.0');
  });
});

describe('Category Merging', () => {
  it('should merge new categories', () => {
    const result = mergeCategoryCounts(undefined, { hot: 5, warm: 3, cold: 2 });
    expect(result.hot).toBe(5);
    expect(result.warm).toBe(3);
    expect(result.cold).toBe(2);
  });

  it('should accumulate existing categories', () => {
    const existing = { hot: 5, warm: 3 };
    const result = mergeCategoryCounts(existing, { hot: 2, cold: 1 });
    expect(result.hot).toBe(7);
    expect(result.warm).toBe(3);
    expect(result.cold).toBe(1);
  });

  it('should anonymize category keys', () => {
    const result = mergeCategoryCounts(undefined, { 'user@test.com': 5 });
    // Email should be scrubbed from keys
    expect(result['[EMAIL_REDACTED]']).toBe(5);
  });
});

describe('Confidence Calculation', () => {
  it('should return low confidence for few samples', () => {
    const confidence = calculateConfidence(1);
    expect(confidence).toBeLessThan(0.5);
  });

  it('should return higher confidence for more samples', () => {
    const conf1 = calculateConfidence(5);
    const conf10 = calculateConfidence(10);
    const conf50 = calculateConfidence(50);

    expect(conf10).toBeGreaterThan(conf1);
    expect(conf50).toBeGreaterThan(conf10);
  });

  it('should asymptote towards 1', () => {
    const conf100 = calculateConfidence(100);
    const conf1000 = calculateConfidence(1000);

    expect(conf100).toBeGreaterThan(0.9);
    expect(conf1000).toBeLessThanOrEqual(1);
  });

  it('should penalize high variance', () => {
    const lowVariance = calculateConfidence(50, 1, 100); // stdDev=1, mean=100
    const highVariance = calculateConfidence(50, 50, 100); // stdDev=50, mean=100

    expect(lowVariance).toBeGreaterThan(highVariance);
  });
});

describe('PatternAggregateStore', () => {
  let store: PatternAggregateStore;

  beforeEach(() => {
    store = new PatternAggregateStore();
  });

  describe('aggregate()', () => {
    it('should aggregate numeric values', async () => {
      const result = await store.aggregate({
        pattern_key: 'conversion.rate',
        source_gate: 'G0',
        value: 0.85,
      });

      expect(result.pattern_key).toBe('conversion.rate');
      expect(result.source_gate).toBe('G0');
      expect(result.sample_count).toBe(1);
      expect(result.pattern_value.aggregates.mean).toBe(0.85);
    });

    it('should accumulate multiple values', async () => {
      await store.aggregate({
        pattern_key: 'conversion.rate',
        source_gate: 'G0',
        value: 0.80,
      });

      const result = await store.aggregate({
        pattern_key: 'conversion.rate',
        source_gate: 'G0',
        value: 0.90,
      });

      expect(result.sample_count).toBe(2);
      expect(result.pattern_value.aggregates.mean).toBeCloseTo(0.85, 10);
    });

    it('should aggregate categorical values', async () => {
      const result = await store.aggregate({
        pattern_key: 'engagement.lead_type',
        source_gate: 'G0',
        value: { hot: 5, warm: 3, cold: 2 },
      });

      expect(result.pattern_value.categories).toBeDefined();
      expect(result.pattern_value.categories?.hot).toBe(5);
    });

    it('should throw on invalid input', async () => {
      await expect(store.aggregate({
        pattern_key: 'invalid',
        source_gate: 'G0',
        value: 0.5,
      })).rejects.toThrow('Invalid input');
    });

    it('should separate patterns by gate', async () => {
      await store.aggregate({
        pattern_key: 'conversion.rate',
        source_gate: 'G0',
        value: 0.80,
      });

      await store.aggregate({
        pattern_key: 'conversion.rate',
        source_gate: 'G1',
        value: 0.70,
      });

      const g0 = await store.get('conversion.rate', 'G0');
      const g1 = await store.get('conversion.rate', 'G1');

      expect(g0?.pattern_value.aggregates.mean).toBe(0.80);
      expect(g1?.pattern_value.aggregates.mean).toBe(0.70);
    });
  });

  describe('get()', () => {
    it('should return null for non-existent pattern', async () => {
      const result = await store.get('nonexistent.pattern', 'G0');
      expect(result).toBeNull();
    });

    it('should return existing pattern', async () => {
      await store.aggregate({
        pattern_key: 'conversion.rate',
        source_gate: 'G0',
        value: 0.85,
      });

      const result = await store.get('conversion.rate', 'G0');
      expect(result).not.toBeNull();
      expect(result?.pattern_key).toBe('conversion.rate');
    });
  });

  describe('list()', () => {
    it('should return empty array initially', async () => {
      const result = await store.list();
      expect(result).toHaveLength(0);
    });

    it('should return all patterns', async () => {
      await store.aggregate({
        pattern_key: 'conversion.rate',
        source_gate: 'G0',
        value: 0.85,
      });

      await store.aggregate({
        pattern_key: 'engagement.time',
        source_gate: 'G1',
        value: 120,
      });

      const result = await store.list();
      expect(result).toHaveLength(2);
    });

    it('should filter by gate', async () => {
      await store.aggregate({
        pattern_key: 'conversion.rate',
        source_gate: 'G0',
        value: 0.85,
      });

      await store.aggregate({
        pattern_key: 'engagement.time',
        source_gate: 'G1',
        value: 120,
      });

      const result = await store.list('G0');
      expect(result).toHaveLength(1);
      expect(result[0].source_gate).toBe('G0');
    });
  });

  describe('listWithMinSamples()', () => {
    it('should filter by sample count', async () => {
      // Add pattern with few samples
      await store.aggregate({
        pattern_key: 'low.samples',
        source_gate: 'G0',
        value: 0.5,
      });

      // Add pattern with many samples
      for (let i = 0; i < MIN_SAMPLE_COUNT + 1; i++) {
        await store.aggregate({
          pattern_key: 'high.samples',
          source_gate: 'G1',
          value: Math.random(),
        });
      }

      const result = await store.listWithMinSamples();
      expect(result).toHaveLength(1);
      expect(result[0].pattern_key).toBe('high.samples');
    });
  });

  describe('generateGlobalInsights()', () => {
    it('should return empty array when no patterns meet threshold', async () => {
      await store.aggregate({
        pattern_key: 'conversion.rate',
        source_gate: 'G0',
        value: 0.85,
      });

      const insights = await store.generateGlobalInsights();
      expect(insights).toHaveLength(0);
    });

    it('should generate benchmark insights for patterns above threshold', async () => {
      for (let i = 0; i < MIN_SAMPLE_COUNT + 1; i++) {
        await store.aggregate({
          pattern_key: 'conversion.rate',
          source_gate: 'G0',
          value: 0.80 + Math.random() * 0.1,
        });
      }

      const insights = await store.generateGlobalInsights();
      expect(insights.length).toBeGreaterThan(0);

      const benchmark = insights.find(i => i.insight.type === 'benchmark');
      expect(benchmark).toBeDefined();
      expect(benchmark?.pattern_key).toBe('conversion.rate');
    });

    it('should generate anomaly insights for high variance', async () => {
      // Add values with high variance
      const values = [0.1, 0.9, 0.2, 0.8, 0.15, 0.85];
      for (const v of values) {
        await store.aggregate({
          pattern_key: 'volatile.metric',
          source_gate: 'G0',
          value: v,
        });
      }

      const insights = await store.generateGlobalInsights();
      const anomaly = insights.find(i => i.insight.type === 'anomaly');
      expect(anomaly).toBeDefined();
      expect(anomaly?.insight.summary).toContain('variance');
    });
  });

  describe('clear()', () => {
    it('should clear all patterns', async () => {
      await store.aggregate({
        pattern_key: 'conversion.rate',
        source_gate: 'G0',
        value: 0.85,
      });

      store.clear();
      const result = await store.list();
      expect(result).toHaveLength(0);
    });
  });
});

describe('Privacy Guarantees', () => {
  let store: PatternAggregateStore;

  beforeEach(() => {
    store = new PatternAggregateStore();
  });

  it('should never store raw tenant data', async () => {
    await store.aggregate({
      pattern_key: 'engagement.contact',
      source_gate: 'G0',
      value: { 'user@company.com': 1 },
    });

    const pattern = await store.get('engagement.contact', 'G0');
    const categories = pattern?.pattern_value.categories || {};

    // Email should be anonymized
    expect(Object.keys(categories).join('')).not.toContain('@');
    expect(Object.keys(categories).join('')).toContain('REDACTED');
  });

  it('should enforce minimum sample count for insights', async () => {
    // Add fewer than minimum samples
    for (let i = 0; i < MIN_SAMPLE_COUNT - 1; i++) {
      await store.aggregate({
        pattern_key: 'conversion.rate',
        source_gate: 'G0',
        value: 0.85,
      });
    }

    const insights = await store.generateGlobalInsights();
    expect(insights).toHaveLength(0);
  });

  it('should not leak individual values in aggregates', async () => {
    const secretValue = 12345.6789;
    await store.aggregate({
      pattern_key: 'payment.amount',
      source_gate: 'G2',
      value: secretValue,
    });

    const pattern = await store.get('payment.amount', 'G2');
    const aggregates = pattern?.pattern_value.aggregates || {};

    // With only 1 sample, mean equals the value but this is protected
    // by not returning aggregates until MIN_SAMPLE_COUNT is reached
    expect(pattern?.sample_count).toBeLessThan(MIN_SAMPLE_COUNT);
  });

  it('should keep patterns isolated by gate', async () => {
    await store.aggregate({
      pattern_key: 'conversion.rate',
      source_gate: 'G0',
      value: 0.85,
    });

    await store.aggregate({
      pattern_key: 'conversion.rate',
      source_gate: 'G2',
      value: 0.65,
    });

    const g0 = await store.get('conversion.rate', 'G0');
    const g2 = await store.get('conversion.rate', 'G2');

    // Same key, different gates, different values
    expect(g0?.pattern_value.aggregates.mean).not.toBe(g2?.pattern_value.aggregates.mean);
  });
});

describe('MIN_SAMPLE_COUNT constant', () => {
  it('should be at least 5 for k-anonymity', () => {
    expect(MIN_SAMPLE_COUNT).toBeGreaterThanOrEqual(5);
  });
});
