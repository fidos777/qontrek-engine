// lib/mcp/tools/workflow.ts
// N8N workflow execution matching existing batch patterns

export interface WorkflowExecution {
  success: boolean;
  workflowName: string;
  executionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message?: string;
  data?: unknown;
  webhook?: string;
  dryRun?: boolean;
}

// Match workflow names from batch/runtime_auto_sync.batch and n8n stubs
const KNOWN_WORKFLOWS = [
  'payment_reminder',
  'escalation',
  'report_generation',
  'sync_governance',
  'send_meter',
  'roi_nudge',
  'monitor',
  'referral'
];

// Mock responses for different workflow types
const MOCK_RESPONSES: Record<string, unknown> = {
  'payment_reminder': {
    sent: 3,
    scheduled: 2,
    failed: 0,
    template: 'payment_reminder_7d',
    nextRun: new Date(Date.now() + 3600000).toISOString()
  },
  'escalation': {
    escalated: 1,
    manager: 'Ahmad Razak',
    priority: 'high',
    sla_breach: false
  },
  'report_generation': {
    format: 'pdf',
    pages: 12,
    sections: ['summary', 'pipeline', 'recovery', 'forecast'],
    downloadUrl: '/mock/report.pdf'
  },
  'sync_governance': {
    gates: ['G13', 'G14', 'G15', 'G16', 'G17', 'G18'],
    status: 'synced',
    timestamp: new Date().toISOString(),
    trustIndex: 85
  },
  'send_meter': {
    credits_used: 15,
    credits_remaining: 985,
    messages_sent: 5
  },
  'roi_nudge': {
    nudged: 8,
    potential_recovery: 45000,
    avg_days_saved: 3.2
  },
  'monitor': {
    checked: 24,
    alerts: 2,
    healthy: 22,
    lastCheck: new Date().toISOString()
  },
  'referral': {
    sent: 5,
    converted: 2,
    pending: 3,
    potential_value: 12500
  }
};

export async function executeWorkflow(
  workflowName: string,
  data: unknown
): Promise<WorkflowExecution> {
  console.log(`[Workflow] Executing: ${workflowName}`, data);

  // Check DRY_RUN flag (matches agent_runner.py pattern)
  const isDryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL?.replace(/\/$/, '');
  const n8nApiKey = process.env.N8N_API_KEY;

  if (!n8nWebhookUrl) {
    console.warn('[Workflow] N8N_WEBHOOK_URL not set, using mock mode');

    return {
      success: true,
      workflowName,
      executionId: `mock-${Date.now()}`,
      status: 'completed',
      message: `Mock execution of ${workflowName}`,
      data: MOCK_RESPONSES[workflowName] || { mock: true, input: data },
      dryRun: true
    };
  }

  // If DRY_RUN is enabled, don't actually call N8N
  if (isDryRun) {
    console.log('[Workflow] DRY_RUN enabled, skipping actual N8N call');
    return {
      success: true,
      workflowName,
      executionId: `dry-run-${Date.now()}`,
      status: 'completed',
      message: 'DRY_RUN mode - no actual execution',
      data: { input: data, dryRun: true },
      dryRun: true
    };
  }

  // REAL N8N webhook execution
  try {
    const webhookUrl = `${n8nWebhookUrl}/webhook/${workflowName}`;

    // Build payload matching N8N function node patterns
    const payload = {
      timestamp: new Date().toISOString(),
      source: 'qontrek-mcp',
      workflow: workflowName,
      executionMode: 'production',
      node_id: process.env.NODE_ID || 'mcp-001',
      data
    };

    console.log(`[Workflow] Calling N8N webhook: ${webhookUrl}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Source': 'qontrek-mcp-server',
      'X-Workflow': workflowName,
      'X-Node-ID': process.env.NODE_ID || 'mcp-001'
    };

    // Add API key if configured
    if (n8nApiKey) {
      headers['Authorization'] = `Bearer ${n8nApiKey}`;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Workflow] N8N webhook failed:', error);
      throw new Error(`Workflow failed (${response.status}): ${error}`);
    }

    const result = await response.json();

    return {
      success: true,
      workflowName,
      executionId: (result as { executionId?: string }).executionId || `n8n-${Date.now()}`,
      status: 'completed',
      data: result,
      webhook: webhookUrl,
      dryRun: false
    };

  } catch (error) {
    console.error('[Workflow] N8N execution error:', error);
    return {
      success: false,
      workflowName,
      executionId: `error-${Date.now()}`,
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      dryRun: false
    };
  }
}

export function listAvailableWorkflows(): {
  workflows: Array<{
    id: string;
    name: string;
    description: string;
    webhook: string;
    configured: boolean;
  }>;
  configured: boolean;
  dryRunEnabled: boolean;
} {
  const baseUrl = process.env.N8N_WEBHOOK_URL?.replace(/\/$/, '') || 'http://n8n.local';
  const configured = !!process.env.N8N_WEBHOOK_URL;

  return {
    workflows: KNOWN_WORKFLOWS.map(id => ({
      id,
      name: id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description: `Execute ${id} workflow`,
      webhook: `${baseUrl}/webhook/${id}`,
      configured
    })),
    configured,
    dryRunEnabled: process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'
  };
}
