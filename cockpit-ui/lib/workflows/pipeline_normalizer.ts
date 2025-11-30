// ============================================
// PIPELINE NORMALIZER
// Layer: L8 (Workflow Engine)
// Purpose: Transform and clean imported data
// ============================================

// ============================================
// CURRENCY CLEANING
// ============================================

/**
 * Clean currency values from Excel
 * Handles: "RM 12,345.67", "12345.67", "12,345", "(1,234.56)"
 */
export function cleanCurrency(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  if (typeof value === 'number') {
    return value;
  }
  
  const str = String(value).trim();
  
  // Check for negative in parentheses: (1,234.56)
  const isNegative = str.startsWith('(') && str.endsWith(')');
  
  // Remove currency symbols, commas, spaces, parentheses
  const cleaned = str
    .replace(/[RM\s,()]/gi, '')
    .replace(/^-/, '');
  
  const num = parseFloat(cleaned);
  
  if (isNaN(num)) {
    return null;
  }
  
  return isNegative ? -num : num;
}

// ============================================
// DATE PARSING
// ============================================

/**
 * Parse dates from various formats
 * Handles: "25/12/2024", "2024-12-25", "Dec 25, 2024", Excel serial
 */
export function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // Handle Excel serial date numbers
  if (typeof value === 'number') {
    // Excel dates are days since 1900-01-01 (with leap year bug)
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  
  const str = String(value).trim();
  
  // Try DD/MM/YYYY format (common in Malaysia)
  const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Try ISO format YYYY-MM-DD
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Fallback to Date.parse
  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

// ============================================
// STATUS STANDARDIZATION
// ============================================

const STATUS_MAPPING: Record<string, { status_category: string; normalized_status: string }> = {
  // Completed statuses
  'completed': { status_category: 'COMPLETED', normalized_status: 'Completed' },
  'done': { status_category: 'COMPLETED', normalized_status: 'Completed' },
  'finished': { status_category: 'COMPLETED', normalized_status: 'Completed' },
  'energized': { status_category: 'COMPLETED', normalized_status: 'Completed - Energized' },
  
  // Cancelled statuses
  'cancelled': { status_category: 'CANCELLED', normalized_status: 'Cancelled' },
  'canceled': { status_category: 'CANCELLED', normalized_status: 'Cancelled' },
  'cancel': { status_category: 'CANCELLED', normalized_status: 'Cancelled' },
  
  // Refund statuses
  'refund': { status_category: 'REFUND', normalized_status: 'Refund' },
  'refunded': { status_category: 'REFUND', normalized_status: 'Refund' },
  
  // Active - Payment pending
  'pending 80%': { status_category: 'ACTIVE', normalized_status: 'Pending 80% Payment' },
  'pending 80% payment': { status_category: 'ACTIVE', normalized_status: 'Pending 80% Payment' },
  'nem approved, pending 80%': { status_category: 'ACTIVE', normalized_status: 'NEM Approved - Pending 80%' },
  
  'pending 20%': { status_category: 'ACTIVE', normalized_status: 'Pending 20% Payment' },
  'pending 20% payment': { status_category: 'ACTIVE', normalized_status: 'Pending 20% Payment' },
  
  'pending handover': { status_category: 'ACTIVE', normalized_status: 'Pending Handover' },
  
  // Active - Process stages
  'pending design': { status_category: 'ACTIVE', normalized_status: 'Pending Design' },
  'pending site visit': { status_category: 'ACTIVE', normalized_status: 'Pending Site Visit' },
  'pending seda': { status_category: 'ACTIVE', normalized_status: 'Pending SEDA Submission' },
  'pending seda submission': { status_category: 'ACTIVE', normalized_status: 'Pending SEDA Submission' },
  'seda submitted': { status_category: 'ACTIVE', normalized_status: 'SEDA Submitted' },
  'seda approved': { status_category: 'ACTIVE', normalized_status: 'SEDA Approved' },
  'pending installation': { status_category: 'ACTIVE', normalized_status: 'Pending Installation' },
  'installation scheduled': { status_category: 'ACTIVE', normalized_status: 'Installation Scheduled' },
  'installation in progress': { status_category: 'ACTIVE', normalized_status: 'Installation In Progress' },
};

/**
 * Standardize status text and derive category
 */
export function standardizeStatus(status: string | null | undefined): {
  status: string;
  status_category: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REFUND';
} {
  if (!status) {
    return { status: 'Unknown', status_category: 'ACTIVE' };
  }
  
  const normalized = status.toLowerCase().trim();
  
  // Direct match
  if (STATUS_MAPPING[normalized]) {
    return {
      status: STATUS_MAPPING[normalized].normalized_status,
      status_category: STATUS_MAPPING[normalized].status_category as any,
    };
  }
  
  // Partial match
  for (const [key, value] of Object.entries(STATUS_MAPPING)) {
    if (normalized.includes(key)) {
      return {
        status: value.normalized_status,
        status_category: value.status_category as any,
      };
    }
  }
  
  // Keyword-based categorization
  if (normalized.includes('completed') || normalized.includes('done') || normalized.includes('energized')) {
    return { status, status_category: 'COMPLETED' };
  }
  if (normalized.includes('cancel')) {
    return { status, status_category: 'CANCELLED' };
  }
  if (normalized.includes('refund')) {
    return { status, status_category: 'REFUND' };
  }
  
  // Default to ACTIVE
  return { status, status_category: 'ACTIVE' };
}

// ============================================
// STATE EXTRACTION
// ============================================

const MALAYSIAN_STATES = [
  'JOHOR', 'KEDAH', 'KELANTAN', 'MELAKA', 'NEGERI SEMBILAN', 'N9',
  'PAHANG', 'PERAK', 'PERLIS', 'PULAU PINANG', 'PENANG',
  'SABAH', 'SARAWAK', 'SELANGOR', 'TERENGGANU',
  'KUALA LUMPUR', 'KL', 'LABUAN', 'PUTRAJAYA'
];

const STATE_ALIASES: Record<string, string> = {
  'N9': 'NEGERI SEMBILAN',
  'KL': 'KUALA LUMPUR',
  'PENANG': 'PULAU PINANG',
};

/**
 * Extract and normalize state from address or state field
 */
export function extractState(value: string | null | undefined): string | null {
  if (!value) return null;
  
  const upper = value.toUpperCase();
  
  // Direct match
  for (const state of MALAYSIAN_STATES) {
    if (upper.includes(state)) {
      return STATE_ALIASES[state] || state;
    }
  }
  
  return null;
}

// ============================================
// BALANCE CALCULATION
// ============================================

export interface PaymentData {
  total_sales?: number | null;
  booking_amount?: number | null;
  payment_80_amount?: number | null;
  payment_20_amount?: number | null;
  balance?: number | null;
}

/**
 * Calculate or validate balance based on payments
 */
export function calculateBalance(data: PaymentData): number {
  const totalSales = data.total_sales ?? 0;
  const booking = data.booking_amount ?? 0;
  const pay80 = data.payment_80_amount ?? 0;
  const pay20 = data.payment_20_amount ?? 0;
  
  // If balance is provided and non-zero, use it
  if (data.balance !== null && data.balance !== undefined && data.balance !== 0) {
    return data.balance;
  }
  
  // Calculate from payments
  const totalPaid = booking + pay80 + pay20;
  return Math.max(0, totalSales - totalPaid);
}

// ============================================
// FULL ROW NORMALIZATION
// ============================================

export interface RawExcelRow {
  [key: string]: unknown;
}

export interface NormalizedProjectRow {
  project_no: string;
  sequence_no: number | null;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  client_ic: string | null;
  spouse_ic: string | null;
  address: string | null;
  state: string | null;
  site_ownership: string | null;
  project_type: string;
  month: string | null;
  quarter: string | null;
  event_name: string | null;
  event_date: string | null;
  proposed_capacity_kwp: number | null;
  proposed_system: string | null;
  finalized_capacity_kwp: number | null;
  finalized_capacity_kwac: number | null;
  system_finalized: string | null;
  status: string;
  status_category: string;
  remarks: string | null;
  total_sales: number | null;
  balance: number;
  mode_of_payment: string | null;
  bank_merchant: string | null;
}

/**
 * Normalize a raw Excel row to database format
 */
export function normalizeRow(raw: RawExcelRow): NormalizedProjectRow {
  const statusResult = standardizeStatus(raw.status as string);
  
  const paymentData: PaymentData = {
    total_sales: cleanCurrency(raw.total_sales),
    booking_amount: cleanCurrency(raw.booking_amount),
    payment_80_amount: cleanCurrency(raw.payment_80_amount),
    payment_20_amount: cleanCurrency(raw.payment_20_amount),
    balance: cleanCurrency(raw.balance),
  };
  
  // Try to extract state from address if not provided
  let state = raw.state as string | null;
  if (!state && raw.address) {
    state = extractState(raw.address as string);
  }
  
  return {
    project_no: String(raw.project_no || '').trim(),
    sequence_no: raw.sequence_no ? parseInt(String(raw.sequence_no)) : null,
    client_name: String(raw.client_name || '').trim(),
    client_phone: raw.client_phone ? String(raw.client_phone).trim() : null,
    client_email: raw.client_email ? String(raw.client_email).trim() : null,
    client_ic: raw.client_ic ? String(raw.client_ic).trim() : null,
    spouse_ic: raw.spouse_ic ? String(raw.spouse_ic).trim() : null,
    address: raw.address ? String(raw.address).trim() : null,
    state: state ? state.toUpperCase() : null,
    site_ownership: raw.site_ownership ? String(raw.site_ownership).trim() : null,
    project_type: 'RESIDENTIAL',
    month: raw.month ? String(raw.month).trim() : null,
    quarter: raw.quarter ? String(raw.quarter).trim() : null,
    event_name: raw.event_name ? String(raw.event_name).trim() : null,
    event_date: raw.event_date ? String(raw.event_date).trim() : null,
    proposed_capacity_kwp: cleanCurrency(raw.proposed_capacity_kwp),
    proposed_system: raw.proposed_system ? String(raw.proposed_system).trim() : null,
    finalized_capacity_kwp: cleanCurrency(raw.finalized_capacity_kwp),
    finalized_capacity_kwac: cleanCurrency(raw.finalized_capacity_kwac),
    system_finalized: raw.system_finalized ? String(raw.system_finalized).trim() : null,
    status: statusResult.status,
    status_category: statusResult.status_category,
    remarks: raw.remarks ? String(raw.remarks).trim() : null,
    total_sales: paymentData.total_sales,
    balance: calculateBalance(paymentData),
    mode_of_payment: raw.mode_of_payment ? String(raw.mode_of_payment).trim() : null,
    bank_merchant: raw.bank_merchant ? String(raw.bank_merchant).trim() : null,
  };
}

export default {
  cleanCurrency,
  parseDate,
  formatDateISO,
  standardizeStatus,
  extractState,
  calculateBalance,
  normalizeRow,
};
