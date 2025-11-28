import { NextRequest, NextResponse } from 'next/server';
import type { WidgetDataEnvelope } from '@/lib/widgets/types';
import { getMockDataForWidget } from '@/lib/widgets/whatsapp/mock-data';

/**
 * GET /api/mcp/tools/getWidgetData
 *
 * Returns widget-specific data for dashboard rendering.
 * Supports both core widgets and WhatsApp widgets.
 *
 * Query parameters:
 *   - widget_type: The type of widget (e.g., "trust_meter", "whatsapp:session_card")
 *   - Additional params passed through to the data source
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const widgetType = searchParams.get('widget_type');

    if (!widgetType) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing required parameter: widget_type',
        },
        { status: 400 }
      );
    }

    // Get data based on widget type
    const data = getWidgetData(widgetType, Object.fromEntries(searchParams));

    const envelope: WidgetDataEnvelope = {
      ok: true,
      rel: `widget_${widgetType.replace(':', '_')}_v1.json`,
      source: 'fallback', // Demo data
      widget_type: widgetType,
      schema_version: '1.0.0',
      data,
      last_updated: new Date().toISOString(),
    };

    return NextResponse.json(envelope);
  } catch (error) {
    console.error('getWidgetData error:', error);
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
 * Get mock/demo data for a specific widget type
 */
function getWidgetData(
  widgetType: string,
  _params: Record<string, string>
): Record<string, unknown> {
  // WhatsApp widgets
  if (widgetType.startsWith('whatsapp:')) {
    return getMockDataForWidget(widgetType);
  }

  // Core widgets
  switch (widgetType) {
    case 'trust_meter':
      return getTrustMeterData();

    case 'pipeline_funnel':
      return getPipelineFunnelData();

    case 'recovery_chart':
      return getRecoveryChartData();

    case 'lead_heatmap':
      return getLeadHeatmapData();

    case 'kpi_card':
      return getKpiCardData();

    case 'lead_table':
      return getLeadTableData();

    case 'reminder_list':
      return getReminderListData();

    case 'success_feed':
      return getSuccessFeedData();

    case 'governance_strip':
      return getGovernanceStripData();

    default:
      return { error: `Unknown widget type: ${widgetType}` };
  }
}

// Mock data generators for core widgets

function getTrustMeterData() {
  return {
    trust_index: 87,
    gates: [
      { id: 'G13', name: 'Determinism', status: 'pass' },
      { id: 'G14', name: 'Privacy', status: 'pass' },
      { id: 'G15', name: 'Federation', status: 'pass' },
      { id: 'G16', name: 'CI Evidence', status: 'pass' },
      { id: 'G17', name: 'Key Lifecycle', status: 'pass' },
      { id: 'G18', name: 'Federation Runtime', status: 'pass' },
      { id: 'G19', name: 'Ledger Automation', status: 'pass' },
      { id: 'G20', name: 'Observatory', status: 'partial' },
      { id: 'G21', name: 'Genesis', status: 'pending' },
    ],
    last_updated: new Date().toISOString(),
  };
}

function getPipelineFunnelData() {
  return {
    pipeline: {
      total_leads: 156,
      stages: [
        { name: 'New', count: 45, value: 450000 },
        { name: 'Contacted', count: 38, value: 380000 },
        { name: 'Qualified', count: 28, value: 560000 },
        { name: 'Proposal', count: 22, value: 660000 },
        { name: 'Negotiation', count: 15, value: 600000 },
        { name: 'Won', count: 8, value: 480000 },
      ],
      conversion_rate: 5.1,
      total_value: 3130000,
      avg_deal_size: 60000,
    },
  };
}

function getRecoveryChartData() {
  return {
    recovery: {
      total_recoverable: 285000,
      recovered_mtd: 125000,
      rate: 43.9,
      aging: [
        { bucket: '0-30 days', amount: 85000, count: 12 },
        { bucket: '31-60 days', amount: 95000, count: 8 },
        { bucket: '61-90 days', amount: 65000, count: 5 },
        { bucket: '90+ days', amount: 40000, count: 3 },
      ],
      trend: [
        { date: '2024-11-21', recovered: 15000 },
        { date: '2024-11-22', recovered: 22000 },
        { date: '2024-11-23', recovered: 8000 },
        { date: '2024-11-24', recovered: 18000 },
        { date: '2024-11-25', recovered: 25000 },
        { date: '2024-11-26', recovered: 20000 },
        { date: '2024-11-27', recovered: 17000 },
      ],
    },
  };
}

function getLeadHeatmapData() {
  return {
    heatmap: {
      data: generateHeatmapData(),
      peak_hours: '10:00 - 12:00',
      peak_day: 'Tuesday',
      total_interactions: 892,
      recommendation: 'Best time to contact: Tuesday 10-11 AM',
    },
  };
}

function generateHeatmapData() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM-7PM
  const data: Array<{ day: string; hour: number; value: number }> = [];

  for (const day of days) {
    for (const hour of hours) {
      // Simulate higher activity during business hours
      const isBusinessHour = hour >= 9 && hour <= 17;
      const isWeekend = day === 'Sat' || day === 'Sun';
      const baseValue = isWeekend ? 2 : isBusinessHour ? 15 : 5;
      data.push({
        day,
        hour,
        value: Math.floor(baseValue + Math.random() * 10),
      });
    }
  }
  return data;
}

function getKpiCardData() {
  return {
    kpi: {
      value: 156,
      label: 'Active Leads',
      trend: 12.5,
      target: 200,
      progress: 78,
    },
  };
}

function getLeadTableData() {
  return {
    leads: [
      {
        id: 'lead-001',
        name: 'Ahmad Razak',
        company: 'Seri Mutiara Builders',
        amount: 45000,
        stage: 'proposal',
        last_contact: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'lead-002',
        name: 'Siti Nurhaliza',
        company: 'Metro Solar Sdn Bhd',
        amount: 78000,
        stage: 'negotiation',
        last_contact: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: 'lead-003',
        name: 'Raj Kumar',
        company: 'KL Property Group',
        amount: 120000,
        stage: 'qualified',
        last_contact: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        id: 'lead-004',
        name: 'Tan Wei Ming',
        company: 'Sunshine Industries',
        amount: 35000,
        stage: 'contacted',
        last_contact: new Date(Date.now() - 345600000).toISOString(),
      },
      {
        id: 'lead-005',
        name: 'Fatimah Abdullah',
        company: 'Nusantara Holdings',
        amount: 95000,
        stage: 'new',
        last_contact: new Date(Date.now() - 432000000).toISOString(),
      },
    ],
  };
}

function getReminderListData() {
  return {
    reminders: [
      {
        id: 'rem-001',
        title: 'Follow up on quotation',
        lead_name: 'Ahmad Razak',
        due_at: new Date(Date.now() + 3600000).toISOString(),
        priority: 'high',
      },
      {
        id: 'rem-002',
        title: 'Send payment reminder',
        lead_name: 'Siti Nurhaliza',
        due_at: new Date(Date.now() + 7200000).toISOString(),
        priority: 'high',
      },
      {
        id: 'rem-003',
        title: 'Schedule site visit',
        lead_name: 'Raj Kumar',
        due_at: new Date(Date.now() + 86400000).toISOString(),
        priority: 'medium',
      },
      {
        id: 'rem-004',
        title: 'Check installation progress',
        lead_name: 'Tan Wei Ming',
        due_at: new Date(Date.now() + 172800000).toISOString(),
        priority: 'low',
      },
    ],
  };
}

function getSuccessFeedData() {
  return {
    successes: [
      {
        id: 'success-001',
        type: 'deal_won',
        description: 'Closed deal with Metro Solar',
        lead_name: 'Siti Nurhaliza',
        amount: 78000,
        achieved_at: new Date(Date.now() - 3600000).toISOString(),
        assigned_to: 'Ali Hassan',
      },
      {
        id: 'success-002',
        type: 'payment_received',
        description: 'Received payment from KL Property',
        lead_name: 'Raj Kumar',
        amount: 45000,
        achieved_at: new Date(Date.now() - 86400000).toISOString(),
        assigned_to: 'Sarah Tan',
      },
      {
        id: 'success-003',
        type: 'meeting_booked',
        description: 'Site visit scheduled',
        lead_name: 'Ahmad Razak',
        amount: 45000,
        achieved_at: new Date(Date.now() - 172800000).toISOString(),
        assigned_to: 'Ali Hassan',
      },
      {
        id: 'success-004',
        type: 'proposal_sent',
        description: 'Quotation sent to new lead',
        lead_name: 'Fatimah Abdullah',
        amount: 95000,
        achieved_at: new Date(Date.now() - 259200000).toISOString(),
        assigned_to: 'Sarah Tan',
      },
    ],
  };
}

function getGovernanceStripData() {
  return {
    gates: [
      { id: 'G13', status: 'pass' },
      { id: 'G14', status: 'pass' },
      { id: 'G15', status: 'pass' },
      { id: 'G16', status: 'pass' },
      { id: 'G17', status: 'pass' },
      { id: 'G18', status: 'pass' },
      { id: 'G19', status: 'pass' },
      { id: 'G20', status: 'partial' },
      { id: 'G21', status: 'pending' },
    ],
    overall_status: 'compliant',
    compliance_score: 87,
    last_audit: new Date(Date.now() - 604800000).toISOString(),
    next_review: new Date(Date.now() + 1209600000).toISOString(),
    governance_id: 'gov-001',
  };
}
