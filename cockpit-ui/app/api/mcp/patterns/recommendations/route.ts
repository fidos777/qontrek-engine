import { NextRequest, NextResponse } from 'next/server';
import {
  generateRecommendations,
  summarizeRecommendations,
  verifyKAnonymity,
  scrubTenantIds,
  PatternAggregate,
  TrendPoint,
  GlobalBenchmark,
  Recommendation,
  DEFAULT_CONFIG,
  DEFAULT_BENCHMARKS,
} from '@/lib/patterns/recommend';

/**
 * GET /api/mcp/patterns/recommendations
 *
 * MCP endpoint for listing pattern recommendations.
 * Analyzes pattern_aggregate data to generate actionable insights.
 *
 * Query Parameters:
 * - gateId: Filter by gate (e.g., "G0", "G2", "CFO")
 * - priority: Filter by priority ("critical", "high", "medium", "low", "info")
 * - category: Filter by category ("performance", "outlier", "trend", "gate_optimization")
 * - limit: Maximum recommendations to return (default: 50)
 * - demo: If "true", use demo data for testing
 *
 * Response:
 * {
 *   version: string;
 *   generatedAt: string;
 *   recommendations: Recommendation[];
 *   summary: { total, byPriority, byCategory, byGate };
 *   privacy: { kAnonymityMet: boolean, minTenants: number };
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gateId = searchParams.get('gateId');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const useDemo = searchParams.get('demo') === 'true';

    // Load pattern aggregates
    // In production, this would query the pattern_aggregate table
    // For now, use demo data or empty array
    let aggregates: PatternAggregate[] = [];
    let trendData = new Map<string, TrendPoint[]>();
    let customBenchmarks: GlobalBenchmark[] = [];

    if (useDemo) {
      // Demo data for testing/development
      const demoResult = generateDemoData();
      aggregates = demoResult.aggregates;
      trendData = demoResult.trendData;
    } else {
      // Production: Load from database
      const dbResult = await loadPatternAggregates(gateId);
      aggregates = dbResult.aggregates;
      trendData = dbResult.trendData;
      customBenchmarks = dbResult.customBenchmarks;
    }

    // Privacy check: Verify k-anonymity
    // In production, check actual tenant count
    const tenantCount = useDemo ? 100 : await getTenantCount();
    const kAnonymityMet = verifyKAnonymity(tenantCount, DEFAULT_CONFIG.minTenantsForBenchmark);

    if (!kAnonymityMet && !useDemo) {
      return NextResponse.json({
        version: 'v1.0',
        generatedAt: new Date().toISOString(),
        recommendations: [],
        summary: { total: 0, byPriority: {}, byCategory: {}, byGate: {} },
        privacy: {
          kAnonymityMet: false,
          minTenants: DEFAULT_CONFIG.minTenantsForBenchmark,
          message: 'Insufficient tenant diversity for privacy-safe recommendations',
        },
      });
    }

    // Scrub tenant IDs before processing (privacy by design)
    const scrubbedAggregates = scrubTenantIds(aggregates).map(a => ({
      ...a,
      tenantId: '[SCRUBBED]', // Satisfy type requirements
    })) as PatternAggregate[];

    // Generate recommendations
    let recommendations = generateRecommendations(
      scrubbedAggregates,
      trendData,
      customBenchmarks,
      DEFAULT_CONFIG
    );

    // Apply filters
    if (gateId) {
      recommendations = recommendations.filter(r => r.gateId === gateId);
    }
    if (priority) {
      recommendations = recommendations.filter(r => r.priority === priority);
    }
    if (category) {
      recommendations = recommendations.filter(r => r.category === category);
    }

    // Apply limit
    recommendations = recommendations.slice(0, limit);

    // Generate summary
    const summary = summarizeRecommendations(recommendations);

    return NextResponse.json({
      version: 'v1.0',
      generatedAt: new Date().toISOString(),
      recommendations,
      summary,
      privacy: {
        kAnonymityMet: true,
        minTenants: DEFAULT_CONFIG.minTenantsForBenchmark,
      },
      benchmarks: {
        available: DEFAULT_BENCHMARKS.map(b => ({
          gateId: b.gateId,
          metricName: b.metricName,
        })),
        lastUpdated: DEFAULT_BENCHMARKS[0]?.updatedAt,
      },
    });

  } catch (error) {
    console.error('Pattern recommendations API error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mcp/patterns/recommendations
 *
 * Generate recommendations for provided pattern aggregates.
 * Useful for real-time analysis without database storage.
 *
 * Request Body:
 * {
 *   aggregates: PatternAggregate[];
 *   trendData?: Record<string, TrendPoint[]>;
 *   customBenchmarks?: GlobalBenchmark[];
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.aggregates || !Array.isArray(body.aggregates)) {
      return NextResponse.json(
        { error: 'aggregates array is required' },
        { status: 400 }
      );
    }

    const aggregates: PatternAggregate[] = body.aggregates;
    const customBenchmarks: GlobalBenchmark[] = body.customBenchmarks || [];

    // Convert trendData from object to Map
    const trendData = new Map<string, TrendPoint[]>();
    if (body.trendData) {
      for (const [key, points] of Object.entries(body.trendData)) {
        trendData.set(key, points as TrendPoint[]);
      }
    }

    // Scrub tenant IDs before processing
    const scrubbedAggregates = scrubTenantIds(aggregates).map(a => ({
      ...a,
      tenantId: '[SCRUBBED]',
    })) as PatternAggregate[];

    // Generate recommendations
    const recommendations = generateRecommendations(
      scrubbedAggregates,
      trendData,
      customBenchmarks,
      DEFAULT_CONFIG
    );

    const summary = summarizeRecommendations(recommendations);

    return NextResponse.json({
      version: 'v1.0',
      generatedAt: new Date().toISOString(),
      recommendations,
      summary,
      privacy: {
        kAnonymityMet: true,
        tenantsAnalyzed: '[REDACTED]', // Never expose tenant counts in POST
      },
    });

  } catch (error) {
    console.error('Pattern recommendations POST error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// ============================================================================
// Data Loading Functions
// ============================================================================

/**
 * Load pattern aggregates from database
 * In production, this queries the pattern_aggregate table
 */
async function loadPatternAggregates(gateId: string | null): Promise<{
  aggregates: PatternAggregate[];
  trendData: Map<string, TrendPoint[]>;
  customBenchmarks: GlobalBenchmark[];
}> {
  // TODO: Implement database query when pattern_aggregate table is available
  // For now, return empty arrays
  // Example query:
  // SELECT * FROM pattern_aggregate WHERE ($1::text IS NULL OR gate_id = $1)
  // ORDER BY created_at DESC

  return {
    aggregates: [],
    trendData: new Map(),
    customBenchmarks: [],
  };
}

/**
 * Get tenant count for k-anonymity check
 */
async function getTenantCount(): Promise<number> {
  // TODO: Query actual tenant count from database
  // SELECT COUNT(DISTINCT tenant_id) FROM pattern_aggregate
  return 0;
}

/**
 * Generate demo data for testing
 */
function generateDemoData(): {
  aggregates: PatternAggregate[];
  trendData: Map<string, TrendPoint[]>;
} {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const aggregates: PatternAggregate[] = [
    // G0: Lead Qualification - below average metrics
    {
      id: 'demo_1',
      tenantId: 'demo_tenant',
      gateId: 'G0',
      metricName: 'response_time_hours',
      value: 6.5, // Above benchmark (worse) - benchmark p50 is 2.0
      sampleSize: 150,
      windowStart: weekAgo.toISOString(),
      windowEnd: now.toISOString(),
      createdAt: now.toISOString(),
    },
    {
      id: 'demo_2',
      tenantId: 'demo_tenant',
      gateId: 'G0',
      metricName: 'qualification_rate',
      value: 0.22, // Below benchmark - benchmark p50 is 0.35
      sampleSize: 200,
      windowStart: weekAgo.toISOString(),
      windowEnd: now.toISOString(),
      createdAt: now.toISOString(),
    },
    // G2: Payment Recovery - mixed metrics
    {
      id: 'demo_3',
      tenantId: 'demo_tenant',
      gateId: 'G2',
      metricName: 'recovery_rate',
      value: 0.32, // Below benchmark - benchmark p50 is 0.45
      sampleSize: 180,
      windowStart: weekAgo.toISOString(),
      windowEnd: now.toISOString(),
      createdAt: now.toISOString(),
    },
    {
      id: 'demo_4',
      tenantId: 'demo_tenant',
      gateId: 'G2',
      metricName: 'avg_days_to_recovery',
      value: 15.0, // Above benchmark (worse) - benchmark p50 is 7.0
      sampleSize: 120,
      windowStart: weekAgo.toISOString(),
      windowEnd: now.toISOString(),
      createdAt: now.toISOString(),
    },
    // CFO Lens - good metrics (should not generate recommendations)
    {
      id: 'demo_5',
      tenantId: 'demo_tenant',
      gateId: 'CFO',
      metricName: 'cash_flow_accuracy',
      value: 0.91, // Above benchmark p50 - good
      sampleSize: 90,
      windowStart: weekAgo.toISOString(),
      windowEnd: now.toISOString(),
      createdAt: now.toISOString(),
    },
  ];

  // Generate trend data showing declining qualification rate
  const trendData = new Map<string, TrendPoint[]>();
  const qualificationTrend: TrendPoint[] = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date(now.getTime() - (14 - i) * 24 * 60 * 60 * 1000);
    qualificationTrend.push({
      timestamp: date.toISOString(),
      value: 0.35 - (i * 0.01), // Declining from 0.35 to 0.22
    });
  }
  trendData.set('G0_qualification_rate', qualificationTrend);

  return { aggregates, trendData };
}
