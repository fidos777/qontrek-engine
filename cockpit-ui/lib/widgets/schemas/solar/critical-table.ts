// ============================================
// SOLAR CRITICAL LEADS TABLE WIDGET SCHEMA
// Layer: L3 (Widget OS)
// Purpose: Display critical leads requiring action
// ============================================

import { z } from 'zod';
import type { WidgetSchema, CriticalLead } from '@/types/solar';

// Zod validation schema
export const CriticalLeadSchema = z.object({
  id: z.string(),
  project_no: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  status: z.string(),
  amount: z.number(),
  state: z.string().nullable(),
  system_size: z.number().nullable(),
  project_value: z.number().nullable(),
  stage: z.enum(['80%', '20%', 'HANDOVER']),
  days_overdue: z.number(),
  last_contact: z.string().nullable(),
  next_action: z.string(),
});

export const SolarCriticalTableDataSchema = z.object({
  leads: z.array(CriticalLeadSchema),
  total_count: z.number(),
  total_value: z.number(),
});

export type SolarCriticalTableData = z.infer<typeof SolarCriticalTableDataSchema>;

// Column definitions for the table
export const CRITICAL_TABLE_COLUMNS = [
  { id: 'name', label: 'Customer', sortable: true, width: '20%' },
  { id: 'project_no', label: 'Project', sortable: true, width: '15%' },
  { id: 'amount', label: 'Amount (RM)', sortable: true, width: '12%', align: 'right' as const },
  { id: 'stage', label: 'Stage', sortable: true, width: '10%' },
  { id: 'days_overdue', label: 'Days Overdue', sortable: true, width: '10%', align: 'right' as const },
  { id: 'last_contact', label: 'Last Contact', sortable: true, width: '12%' },
  { id: 'next_action', label: 'Next Action', sortable: false, width: '15%' },
  { id: 'actions', label: 'Actions', sortable: false, width: '6%' },
] as const;

// Widget definition
export const SOLAR_CRITICAL_TABLE_SCHEMA: WidgetSchema = {
  id: 'solar_critical_table',
  name: 'Critical Leads',
  description: 'Table of leads requiring immediate attention',
  category: 'table',
  vertical: 'solar',
  
  data_source: {
    type: 'mcp',
    mcp_tool: 'getCriticalLeads',
    params: {
      limit: 15,
      sort_by: 'amount',
      sort_order: 'desc',
    },
    fallback_file: '/data/g2_dashboard_v19.1.json',
  },
  
  ui_hints: {
    size: 'full',
    color: 'default',
    animate: false,
    priority: 4,
  },
  
  refresh_interval_ms: 60000,
};

// Data transformer
export function transformToCriticalTableData(mcpResponse: {
  critical_leads: CriticalLead[];
}): SolarCriticalTableData {
  const leads = mcpResponse.critical_leads;
  
  return {
    leads,
    total_count: leads.length,
    total_value: leads.reduce((sum, lead) => sum + lead.amount, 0),
  };
}

// Helper: Get urgency level based on days overdue
export function getUrgencyLevel(daysOverdue: number): 'critical' | 'high' | 'medium' | 'low' {
  if (daysOverdue >= 30) return 'critical';
  if (daysOverdue >= 21) return 'high';
  if (daysOverdue >= 14) return 'medium';
  return 'low';
}

// Helper: Get urgency color
export function getUrgencyColor(daysOverdue: number): string {
  const level = getUrgencyLevel(daysOverdue);
  const colors = {
    critical: 'red',
    high: 'orange',
    medium: 'yellow',
    low: 'green',
  };
  return colors[level];
}

export default SOLAR_CRITICAL_TABLE_SCHEMA;
