import { NextResponse } from 'next/server';

/**
 * MCP Tool Manifest
 *
 * Provides a list of available MCP tools for workflow evolution.
 * Compatible with Claude's MCP (Model Context Protocol) tool discovery.
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

/**
 * GET /api/mcp/manifest
 *
 * Returns the MCP tool manifest with available workflow tools.
 */
export async function GET() {
  const tools: MCPTool[] = [
    {
      name: 'evolveWorkflow',
      description:
        'Evolve a workflow through cloning, mutation, or rollback. Supports evolutionary algorithm-based workflow optimization.',
      inputSchema: {
        type: 'object',
        properties: {
          tenantId: {
            type: 'string',
            description: 'The tenant ID owning the workflow',
          },
          workflowName: {
            type: 'string',
            description: 'Name of the workflow to evolve',
          },
          action: {
            type: 'string',
            enum: ['clone', 'mutate', 'rollback'],
            description:
              'Evolution action: clone (exact copy), mutate (apply mutations), rollback (revert to best score)',
          },
          targetScore: {
            type: 'number',
            description:
              'Target score threshold for rollback (optional, used with rollback action)',
          },
          mutationRules: {
            type: 'array',
            items: { type: 'string' },
            description:
              'List of mutation rule IDs to apply (optional, used with mutate action). Available: add_retry, add_timeout, add_error_handler, optimize_parallel, add_caching, add_logging, reorder_nodes',
          },
        },
        required: ['tenantId', 'workflowName', 'action'],
      },
    },
    {
      name: 'listWorkflowVersions',
      description:
        'List all versions of a workflow with their scores, mutation history, and metadata.',
      inputSchema: {
        type: 'object',
        properties: {
          tenantId: {
            type: 'string',
            description: 'The tenant ID owning the workflows',
          },
          workflowName: {
            type: 'string',
            description: 'Filter by specific workflow name (optional)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of versions to return (default: 50)',
          },
          offset: {
            type: 'number',
            description: 'Number of versions to skip for pagination (default: 0)',
          },
          sortBy: {
            type: 'string',
            enum: ['version', 'score', 'createdAt'],
            description: 'Field to sort by (default: version)',
          },
          sortOrder: {
            type: 'string',
            enum: ['asc', 'desc'],
            description: 'Sort order (default: desc)',
          },
        },
        required: ['tenantId'],
      },
    },
    {
      name: 'createWorkflow',
      description:
        'Create a new workflow with an initial version. The workflow definition follows the n8n-compatible format.',
      inputSchema: {
        type: 'object',
        properties: {
          tenantId: {
            type: 'string',
            description: 'The tenant ID that will own the workflow',
          },
          workflowName: {
            type: 'string',
            description: 'Name for the new workflow',
          },
          definition: {
            type: 'object',
            description:
              'Workflow definition with name, nodes array, connections array, and optional settings',
            properties: {
              name: { type: 'string' },
              nodes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    type: { type: 'string' },
                    position: {
                      type: 'object',
                      properties: {
                        x: { type: 'number' },
                        y: { type: 'number' },
                      },
                    },
                    parameters: { type: 'object' },
                  },
                },
              },
              connections: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    sourceNodeId: { type: 'string' },
                    sourceOutput: { type: 'number' },
                    targetNodeId: { type: 'string' },
                    targetInput: { type: 'number' },
                  },
                },
              },
              settings: { type: 'object' },
            },
            required: ['name', 'nodes', 'connections'],
          },
          isActive: {
            type: 'boolean',
            description: 'Whether to set this as the active version (default: true)',
          },
        },
        required: ['tenantId', 'workflowName', 'definition'],
      },
    },
    {
      name: 'scoreWorkflow',
      description:
        'Update the score of a workflow version based on execution metrics.',
      inputSchema: {
        type: 'object',
        properties: {
          versionId: {
            type: 'string',
            description: 'The ID of the workflow version to score',
          },
          metrics: {
            type: 'object',
            description: 'Execution metrics for scoring',
            properties: {
              executionTime: {
                type: 'number',
                description: 'Execution time in milliseconds',
              },
              successRate: {
                type: 'number',
                description: 'Success rate between 0 and 1',
              },
              errorCount: {
                type: 'number',
                description: 'Number of errors encountered',
              },
              resourceUsage: {
                type: 'number',
                description: 'Resource usage metric between 0 and 1 (optional)',
              },
              outputQuality: {
                type: 'number',
                description: 'Output quality metric between 0 and 1 (optional)',
              },
            },
            required: ['executionTime', 'successRate', 'errorCount'],
          },
          weights: {
            type: 'object',
            description: 'Custom weights for score calculation (optional)',
            properties: {
              executionTime: { type: 'number' },
              successRate: { type: 'number' },
              errorCount: { type: 'number' },
              resourceUsage: { type: 'number' },
              outputQuality: { type: 'number' },
            },
          },
        },
        required: ['versionId', 'metrics'],
      },
    },
  ];

  const manifest = {
    name: 'qontrek-workflow-engine',
    version: '1.0.0',
    description: 'Evolutionary Workflow Engine for Qontrek',
    tools,
    endpoints: {
      evolve: '/api/mcp/workflows/evolve',
      manifest: '/api/mcp/manifest',
    },
  };

  return NextResponse.json(manifest);
}
