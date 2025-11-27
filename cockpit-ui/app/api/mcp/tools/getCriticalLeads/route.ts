/**
 * MCP Tool: getCriticalLeads
 *
 * Returns critical and high-priority leads requiring attention.
 * Supports filtering by priority and sorting options.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GetCriticalLeadsInputSchema, type GetCriticalLeadsOutput, type Lead } from '@/lib/mcp/schemas';
import {
  createGovernanceContext,
  extractTenantFromJWT,
  getDefaultTenant,
  withGovernance,
  ErrorCodes,
} from '@/lib/mcp/governance';

export const runtime = 'nodejs';

// Demo leads data
const DEMO_LEADS: Lead[] = [
  {
    id: 'lead_001',
    name: 'Sarah Chen',
    company: 'TechVentures Inc',
    email: 'sarah.chen@techventures.example',
    phone: '+1-555-0101',
    value: 250000,
    priority: 'critical',
    status: 'proposal',
    created_at: '2024-10-15T09:00:00Z',
    updated_at: '2024-11-25T14:30:00Z',
    assigned_to: 'rep_james',
    tags: ['enterprise', 'q4-target', 'expansion'],
  },
  {
    id: 'lead_002',
    name: 'Michael Rodriguez',
    company: 'GlobalRetail Corp',
    email: 'mrodriguez@globalretail.example',
    phone: '+1-555-0102',
    value: 180000,
    priority: 'critical',
    status: 'negotiation',
    created_at: '2024-09-20T11:00:00Z',
    updated_at: '2024-11-26T10:15:00Z',
    assigned_to: 'rep_lisa',
    tags: ['retail', 'renewal', 'at-risk'],
  },
  {
    id: 'lead_003',
    name: 'Emily Watson',
    company: 'FinanceFirst Ltd',
    email: 'ewatson@financefirst.example',
    phone: '+1-555-0103',
    value: 320000,
    priority: 'critical',
    status: 'qualified',
    created_at: '2024-11-01T08:30:00Z',
    updated_at: '2024-11-27T09:00:00Z',
    assigned_to: 'rep_james',
    tags: ['finance', 'new-logo', 'fast-track'],
  },
  {
    id: 'lead_004',
    name: 'David Kim',
    company: 'HealthCare Systems',
    email: 'dkim@healthcaresys.example',
    phone: '+1-555-0104',
    value: 150000,
    priority: 'high',
    status: 'proposal',
    created_at: '2024-10-25T10:00:00Z',
    updated_at: '2024-11-24T16:45:00Z',
    assigned_to: 'rep_mike',
    tags: ['healthcare', 'compliance'],
  },
  {
    id: 'lead_005',
    name: 'Jennifer Lee',
    company: 'EduTech Solutions',
    email: 'jlee@edutech.example',
    phone: '+1-555-0105',
    value: 95000,
    priority: 'high',
    status: 'qualified',
    created_at: '2024-11-10T14:00:00Z',
    updated_at: '2024-11-26T11:30:00Z',
    assigned_to: 'rep_lisa',
    tags: ['education', 'growth'],
  },
  {
    id: 'lead_006',
    name: 'Robert Martinez',
    company: 'Manufacturing Plus',
    email: 'rmartinez@mfgplus.example',
    phone: '+1-555-0106',
    value: 210000,
    priority: 'high',
    status: 'negotiation',
    created_at: '2024-09-15T09:30:00Z',
    updated_at: '2024-11-25T17:00:00Z',
    assigned_to: 'rep_james',
    tags: ['manufacturing', 'expansion'],
  },
  {
    id: 'lead_007',
    name: 'Amanda Foster',
    company: 'StartupHub',
    email: 'afoster@startuphub.example',
    phone: '+1-555-0107',
    value: 45000,
    priority: 'medium',
    status: 'contacted',
    created_at: '2024-11-15T13:00:00Z',
    updated_at: '2024-11-26T09:00:00Z',
    assigned_to: 'rep_mike',
    tags: ['startup', 'potential'],
  },
  {
    id: 'lead_008',
    name: 'Christopher Brown',
    company: 'LogiTrans Inc',
    email: 'cbrown@logitrans.example',
    phone: '+1-555-0108',
    value: 175000,
    priority: 'high',
    status: 'proposal',
    created_at: '2024-10-05T11:30:00Z',
    updated_at: '2024-11-27T08:15:00Z',
    assigned_to: 'rep_lisa',
    tags: ['logistics', 'integration'],
  },
];

export async function POST(request: NextRequest) {
  const tenantId = extractTenantFromJWT(request.headers.get('authorization')) || getDefaultTenant();
  const governance = createGovernanceContext(tenantId, 'G13');

  try {
    const body = await request.json();
    const parseResult = GetCriticalLeadsInputSchema.safeParse(body);

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

    const result = await withGovernance<typeof parseResult.data, GetCriticalLeadsOutput>(
      'getCriticalLeads',
      parseResult.data,
      governance,
      async (input) => {
        const { limit, priority, sort_by } = input;

        // Filter by priority
        let filtered = DEMO_LEADS;
        if (priority !== 'all') {
          const priorityLevels: Record<string, string[]> = {
            critical: ['critical'],
            high: ['critical', 'high'],
            medium: ['critical', 'high', 'medium'],
          };
          const allowedPriorities = priorityLevels[priority] || ['critical'];
          filtered = DEMO_LEADS.filter(lead => allowedPriorities.includes(lead.priority));
        }

        // Sort
        const sortFunctions: Record<string, (a: Lead, b: Lead) => number> = {
          value: (a, b) => b.value - a.value,
          urgency: (a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          },
          created_at: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        };
        filtered.sort(sortFunctions[sort_by] || sortFunctions.urgency);

        // Apply limit
        const leads = filtered.slice(0, limit);
        const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);

        return {
          leads,
          total: filtered.length,
          total_value: totalValue,
          has_more: filtered.length > limit,
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

  const result = await withGovernance<{}, GetCriticalLeadsOutput>(
    'getCriticalLeads',
    { limit: 20, priority: 'critical', sort_by: 'urgency' },
    governance,
    async () => {
      const critical = DEMO_LEADS.filter(l => l.priority === 'critical');
      return {
        leads: critical,
        total: critical.length,
        total_value: critical.reduce((sum, l) => sum + l.value, 0),
        has_more: false,
      };
    }
  );

  return NextResponse.json(result);
}
