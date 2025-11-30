// ============================================
// QONTREK SOLAR VERTICAL - TYPESCRIPT TYPES
// Version: 1.0.0
// Layer: L1 (Data Types)
// ============================================

// ============================================
// DATABASE TYPES (matches Supabase schema)
// ============================================

export interface SolarProject {
  id: string;
  project_no: string;
  sequence_no: number | null;
  
  // Client Information
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  client_ic: string | null;
  spouse_ic: string | null;
  
  // Location
  address: string | null;
  state: string | null;
  site_ownership: string | null;
  
  // Project Details
  project_type: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL';
  month: string | null;
  quarter: string | null;
  event_name: string | null;
  event_date: string | null;
  
  // System Specifications
  proposed_capacity_kwp: number | null;
  proposed_system: string | null;
  finalized_capacity_kwp: number | null;
  finalized_capacity_kwac: number | null;
  system_finalized: string | null;
  
  // Status & Workflow
  status: string;
  status_category: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REFUND';
  remarks: string | null;
  
  // Financial
  total_sales: number | null;
  balance: number;
  mode_of_payment: string | null;
  bank_merchant: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface SolarPayment {
  id: string;
  project_id: string;
  project_no: string;
  
  payment_type: 'BOOKING' | '80_PERCENT' | '20_PERCENT';
  amount: number | null;
  payment_date: string | null;
  expected_date: string | null;
  
  status: 'PENDING' | 'RECEIVED' | 'OVERDUE';
  days_overdue: number;
  
  created_at: string;
  updated_at: string;
}

export interface SolarRecoveryAction {
  id: string;
  project_id: string;
  project_no: string;
  
  action_type: ActionType;
  action_date: string;
  performed_by: string | null;
  
  result: ActionResult | null;
  notes: string | null;
  next_action_date: string | null;
  
  created_at: string;
}

// ============================================
// VIEW TYPES (for dashboard)
// ============================================

export interface CriticalLead {
  id: string;
  project_no: string;
  name: string;
  phone: string | null;
  status: string;
  amount: number;
  state: string | null;
  system_size: number | null;
  project_value: number | null;
  stage: PaymentStage;
  days_overdue: number;
  last_contact: string | null;
  next_action: string;
}

// ============================================
// DASHBOARD DATA TYPES
// ============================================

export interface G2DashboardData {
  metadata: {
    generated_at: string;
    source: 'supabase' | 'mock' | 'real' | 'file';
    version: string;
    tenant: string;
  };
  
  summary: {
    total_recoverable: number;
    pending_80_count: number;
    pending_80_value: number;
    pending_20_count: number;
    pending_20_value: number;
    handover_count: number;
    handover_value: number;
    total_projects: number;
    active_projects: number;
  };
  
  kpi: {
    recovery_rate_7d: number;
    recovery_rate_30d: number;
    avg_days_to_payment: number;
    escalation_rate: number;
    contact_success_rate: number;
  };
  
  critical_leads: CriticalLead[];
  active_reminders: ActiveReminder[];
  recent_success: RecentSuccess[];
  pipeline_by_stage: PipelineStage[];
  state_distribution: StateDistribution[];
}

export interface ActiveReminder {
  id: string;
  project_no: string;
  lead_name: string;
  stage: string;
  next_action: string;
  due_date: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RecentSuccess {
  id: string;
  name: string;
  amount: number;
  days_to_pay: number;
  paid_at: string;
  stage: string;
}

export interface PipelineStage {
  stage: string;
  count: number;
  value: number;
  percentage: number;
}

export interface StateDistribution {
  state: string;
  count: number;
  value: number;
}

// ============================================
// MCP TOOL TYPES
// ============================================

export interface MCPToolResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    execution_time_ms: number;
    source: string;
    cached: boolean;
  };
}

export interface GetPipelineSummaryParams {
  stage?: PaymentStage | 'ALL';
  state?: string;
  min_amount?: number;
  days_overdue_min?: number;
}

export interface GetCriticalLeadsParams {
  limit?: number;
  stage?: PaymentStage;
  sort_by?: 'amount' | 'days_overdue' | 'last_contact';
  sort_order?: 'asc' | 'desc';
}

export interface LogRecoveryActionParams {
  project_id: string;
  action_type: ActionType;
  result?: ActionResult;
  notes?: string;
  next_action_date?: string;
  performed_by?: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export type PaymentStage = '80%' | '20%' | 'HANDOVER';

export type ActionType = 'CALL' | 'SMS' | 'WHATSAPP' | 'EMAIL' | 'SITE_VISIT';

export type ActionResult = 'CONNECTED' | 'NO_ANSWER' | 'PROMISED_PAYMENT' | 'SCHEDULED' | 'ESCALATED';

// ============================================
// WIDGET TYPES (L3)
// ============================================

export interface WidgetDataSource {
  type: 'mcp' | 'supabase' | 'file' | 'static';
  mcp_tool?: string;
  params?: Record<string, unknown>;
  fallback_file?: string;
}

export interface WidgetUIHints {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  color?: string;
  icon?: string;
  show_trend?: boolean;
  animate?: boolean;
  priority?: number;
}

export interface WidgetSchema {
  id: string;
  name: string;
  description: string;
  category: 'metrics' | 'charts' | 'table' | 'list' | 'action';
  vertical: string;
  data_source: WidgetDataSource;
  ui_hints: WidgetUIHints;
  refresh_interval_ms?: number;
}
