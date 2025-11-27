/**
 * MCP Tool: getPipelineSummary
 *
 * Returns sales pipeline summary with stage metrics.
 * Supports time range filtering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GetPipelineSummaryInputSchema, type GetPipelineSummaryOutput } from '@/lib/mcp/schemas';
import {
  createGovernanceContext,
  extractTenantFromJWT,
  getDefaultTenant,
  withGovernance,
  ErrorCodes,
} from '@/lib/mcp/governance';

export const runtime = 'nodejs';

// Demo pipeline data
const DEMO_PIPELINES: Record<string, GetPipelineSummaryOutput> = {
  default: {
    pipeline_id: 'pipeline_sales_001',
    name: 'Main Sales Pipeline',
    stages: [
      { id: 'stage_1', name: 'Lead', status: 'active', items_count: 145, value: 2450000, conversion_rate: 100 },
      { id: 'stage_2', name: 'Qualified', status: 'active', items_count: 89, value: 1890000, conversion_rate: 61.4 },
      { id: 'stage_3', name: 'Proposal', status: 'active', items_count: 42, value: 1250000, conversion_rate: 47.2 },
      { id: 'stage_4', name: 'Negotiation', status: 'active', items_count: 18, value: 720000, conversion_rate: 42.9 },
      { id: 'stage_5', name: 'Closed Won', status: 'completed', items_count: 12, value: 480000, conversion_rate: 66.7 },
    ],
    totals: {
      items: 306,
      value: 6790000,
      avg_conversion: 63.6,
    },
    last_updated: new Date().toISOString(),
  },
  enterprise: {
    pipeline_id: 'pipeline_enterprise_001',
    name: 'Enterprise Deals',
    stages: [
      { id: 'stage_1', name: 'Discovery', status: 'active', items_count: 23, value: 4500000, conversion_rate: 100 },
      { id: 'stage_2', name: 'Technical Review', status: 'active', items_count: 15, value: 3200000, conversion_rate: 65.2 },
      { id: 'stage_3', name: 'Business Case', status: 'active', items_count: 8, value: 2100000, conversion_rate: 53.3 },
      { id: 'stage_4', name: 'Contract', status: 'active', items_count: 4, value: 1200000, conversion_rate: 50.0 },
      { id: 'stage_5', name: 'Closed', status: 'completed', items_count: 3, value: 950000, conversion_rate: 75.0 },
    ],
    totals: {
      items: 53,
      value: 11950000,
      avg_conversion: 68.7,
    },
    last_updated: new Date().toISOString(),
  },
};

function applyTimeRangeMultiplier(data: GetPipelineSummaryOutput, timeRange: string): GetPipelineSummaryOutput {
  const multipliers: Record<string, number> = {
    '1h': 0.05,
    '24h': 0.25,
    '7d': 0.6,
    '30d': 1.0,
  };
  const multiplier = multipliers[timeRange] || 1.0;

  return {
    ...data,
    stages: data.stages.map(stage => ({
      ...stage,
      items_count: Math.round(stage.items_count * multiplier),
      value: Math.round(stage.value * multiplier),
    })),
    totals: {
      items: Math.round(data.totals.items * multiplier),
      value: Math.round(data.totals.value * multiplier),
      avg_conversion: data.totals.avg_conversion,
    },
    last_updated: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  const tenantId = extractTenantFromJWT(request.headers.get('authorization')) || getDefaultTenant();
  const governance = createGovernanceContext(tenantId, 'G13');

  try {
    const body = await request.json();
    const parseResult = GetPipelineSummaryInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: ErrorCodes.INVALID_INPUT,
            message: 'Invalid input parameters',
            details: { errors: parseResult.error.flatten() },
          },
          governance,
        },
        { status: 400 }
      );
    }

    const result = await withGovernance<typeof parseResult.data, GetPipelineSummaryOutput>(
      'getPipelineSummary',
      parseResult.data,
      governance,
      async (input) => {
        const { pipeline_id, time_range } = input;

        // Select pipeline data
        let pipelineData = DEMO_PIPELINES.default;
        if (pipeline_id && DEMO_PIPELINES[pipeline_id]) {
          pipelineData = DEMO_PIPELINES[pipeline_id];
        } else if (pipeline_id === 'enterprise' || pipeline_id === 'pipeline_enterprise_001') {
          pipelineData = DEMO_PIPELINES.enterprise;
        }

        // Apply time range filter
        return applyTimeRangeMultiplier(pipelineData, time_range);
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: (error as Error).message,
        },
        governance,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const tenantId = extractTenantFromJWT(request.headers.get('authorization')) || getDefaultTenant();
  const governance = createGovernanceContext(tenantId, 'G13');

  const result = await withGovernance<{}, GetPipelineSummaryOutput>(
    'getPipelineSummary',
    { time_range: '24h' },
    governance,
    async () => applyTimeRangeMultiplier(DEMO_PIPELINES.default, '24h')
  );

  return NextResponse.json(result);
}
