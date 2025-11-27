/**
 * MCP Tool: triggerWorkflow
 *
 * POST /api/mcp/tools/triggerWorkflow
 * Trigger a workflow execution, either manually or based on an event.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractAuthContext,
  logToolInvocation,
  createSuccessResponse,
  createErrorResponse,
  parseRequestBody,
  getCurrentTimestamp,
  generateId,
  DEMO_WORKFLOWS,
  logProofEvent,
} from '@/lib/mcp';
import { TriggerWorkflowInputSchema } from '@/lib/mcp/schemas';

export const runtime = 'nodejs';

const TOOL_NAME = 'triggerWorkflow';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const authContext = extractAuthContext(request.headers);

  try {
    // Parse and validate input
    const rawInput = await parseRequestBody<Record<string, unknown>>(request);
    const input = TriggerWorkflowInputSchema.parse(rawInput);

    // Find workflow
    const workflow = DEMO_WORKFLOWS.find(w => w.id === input.workflow_id);

    if (!workflow) {
      const governance = await logToolInvocation(TOOL_NAME, authContext, input, false);

      return NextResponse.json(
        createErrorResponse(
          TOOL_NAME,
          'NOT_FOUND',
          `Workflow with ID ${input.workflow_id} not found`,
          governance,
          startTime,
          { execution_id: '', workflow_id: input.workflow_id, status: 'failed' as const, started_at: '' }
        ),
        { status: 404 }
      );
    }

    // Generate execution ID
    const executionId = generateId();
    const startedAt = getCurrentTimestamp();

    // Log the workflow trigger to proof chain
    await logProofEvent(
      authContext.tenant_id,
      'workflow_triggered',
      { id: authContext.user_id, type: authContext.is_demo ? 'system' : 'user' },
      { id: input.workflow_id, type: 'workflow', name: workflow.name },
      {
        execution_id: executionId,
        trigger_type: input.trigger_type,
        context: input.context,
      }
    );

    // Log tool invocation
    const governance = await logToolInvocation(TOOL_NAME, authContext, input, true);

    // Build response
    const data = {
      execution_id: executionId,
      workflow_id: input.workflow_id,
      status: 'queued' as const,
      started_at: startedAt,
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
        { execution_id: '', workflow_id: '', status: 'failed' as const, started_at: '' }
      ),
      { status: 400 }
    );
  }
}
