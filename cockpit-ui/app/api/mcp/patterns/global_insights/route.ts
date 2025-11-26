import { NextResponse } from 'next/server';
import {
  patternStore,
  validateGate,
  MIN_SAMPLE_COUNT,
  VALID_GATES,
  type GateId,
  type GlobalInsight,
} from '@/lib/patterns/aggregate';

/**
 * GET /api/mcp/patterns/global_insights
 *
 * Returns anonymized cross-tenant pattern insights for meta-learning.
 * All data returned meets k-anonymity requirements (minimum sample count).
 *
 * Query parameters:
 *   - gate: Optional gate filter (G0-G21)
 *   - type: Optional insight type filter (benchmark, trend, anomaly, recommendation)
 *   - minSamples: Optional minimum sample count (default: 5)
 *
 * PRIVACY GUARANTEE:
 * - No tenant-identifiable data is returned
 * - All patterns require minimum sample count for k-anonymity
 * - PII is scrubbed before aggregation
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gateFilter = searchParams.get('gate');
    const typeFilter = searchParams.get('type');
    const minSamplesParam = searchParams.get('minSamples');
    const minSamples = minSamplesParam ? parseInt(minSamplesParam, 10) : MIN_SAMPLE_COUNT;

    // Validate gate filter if provided
    if (gateFilter && !validateGate(gateFilter)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid gate. Must be one of: ${VALID_GATES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate type filter if provided
    const validTypes = ['benchmark', 'trend', 'anomaly', 'recommendation'];
    if (typeFilter && !validTypes.includes(typeFilter)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate minSamples
    if (minSamples < MIN_SAMPLE_COUNT) {
      return NextResponse.json(
        {
          ok: false,
          error: `minSamples must be at least ${MIN_SAMPLE_COUNT} to ensure k-anonymity`,
        },
        { status: 400 }
      );
    }

    // Generate global insights
    let insights = await patternStore.generateGlobalInsights();

    // Apply gate filter
    if (gateFilter) {
      insights = insights.filter(i => i.source_gate === gateFilter);
    }

    // Apply type filter
    if (typeFilter) {
      insights = insights.filter(i => i.insight.type === typeFilter);
    }

    // Apply sample count filter
    insights = insights.filter(i => i.sample_count >= minSamples);

    // Build response envelope
    const response = {
      ok: true,
      rel: 'mcp_global_insights_v1.json',
      source: 'aggregated' as const,
      schemaVersion: '1.0.0',
      data: {
        insights,
        meta: {
          generatedAt: new Date().toISOString(),
          totalInsights: insights.length,
          minSampleThreshold: minSamples,
          filters: {
            gate: gateFilter || 'all',
            type: typeFilter || 'all',
          },
          privacyGuarantee: {
            kAnonymity: minSamples,
            piiScrubbed: true,
            tenantIsolation: true,
          },
        },
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Global insights API error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mcp/patterns/global_insights
 *
 * Aggregates new pattern data point.
 * Input is validated and anonymized before storage.
 *
 * Request body:
 * {
 *   "pattern_key": "conversion.funnel_drop_rate",
 *   "source_gate": "G0",
 *   "value": 0.15
 * }
 *
 * PRIVACY GUARANTEE:
 * - All string values are scrubbed for PII
 * - No tenant identifiers are stored
 * - Only statistical aggregates are maintained
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { pattern_key, source_gate, value } = body;

    // Validate required fields
    if (!pattern_key || !source_gate || value === undefined) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing required fields: pattern_key, source_gate, value',
        },
        { status: 400 }
      );
    }

    // Aggregate the data point
    const aggregate = await patternStore.aggregate({
      pattern_key,
      source_gate: source_gate as GateId,
      value,
    });

    // Return response (exclude raw data, only summary)
    return NextResponse.json({
      ok: true,
      rel: 'mcp_pattern_aggregated_v1.json',
      schemaVersion: '1.0.0',
      data: {
        pattern_key: aggregate.pattern_key,
        source_gate: aggregate.source_gate,
        sample_count: aggregate.sample_count,
        confidence_score: aggregate.confidence_score,
        updated_at: aggregate.updated_at,
        // Only return aggregates if above k-anonymity threshold
        ...(aggregate.sample_count >= MIN_SAMPLE_COUNT && {
          aggregates: {
            mean: aggregate.pattern_value.aggregates.mean,
            stdDev: aggregate.pattern_value.aggregates.stdDev,
          },
        }),
      },
      meta: {
        privacyGuarantee: {
          kAnonymity: MIN_SAMPLE_COUNT,
          piiScrubbed: true,
          aggregatesOnly: true,
        },
      },
    });

  } catch (error) {
    console.error('Pattern aggregation error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * Endpoint metadata for MCP manifest (see mcp-manifest.json)
 * - name: 'global_insights'
 * - description: 'Cross-tenant pattern insights with k-anonymity guarantees'
 * - methods: ['GET', 'POST']
 * - privacy: { tenantIsolation: true, piiScrubbing: true, kAnonymity: 5 }
 */
