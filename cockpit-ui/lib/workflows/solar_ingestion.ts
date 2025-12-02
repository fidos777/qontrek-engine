// ============================================
// SOLAR PIPELINE INGESTION WORKFLOW
// Layer: L8 (Workflow Engine)
// Purpose: Process uploaded Excel files into Supabase
// ============================================

import { z } from 'zod';

// ============================================
// WORKFLOW DEFINITION
// ============================================

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'upload' | 'parse' | 'map' | 'validate' | 'normalize' | 'store' | 'analyze' | 'notify';
  config: Record<string, unknown>;
  on_error: 'fail' | 'skip' | 'retry';
  retry_count?: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  vertical: string;
  trigger: 'manual' | 'schedule' | 'webhook';
  steps: WorkflowStep[];
  outputs: string[];
}

// ============================================
// FIELD MAPPING (Excel Column → DB Field)
// ============================================

export const FIELD_MAPPING: Record<string, string> = {
  // Project Identification
  'NO': 'sequence_no',
  'PROJECT NO': 'project_no',
  'Project No': 'project_no',
  
  // Client Information
  "CLIENT'S NAME": 'client_name',
  "Client's Name": 'client_name',
  'CLIENT NAME': 'client_name',
  'CONTACT NO': 'client_phone',
  'Contact No': 'client_phone',
  'EMAIL': 'client_email',
  "CLIENT'S IC": 'client_ic',
  "SPOUSE'S IC": 'spouse_ic',
  
  // Location
  'ADDRESS': 'address',
  'STATE': 'state',
  'SITE OWNERSHIP': 'site_ownership',
  
  // Project Details
  'MONTH': 'month',
  'QTR': 'quarter',
  'Quarter': 'quarter',
  'EVENT NAME': 'event_name',
  'EVENT DATE': 'event_date',
  
  // System Specifications
  'PROPOSED CAPACITY (kWp)': 'proposed_capacity_kwp',
  'PROPOSED SYSTEM': 'proposed_system',
  'FINALIZED CAPACITY (kWp)': 'finalized_capacity_kwp',
  'FINALIZED CAPACITY (kWac)': 'finalized_capacity_kwac',
  'SYSTEM FINALIZED': 'system_finalized',
  
  // Status
  'STATUS': 'status',
  'REMARKS': 'remarks',
  
  // Financial
  'TOTAL SALES': 'total_sales',
  'Total Sales': 'total_sales',
  'BALANCE': 'balance',
  'Balance': 'balance',
  'MODE OF PAYMENT': 'mode_of_payment',
  'BANK/MERCHANT': 'bank_merchant',
  
  // Payment Milestones
  'BOOKING': 'booking_amount',
  'Booking': 'booking_amount',
  '80%': 'payment_80_amount',
  '80% PAYMENT': 'payment_80_amount',
  '20%': 'payment_20_amount',
  '20% PAYMENT': 'payment_20_amount',
};

export const SOLAR_INGESTION_WORKFLOW: WorkflowDefinition = {
  id: 'solar_pipeline_ingestion',
  name: 'Solar Pipeline Excel Ingestion',
  description: 'Process Voltek Excel exports into Supabase solar_projects table',
  version: '1.0.0',
  vertical: 'solar',
  trigger: 'manual',
  
  steps: [
    {
      id: 'receive_file',
      name: 'Receive Upload',
      type: 'upload',
      config: {
        max_size_mb: 10,
        allowed_extensions: ['.xlsx', '.xls', '.csv'],
        validate_structure: true,
      },
      on_error: 'fail',
    },
    {
      id: 'parse_excel',
      name: 'Parse Excel File',
      type: 'parse',
      config: {
        header_row: 1,
        skip_empty_rows: true,
        date_formats: ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'],
        number_locale: 'en-MY',
      },
      on_error: 'fail',
    },
    {
      id: 'map_fields',
      name: 'Map Excel Columns to DB Fields',
      type: 'map',
      config: {
        mapping: FIELD_MAPPING,
        strict_mode: false, // Allow unmapped columns
        required_fields: ['project_no', 'client_name'],
      },
      on_error: 'fail',
    },
    {
      id: 'validate_rows',
      name: 'Validate Row Data',
      type: 'validate',
      config: {
        schema: 'SolarProjectRowSchema',
        fail_on_invalid: false,
        collect_errors: true,
        max_errors: 100,
      },
      on_error: 'skip',
    },
    {
      id: 'normalize_data',
      name: 'Normalize and Transform',
      type: 'normalize',
      config: {
        transformers: [
          'cleanCurrency',
          'parseDates',
          'standardizeStatus',
          'extractState',
          'calculateBalance',
        ],
      },
      on_error: 'skip',
    },
    {
      id: 'store_records',
      name: 'Insert/Update Supabase',
      type: 'store',
      config: {
        target_table: 'solar_projects',
        conflict_key: 'project_no',
        on_conflict: 'update',
        batch_size: 100,
      },
      on_error: 'retry',
      retry_count: 3,
    },
    {
      id: 'run_analysis',
      name: 'Run DIA Skills',
      type: 'analyze',
      config: {
        skills: [
          'recovery_probability',
          'risk_classification',
          'suggested_action',
        ],
      },
      on_error: 'skip',
    },
    {
      id: 'emit_completion',
      name: 'Emit Completion Event',
      type: 'notify',
      config: {
        event: 'pipeline_updated',
        include_summary: true,
      },
      on_error: 'skip',
    },
  ],
  
  outputs: [
    'records_processed',
    'records_inserted',
    'records_updated',
    'records_failed',
    'validation_errors',
    'total_pipeline_value',
  ],
};

// ============================================
// VALIDATION SCHEMA
// ============================================

export const SolarProjectRowSchema = z.object({
  project_no: z.string()
    .min(1, 'Project number is required')
    .regex(/^VESB\//, 'Project number must start with VESB/'),
  
  client_name: z.string()
    .min(1, 'Client name is required'),
  
  client_phone: z.string().optional(),
  client_email: z.string().email().optional().or(z.literal('')),
  
  status: z.string().optional(),
  
  total_sales: z.number()
    .min(0, 'Total sales cannot be negative')
    .optional(),
  
  balance: z.number().optional(),
  
  proposed_capacity_kwp: z.number()
    .min(0)
    .max(100)
    .optional(),
  
  state: z.string().optional(),
});

export type SolarProjectRow = z.infer<typeof SolarProjectRowSchema>;

// ============================================
// WORKFLOW EXECUTION TYPES
// ============================================

export interface WorkflowJob {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  current_step: string;
  progress: number;
  started_at: string;
  completed_at?: string;
  input: {
    file_name: string;
    file_size: number;
    uploaded_by: string;
  };
  output?: WorkflowOutput;
  errors?: WorkflowError[];
}

export interface WorkflowOutput {
  records_processed: number;
  records_inserted: number;
  records_updated: number;
  records_failed: number;
  validation_errors: number;
  total_pipeline_value: number;
  execution_time_ms: number;
}

export interface WorkflowError {
  step_id: string;
  row_number?: number;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export default SOLAR_INGESTION_WORKFLOW;
