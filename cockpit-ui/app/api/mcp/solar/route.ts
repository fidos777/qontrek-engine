// ======================================================
// SOLAR MCP API ROUTE — Edge Runtime
// Path: /app/api/mcp/solar/route.ts
// Supports: Action-based API + JSON-RPC 2.0 MCP Protocol
// Actions: kpi, critical_leads, recovery_pipeline, timeline
// MCP Tools: get_kpi_summary, get_critical_leads, get_recovery_pipeline, get_recent_activity
// ======================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// ---------------------------------------------
// CORS Headers (MCP-compatible)
// ---------------------------------------------
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ---------------------------------------------
// Supabase (Edge)
// ---------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// ---------------------------------------------
// MCP Tool Definitions
// ---------------------------------------------
const MCP_TOOLS = [
  {
    name: 'get_kpi_summary',
    description: 'Fetch KPI summary data',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_critical_leads',
    description: 'Fetch overdue leads data',
    input_schema: {
      type: 'object',
      properties: {
        stage: { type: 'string', description: 'Filter by stage' },
        limit: { type: 'number', description: 'Limit results' },
      },
    },
  },
  {
    name: 'get_recovery_pipeline',
    description: 'Fetch financial recovery pipeline',
    input_schema: {
      type: 'object',
      properties: {
        stage: { type: 'string', description: 'Filter by stage' },
        state: { type: 'string', description: 'Filter by state' },
        limit: { type: 'number', description: 'Limit results' },
      },
    },
  },
  {
    name: 'get_recent_activity',
    description: 'Fetch recent financial reminders & payments',
    input_schema: {
      type: 'object',
      properties: {
        project_no: { type: 'string', description: 'Project number to filter by' },
      },
      required: ['project_no'],
    },
  },
] as const;

// ---------------------------------------------
// ZOD SCHEMAS (Discriminated Union) - Legacy Action-based API
// ---------------------------------------------
const KpiAction = z.object({
  action: z.literal('kpi'),
  params: z.object({}).optional(),
});

const CriticalLeadsAction = z.object({
  action: z.literal('critical_leads'),
  params: z.object({
    stage: z.string().optional(),
    limit: z.number().optional(),
  }).optional(),
});

const RecoveryPipelineAction = z.object({
  action: z.literal('recovery_pipeline'),
  params: z.object({
    stage: z.string().optional(),
    state: z.string().optional(),
    limit: z.number().optional(),
  }).optional(),
});

const TimelineAction = z.object({
  action: z.literal('timeline'),
  params: z.object({
    project_no: z.string(),
  }),
});

const ActionSchema = z.discriminatedUnion('action', [
  KpiAction,
  CriticalLeadsAction,
  RecoveryPipelineAction,
  TimelineAction,
]);

// ---------------------------------------------
// JSON-RPC 2.0 Schema
// ---------------------------------------------
const JsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number(), z.null()]),
  method: z.string(),
  params: z.any().optional(),
});

// ---------------------------------------------
// Tool Execution Functions (with error guards)
// ---------------------------------------------
async function executeKpi() {
  try {
    const { data, error } = await supabase
      .from('v_solar_kpi_summary')
      .select('*');
    if (error) {
      console.error('[MCP] Supabase error in executeKpi:', error);
      throw new Error(`Supabase query failed: ${error.message}`);
    }
    return data || [];
  } catch (err: any) {
    console.error('[MCP] executeKpi error:', err);
    throw err;
  }
}

async function executeCriticalLeads(params?: { stage?: string; limit?: number }) {
  try {
    let q = supabase.from('v_critical_leads').select('*');
    if (params?.stage) q = q.eq('stage', params.stage);
    if (params?.limit) q = q.limit(params.limit);
    const { data, error } = await q;
    if (error) {
      console.error('[MCP] Supabase error in executeCriticalLeads:', error);
      throw new Error(`Supabase query failed: ${error.message}`);
    }
    return data || [];
  } catch (err: any) {
    console.error('[MCP] executeCriticalLeads error:', err);
    throw err;
  }
}

async function executeRecoveryPipeline(params?: { stage?: string; state?: string; limit?: number }) {
  try {
    let q = supabase.from('v_payment_recovery_pipeline').select('*');
    if (params?.stage) q = q.eq('stage', params.stage);
    if (params?.state) q = q.eq('state', params.state);
    if (params?.limit) q = q.limit(params.limit);
    const { data, error } = await q;
    if (error) {
      console.error('[MCP] Supabase error in executeRecoveryPipeline:', error);
      throw new Error(`Supabase query failed: ${error.message}`);
    }
    return data || [];
  } catch (err: any) {
    console.error('[MCP] executeRecoveryPipeline error:', err);
    throw err;
  }
}

async function executeTimeline(project_no: string) {
  try {
    if (!project_no || typeof project_no !== 'string') {
      throw new Error('project_no parameter is required and must be a string');
    }
    const { data, error } = await supabase
      .from('v_solar_timeline')
      .select('*')
      .eq('project_no', project_no)
      .order('event_date', { ascending: true });
    if (error) {
      console.error('[MCP] Supabase error in executeTimeline:', error);
      throw new Error(`Supabase query failed: ${error.message}`);
    }
    return data || [];
  } catch (err: any) {
    console.error('[MCP] executeTimeline error:', err);
    throw err;
  }
}

// ---------------------------------------------
// POST HANDLER (Strict JSON-RPC 2.0 for Agent Builder)
// ---------------------------------------------
export async function POST(req: NextRequest) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const body = await req.json();

    // Validate JSON-RPC 2.0 request
    if (body.jsonrpc !== '2.0' || !body.method || body.id === undefined) {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: body.id ?? null,
          error: {
            code: -32600,
            message: 'Invalid Request',
          },
        },
        { status: 400, headers }
      );
    }

    const { id, method, params } = body;

    // Handle tools/list
    if (method === 'tools/list') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            tools: [
              { name: 'get_kpi_summary', description: 'Fetch KPI summary data' },
              { name: 'get_critical_leads', description: 'Fetch overdue leads data' },
              { name: 'get_recovery_pipeline', description: 'Fetch financial recovery pipeline' },
              { name: 'get_recent_activity', description: 'Fetch financial reminders & payments' },
            ],
          },
        },
        { headers }
      );
    }

    // Handle tools/call
    if (method === 'tools/call') {
      const toolName = params?.name;
      const toolArguments = params?.arguments || {};

      if (!toolName) {
        return NextResponse.json(
          {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: 'Invalid params: tool name required',
            },
          },
          { status: 400, headers }
        );
      }

      try {
        let content;

        switch (toolName) {
          case 'get_kpi_summary':
            content = await executeKpi();
            break;
          case 'get_critical_leads':
            content = await executeCriticalLeads(toolArguments);
            break;
          case 'get_recovery_pipeline':
            content = await executeRecoveryPipeline(toolArguments);
            break;
          case 'get_recent_activity':
            if (!toolArguments?.project_no) {
              throw new Error('project_no parameter is required');
            }
            content = await executeTimeline(toolArguments.project_no);
            break;
          default:
            return NextResponse.json(
              {
                jsonrpc: '2.0',
                id,
                error: {
                  code: -32601,
                  message: `Tool '${toolName}' not found`,
                },
              },
              { status: 404, headers }
            );
        }

        return NextResponse.json(
          {
            jsonrpc: '2.0',
            id,
            result: {
              content: content,
            },
          },
          { headers }
        );
      } catch (toolError: any) {
        // Guard: Always return JSON-RPC compliant error
        const errorMessage = toolError?.message || 'Tool execution failed';
        const errorCode = toolError?.code || -32603; // Internal error
        
        console.error('[MCP] Tool execution error:', {
          tool: toolName,
          error: errorMessage,
          code: errorCode,
        });
        
        return NextResponse.json(
          {
            jsonrpc: '2.0',
            id,
            error: {
              code: errorCode,
              message: errorMessage,
            },
          },
          { status: 500, headers }
        );
      }
    }

    // Unknown method
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: 'Method not found',
        },
      },
      { status: 404, headers }
    );
  } catch (err: any) {
    // Guard: Catch-all for any unexpected errors
    console.error('[MCP] Unexpected error in POST handler:', err);
    
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: err?.message || 'Parse error',
        },
      },
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json', 
          'Access-Control-Allow-Origin': '*' 
        } 
      }
    );
  }
}

// ---------------------------------------------
// GET HANDLER (MCP Discovery)
// ---------------------------------------------
export async function GET() {
  return NextResponse.json(
    {
      mcp_server: true,
      version: '1.0',
      capabilities: {
        jsonrpc: true,
        tool_calling: true,
        edge_runtime: true,
      },
      tools: [
        { name: 'get_kpi_summary', description: 'Fetch KPI summary data' },
        { name: 'get_critical_leads', description: 'Fetch overdue leads data' },
        { name: 'get_recovery_pipeline', description: 'Fetch financial recovery pipeline' },
        { name: 'get_recent_activity', description: 'Fetch financial reminders & payments' },
      ],
      server_info: {
        name: 'qontrek-mcp-solar',
        owner: 'Qontrek',
        contact: 'support@qontrek.com',
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

// ---------------------------------------------
// OPTIONS HANDLER (CORS Preflight)
// ---------------------------------------------
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
