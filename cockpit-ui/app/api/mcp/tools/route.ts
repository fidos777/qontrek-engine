/**
 * MCP Tool Discovery Endpoint
 *
 * GET /api/mcp/tools
 * Returns the manifest of all available MCP tools with their schemas.
 */

import { NextResponse } from 'next/server';
import type { MCPManifest } from '@/lib/mcp/types';

export const runtime = 'nodejs';

const manifest: MCPManifest = {
  name: 'qontrek-mcp',
  version: '1.0.0',
  description: 'Qontrek OS MCP Tool Fabric - Multi-tenant AI Governance Platform for Malaysian SMEs',
  tools: [
    {
      name: 'listTenants',
      description: 'List all tenants accessible to the current user. Filter by status (active/all) and limit results.',
      input_schema: {
        type: 'object',
        properties: {
          filter: { type: 'string', enum: ['active', 'all'], description: 'Filter tenants by status' },
          limit: { type: 'number', description: 'Maximum number of tenants to return (1-100)' },
        },
      },
      output_schema: {
        type: 'object',
        properties: {
          tenants: { type: 'array', description: 'List of tenant objects with id, name, slug, status' },
          total: { type: 'number', description: 'Total count of matching tenants' },
        },
        required: ['tenants', 'total'],
      },
    },
    {
      name: 'getGovernanceStatus',
      description: 'Get current governance status including all gate checks (G13-G21) and trust index.',
      input_schema: {
        type: 'object',
        properties: {
          tenant_id: { type: 'string', format: 'uuid', description: 'Target tenant ID (defaults to authenticated tenant)' },
          include_evidence: { type: 'boolean', description: 'Include detailed evidence for each gate' },
        },
      },
      output_schema: {
        type: 'object',
        properties: {
          gates: { type: 'object', description: 'Status of gates G13-G21' },
          trust_index: { type: 'number', description: 'Overall trust score (0-100)' },
          last_updated: { type: 'string', format: 'date-time' },
        },
        required: ['gates', 'trust_index', 'last_updated'],
      },
    },
    {
      name: 'refreshProof',
      description: 'Force refresh the proof chain for a tenant, generating a new proof hash.',
      input_schema: {
        type: 'object',
        properties: {
          tenant_id: { type: 'string', format: 'uuid', description: 'Target tenant ID' },
          force: { type: 'boolean', description: 'Force refresh even if recent proof exists' },
        },
        required: ['tenant_id'],
      },
      output_schema: {
        type: 'object',
        properties: {
          proof_id: { type: 'string', format: 'uuid' },
          hash: { type: 'string', description: 'New proof hash' },
          refreshed_at: { type: 'string', format: 'date-time' },
        },
        required: ['proof_id', 'hash', 'refreshed_at'],
      },
    },
    {
      name: 'logProofEvent',
      description: 'Log an event to the proof chain for audit compliance (G13 lineage tracking).',
      input_schema: {
        type: 'object',
        properties: {
          event_type: { type: 'string', description: 'Type of event being logged' },
          actor: { type: 'object', description: 'Entity performing the action (id, type, name)' },
          target: { type: 'object', description: 'Entity being acted upon (id, type, name)' },
          metadata: { type: 'object', description: 'Additional event metadata' },
        },
        required: ['event_type', 'actor', 'target'],
      },
      output_schema: {
        type: 'object',
        properties: {
          event_id: { type: 'string', format: 'uuid' },
          proof_hash: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
        required: ['event_id', 'proof_hash', 'timestamp'],
      },
    },
    {
      name: 'getPipelineSummary',
      description: 'Get sales pipeline summary with stage counts, values, and average days.',
      input_schema: {
        type: 'object',
        properties: {
          tenant_id: { type: 'string', format: 'uuid', description: 'Target tenant ID' },
          stage: { type: 'string', description: 'Filter by specific stage' },
          date_range: {
            type: 'object',
            properties: {
              from: { type: 'string', format: 'date' },
              to: { type: 'string', format: 'date' },
            },
          },
        },
      },
      output_schema: {
        type: 'object',
        properties: {
          stages: { type: 'array', description: 'Pipeline stages with metrics' },
          total_value_rm: { type: 'number', description: 'Total pipeline value in MYR' },
          total_leads: { type: 'number', description: 'Total number of leads' },
        },
        required: ['stages', 'total_value_rm', 'total_leads'],
      },
    },
    {
      name: 'getKPISnapshot',
      description: 'Get current KPI values across recovery, conversion, and engagement metrics.',
      input_schema: {
        type: 'object',
        properties: {
          tenant_id: { type: 'string', format: 'uuid', description: 'Target tenant ID' },
          category: { type: 'string', enum: ['recovery', 'conversion', 'engagement', 'all'], description: 'KPI category filter' },
        },
      },
      output_schema: {
        type: 'object',
        properties: {
          kpis: { type: 'array', description: 'KPI objects with id, name, value, target, unit, trend' },
          as_of: { type: 'string', format: 'date-time' },
        },
        required: ['kpis', 'as_of'],
      },
    },
    {
      name: 'getCriticalLeads',
      description: 'Get leads requiring immediate attention, sorted by priority or value.',
      input_schema: {
        type: 'object',
        properties: {
          priority: { type: 'string', enum: ['critical', 'high', 'medium'], description: 'Minimum priority level' },
          limit: { type: 'number', description: 'Maximum leads to return' },
          sort_by: { type: 'string', enum: ['value', 'days_overdue'], description: 'Sort order' },
        },
      },
      output_schema: {
        type: 'object',
        properties: {
          leads: { type: 'array', description: 'Lead summaries with id, name, phone, stage, amount, days_overdue, next_action' },
          total: { type: 'number' },
        },
        required: ['leads', 'total'],
      },
    },
    {
      name: 'getLeadDetails',
      description: 'Get detailed information about a specific lead including optional history.',
      input_schema: {
        type: 'object',
        properties: {
          lead_id: { type: 'string', format: 'uuid', description: 'Lead ID to retrieve' },
          include_history: { type: 'boolean', description: 'Include activity history' },
        },
        required: ['lead_id'],
      },
      output_schema: {
        type: 'object',
        properties: {
          lead: { type: 'object', description: 'Full lead details including data and optional history' },
        },
        required: ['lead'],
      },
    },
    {
      name: 'updateLeadStatus',
      description: 'Update the status of a lead and log the change to the proof chain.',
      input_schema: {
        type: 'object',
        properties: {
          lead_id: { type: 'string', format: 'uuid', description: 'Lead ID to update' },
          status: { type: 'string', description: 'New status value' },
          notes: { type: 'string', description: 'Optional notes about the status change' },
        },
        required: ['lead_id', 'status'],
      },
      output_schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          lead_id: { type: 'string', format: 'uuid' },
          new_status: { type: 'string' },
          updated_at: { type: 'string', format: 'date-time' },
        },
        required: ['success', 'lead_id', 'new_status', 'updated_at'],
      },
    },
    {
      name: 'triggerWorkflow',
      description: 'Trigger a workflow execution, either manually or based on an event.',
      input_schema: {
        type: 'object',
        properties: {
          workflow_id: { type: 'string', description: 'Workflow identifier' },
          trigger_type: { type: 'string', enum: ['manual', 'event'], description: 'How the workflow is being triggered' },
          context: { type: 'object', description: 'Context data for the workflow execution' },
        },
        required: ['workflow_id', 'trigger_type'],
      },
      output_schema: {
        type: 'object',
        properties: {
          execution_id: { type: 'string', format: 'uuid' },
          workflow_id: { type: 'string' },
          status: { type: 'string', enum: ['queued', 'running'] },
          started_at: { type: 'string', format: 'date-time' },
        },
        required: ['execution_id', 'workflow_id', 'status', 'started_at'],
      },
    },
    {
      name: 'getWidgetData',
      description: 'Get rendered data for a specific dashboard widget type.',
      input_schema: {
        type: 'object',
        properties: {
          widget_type: { type: 'string', description: 'Widget identifier (trust_meter, pipeline_funnel, recovery_chart, lead_heatmap)' },
          config: { type: 'object', description: 'Optional widget configuration' },
        },
        required: ['widget_type'],
      },
      output_schema: {
        type: 'object',
        properties: {
          widget_type: { type: 'string' },
          data: { type: 'object', description: 'Widget-specific data' },
          rendered_at: { type: 'string', format: 'date-time' },
        },
        required: ['widget_type', 'data', 'rendered_at'],
      },
    },
    {
      name: 'getAgentContext',
      description: 'Get the context for an AI agent including persona, available tools, and permissions.',
      input_schema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string', description: 'Agent identifier (recovery-agent, sales-agent, cfo-agent)' },
        },
      },
      output_schema: {
        type: 'object',
        properties: {
          persona: { type: 'string', description: 'Agent persona/role' },
          tools: { type: 'array', description: 'Available tool names' },
          permissions: { type: 'array', description: 'Permission levels' },
          tenant: { type: 'object', description: 'Associated tenant info' },
        },
        required: ['persona', 'tools', 'permissions', 'tenant'],
      },
    },
  ],
};

export async function GET() {
  return NextResponse.json(manifest, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/json',
    },
  });
}
