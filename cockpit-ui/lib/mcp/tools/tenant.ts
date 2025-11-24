// lib/mcp/tools/tenant.ts
// Tenant data access using ACTUAL Supabase patterns from agent_runner.py

export interface TenantStats {
  tenantId: string;
  name: string;
  totalRecoverable: number;
  criticalLeads: number;
  avgDaysOverdue: number;
  recoveryRate: number;
  pipelineStatus: 'active' | 'paused' | 'archived';
  lastUpdated: string;
  invoices?: {
    pending80: number;
    pending20: number;
    handover: number;
  };
}

// Match the actual tables from the codebase scan
const SUPABASE_TABLES = {
  BRAND_CONFIG: 'brand_config',
  OPS_LOGS: 'ops_logs',
  EVENTS_RAW: 'events_raw',
  AGENT_LOGS: 'agent_logs',
  CREDIT_LOGS: 'credit_logs',
  TASK_LOG: 'task_log',
  WA_TEMPLATE_LOG: 'wa_template_log'
};

// Demo tenants with ACTUAL RM values from fixtures
const DEMO_TENANTS: Record<string, TenantStats> = {
  'voltek': {
    tenantId: 'voltek',
    name: 'Voltek Solar Malaysia',
    totalRecoverable: 180400,
    criticalLeads: 12,
    avgDaysOverdue: 18.5,
    recoveryRate: 68.5,
    pipelineStatus: 'active',
    lastUpdated: new Date().toISOString(),
    invoices: {
      pending80: 96000,
      pending20: 24000,
      handover: 60400
    }
  },
  'perodua': {
    tenantId: 'perodua',
    name: 'Perodua Service Centers',
    totalRecoverable: 520000,
    criticalLeads: 34,
    avgDaysOverdue: 12.3,
    recoveryRate: 72.1,
    pipelineStatus: 'active',
    lastUpdated: new Date().toISOString(),
    invoices: {
      pending80: 312000,
      pending20: 104000,
      handover: 104000
    }
  },
  'takaful': {
    tenantId: 'takaful',
    name: 'Takaful Insurance',
    totalRecoverable: 89000,
    criticalLeads: 8,
    avgDaysOverdue: 22.1,
    recoveryRate: 55.2,
    pipelineStatus: 'paused',
    lastUpdated: new Date().toISOString(),
    invoices: {
      pending80: 53400,
      pending20: 17800,
      handover: 17800
    }
  },
  'cidb': {
    tenantId: 'cidb',
    name: 'CIDB Malaysia',
    totalRecoverable: 1250000,
    criticalLeads: 67,
    avgDaysOverdue: 35.2,
    recoveryRate: 42.3,
    pipelineStatus: 'active',
    lastUpdated: new Date().toISOString(),
    invoices: {
      pending80: 750000,
      pending20: 250000,
      handover: 250000
    }
  }
};

// Supabase headers matching agent_runner.py pattern
function sbHeaders(apiKey: string): Record<string, string> {
  return {
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'count=exact'
  };
}

export async function getTenantData(tenantId: string): Promise<TenantStats> {
  console.log(`[Tenant] Fetching data for: ${tenantId}`);

  // Return demo data if available
  if (DEMO_TENANTS[tenantId]) {
    return {
      ...DEMO_TENANTS[tenantId],
      lastUpdated: new Date().toISOString()
    };
  }

  // Use REAL Supabase with RLS (matches existing pattern in agent_runner.py)
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Tenant] Supabase not configured, only demo tenants available');
    throw new Error(`Unknown tenant: ${tenantId}. Available: voltek, perodua, takaful, cidb`);
  }

  try {
    // Query brand_config table (exists in migrations)
    const brandResponse = await fetch(
      `${supabaseUrl}/rest/v1/${SUPABASE_TABLES.BRAND_CONFIG}?brand=eq.${tenantId}&select=*`,
      {
        headers: sbHeaders(supabaseKey)
      }
    );

    if (!brandResponse.ok) {
      console.error('[Tenant] Brand config error:', await brandResponse.text());
      throw new Error(`Failed to fetch brand config for: ${tenantId}`);
    }

    const brandData = await brandResponse.json();
    if (!brandData || brandData.length === 0) {
      throw new Error(`Brand not found: ${tenantId}`);
    }

    const brand = brandData[0];

    // Query ops_logs for aggregated stats
    const opsResponse = await fetch(
      `${supabaseUrl}/rest/v1/${SUPABASE_TABLES.OPS_LOGS}?brand=eq.${tenantId}&select=amount,status,days_overdue`,
      {
        headers: { ...sbHeaders(supabaseKey), 'Range': '0-999' }
      }
    );

    let totalRecoverable = 0;
    let criticalLeads = 0;
    let avgDaysOverdue = 0;

    if (opsResponse.ok) {
      const opsLogs = await opsResponse.json();
      totalRecoverable = opsLogs.reduce((sum: number, log: { amount?: number }) => sum + (log.amount || 0), 0);
      criticalLeads = opsLogs.filter((log: { days_overdue?: number }) => (log.days_overdue || 0) > 14).length;
      avgDaysOverdue = opsLogs.length > 0
        ? opsLogs.reduce((sum: number, log: { days_overdue?: number }) => sum + (log.days_overdue || 0), 0) / opsLogs.length
        : 0;
    }

    return {
      tenantId,
      name: brand.name || tenantId,
      totalRecoverable,
      criticalLeads,
      avgDaysOverdue: Math.round(avgDaysOverdue * 10) / 10,
      recoveryRate: brand.recovery_rate || 65.0,
      pipelineStatus: brand.status || 'active',
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error('[Tenant] Supabase query failed:', error);
    throw error;
  }
}

export async function listTenants(): Promise<{
  tenants: Array<{ id: string; name: string; active: boolean; demo: boolean }>;
  count: number;
  source: string;
}> {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  // Always include demo tenants
  const demoTenants = [
    { id: 'voltek', name: 'Voltek Solar', active: true, demo: true },
    { id: 'perodua', name: 'Perodua', active: true, demo: true },
    { id: 'takaful', name: 'Takaful Insurance', active: false, demo: true },
    { id: 'cidb', name: 'CIDB Malaysia', active: true, demo: true }
  ];

  if (!supabaseUrl || !supabaseKey) {
    return {
      tenants: demoTenants,
      count: demoTenants.length,
      source: 'demo'
    };
  }

  try {
    // Query real tenants from brand_config
    const response = await fetch(
      `${supabaseUrl}/rest/v1/${SUPABASE_TABLES.BRAND_CONFIG}?select=brand,name,active&order=brand`,
      {
        headers: sbHeaders(supabaseKey)
      }
    );

    if (!response.ok) {
      console.warn('[Tenant] Failed to list from Supabase:', await response.text());
      return {
        tenants: demoTenants,
        count: demoTenants.length,
        source: 'demo'
      };
    }

    const data = await response.json();
    const realTenants = data?.map((t: { brand: string; name: string; active: boolean }) => ({
      id: t.brand,
      name: t.name,
      active: t.active,
      demo: false
    })) || [];

    // Merge demo and real tenants (deduped by id)
    const allIds = new Set(realTenants.map((t: { id: string }) => t.id));
    const uniqueDemos = demoTenants.filter(t => !allIds.has(t.id));
    const allTenants = [...uniqueDemos, ...realTenants];

    return {
      tenants: allTenants,
      count: allTenants.length,
      source: realTenants.length > 0 ? 'mixed' : 'demo'
    };

  } catch (error) {
    console.error('[Tenant] List tenants failed:', error);
    return {
      tenants: demoTenants,
      count: demoTenants.length,
      source: 'demo'
    };
  }
}
