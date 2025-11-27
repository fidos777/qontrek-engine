/**
 * MCP Tool: triggerWorkflow
 *
 * Triggers execution of a defined workflow.
 * Supports manual, scheduled, and event-based triggers.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { TriggerWorkflowInputSchema, type TriggerWorkflowOutput } from '@/lib/mcp/schemas';
import {
  createGovernanceContext,
  extractTenantFromJWT,
  getDefaultTenant,
  withGovernance,
  ErrorCodes,
} from '@/lib/mcp/governance';

export const runtime = 'nodejs';

// Demo workflow definitions
const WORKFLOWS: Record<string, { name: string; avgDuration: number; enabled: boolean }> = {
  'wf_lead_nurture': { name: 'Lead Nurture Sequence', avgDuration: 7200000, enabled: true },
  'wf_onboarding': { name: 'Customer Onboarding', avgDuration: 86400000, enabled: true },
  'wf_renewal_reminder': { name: 'Renewal Reminder', avgDuration: 3600000, enabled: true },
  'wf_data_sync': { name: 'Data Synchronization', avgDuration: 300000, enabled: true },
  'wf_report_generation': { name: 'Daily Report Generation', avgDuration: 600000, enabled: true },
  'wf_compliance_check': { name: 'Compliance Audit', avgDuration: 1800000, enabled: true },
  'wf_proof_refresh': { name: 'Governance Proof Refresh', avgDuration: 120000, enabled: true },
  'wf_disabled_example': { name: 'Disabled Workflow', avgDuration: 0, enabled: false },
};

// In-memory execution store
const executions: Map<string, TriggerWorkflowOutput> = new Map();

export async function POST(request: NextRequest) {
  const tenantId = extractTenantFromJWT(request.headers.get('authorization')) || getDefaultTenant();
  const governance = createGovernanceContext(tenantId, 'G13');

  try {
    const body = await request.json();
    const parseResult = TriggerWorkflowInputSchema.safeParse(body);

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

    const result = await withGovernance<typeof parseResult.data, TriggerWorkflowOutput>(
      'triggerWorkflow',
      parseResult.data,
      governance,
      async (input) => {
        const { workflow_id, trigger_type, payload, priority } = input;

        // Validate workflow exists
        const workflow = WORKFLOWS[workflow_id];
        if (!workflow) {
          const error = new Error(`Workflow not found: ${workflow_id}`);
          (error as any).code = ErrorCodes.NOT_FOUND;
          throw error;
        }

        // Check if workflow is enabled
        if (!workflow.enabled) {
          const error = new Error(`Workflow is disabled: ${workflow_id}`);
          (error as any).code = ErrorCodes.WORKFLOW_FAILED;
          throw error;
        }

        // Generate execution ID
        const executionId = `exec_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
        const triggeredAt = new Date();

        // Calculate estimated completion based on priority
        const priorityMultipliers: Record<string, number> = {
          urgent: 0.5,
          high: 0.75,
          normal: 1.0,
          low: 1.5,
        };
        const estimatedDuration = workflow.avgDuration * (priorityMultipliers[priority] || 1.0);
        const estimatedCompletion = new Date(triggeredAt.getTime() + estimatedDuration);

        const execution: TriggerWorkflowOutput = {
          execution_id: executionId,
          workflow_id,
          status: 'queued',
          triggered_at: triggeredAt.toISOString(),
          estimated_completion: estimatedCompletion.toISOString(),
        };

        // Store execution (in production, persist to database)
        executions.set(executionId, execution);

        // Simulate async workflow start
        setTimeout(() => {
          const exec = executions.get(executionId);
          if (exec) {
            exec.status = 'running';
          }
        }, 500);

        // Simulate workflow completion (for demo)
        setTimeout(() => {
          const exec = executions.get(executionId);
          if (exec) {
            exec.status = 'completed';
          }
        }, Math.min(5000, estimatedDuration / 100));

        return execution;
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

// GET endpoint to check execution status
export async function GET(request: NextRequest) {
  const tenantId = extractTenantFromJWT(request.headers.get('authorization')) || getDefaultTenant();
  const governance = createGovernanceContext(tenantId, 'G13');

  const { searchParams } = new URL(request.url);
  const executionId = searchParams.get('execution_id');

  if (!executionId) {
    // Return list of available workflows
    const workflows = Object.entries(WORKFLOWS)
      .filter(([_, wf]) => wf.enabled)
      .map(([id, wf]) => ({ id, name: wf.name }));

    return NextResponse.json({
      success: true,
      data: { workflows },
      error: null,
      governance,
    });
  }

  const execution = executions.get(executionId);
  if (!execution) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: `Execution not found: ${executionId}`,
        },
        governance,
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: execution,
    error: null,
    governance,
  });
}
