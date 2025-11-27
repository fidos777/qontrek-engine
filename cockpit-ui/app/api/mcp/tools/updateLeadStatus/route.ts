/**
 * MCP Tool: updateLeadStatus
 *
 * Updates the status of a lead with optional note.
 * Logs status change for audit trail.
 */

import { NextRequest, NextResponse } from 'next/server';
import { UpdateLeadStatusInputSchema, type UpdateLeadStatusOutput } from '@/lib/mcp/schemas';
import {
  createGovernanceContext,
  extractTenantFromJWT,
  getDefaultTenant,
  withGovernance,
  ErrorCodes,
} from '@/lib/mcp/governance';

export const runtime = 'nodejs';

// In-memory lead status store (for demo)
const leadStatuses: Record<string, string> = {
  lead_001: 'proposal',
  lead_002: 'negotiation',
  lead_003: 'qualified',
};

export async function POST(request: NextRequest) {
  const tenantId = extractTenantFromJWT(request.headers.get('authorization')) || getDefaultTenant();
  const governance = createGovernanceContext(tenantId, 'G13');

  try {
    const body = await request.json();
    const parseResult = UpdateLeadStatusInputSchema.safeParse(body);

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

    const result = await withGovernance<typeof parseResult.data, UpdateLeadStatusOutput>(
      'updateLeadStatus',
      parseResult.data,
      governance,
      async (input) => {
        const { lead_id, status, note } = input;

        // Validate lead exists (in production, check database)
        if (!lead_id.startsWith('lead_')) {
          const error = new Error(`Lead not found: ${lead_id}`);
          (error as any).code = ErrorCodes.NOT_FOUND;
          throw error;
        }

        // Get previous status
        const previousStatus = leadStatuses[lead_id] || 'new';

        // Validate status transition (optional business logic)
        const validTransitions: Record<string, string[]> = {
          new: ['contacted', 'qualified', 'lost'],
          contacted: ['qualified', 'lost'],
          qualified: ['proposal', 'lost'],
          proposal: ['negotiation', 'won', 'lost'],
          negotiation: ['won', 'lost'],
          won: [],
          lost: ['new'], // Allow reopening
        };

        const allowed = validTransitions[previousStatus] || [];
        if (previousStatus !== status && !allowed.includes(status)) {
          const error = new Error(
            `Invalid status transition from '${previousStatus}' to '${status}'. Allowed: ${allowed.join(', ')}`
          );
          (error as any).code = ErrorCodes.INVALID_INPUT;
          throw error;
        }

        // Update status
        leadStatuses[lead_id] = status;

        // In production, also:
        // 1. Update database
        // 2. Create activity record
        // 3. Send notifications if configured
        // 4. Log to audit trail

        return {
          lead_id,
          previous_status: previousStatus,
          new_status: status,
          updated_at: new Date().toISOString(),
          updated_by: tenantId, // In production, extract user from JWT
        };
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    const errorCode = (error as any).code || ErrorCodes.INTERNAL_ERROR;
    const status = errorCode === ErrorCodes.NOT_FOUND ? 404 : errorCode === ErrorCodes.INVALID_INPUT ? 400 : 500;

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
