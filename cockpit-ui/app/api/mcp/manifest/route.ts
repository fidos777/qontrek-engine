/**
 * MCP Manifest Route
 *
 * Provides the Model Context Protocol manifest for Qontrek MCP v2.0.
 * Exposes available tools and their schemas for AI agent integration.
 *
 * GET  /api/mcp/manifest - Retrieve the MCP manifest with available tools
 * POST /api/mcp/manifest - Execute an MCP tool
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  mcpGetTenantOntology,
  mcpUpdateTenantOntology,
  getSchemaVersion,
} from '@/lib/ontology';

// =============================================================================
// Route Configuration
// =============================================================================

export const dynamic = 'force-dynamic';

// =============================================================================
// Tool Definitions
// =============================================================================

/**
 * MCP Tool: getTenantOntology
 * Retrieves the complete domain ontology for a tenant.
 */
const GET_TENANT_ONTOLOGY_TOOL = {
  name: 'getTenantOntology',
  description:
    'Retrieves the complete domain ontology for a specific tenant. ' +
    'Returns entity definitions, workflows, and metrics that define ' +
    'the tenant\'s business domain model.',
  inputSchema: {
    type: 'object',
    properties: {
      tenantId: {
        type: 'string',
        format: 'uuid',
        description: 'The UUID of the tenant to retrieve ontology for',
      },
    },
    required: ['tenantId'],
    additionalProperties: false,
  },
};

/**
 * MCP Tool: updateTenantOntology
 * Creates or updates the domain ontology for a tenant.
 */
const UPDATE_TENANT_ONTOLOGY_TOOL = {
  name: 'updateTenantOntology',
  description:
    'Creates or updates the domain ontology for a specific tenant. ' +
    'Allows setting entity definitions, workflows, and metrics that ' +
    'define the tenant\'s business domain model. Supports partial updates.',
  inputSchema: {
    type: 'object',
    properties: {
      tenantId: {
        type: 'string',
        format: 'uuid',
        description: 'The UUID of the tenant to update',
      },
      domain: {
        type: 'string',
        description:
          'Domain identifier (e.g., "crm", "ecommerce", "finance")',
      },
      entities: {
        type: 'array',
        description: 'Array of entity definitions',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique entity identifier' },
            name: { type: 'string', description: 'Human-readable entity name' },
            description: { type: 'string', description: 'Entity description' },
            attributes: {
              type: 'array',
              description: 'Entity attributes/fields',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: {
                    type: 'string',
                    enum: [
                      'string',
                      'number',
                      'integer',
                      'boolean',
                      'date',
                      'datetime',
                      'uuid',
                      'jsonb',
                      'array',
                      'enum',
                    ],
                  },
                  required: { type: 'boolean' },
                  description: { type: 'string' },
                },
                required: ['name', 'type'],
              },
            },
            relationships: {
              type: 'array',
              description: 'Relationships to other entities',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  targetEntity: { type: 'string' },
                  cardinality: {
                    type: 'string',
                    enum: [
                      'one-to-one',
                      'one-to-many',
                      'many-to-one',
                      'many-to-many',
                    ],
                  },
                },
                required: ['name', 'targetEntity', 'cardinality'],
              },
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Metadata tags for categorization',
            },
          },
          required: ['id', 'name', 'attributes'],
        },
      },
      workflows: {
        type: 'array',
        description: 'Array of workflow definitions',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique workflow identifier' },
            name: { type: 'string', description: 'Workflow name' },
            description: { type: 'string', description: 'Workflow description' },
            entityId: {
              type: 'string',
              description: 'Entity this workflow operates on',
            },
            stages: {
              type: 'array',
              description: 'Workflow stages',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  order: { type: 'number' },
                  transitions: { type: 'array', items: { type: 'string' } },
                },
                required: ['id', 'name', 'order'],
              },
            },
            active: { type: 'boolean', description: 'Whether workflow is active' },
          },
          required: ['id', 'name', 'entityId', 'stages', 'active'],
        },
      },
      metrics: {
        type: 'array',
        description: 'Array of metric definitions',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique metric identifier' },
            name: { type: 'string', description: 'Metric name' },
            description: { type: 'string', description: 'What the metric measures' },
            entityId: {
              type: 'string',
              description: 'Entity the metric is calculated from',
            },
            aggregation: {
              type: 'string',
              enum: [
                'count',
                'sum',
                'avg',
                'min',
                'max',
                'distinct_count',
                'percentage',
                'ratio',
              ],
              description: 'Metric calculation type',
            },
            field: {
              type: 'string',
              description: 'Field to aggregate (for non-count aggregations)',
            },
            unit: { type: 'string', description: 'Unit of measurement' },
            category: { type: 'string', description: 'Metric category for grouping' },
          },
          required: ['id', 'name', 'entityId', 'aggregation'],
        },
      },
    },
    required: ['tenantId'],
    additionalProperties: false,
  },
};

// =============================================================================
// Manifest Definition
// =============================================================================

const MCP_MANIFEST = {
  name: 'qontrek-mcp',
  version: '2.0.0',
  description:
    'Qontrek Model Context Protocol for tenant domain ontology management',
  schemaVersion: getSchemaVersion(),
  tools: [GET_TENANT_ONTOLOGY_TOOL, UPDATE_TENANT_ONTOLOGY_TOOL],
  resources: [
    {
      type: 'ontology',
      description: 'Tenant domain ontology definitions',
      endpoint: '/api/mcp/tenant/{tenantId}/ontology',
      methods: ['GET', 'PUT'],
    },
    {
      type: 'governance',
      description: 'Governance KPI snapshot',
      endpoint: '/api/mcp/governance',
      methods: ['GET'],
    },
    {
      type: 'health',
      description: 'Health check with SLO/SLI metrics',
      endpoint: '/api/mcp/healthz',
      methods: ['GET'],
    },
    {
      type: 'logs',
      description: 'MCP operation logs',
      endpoint: '/api/mcp/tail',
      methods: ['GET'],
    },
  ],
};

// =============================================================================
// GET Handler - Returns MCP Manifest
// =============================================================================

/**
 * GET /api/mcp/manifest
 *
 * Returns the complete MCP manifest including all available tools
 * and their input schemas.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(MCP_MANIFEST);
}

// =============================================================================
// POST Handler - Execute MCP Tool
// =============================================================================

/**
 * POST /api/mcp/manifest
 *
 * Executes an MCP tool by name with the provided arguments.
 * This provides a unified interface for tool invocation.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request structure
    if (!body.tool || typeof body.tool !== 'string') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing or invalid "tool" field. Expected tool name string.',
        },
        { status: 400 }
      );
    }

    if (!body.arguments || typeof body.arguments !== 'object') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing or invalid "arguments" field. Expected object.',
        },
        { status: 400 }
      );
    }

    // Route to appropriate tool handler
    switch (body.tool) {
      case 'getTenantOntology': {
        const result = await mcpGetTenantOntology(body.arguments);
        return NextResponse.json(result, {
          status: result.ok ? 200 : 404,
        });
      }

      case 'updateTenantOntology': {
        const result = await mcpUpdateTenantOntology(body.arguments);
        return NextResponse.json(result, {
          status: result.ok ? 200 : 400,
        });
      }

      default:
        return NextResponse.json(
          {
            ok: false,
            error: `Unknown tool: ${body.tool}`,
            availableTools: MCP_MANIFEST.tools.map((t) => t.name),
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('MCP manifest POST error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
