/**
 * MCP Tool: getKPISnapshot
 *
 * Returns KPI metrics snapshot by category.
 * Supports sales, governance, operations, and finance metrics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GetKPISnapshotInputSchema, type GetKPISnapshotOutput, type KPIMetric } from '@/lib/mcp/schemas';
import {
  createGovernanceContext,
  extractTenantFromJWT,
  getDefaultTenant,
  withGovernance,
  ErrorCodes,
} from '@/lib/mcp/governance';

export const runtime = 'nodejs';

// Demo KPI data by category
const KPI_DATA: Record<string, KPIMetric[]> = {
  sales: [
    { id: 'kpi_revenue', name: 'Monthly Revenue', value: 2450000, unit: 'USD', trend: 'up', change_percent: 12.5, target: 2500000, target_met: false },
    { id: 'kpi_deals_closed', name: 'Deals Closed', value: 47, unit: 'count', trend: 'up', change_percent: 8.2, target: 50, target_met: false },
    { id: 'kpi_avg_deal_size', name: 'Avg Deal Size', value: 52128, unit: 'USD', trend: 'stable', change_percent: 1.3, target: 50000, target_met: true },
    { id: 'kpi_win_rate', name: 'Win Rate', value: 34.2, unit: '%', trend: 'up', change_percent: 5.1, target: 35, target_met: false },
    { id: 'kpi_pipeline_value', name: 'Pipeline Value', value: 6790000, unit: 'USD', trend: 'up', change_percent: 15.8, target: 6000000, target_met: true },
    { id: 'kpi_sales_cycle', name: 'Avg Sales Cycle', value: 42, unit: 'days', trend: 'down', change_percent: -8.7, target: 45, target_met: true },
  ],
  governance: [
    { id: 'kpi_gate_pass_rate', name: 'Gate Pass Rate', value: 77.8, unit: '%', trend: 'up', change_percent: 5.6, target: 80, target_met: false },
    { id: 'kpi_compliance_score', name: 'Compliance Score', value: 94, unit: '%', trend: 'stable', change_percent: 0.5, target: 95, target_met: false },
    { id: 'kpi_audit_coverage', name: 'Audit Coverage', value: 100, unit: '%', trend: 'stable', change_percent: 0, target: 100, target_met: true },
    { id: 'kpi_key_rotation', name: 'Keys Rotated On Time', value: 100, unit: '%', trend: 'stable', change_percent: 0, target: 100, target_met: true },
    { id: 'kpi_proof_freshness', name: 'Proof Freshness', value: 98.5, unit: '%', trend: 'up', change_percent: 2.1, target: 95, target_met: true },
  ],
  operations: [
    { id: 'kpi_uptime', name: 'System Uptime', value: 99.95, unit: '%', trend: 'stable', change_percent: 0.02, target: 99.9, target_met: true },
    { id: 'kpi_response_time', name: 'Avg Response Time', value: 145, unit: 'ms', trend: 'down', change_percent: -12.3, target: 200, target_met: true },
    { id: 'kpi_error_rate', name: 'Error Rate', value: 0.05, unit: '%', trend: 'down', change_percent: -25.0, target: 0.1, target_met: true },
    { id: 'kpi_throughput', name: 'Request Throughput', value: 15420, unit: 'req/min', trend: 'up', change_percent: 18.5, target: 12000, target_met: true },
    { id: 'kpi_queue_depth', name: 'Queue Depth', value: 23, unit: 'items', trend: 'down', change_percent: -35.0, target: 50, target_met: true },
  ],
  finance: [
    { id: 'kpi_mrr', name: 'Monthly Recurring Revenue', value: 1850000, unit: 'USD', trend: 'up', change_percent: 8.3, target: 2000000, target_met: false },
    { id: 'kpi_arr', name: 'Annual Recurring Revenue', value: 22200000, unit: 'USD', trend: 'up', change_percent: 8.3, target: 24000000, target_met: false },
    { id: 'kpi_churn', name: 'Monthly Churn Rate', value: 1.8, unit: '%', trend: 'down', change_percent: -10.0, target: 2.0, target_met: true },
    { id: 'kpi_cac', name: 'Customer Acquisition Cost', value: 12500, unit: 'USD', trend: 'down', change_percent: -5.3, target: 15000, target_met: true },
    { id: 'kpi_ltv', name: 'Customer Lifetime Value', value: 85000, unit: 'USD', trend: 'up', change_percent: 12.0, target: 80000, target_met: true },
    { id: 'kpi_ltv_cac_ratio', name: 'LTV:CAC Ratio', value: 6.8, unit: 'ratio', trend: 'up', change_percent: 18.2, target: 5.0, target_met: true },
  ],
};

function applyTimeRangeVariation(metrics: KPIMetric[], timeRange: string): KPIMetric[] {
  // Apply slight variations based on time range
  const variationFactors: Record<string, number> = {
    today: 0.95,
    week: 0.98,
    month: 1.0,
    quarter: 1.05,
    year: 1.15,
  };
  const factor = variationFactors[timeRange] || 1.0;

  return metrics.map(metric => ({
    ...metric,
    value: metric.unit === '%' || metric.unit === 'ratio'
      ? metric.value
      : Math.round(metric.value * factor),
    target_met: metric.target
      ? (metric.value * factor) >= metric.target
      : undefined,
  }));
}

export async function POST(request: NextRequest) {
  const tenantId = extractTenantFromJWT(request.headers.get('authorization')) || getDefaultTenant();
  const governance = createGovernanceContext(tenantId, 'G13');

  try {
    const body = await request.json();
    const parseResult = GetKPISnapshotInputSchema.safeParse(body);

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

    const result = await withGovernance<typeof parseResult.data, GetKPISnapshotOutput>(
      'getKPISnapshot',
      parseResult.data,
      governance,
      async (input) => {
        const { category, time_range } = input;

        let metrics: KPIMetric[] = [];

        if (category === 'all') {
          // Combine all categories
          for (const cat of Object.keys(KPI_DATA)) {
            metrics = [...metrics, ...KPI_DATA[cat]];
          }
        } else {
          metrics = KPI_DATA[category] || [];
        }

        // Apply time range variations
        metrics = applyTimeRangeVariation(metrics, time_range);

        return {
          category,
          time_range,
          metrics,
          generated_at: new Date().toISOString(),
        };
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

  const result = await withGovernance<{}, GetKPISnapshotOutput>(
    'getKPISnapshot',
    { category: 'all', time_range: 'month' },
    governance,
    async () => {
      let metrics: KPIMetric[] = [];
      for (const cat of Object.keys(KPI_DATA)) {
        metrics = [...metrics, ...KPI_DATA[cat]];
      }
      return {
        category: 'all',
        time_range: 'month',
        metrics,
        generated_at: new Date().toISOString(),
      };
    }
  );

  return NextResponse.json(result);
}
