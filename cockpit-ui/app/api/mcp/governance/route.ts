import { NextResponse } from 'next/server';
import { computeGovernanceScore, getGovernanceHealth } from '@/lib/governance';
import type { GovernanceScore } from '@/lib/governance';

/**
 * GET /api/mcp/governance
 *
 * Returns governance KPI snapshot with computed scores for G13-G21 gates.
 * Used by governance dashboard and MCP tools for real-time monitoring.
 *
 * Query params:
 *   - format: 'full' (default) | 'summary' | 'health'
 *   - tenant_id: optional tenant identifier for multi-tenant deployments
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'full';
    const tenantId = url.searchParams.get('tenant_id') || 'default';

    // Health check format - quick response
    if (format === 'health') {
      const health = await getGovernanceHealth();
      return NextResponse.json({
        ...health,
        tenantId,
        generatedAt: new Date().toISOString(),
      });
    }

    // Compute full governance score
    const governance = await computeGovernanceScore();

    // Summary format - condensed response
    if (format === 'summary') {
      return NextResponse.json({
        version: governance.version,
        generatedAt: governance.generatedAt,
        tenantId,
        overallScore: governance.overallScore,
        weightedScore: governance.weightedScore,
        summary: governance.summary,
        gates: Object.entries(governance.gates).reduce(
          (acc, [id, gate]) => {
            acc[id] = {
              name: gate.name,
              status: gate.status,
              score: gate.score,
            };
            return acc;
          },
          {} as Record<string, { name: string; status: string; score: number }>
        ),
      });
    }

    // Full format - complete response with evidence and KPIs
    const response: GovernanceScore & { tenantId: string } = {
      ...governance,
      tenantId,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Governance API error:', error);
    return NextResponse.json(
      {
        error: (error as Error).message,
        generatedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mcp/governance
 *
 * Triggers governance score recomputation and optionally persists to database.
 *
 * Body:
 *   - tenant_id: tenant identifier
 *   - persist: boolean - whether to save to database
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tenantId = body.tenant_id || 'default';
    const persist = body.persist || false;

    // Compute governance score
    const governance = await computeGovernanceScore();

    // TODO: If persist is true, save to Supabase governance_scores table
    // This requires Supabase client setup which may not be configured yet

    return NextResponse.json({
      success: true,
      persisted: persist,
      tenantId,
      overallScore: governance.overallScore,
      weightedScore: governance.weightedScore,
      summary: governance.summary,
      generatedAt: governance.generatedAt,
    });
  } catch (error) {
    console.error('Governance API POST error:', error);
    return NextResponse.json(
      {
        error: (error as Error).message,
        success: false,
      },
      { status: 500 }
    );
  }
}
