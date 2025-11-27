/**
 * MCP Tool: getWidgetData
 *
 * Returns data for dashboard widgets.
 * Supports caching and refresh control.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GetWidgetDataInputSchema, type GetWidgetDataOutput } from '@/lib/mcp/schemas';
import {
  createGovernanceContext,
  extractTenantFromJWT,
  getDefaultTenant,
  withGovernance,
  ErrorCodes,
} from '@/lib/mcp/governance';

export const runtime = 'nodejs';

// Widget data cache
const widgetCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

// Widget definitions and data generators
const WIDGET_DEFINITIONS: Record<string, {
  type: string;
  ttl: number;
  generator: () => Record<string, unknown>;
}> = {
  'widget_revenue_chart': {
    type: 'chart',
    ttl: 300,
    generator: () => ({
      chart_type: 'line',
      title: 'Revenue Trend',
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Revenue',
          data: [1200000, 1350000, 1280000, 1500000, 1620000, 1850000],
          color: '#4f46e5',
        },
        {
          label: 'Target',
          data: [1300000, 1400000, 1500000, 1600000, 1700000, 1800000],
          color: '#9ca3af',
          dashed: true,
        },
      ],
      summary: { current: 1850000, growth: 14.2 },
    }),
  },
  'widget_pipeline_funnel': {
    type: 'chart',
    ttl: 180,
    generator: () => ({
      chart_type: 'funnel',
      title: 'Sales Pipeline',
      stages: [
        { name: 'Leads', count: 145, value: 2450000 },
        { name: 'Qualified', count: 89, value: 1890000 },
        { name: 'Proposal', count: 42, value: 1250000 },
        { name: 'Negotiation', count: 18, value: 720000 },
        { name: 'Closed', count: 12, value: 480000 },
      ],
      conversion_rate: 8.3,
    }),
  },
  'widget_kpi_cards': {
    type: 'metric',
    ttl: 120,
    generator: () => ({
      cards: [
        { id: 'mrr', label: 'MRR', value: 1850000, format: 'currency', trend: 'up', change: 8.3 },
        { id: 'deals', label: 'Deals Won', value: 47, format: 'number', trend: 'up', change: 12 },
        { id: 'churn', label: 'Churn Rate', value: 1.8, format: 'percent', trend: 'down', change: -10 },
        { id: 'nps', label: 'NPS Score', value: 72, format: 'number', trend: 'stable', change: 2 },
      ],
    }),
  },
  'widget_activity_feed': {
    type: 'list',
    ttl: 60,
    generator: () => ({
      title: 'Recent Activity',
      items: [
        { id: 'act_1', type: 'deal_won', message: 'Deal closed: TechVentures ($250K)', time: '2 hours ago', icon: 'trophy' },
        { id: 'act_2', type: 'lead_created', message: 'New lead: GlobalRetail Corp', time: '3 hours ago', icon: 'user-plus' },
        { id: 'act_3', type: 'meeting', message: 'Demo scheduled with FinanceFirst', time: '4 hours ago', icon: 'calendar' },
        { id: 'act_4', type: 'email', message: 'Proposal sent to HealthCare Systems', time: '5 hours ago', icon: 'mail' },
        { id: 'act_5', type: 'call', message: 'Follow-up call completed with EduTech', time: '6 hours ago', icon: 'phone' },
      ],
      total_count: 156,
    }),
  },
  'widget_governance_status': {
    type: 'table',
    ttl: 300,
    generator: () => ({
      title: 'Governance Gates',
      columns: ['Gate', 'Status', 'Score'],
      rows: [
        { gate: 'G13', name: 'Determinism', status: 'pass', score: 100 },
        { gate: 'G14', name: 'Privacy', status: 'pass', score: 100 },
        { gate: 'G15', name: 'Federation', status: 'pass', score: 100 },
        { gate: 'G16', name: 'CI Evidence', status: 'pass', score: 100 },
        { gate: 'G17', name: 'Key Lifecycle', status: 'pass', score: 100 },
        { gate: 'G18', name: 'Runtime', status: 'pass', score: 100 },
        { gate: 'G19', name: 'Automation', status: 'pass', score: 100 },
        { gate: 'G20', name: 'Observatory', status: 'partial', score: 80 },
        { gate: 'G21', name: 'Genesis', status: 'pending', score: 0 },
      ],
      summary: { overall_score: 87, gates_passed: 7, gates_pending: 2 },
    }),
  },
  'widget_top_leads': {
    type: 'table',
    ttl: 180,
    generator: () => ({
      title: 'Top Critical Leads',
      columns: ['Name', 'Company', 'Value', 'Status'],
      rows: [
        { name: 'Sarah Chen', company: 'TechVentures', value: 250000, status: 'proposal', priority: 'critical' },
        { name: 'Emily Watson', company: 'FinanceFirst', value: 320000, status: 'qualified', priority: 'critical' },
        { name: 'Michael Rodriguez', company: 'GlobalRetail', value: 180000, status: 'negotiation', priority: 'critical' },
      ],
      total_value: 750000,
    }),
  },
  'widget_system_health': {
    type: 'metric',
    ttl: 60,
    generator: () => ({
      status: 'healthy',
      metrics: [
        { label: 'Uptime', value: 99.95, unit: '%', status: 'good' },
        { label: 'Response Time', value: 145, unit: 'ms', status: 'good' },
        { label: 'Error Rate', value: 0.05, unit: '%', status: 'good' },
        { label: 'Active Users', value: 342, unit: '', status: 'good' },
      ],
      last_check: new Date().toISOString(),
    }),
  },
};

function getWidgetData(widgetId: string, refresh: boolean): { data: Record<string, unknown>; cached: boolean; ttl: number } | null {
  const definition = WIDGET_DEFINITIONS[widgetId];
  if (!definition) return null;

  const cacheKey = widgetId;
  const cached = widgetCache.get(cacheKey);
  const now = Date.now();

  // Return cached data if valid and not forcing refresh
  if (!refresh && cached && (now - cached.timestamp) < (cached.ttl * 1000)) {
    return {
      data: cached.data,
      cached: true,
      ttl: Math.round((cached.ttl * 1000 - (now - cached.timestamp)) / 1000),
    };
  }

  // Generate fresh data
  const data = definition.generator();

  // Update cache
  widgetCache.set(cacheKey, {
    data,
    timestamp: now,
    ttl: definition.ttl,
  });

  return {
    data,
    cached: false,
    ttl: definition.ttl,
  };
}

export async function POST(request: NextRequest) {
  const tenantId = extractTenantFromJWT(request.headers.get('authorization')) || getDefaultTenant();
  const governance = createGovernanceContext(tenantId, 'G13');

  try {
    const body = await request.json();
    const parseResult = GetWidgetDataInputSchema.safeParse(body);

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

    const result = await withGovernance<typeof parseResult.data, GetWidgetDataOutput>(
      'getWidgetData',
      parseResult.data,
      governance,
      async (input) => {
        const { widget_id, refresh } = input;

        const widgetResult = getWidgetData(widget_id, refresh);
        if (!widgetResult) {
          const error = new Error(`Widget not found: ${widget_id}`);
          (error as any).code = ErrorCodes.NOT_FOUND;
          throw error;
        }

        const definition = WIDGET_DEFINITIONS[widget_id];

        return {
          widget_id,
          widget_type: definition.type,
          data: widgetResult.data,
          cached: widgetResult.cached,
          cache_ttl: widgetResult.ttl,
          rendered_at: new Date().toISOString(),
        };
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    const errorCode = (error as any).code || ErrorCodes.INTERNAL_ERROR;
    const status = errorCode === ErrorCodes.NOT_FOUND ? 404 : 500;

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: errorCode,
          message: (error as Error).message,
        },
        governance,
      },
      { status }
    );
  }
}

// GET endpoint to list available widgets
export async function GET(request: NextRequest) {
  const tenantId = extractTenantFromJWT(request.headers.get('authorization')) || getDefaultTenant();
  const governance = createGovernanceContext(tenantId, 'G13');

  const widgets = Object.entries(WIDGET_DEFINITIONS).map(([id, def]) => ({
    widget_id: id,
    widget_type: def.type,
    cache_ttl: def.ttl,
  }));

  return NextResponse.json({
    success: true,
    data: { widgets },
    error: null,
    governance,
  });
}
