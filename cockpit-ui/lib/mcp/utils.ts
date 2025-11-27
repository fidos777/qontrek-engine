/**
 * MCP Tool Fabric - Utilities
 *
 * Shared utility functions for MCP tools including response builders,
 * demo data generators, and common helpers.
 */

import type { MCPResponse, ResponseMeta, GovernanceMetadata } from './types';
import { MCP_VERSION, logToolInvocation, type extractAuthContext } from './governance';

// =============================================================================
// RESPONSE BUILDERS
// =============================================================================

/**
 * Create a successful MCP response
 */
export function createSuccessResponse<T>(
  toolName: string,
  data: T,
  governance: GovernanceMetadata,
  startTime: number
): MCPResponse<T> {
  return {
    success: true,
    data,
    governance,
    meta: {
      tool: toolName,
      version: MCP_VERSION,
      duration_ms: Date.now() - startTime,
    },
  };
}

/**
 * Create an error MCP response
 */
export function createErrorResponse<T>(
  toolName: string,
  code: string,
  message: string,
  governance: GovernanceMetadata,
  startTime: number,
  defaultData: T
): MCPResponse<T> {
  return {
    success: false,
    data: defaultData,
    error: { code, message },
    governance,
    meta: {
      tool: toolName,
      version: MCP_VERSION,
      duration_ms: Date.now() - startTime,
    },
  };
}

/**
 * Wrap a tool handler with governance logging
 */
export async function withGovernance<T>(
  toolName: string,
  authContext: ReturnType<typeof extractAuthContext>,
  input: Record<string, unknown>,
  handler: () => Promise<T>
): Promise<{ data: T; governance: GovernanceMetadata }> {
  try {
    const data = await handler();
    const governance = await logToolInvocation(toolName, authContext, input, true);
    return { data, governance };
  } catch (error) {
    const governance = await logToolInvocation(toolName, authContext, input, false);
    throw { error, governance };
  }
}

// =============================================================================
// DEMO DATA GENERATORS
// =============================================================================

/** Demo tenant data */
export const DEMO_TENANTS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Voltek Energy',
    slug: 'voltek',
    status: 'active' as const,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Solar Solutions MY',
    slug: 'solar-solutions',
    status: 'active' as const,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Green Power Sdn Bhd',
    slug: 'greenpower',
    status: 'suspended' as const,
  },
];

/** Demo leads data */
export const DEMO_LEADS = [
  {
    id: 'aaaa1111-aaaa-1111-aaaa-111111111111',
    name: 'Ahmad Razak',
    phone: '+60123456789',
    email: 'ahmad.razak@example.com',
    stage: 'negotiation' as const,
    amount_rm: 8000,
    days_overdue: 21,
    next_action: 'Follow up on payment plan',
    data: {
      company: 'Razak Solar Sdn Bhd',
      source: 'referral',
      priority: 'critical',
    },
  },
  {
    id: 'aaaa2222-aaaa-2222-aaaa-222222222222',
    name: 'Siti Aminah',
    phone: '+60198765432',
    email: 'siti.aminah@example.com',
    stage: 'proposal' as const,
    amount_rm: 15000,
    days_overdue: 7,
    next_action: 'Send revised quote',
    data: {
      company: 'Green Home MY',
      source: 'website',
      priority: 'high',
    },
  },
  {
    id: 'aaaa3333-aaaa-3333-aaaa-333333333333',
    name: 'Muthu Krishnan',
    phone: '+60112233445',
    email: 'muthu.k@example.com',
    stage: 'qualified' as const,
    amount_rm: 12500,
    days_overdue: 3,
    next_action: 'Schedule site visit',
    data: {
      company: 'KL Eco Solutions',
      source: 'trade_show',
      priority: 'medium',
    },
  },
  {
    id: 'aaaa4444-aaaa-4444-aaaa-444444444444',
    name: 'Lee Wei Ming',
    phone: '+60177889900',
    email: 'weiming.lee@example.com',
    stage: 'negotiation' as const,
    amount_rm: 22000,
    days_overdue: 14,
    next_action: 'Final contract review',
    data: {
      company: 'Penang Solar Co',
      source: 'cold_call',
      priority: 'critical',
    },
  },
  {
    id: 'aaaa5555-aaaa-5555-aaaa-555555555555',
    name: 'Tan Mei Ling',
    phone: '+60145678901',
    email: 'meiling.tan@example.com',
    stage: 'new' as const,
    amount_rm: 5500,
    days_overdue: 0,
    next_action: 'Initial qualification call',
    data: {
      company: 'Tan Residence',
      source: 'facebook',
      priority: 'low',
    },
  },
];

/** Demo KPIs data */
export const DEMO_KPIS = {
  recovery: [
    { id: 'kpi-rec-1', name: 'Recovery Rate', value: 68.5, target: 85, unit: '%', trend: 'up' as const },
    { id: 'kpi-rec-2', name: 'Avg Days to Recover', value: 18, target: 14, unit: 'days', trend: 'down' as const },
    { id: 'kpi-rec-3', name: 'Total Recovered (MTD)', value: 125000, target: 150000, unit: 'RM', trend: 'up' as const },
  ],
  conversion: [
    { id: 'kpi-conv-1', name: 'Lead Conversion Rate', value: 24.3, target: 30, unit: '%', trend: 'up' as const },
    { id: 'kpi-conv-2', name: 'Proposal Win Rate', value: 42.1, target: 50, unit: '%', trend: 'stable' as const },
    { id: 'kpi-conv-3', name: 'Avg Deal Size', value: 12500, target: 15000, unit: 'RM', trend: 'up' as const },
  ],
  engagement: [
    { id: 'kpi-eng-1', name: 'Response Rate', value: 78.2, target: 80, unit: '%', trend: 'up' as const },
    { id: 'kpi-eng-2', name: 'Avg Response Time', value: 2.4, target: 2, unit: 'hours', trend: 'down' as const },
    { id: 'kpi-eng-3', name: 'NPS Score', value: 72, target: 75, unit: 'pts', trend: 'stable' as const },
  ],
};

/** Demo pipeline stages */
export const DEMO_PIPELINE_STAGES = [
  { name: 'New', count: 45, value_rm: 225000, avg_days: 3 },
  { name: 'Qualified', count: 32, value_rm: 480000, avg_days: 7 },
  { name: 'Proposal', count: 18, value_rm: 360000, avg_days: 12 },
  { name: 'Negotiation', count: 12, value_rm: 288000, avg_days: 21 },
  { name: 'Closed Won', count: 8, value_rm: 160000, avg_days: 0 },
  { name: 'Closed Lost', count: 5, value_rm: 75000, avg_days: 0 },
];

/** Demo workflows */
export const DEMO_WORKFLOWS = [
  { id: 'wf-001', name: 'Payment Reminder Sequence', type: 'automated' },
  { id: 'wf-002', name: 'Lead Qualification Flow', type: 'manual' },
  { id: 'wf-003', name: 'Proposal Follow-up', type: 'automated' },
  { id: 'wf-004', name: 'Win/Loss Analysis', type: 'manual' },
];

/** Demo widgets */
export const DEMO_WIDGETS = {
  trust_meter: {
    trust_index: 87,
    gates_passing: 7,
    gates_warning: 2,
    gates_failing: 0,
    last_audit: new Date().toISOString(),
  },
  pipeline_funnel: {
    stages: DEMO_PIPELINE_STAGES,
    conversion_rate: 24.3,
    avg_cycle_days: 35,
  },
  recovery_chart: {
    current_month: 125000,
    previous_month: 98000,
    target: 150000,
    trend: [85000, 92000, 98000, 105000, 118000, 125000],
  },
  lead_heatmap: {
    high_priority: 4,
    medium_priority: 8,
    low_priority: 12,
    overdue: 6,
  },
};

/** Demo agent personas */
export const DEMO_AGENTS = {
  'recovery-agent': {
    persona: 'Recovery Specialist',
    tools: ['getCriticalLeads', 'getLeadDetails', 'updateLeadStatus', 'triggerWorkflow'],
    permissions: ['read', 'write', 'execute'] as const,
  },
  'sales-agent': {
    persona: 'Sales Assistant',
    tools: ['getPipelineSummary', 'getKPISnapshot', 'getCriticalLeads', 'getLeadDetails'],
    permissions: ['read'] as const,
  },
  'cfo-agent': {
    persona: 'CFO Dashboard',
    tools: ['getKPISnapshot', 'getPipelineSummary', 'getGovernanceStatus', 'getWidgetData'],
    permissions: ['read', 'admin'] as const,
  },
  'default': {
    persona: 'General Assistant',
    tools: ['listTenants', 'getGovernanceStatus', 'getKPISnapshot', 'getPipelineSummary'],
    permissions: ['read'] as const,
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse JSON body from request with error handling
 */
export async function parseRequestBody<T>(request: Request): Promise<T | null> {
  try {
    const text = await request.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Generate a random UUID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Filter leads by priority
 */
export function filterLeadsByPriority(
  leads: typeof DEMO_LEADS,
  priority: 'critical' | 'high' | 'medium' | 'low'
): typeof DEMO_LEADS {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const maxPriority = priorityOrder[priority];

  return leads.filter(lead => {
    const leadPriority = priorityOrder[lead.data.priority as keyof typeof priorityOrder] ?? 3;
    return leadPriority <= maxPriority;
  });
}

/**
 * Sort leads by specified field
 */
export function sortLeads(
  leads: typeof DEMO_LEADS,
  sortBy: 'value' | 'days_overdue'
): typeof DEMO_LEADS {
  return [...leads].sort((a, b) => {
    if (sortBy === 'value') {
      return b.amount_rm - a.amount_rm;
    }
    return b.days_overdue - a.days_overdue;
  });
}

/**
 * Get lead history events (demo)
 */
export function getLeadHistory(leadId: string) {
  const now = new Date();
  return [
    {
      id: crypto.randomUUID(),
      type: 'status_change',
      description: 'Lead moved to current stage',
      timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      actor: 'System',
    },
    {
      id: crypto.randomUUID(),
      type: 'note_added',
      description: 'Customer requested pricing breakdown',
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      actor: 'Ahmad (Sales Rep)',
    },
    {
      id: crypto.randomUUID(),
      type: 'email_sent',
      description: 'Proposal document sent via email',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      actor: 'System',
    },
    {
      id: crypto.randomUUID(),
      type: 'call_logged',
      description: 'Follow-up call completed, customer interested',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      actor: 'Siti (Account Manager)',
    },
  ];
}
