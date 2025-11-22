// Voltek Recovery Calculation Utilities

export interface VoltekLead {
  id: string;
  company: string;
  contact: string;
  phone: string;
  email: string;
  amount: number;
  status: 'critical' | 'pending' | 'recovered' | 'written_off';
  overdue_days: number;
  last_contact: string;
  next_action: string;
  notes: string;
  priority: number;
}

export interface VoltekSummary {
  total_recoverable: number;
  pending_amount: number;
  pending_percentage: number;
  recovered_amount: number;
  critical_count: number;
  total_leads: number;
  recovery_rate_30d: number;
  avg_days_overdue: number;
}

export interface VoltekActivity {
  id: string;
  lead_id: string;
  action: string;
  amount?: number;
  channel?: string;
  duration?: number;
  timestamp: string;
  user: string;
}

export interface VoltekData {
  summary: VoltekSummary;
  leads: VoltekLead[];
  activity_log: VoltekActivity[];
}

// Format currency in Malaysian Ringgit
export function formatMYR(amount: number): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

// Format date/time
export function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-MY', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateString));
}

// Format relative time (e.g., "2 days ago")
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

// Calculate total amount by status
export function calculateAmountByStatus(leads: VoltekLead[], status: VoltekLead['status']): number {
  return leads
    .filter(lead => lead.status === status)
    .reduce((sum, lead) => sum + lead.amount, 0);
}

// Calculate count by status
export function calculateCountByStatus(leads: VoltekLead[], status: VoltekLead['status']): number {
  return leads.filter(lead => lead.status === status).length;
}

// Get critical leads (sorted by priority)
export function getCriticalLeads(leads: VoltekLead[]): VoltekLead[] {
  return leads
    .filter(lead => lead.status === 'critical')
    .sort((a, b) => a.priority - b.priority);
}

// Get pending leads
export function getPendingLeads(leads: VoltekLead[]): VoltekLead[] {
  return leads
    .filter(lead => lead.status === 'pending')
    .sort((a, b) => b.overdue_days - a.overdue_days);
}

// Calculate average overdue days for active leads
export function calculateAvgOverdueDays(leads: VoltekLead[]): number {
  const activeLeads = leads.filter(lead =>
    lead.status === 'critical' || lead.status === 'pending'
  );
  if (activeLeads.length === 0) return 0;

  const totalDays = activeLeads.reduce((sum, lead) => sum + lead.overdue_days, 0);
  return Math.round(totalDays / activeLeads.length);
}

// Calculate recovery rate
export function calculateRecoveryRate(leads: VoltekLead[]): number {
  const totalAmount = leads.reduce((sum, lead) => sum + lead.amount, 0);
  const recoveredAmount = calculateAmountByStatus(leads, 'recovered');

  if (totalAmount === 0) return 0;
  return recoveredAmount / totalAmount;
}

// Get priority color class based on status
export function getStatusColor(status: VoltekLead['status']): string {
  switch (status) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'recovered':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'written_off':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

// Get urgency level based on overdue days
export function getUrgencyLevel(overdueDays: number): 'high' | 'medium' | 'low' {
  if (overdueDays >= 60) return 'high';
  if (overdueDays >= 30) return 'medium';
  return 'low';
}

// Validate phone number format (Malaysian)
export function isValidMalaysianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // Malaysian mobile: 01X-XXXXXXX or 01X-XXXXXXXX
  // With country code: 601X-XXXXXXX
  return /^(60)?1\d{8,9}$/.test(cleaned);
}

// Format phone for display
export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('60')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)}-${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

// Generate WhatsApp link
export function generateWhatsAppLink(phone: string, message?: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const phoneNumber = cleaned.startsWith('60') ? cleaned : `60${cleaned}`;
  const encodedMessage = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${phoneNumber}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
}

// Generate SMS link
export function generateSMSLink(phone: string, message?: string): string {
  const encodedMessage = message ? encodeURIComponent(message) : '';
  return `sms:${phone}${encodedMessage ? `?body=${encodedMessage}` : ''}`;
}

// Generate tel link
export function generateTelLink(phone: string): string {
  return `tel:${phone}`;
}

// CSV validation for import
export interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
  validRowCount: number;
}

export function validateCSVData(rows: string[][]): CSVValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let validRowCount = 0;

  if (rows.length < 2) {
    errors.push('CSV must contain at least a header row and one data row');
    return { isValid: false, errors, warnings, rowCount: rows.length, validRowCount };
  }

  const headers = rows[0].map(h => h.toLowerCase().trim());
  const requiredFields = ['company', 'contact', 'phone', 'amount'];

  for (const field of requiredFields) {
    if (!headers.includes(field)) {
      errors.push(`Missing required column: ${field}`);
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings, rowCount: rows.length - 1, validRowCount };
  }

  const companyIdx = headers.indexOf('company');
  const contactIdx = headers.indexOf('contact');
  const phoneIdx = headers.indexOf('phone');
  const amountIdx = headers.indexOf('amount');
  const emailIdx = headers.indexOf('email');

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    let rowValid = true;

    if (!row[companyIdx]?.trim()) {
      errors.push(`Row ${i}: Company name is required`);
      rowValid = false;
    }

    if (!row[contactIdx]?.trim()) {
      errors.push(`Row ${i}: Contact name is required`);
      rowValid = false;
    }

    if (!row[phoneIdx]?.trim()) {
      errors.push(`Row ${i}: Phone number is required`);
      rowValid = false;
    } else if (!isValidMalaysianPhone(row[phoneIdx])) {
      warnings.push(`Row ${i}: Phone number may not be valid Malaysian format`);
    }

    const amount = parseFloat(row[amountIdx]);
    if (isNaN(amount) || amount <= 0) {
      errors.push(`Row ${i}: Amount must be a positive number`);
      rowValid = false;
    }

    if (emailIdx >= 0 && row[emailIdx]?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row[emailIdx].trim())) {
        warnings.push(`Row ${i}: Email format may be invalid`);
      }
    }

    if (rowValid) validRowCount++;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    rowCount: rows.length - 1,
    validRowCount,
  };
}

// Parse CSV string to rows
export function parseCSV(csvString: string): string[][] {
  const lines = csvString.trim().split('\n');
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  });
}
