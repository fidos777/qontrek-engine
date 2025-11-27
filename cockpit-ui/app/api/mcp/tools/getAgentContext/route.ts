/**
 * MCP Tool: getAgentContext
 *
 * Returns agent context including permissions, available tools,
 * and session information.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GetAgentContextInputSchema, type GetAgentContextOutput, type AgentTool } from '@/lib/mcp/schemas';
import {
  createGovernanceContext,
  extractTenantFromJWT,
  getDefaultTenant,
  withGovernance,
  ErrorCodes,
} from '@/lib/mcp/governance';

export const runtime = 'nodejs';

// In-memory session store (in production, use Redis or similar)
const sessions: Map<string, {
  started_at: string;
  requests_count: number;
  last_activity: string;
  tools_used: Set<string>;
}> = new Map();

// MCP tool definitions
const MCP_TOOLS: AgentTool[] = [
  {
    name: 'listTenants',
    description: 'List available tenants with filtering',
    available: true,
    rate_limit: { requests: 100, window_seconds: 60 },
  },
  {
    name: 'getGovernanceStatus',
    description: 'Get governance gate status (G13-G21)',
    available: true,
    rate_limit: { requests: 100, window_seconds: 60 },
  },
  {
    name: 'refreshProof',
    description: 'Regenerate governance proof files',
    available: true,
    rate_limit: { requests: 10, window_seconds: 60 },
  },
  {
    name: 'getPipelineSummary',
    description: 'Get sales pipeline summary with stage metrics',
    available: true,
    rate_limit: { requests: 100, window_seconds: 60 },
  },
  {
    name: 'getCriticalLeads',
    description: 'Get critical and high-priority leads',
    available: true,
    rate_limit: { requests: 100, window_seconds: 60 },
  },
  {
    name: 'getLeadDetails',
    description: 'Get detailed lead information with history',
    available: true,
    rate_limit: { requests: 200, window_seconds: 60 },
  },
  {
    name: 'updateLeadStatus',
    description: 'Update lead status with optional note',
    available: true,
    rate_limit: { requests: 50, window_seconds: 60 },
  },
  {
    name: 'getKPISnapshot',
    description: 'Get KPI metrics by category',
    available: true,
    rate_limit: { requests: 100, window_seconds: 60 },
  },
  {
    name: 'triggerWorkflow',
    description: 'Trigger workflow execution',
    available: true,
    rate_limit: { requests: 20, window_seconds: 60 },
  },
  {
    name: 'logProofEvent',
    description: 'Log governance/compliance events',
    available: true,
    rate_limit: { requests: 100, window_seconds: 60 },
  },
  {
    name: 'getWidgetData',
    description: 'Get dashboard widget data',
    available: true,
    rate_limit: { requests: 200, window_seconds: 60 },
  },
  {
    name: 'getAgentContext',
    description: 'Get agent context and permissions',
    available: true,
    rate_limit: { requests: 50, window_seconds: 60 },
  },
];

// Permission definitions by tenant tier
const TIER_PERMISSIONS: Record<string, string[]> = {
  free: [
    'read:tenants',
    'read:governance',
    'read:pipeline',
    'read:leads',
    'read:kpis',
    'read:widgets',
  ],
  pro: [
    'read:tenants',
    'read:governance',
    'read:pipeline',
    'read:leads',
    'write:leads',
    'read:kpis',
    'read:widgets',
    'execute:workflows',
    'write:proof_events',
  ],
  enterprise: [
    'read:tenants',
    'write:tenants',
    'read:governance',
    'write:governance',
    'read:pipeline',
    'read:leads',
    'write:leads',
    'read:kpis',
    'read:widgets',
    'execute:workflows',
    'write:proof_events',
    'admin:full',
  ],
};

function getOrCreateSession(tenantId: string): {
  started_at: string;
  requests_count: number;
  last_activity: string;
  tools_used: Set<string>;
} {
  let session = sessions.get(tenantId);
  if (!session) {
    session = {
      started_at: new Date().toISOString(),
      requests_count: 0,
      last_activity: new Date().toISOString(),
      tools_used: new Set(),
    };
    sessions.set(tenantId, session);
  }

  // Update activity
  session.requests_count++;
  session.last_activity = new Date().toISOString();
  session.tools_used.add('getAgentContext');

  return session;
}

function determineTier(tenantId: string): 'free' | 'pro' | 'enterprise' {
  // In production, look up tenant tier from database
  if (tenantId.includes('enterprise') || tenantId.startsWith('admin_')) {
    return 'enterprise';
  }
  if (tenantId.includes('pro')) {
    return 'pro';
  }
  return 'pro'; // Default to pro for dev
}

export async function POST(request: NextRequest) {
  const tenantId = extractTenantFromJWT(request.headers.get('authorization')) || getDefaultTenant();
  const governance = createGovernanceContext(tenantId, 'G13');

  try {
    const body = await request.json();
    const parseResult = GetAgentContextInputSchema.safeParse(body);

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

    const result = await withGovernance<typeof parseResult.data, GetAgentContextOutput>(
      'getAgentContext',
      parseResult.data,
      governance,
      async (input) => {
        const { context_type, include_tools } = input;

        const session = getOrCreateSession(tenantId);
        const tier = determineTier(tenantId);
        const permissions = TIER_PERMISSIONS[tier] || TIER_PERMISSIONS.free;

        // Build base response
        const response: GetAgentContextOutput = {
          agent_id: `agent_${tenantId}`,
          tenant_id: tenantId,
          permissions,
          session: {
            started_at: session.started_at,
            requests_count: session.requests_count,
            last_activity: session.last_activity,
          },
          governance: {
            compliance_level: tier === 'enterprise' ? 'strict' : 'standard',
            active_gates: ['G13', 'G14', 'G15', 'G16', 'G17', 'G18', 'G19', 'G20'],
          },
        };

        // Include tools if requested
        if (include_tools) {
          response.available_tools = MCP_TOOLS.map(tool => ({
            ...tool,
            // Check if tool is available based on permissions
            available: tool.available && hasToolPermission(tool.name, permissions),
          }));
        }

        // Filter response based on context_type
        if (context_type === 'summary') {
          return {
            agent_id: response.agent_id,
            tenant_id: response.tenant_id,
            permissions: [],
            session: response.session,
            governance: response.governance,
          };
        }

        if (context_type === 'permissions') {
          return {
            agent_id: response.agent_id,
            tenant_id: response.tenant_id,
            permissions,
            session: {
              started_at: session.started_at,
              requests_count: 0,
              last_activity: session.last_activity,
            },
            governance: response.governance,
          };
        }

        if (context_type === 'history') {
          return {
            agent_id: response.agent_id,
            tenant_id: response.tenant_id,
            permissions: [],
            available_tools: undefined,
            session: {
              started_at: session.started_at,
              requests_count: session.requests_count,
              last_activity: session.last_activity,
            },
            governance: response.governance,
          };
        }

        return response;
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: (error as Error).message,
        },
        governance,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const tenantId = extractTenantFromJWT(request.headers.get('authorization')) || getDefaultTenant();
  const governance = createGovernanceContext(tenantId, 'G13');

  const session = getOrCreateSession(tenantId);
  const tier = determineTier(tenantId);
  const permissions = TIER_PERMISSIONS[tier] || TIER_PERMISSIONS.free;

  return NextResponse.json({
    success: true,
    data: {
      agent_id: `agent_${tenantId}`,
      tenant_id: tenantId,
      permissions,
      available_tools: MCP_TOOLS.map(tool => ({
        ...tool,
        available: tool.available && hasToolPermission(tool.name, permissions),
      })),
      session: {
        started_at: session.started_at,
        requests_count: session.requests_count,
        last_activity: session.last_activity,
      },
      governance: {
        compliance_level: tier === 'enterprise' ? 'strict' : 'standard',
        active_gates: ['G13', 'G14', 'G15', 'G16', 'G17', 'G18', 'G19', 'G20'],
      },
    },
    error: null,
    governance,
  });
}

function hasToolPermission(toolName: string, permissions: string[]): boolean {
  const toolPermissionMap: Record<string, string[]> = {
    listTenants: ['read:tenants'],
    getGovernanceStatus: ['read:governance'],
    refreshProof: ['write:governance'],
    getPipelineSummary: ['read:pipeline'],
    getCriticalLeads: ['read:leads'],
    getLeadDetails: ['read:leads'],
    updateLeadStatus: ['write:leads'],
    getKPISnapshot: ['read:kpis'],
    triggerWorkflow: ['execute:workflows'],
    logProofEvent: ['write:proof_events'],
    getWidgetData: ['read:widgets'],
    getAgentContext: ['read:tenants'],
  };

  const required = toolPermissionMap[toolName] || [];
  return required.every(perm => permissions.includes(perm) || permissions.includes('admin:full'));
}
