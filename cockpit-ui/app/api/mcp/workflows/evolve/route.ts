import { NextRequest, NextResponse } from 'next/server';
import {
  cloneWorkflow,
  mutateWorkflow,
  rollbackWorkflow,
  listWorkflowVersions,
  storeWorkflowVersion,
} from '@/lib/workflows';
import type {
  EvolveWorkflowRequest,
  EvolveWorkflowResponse,
  ListWorkflowVersionsRequest,
  ListWorkflowVersionsResponse,
  WorkflowDefinition,
} from '@/types/workflows';

/**
 * POST /api/mcp/workflows/evolve
 *
 * Evolve a workflow using the specified action:
 * - clone: Create an exact copy with a new version
 * - mutate: Create a mutated version with applied mutations
 * - rollback: Revert to a previous version based on score
 *
 * Request body:
 * {
 *   tenantId: string;
 *   workflowName: string;
 *   action: 'clone' | 'mutate' | 'rollback';
 *   targetScore?: number;       // For rollback
 *   mutationRules?: string[];   // For mutate
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EvolveWorkflowRequest;

    // Validate required fields
    if (!body.tenantId || !body.workflowName || !body.action) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing required fields: tenantId, workflowName, action',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validate action
    if (!['clone', 'mutate', 'rollback'].includes(body.action)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid action: ${body.action}. Must be one of: clone, mutate, rollback`,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Execute the appropriate action
    let result;

    switch (body.action) {
      case 'clone':
        result = await cloneWorkflow(body.tenantId, body.workflowName, {
          activateClone: false,
        });
        break;

      case 'mutate':
        result = await mutateWorkflow(body.tenantId, body.workflowName, {
          mutationRules: body.mutationRules,
          activateMutant: false,
        });
        break;

      case 'rollback':
        result = await rollbackWorkflow(body.tenantId, body.workflowName, {
          targetScore: body.targetScore,
          activateRollback: true,
        });
        break;
    }

    const response: EvolveWorkflowResponse = {
      ok: result.success,
      result,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      status: result.success ? 200 : 422,
    });
  } catch (error) {
    console.error('Evolve workflow error:', error);
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

/**
 * GET /api/mcp/workflows/evolve
 *
 * List workflow versions with optional filtering.
 *
 * Query params:
 * - tenantId: string (required)
 * - workflowName?: string
 * - limit?: number (default: 50)
 * - offset?: number (default: 0)
 * - sortBy?: 'version' | 'score' | 'createdAt'
 * - sortOrder?: 'asc' | 'desc'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const tenantId = searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing required query param: tenantId',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const params: ListWorkflowVersionsRequest = {
      tenantId,
      workflowName: searchParams.get('workflowName') || undefined,
      limit: parseInt(searchParams.get('limit') || '50', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
      sortBy: (searchParams.get('sortBy') as 'version' | 'score' | 'createdAt') || 'version',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    const { versions, total } = await listWorkflowVersions(tenantId, {
      workflowName: params.workflowName,
      limit: params.limit,
      offset: params.offset,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });

    const response: ListWorkflowVersionsResponse = {
      ok: true,
      versions,
      total,
      hasMore: (params.offset || 0) + versions.length < total,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('List workflow versions error:', error);
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

/**
 * PUT /api/mcp/workflows/evolve
 *
 * Create a new initial workflow version.
 *
 * Request body:
 * {
 *   tenantId: string;
 *   workflowName: string;
 *   definition: WorkflowDefinition;
 *   isActive?: boolean;
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      tenantId: string;
      workflowName: string;
      definition: WorkflowDefinition;
      isActive?: boolean;
    };

    // Validate required fields
    if (!body.tenantId || !body.workflowName || !body.definition) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing required fields: tenantId, workflowName, definition',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validate definition structure
    if (!body.definition.name || !Array.isArray(body.definition.nodes)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid definition: must have name and nodes array',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const newVersion = await storeWorkflowVersion(
      body.tenantId,
      body.workflowName,
      body.definition,
      {
        mutationType: 'initial',
        isActive: body.isActive ?? true,
      }
    );

    return NextResponse.json({
      ok: true,
      version: newVersion,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Create workflow version error:', error);
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
