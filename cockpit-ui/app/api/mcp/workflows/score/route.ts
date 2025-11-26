import { NextRequest, NextResponse } from 'next/server';
import { scoreWorkflow, checkAutoRollback } from '@/lib/workflows';
import type { WorkflowScoreMetrics, ScoreWeights } from '@/types/workflows';

/**
 * POST /api/mcp/workflows/score
 *
 * Update the score of a workflow version based on execution metrics.
 * Optionally triggers auto-rollback if score drops below threshold.
 *
 * Request body:
 * {
 *   versionId: string;
 *   metrics: WorkflowScoreMetrics;
 *   weights?: ScoreWeights;
 *   autoRollback?: {
 *     enabled: boolean;
 *     tenantId: string;
 *     workflowName: string;
 *   };
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      versionId: string;
      metrics: WorkflowScoreMetrics;
      weights?: Partial<ScoreWeights>;
      autoRollback?: {
        enabled: boolean;
        tenantId: string;
        workflowName: string;
      };
    };

    // Validate required fields
    if (!body.versionId || !body.metrics) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing required fields: versionId, metrics',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validate metrics
    if (
      typeof body.metrics.executionTime !== 'number' ||
      typeof body.metrics.successRate !== 'number' ||
      typeof body.metrics.errorCount !== 'number'
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid metrics: executionTime, successRate, errorCount are required numbers',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Calculate and update score
    const score = await scoreWorkflow(body.versionId, body.metrics, body.weights);

    // Check for auto-rollback if enabled
    let rollbackResult = null;
    if (body.autoRollback?.enabled && body.autoRollback.tenantId && body.autoRollback.workflowName) {
      rollbackResult = await checkAutoRollback(
        body.autoRollback.tenantId,
        body.autoRollback.workflowName
      );
    }

    return NextResponse.json({
      ok: true,
      score,
      versionId: body.versionId,
      rollback: rollbackResult
        ? {
            triggered: true,
            result: rollbackResult,
          }
        : {
            triggered: false,
          },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Score workflow error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
