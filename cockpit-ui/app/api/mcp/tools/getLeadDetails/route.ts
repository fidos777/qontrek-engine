/**
 * MCP Tool: getLeadDetails
 *
 * Returns detailed information about a specific lead.
 * Includes activity history and related leads.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GetLeadDetailsInputSchema, type GetLeadDetailsOutput, type Lead, type LeadActivity, type LeadHistory } from '@/lib/mcp/schemas';
import {
  createGovernanceContext,
  extractTenantFromJWT,
  getDefaultTenant,
  withGovernance,
  ErrorCodes,
} from '@/lib/mcp/governance';

export const runtime = 'nodejs';

// Demo lead data
const DEMO_LEAD: Lead = {
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
  metadata: {
    source: 'inbound_marketing',
    campaign: 'q4_enterprise_push',
    score: 92,
    last_contact_method: 'video_call',
  },
};

const DEMO_ACTIVITIES: LeadActivity[] = [
  {
    id: 'act_001',
    type: 'meeting',
    description: 'Product demo with technical team - discussed integration requirements',
    performed_by: 'rep_james',
    performed_at: '2024-11-25T14:00:00Z',
    metadata: { duration_minutes: 60, attendees: 4 },
  },
  {
    id: 'act_002',
    type: 'email',
    description: 'Sent revised proposal with custom pricing tier',
    performed_by: 'rep_james',
    performed_at: '2024-11-22T10:30:00Z',
    metadata: { template: 'enterprise_proposal_v2' },
  },
  {
    id: 'act_003',
    type: 'call',
    description: 'Follow-up call to address security questions',
    performed_by: 'rep_james',
    performed_at: '2024-11-20T15:00:00Z',
    metadata: { duration_minutes: 25, outcome: 'positive' },
  },
  {
    id: 'act_004',
    type: 'note',
    description: 'Client mentioned budget approval expected by end of month',
    performed_by: 'rep_james',
    performed_at: '2024-11-18T09:00:00Z',
  },
  {
    id: 'act_005',
    type: 'status_change',
    description: 'Moved from Qualified to Proposal stage',
    performed_by: 'system',
    performed_at: '2024-11-15T11:00:00Z',
  },
];

const DEMO_HISTORY: LeadHistory[] = [
  {
    id: 'hist_001',
    field: 'status',
    old_value: 'qualified',
    new_value: 'proposal',
    changed_by: 'rep_james',
    changed_at: '2024-11-15T11:00:00Z',
  },
  {
    id: 'hist_002',
    field: 'value',
    old_value: '200000',
    new_value: '250000',
    changed_by: 'rep_james',
    changed_at: '2024-11-10T14:30:00Z',
  },
  {
    id: 'hist_003',
    field: 'priority',
    old_value: 'high',
    new_value: 'critical',
    changed_by: 'manager_sarah',
    changed_at: '2024-11-08T09:00:00Z',
  },
  {
    id: 'hist_004',
    field: 'assigned_to',
    old_value: 'rep_mike',
    new_value: 'rep_james',
    changed_by: 'manager_sarah',
    changed_at: '2024-10-20T10:00:00Z',
  },
];

const RELATED_LEADS = [
  { id: 'lead_010', name: 'Tom Wilson (TechVentures)', relation: 'same_company' },
  { id: 'lead_015', name: 'Lisa Park (TechVentures)', relation: 'same_company' },
  { id: 'lead_022', name: 'Mike Johnson', relation: 'referred_by' },
];

export async function POST(request: NextRequest) {
  const tenantId = extractTenantFromJWT(request.headers.get('authorization')) || getDefaultTenant();
  const governance = createGovernanceContext(tenantId, 'G13');

  try {
    const body = await request.json();
    const parseResult = GetLeadDetailsInputSchema.safeParse(body);

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

    const result = await withGovernance<typeof parseResult.data, GetLeadDetailsOutput>(
      'getLeadDetails',
      parseResult.data,
      governance,
      async (input) => {
        const { lead_id, include_history, include_activities } = input;

        // In production, fetch from database
        // For demo, return mock data for any lead_id
        if (!lead_id.startsWith('lead_')) {
          const error = new Error(`Lead not found: ${lead_id}`);
          (error as any).code = ErrorCodes.NOT_FOUND;
          throw error;
        }

        const response: GetLeadDetailsOutput = {
          lead: { ...DEMO_LEAD, id: lead_id },
          related_leads: RELATED_LEADS,
        };

        if (include_activities) {
          response.activities = DEMO_ACTIVITIES;
        }

        if (include_history) {
          response.history = DEMO_HISTORY;
        }

        return response;
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
