import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/redis/rateLimiter';
import { getCorsHeaders, handleCorsPrelight } from '@/lib/utils/cors';

// Validation schema
const MCPRequestSchema = z.object({
  tool: z.string().min(1),
  params: z.record(z.string(), z.any()).optional().default({})
});

// Tool registry (will be populated with actual implementations)
const toolRegistry: Record<string, (params: any) => Promise<any>> = {
  // Governance - wraps existing endpoint
  'getGovernanceStatus': async () => {
    const origin = process.env.NODE_ENV === 'production'
      ? 'https://qontrek.com'
      : 'http://localhost:3000';
    const res = await fetch(`${origin}/api/mcp/governance`);
    if (!res.ok) throw new Error('Failed to fetch governance status');
    return res.json();
  },

  // Tenant data - uses Supabase
  'getTenantData': async (params: { tenantId: string }) => {
    const { getTenantData } = await import('@/lib/mcp/tools/tenant');
    return getTenantData(params.tenantId);
  },

  // Workflow execution - N8N
  'executeWorkflow': async (params: { workflowName: string; data: any }) => {
    const { executeWorkflow } = await import('@/lib/mcp/tools/workflow');
    return executeWorkflow(params.workflowName, params.data);
  },

  // WhatsApp messaging
  'sendWhatsAppMessage': async (params: { to: string; message: string; templateId?: string }) => {
    const { sendWhatsAppMessage } = await import('@/lib/mcp/tools/whatsapp');
    return sendWhatsAppMessage(params.to, params.message, params.templateId);
  },

  // Report export
  'exportReport': async (params: { format: 'csv' | 'pdf' | 'excel'; tenantId: string; dateRange?: any }) => {
    const { exportReport } = await import('@/lib/mcp/tools/export');
    return exportReport(params.format, params.tenantId, params.dateRange);
  },

  // Health check - wraps existing
  'getHealthStatus': async () => {
    const origin = process.env.NODE_ENV === 'production'
      ? 'https://qontrek.com'
      : 'http://localhost:3000';
    const res = await fetch(`${origin}/api/mcp/healthz`);
    if (!res.ok) throw new Error('Failed to fetch health status');
    return res.json();
  }
};

export async function OPTIONS(request: NextRequest) {
  return handleCorsPrelight(request);
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Extract client ID for rate limiting
  const clientId = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'anonymous';

  // Check rate limit
  const rateLimit = await checkRateLimit('mcp-execute', clientId, {
    maxRequests: 100,
    windowMs: 60000
  });

  const corsHeaders = getCorsHeaders(request);

  // Add rate limit headers
  const headers = {
    ...corsHeaders,
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': String(rateLimit.remaining),
    'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
  };

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      },
      { status: 429, headers }
    );
  }

  try {
    // Parse and validate request
    const body = await request.json();
    const { tool, params } = MCPRequestSchema.parse(body);

    // Check if tool exists
    if (!toolRegistry[tool]) {
      return NextResponse.json(
        {
          error: 'Unknown tool',
          tool,
          availableTools: Object.keys(toolRegistry)
        },
        { status: 400, headers }
      );
    }

    // Execute tool
    console.log(`[MCP] Executing tool: ${tool}`, params);
    const result = await toolRegistry[tool](params);

    // Calculate execution time
    const executionTime = Date.now() - startTime;

    // Return success response
    return NextResponse.json(
      {
        success: true,
        tool,
        result,
        metadata: {
          executionTime,
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      },
      { status: 200, headers }
    );

  } catch (error) {
    console.error('[MCP] Execution error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: error.issues
        },
        { status: 400, headers }
      );
    }

    // Handle tool execution errors
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Tool execution failed',
        message,
        tool: (await request.json().catch(() => ({}))).tool
      },
      { status: 500, headers }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'Use POST to execute MCP tools'
    },
    { status: 405, headers: getCorsHeaders(request) }
  );
}
