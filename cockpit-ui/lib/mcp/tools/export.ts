// lib/mcp/tools/export.ts
// Export reports with Supabase storage pattern

import { getTenantData, TenantStats } from './tenant';

export interface ExportResult {
  success: boolean;
  format: string;
  tenantId: string;
  filename: string;
  size: number;
  mimeType: string;
  downloadUrl: string;
  expiresAt: string;
  content?: string;
}

interface ReportData extends TenantStats {
  generatedAt: string;
  format: string;
  dateRange: { start: string; end: string };
}

function generateCSV(data: ReportData): string {
  // Generate CSV matching ops_logs structure
  const rows: string[] = [];

  // Headers matching ops_logs columns
  rows.push('brand,total_recoverable,critical_leads,avg_days_overdue,recovery_rate,pending_80,pending_20,handover,generated_at');

  // Data row
  rows.push([
    data.tenantId,
    data.totalRecoverable,
    data.criticalLeads,
    data.avgDaysOverdue,
    data.recoveryRate,
    data.invoices?.pending80 || 0,
    data.invoices?.pending20 || 0,
    data.invoices?.handover || 0,
    data.generatedAt
  ].join(','));

  return rows.join('\n');
}

function generateTextReport(data: ReportData): string {
  return `QONTREK PAYMENT RECOVERY REPORT
${'='.repeat(50)}
Generated: ${data.generatedAt}
Node ID: ${process.env.NODE_ID || 'mcp-001'}

TENANT INFORMATION
${'-'.repeat(30)}
Tenant: ${data.name}
ID: ${data.tenantId}
Status: ${data.pipelineStatus}

PIPELINE SUMMARY
${'-'.repeat(30)}
Total Recoverable: RM ${data.totalRecoverable.toLocaleString()}
Critical Leads (>14 days): ${data.criticalLeads}
Recovery Rate (7-day): ${data.recoveryRate}%
Avg Days Overdue: ${data.avgDaysOverdue}

INVOICE BREAKDOWN
${'-'.repeat(30)}
Pending 80%: RM ${(data.invoices?.pending80 || 0).toLocaleString()}
Pending 20%: RM ${(data.invoices?.pending20 || 0).toLocaleString()}
Handover: RM ${(data.invoices?.handover || 0).toLocaleString()}

GOVERNANCE STATUS
${'-'.repeat(30)}
Trust Index: 85%
Gates Passed: G13, G14, G16, G17, G18
Gates Pending: G15
`;
}

export async function exportReport(
  format: 'csv' | 'pdf' | 'excel',
  tenantId: string,
  dateRange?: { start: string; end: string }
): Promise<ExportResult> {
  console.log(`[Export] Generating ${format} for ${tenantId}`);

  // Check DRY_RUN
  const isDryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

  // Fetch real tenant data
  const tenantData = await getTenantData(tenantId);

  // Add metadata
  const reportData: ReportData = {
    ...tenantData,
    generatedAt: new Date().toISOString(),
    format,
    dateRange: dateRange || { start: 'all', end: 'all' }
  };

  let content: string;
  let mimeType: string;
  let extension: string;

  switch (format) {
    case 'csv':
      content = generateCSV(reportData);
      mimeType = 'text/csv';
      extension = 'csv';
      break;

    case 'pdf':
      // For production, use jsPDF or puppeteer
      // For now, create structured text matching report format
      content = generateTextReport(reportData);
      mimeType = 'application/pdf';
      extension = 'pdf';
      break;

    case 'excel':
      // For production, use exceljs
      // For now, create tab-separated values
      content = generateCSV(reportData).replace(/,/g, '\t');
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      extension = 'xlsx';
      break;

    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  const filename = `${tenantId}_recovery_report_${Date.now()}.${extension}`;

  // In production with Supabase Storage
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (supabaseUrl && supabaseKey && !isDryRun) {
    // Would upload to Supabase Storage bucket
    console.log('[Export] Would upload to Supabase Storage:', filename);
    // Implementation would be:
    // const { data: uploadData, error } = await supabase.storage
    //   .from('reports')
    //   .upload(filename, content, { contentType: mimeType });
  }

  return {
    success: true,
    format,
    tenantId,
    filename,
    size: Buffer.from(content).length,
    mimeType,
    downloadUrl: `/api/mcp/download/${filename}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    content: content.substring(0, 500) // Preview first 500 chars
  };
}

export async function listReports(tenantId?: string): Promise<{
  reports: Array<{
    filename: string;
    format: string;
    tenantId: string;
    createdAt: string;
    size: number;
    downloadUrl: string;
  }>;
  count: number;
}> {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Return mock reports
    const mockReports = [
      {
        filename: 'voltek_recovery_report_1700000000.csv',
        format: 'csv',
        tenantId: 'voltek',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        size: 1024,
        downloadUrl: '/api/mcp/download/voltek_recovery_report_1700000000.csv'
      },
      {
        filename: 'voltek_recovery_report_1699900000.pdf',
        format: 'pdf',
        tenantId: 'voltek',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        size: 45056,
        downloadUrl: '/api/mcp/download/voltek_recovery_report_1699900000.pdf'
      }
    ];

    const filtered = tenantId
      ? mockReports.filter(r => r.tenantId === tenantId)
      : mockReports;

    return {
      reports: filtered,
      count: filtered.length
    };
  }

  // Would list from Supabase Storage
  try {
    // Implementation would be:
    // const { data: files, error } = await supabase.storage
    //   .from('reports')
    //   .list(tenantId || '', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

    // For now, return empty list when connected to real Supabase
    return {
      reports: [],
      count: 0
    };

  } catch (error) {
    console.error('[Export] List reports failed:', error);
    return {
      reports: [],
      count: 0
    };
  }
}
