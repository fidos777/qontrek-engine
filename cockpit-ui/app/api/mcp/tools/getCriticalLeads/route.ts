/**
 * MCP Tool: getCriticalLeads
 *
 * POST /api/mcp/tools/getCriticalLeads
 * Get leads requiring immediate attention, sorted by priority or value.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractAuthContext,
  logToolInvocation,
  createSuccessResponse,
  createErrorResponse,
  parseRequestBody,
  DEMO_LEADS,
  filterLeadsByPriority,
  sortLeads,
} from '@/lib/mcp';
import { GetCriticalLeadsInputSchema } from '@/lib/mcp/schemas';

export const runtime = 'nodejs';

const TOOL_NAME = 'getCriticalLeads';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const authContext = extractAuthContext(request.headers);

  try {
    // Parse and validate input
    const rawInput = await parseRequestBody<Record<string, unknown>>(request);
    const input = GetCriticalLeadsInputSchema.parse(rawInput ?? {});

    // Filter and sort leads
    let leads = filterLeadsByPriority(DEMO_LEADS, input.priority ?? 'critical');
    leads = sortLeads(leads, input.sort_by ?? 'days_overdue');

    // Apply limit
    const limit = input.limit ?? 10;
    const limitedLeads = leads.slice(0, limit);

    // Transform to output format
    const outputLeads = limitedLeads.map(lead => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      stage: lead.stage,
      amount_rm: lead.amount_rm,
      days_overdue: lead.days_overdue,
      next_action: lead.next_action,
    }));

    // Log tool invocation
    const governance = await logToolInvocation(TOOL_NAME, authContext, input, true);

    // Build response
    const data = {
      leads: outputLeads,
      total: outputLeads.length,
    };

    return NextResponse.json(
      createSuccessResponse(TOOL_NAME, data, governance, startTime)
    );
  } catch (error) {
    const governance = await logToolInvocation(TOOL_NAME, authContext, {}, false);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      createErrorResponse(
        TOOL_NAME,
        'VALIDATION_ERROR',
        errorMessage,
        governance,
        startTime,
        { leads: [], total: 0 }
      ),
      { status: 400 }
    );
  }
}
