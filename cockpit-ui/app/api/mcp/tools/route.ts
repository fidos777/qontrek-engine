import { NextResponse } from 'next/server';

/**
 * GET /api/mcp/tools
 *
 * Discovery endpoint for all available MCP tools.
 * Returns OpenAPI-compatible schemas for ChatGPT Actions.
 */
export async function GET() {
  const tools = {
    tools: [
      // Tenant tools
      {
        name: 'getTenantData',
        description: 'Fetch tenant pipeline data including total recoverable amount, critical leads, and recovery rate',
        category: 'tenant',
        inputSchema: {
          type: 'object',
          properties: {
            tenantId: {
              type: 'string',
              description: 'Tenant ID (e.g., voltek, perodua, takaful, cidb)',
              examples: ['voltek', 'perodua', 'cidb']
            }
          },
          required: ['tenantId']
        },
        outputSchema: {
          type: 'object',
          properties: {
            tenantId: { type: 'string' },
            name: { type: 'string' },
            totalRecoverable: { type: 'number', description: 'Total RM amount recoverable' },
            criticalLeads: { type: 'number', description: 'Leads overdue >14 days' },
            avgDaysOverdue: { type: 'number' },
            recoveryRate: { type: 'number', description: 'Percentage' },
            pipelineStatus: { type: 'string', enum: ['active', 'paused', 'archived'] },
            invoices: {
              type: 'object',
              properties: {
                pending80: { type: 'number' },
                pending20: { type: 'number' },
                handover: { type: 'number' }
              }
            }
          }
        }
      },
      {
        name: 'listTenants',
        description: 'List all available tenants with their status',
        category: 'tenant',
        inputSchema: {
          type: 'object',
          properties: {}
        },
        outputSchema: {
          type: 'object',
          properties: {
            tenants: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  active: { type: 'boolean' },
                  demo: { type: 'boolean' }
                }
              }
            },
            count: { type: 'number' },
            source: { type: 'string', enum: ['demo', 'mixed', 'live'] }
          }
        }
      },

      // Workflow tools
      {
        name: 'executeWorkflow',
        description: 'Execute an N8N workflow by name with custom data',
        category: 'workflow',
        inputSchema: {
          type: 'object',
          properties: {
            workflowName: {
              type: 'string',
              description: 'Workflow name',
              examples: ['payment_reminder', 'escalation', 'report_generation', 'sync_governance']
            },
            data: {
              type: 'object',
              description: 'Custom data to pass to the workflow'
            }
          },
          required: ['workflowName']
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            workflowName: { type: 'string' },
            executionId: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'running', 'completed', 'failed'] },
            dryRun: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      },
      {
        name: 'listWorkflows',
        description: 'List all available N8N workflows',
        category: 'workflow',
        inputSchema: {
          type: 'object',
          properties: {}
        },
        outputSchema: {
          type: 'object',
          properties: {
            workflows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  webhook: { type: 'string' },
                  configured: { type: 'boolean' }
                }
              }
            },
            configured: { type: 'boolean' },
            dryRunEnabled: { type: 'boolean' }
          }
        }
      },

      // WhatsApp tools
      {
        name: 'sendWhatsAppMessage',
        description: 'Send a WhatsApp message via WhatChimp API',
        category: 'whatsapp',
        inputSchema: {
          type: 'object',
          properties: {
            to: {
              type: 'string',
              description: 'Phone number (Malaysian format: 0123456789 or 60123456789)',
              examples: ['0123456789', '60123456789']
            },
            message: {
              type: 'string',
              description: 'Message content'
            },
            templateId: {
              type: 'string',
              description: 'WhatChimp template ID (optional)'
            }
          },
          required: ['to', 'message']
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            messageId: { type: 'string' },
            to: { type: 'string' },
            status: { type: 'string', enum: ['queued', 'sent', 'delivered', 'read', 'failed'] },
            provider: { type: 'string' },
            dryRun: { type: 'boolean' },
            creditUsed: { type: 'number' }
          }
        }
      },
      {
        name: 'getMessageStatus',
        description: 'Get delivery status of a WhatsApp message',
        category: 'whatsapp',
        inputSchema: {
          type: 'object',
          properties: {
            messageId: {
              type: 'string',
              description: 'Message ID returned from sendWhatsAppMessage'
            }
          },
          required: ['messageId']
        },
        outputSchema: {
          type: 'object',
          properties: {
            messageId: { type: 'string' },
            status: { type: 'string' },
            deliveredAt: { type: 'string' },
            readAt: { type: 'string' }
          }
        }
      },

      // Export tools
      {
        name: 'exportReport',
        description: 'Export tenant recovery report in CSV, PDF, or Excel format',
        category: 'export',
        inputSchema: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: ['csv', 'pdf', 'excel'],
              description: 'Export format'
            },
            tenantId: {
              type: 'string',
              description: 'Tenant ID'
            },
            dateRange: {
              type: 'object',
              properties: {
                start: { type: 'string', description: 'ISO date string' },
                end: { type: 'string', description: 'ISO date string' }
              }
            }
          },
          required: ['format', 'tenantId']
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            format: { type: 'string' },
            tenantId: { type: 'string' },
            filename: { type: 'string' },
            size: { type: 'number' },
            mimeType: { type: 'string' },
            downloadUrl: { type: 'string' },
            expiresAt: { type: 'string' },
            content: { type: 'string', description: 'Preview (first 500 chars)' }
          }
        }
      }
    ],

    // Metadata
    version: '1.0.0',
    totalTools: 7,
    categories: ['tenant', 'workflow', 'whatsapp', 'export'],

    // Usage example
    usage: {
      endpoint: 'POST /api/mcp/execute',
      example: {
        tool: 'getTenantData',
        params: { tenantId: 'voltek' }
      }
    },

    timestamp: new Date().toISOString()
  };

  return NextResponse.json(tools);
}
