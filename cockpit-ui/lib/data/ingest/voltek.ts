/**
 * Voltek Excel data importer
 *
 * This module provides the main entry point for importing Voltek Excel files
 * and normalizing them to the VoltekDataset structure with Zod validation.
 */

import * as XLSX from 'xlsx';
import { parseExcelFile, readExcelFile, parseExcel, ExcelMapping } from './excel';
import {
  VoltekDataset,
  VoltekProject,
  VoltekLead,
  VoltekFinancial,
  VoltekInstallationTask,
  VoltekMaterial,
  safeParseDataset,
  ValidationIssue,
} from '../schemas';

// Import mapping configuration
// Note: Ensure tsconfig.json has "resolveJsonModule": true
import voltekMappingJson from '../mapping/voltek.xlsx.map.json';
const voltekMapping = voltekMappingJson as ExcelMapping;

/**
 * Import result with validation feedback
 */
export interface ImportResult {
  success: boolean;
  data?: VoltekDataset;
  issues: ValidationIssue[];
  stats: {
    projectsCount: number;
    leadsCount: number;
    financialsCount: number;
    installationTasksCount: number;
    materialsCount: number;
  };
}

/**
 * Generate a unique ID if one is missing
 */
function generateId(prefix: string, index: number): string {
  return `${prefix}_${Date.now()}_${index}`;
}

/**
 * Normalize projects data
 */
function normalizeProjects(rows: Record<string, any>[]): VoltekProject[] {
  return rows.map((row, index) => {
    // Ensure ID exists
    if (!row.id) {
      row.id = generateId('proj', index);
    }

    // Map status values to valid enum values
    if (row.status) {
      const statusMap: Record<string, string> = {
        lead: 'lead',
        qualified: 'qualified',
        'in progress': 'in_progress',
        inprogress: 'in_progress',
        'in-progress': 'in_progress',
        installed: 'installed',
        complete: 'completed',
        completed: 'completed',
        cancelled: 'cancelled',
        canceled: 'cancelled',
        'on hold': 'on_hold',
        onhold: 'on_hold',
        'on-hold': 'on_hold',
      };
      row.status = statusMap[row.status.toLowerCase()] || row.status;
    }

    // Map priority values
    if (row.priority) {
      const priorityMap: Record<string, string> = {
        h: 'high',
        high: 'high',
        m: 'medium',
        med: 'medium',
        medium: 'medium',
        l: 'low',
        low: 'low',
      };
      row.priority = priorityMap[row.priority.toLowerCase()] || row.priority;
    }

    return row as VoltekProject;
  });
}

/**
 * Normalize leads data
 */
function normalizeLeads(rows: Record<string, any>[]): VoltekLead[] {
  return rows.map((row, index) => {
    if (!row.id) {
      row.id = generateId('lead', index);
    }
    return row as VoltekLead;
  });
}

/**
 * Normalize financials data
 */
function normalizeFinancials(rows: Record<string, any>[]): VoltekFinancial[] {
  return rows.map((row, index) => {
    if (!row.id) {
      row.id = generateId('fin', index);
    }

    // Map transaction type
    if (row.type) {
      const typeMap: Record<string, string> = {
        income: 'income',
        revenue: 'income',
        payment: 'income',
        expense: 'expense',
        cost: 'expense',
        expenditure: 'expense',
      };
      row.type = typeMap[row.type.toLowerCase()] || row.type;
    }

    return row as VoltekFinancial;
  });
}

/**
 * Normalize installation tasks data
 */
function normalizeInstallationTasks(
  rows: Record<string, any>[]
): VoltekInstallationTask[] {
  return rows.map((row, index) => {
    if (!row.id) {
      row.id = generateId('task', index);
    }
    return row as VoltekInstallationTask;
  });
}

/**
 * Normalize materials data
 */
function normalizeMaterials(rows: Record<string, any>[]): VoltekMaterial[] {
  return rows.map((row, index) => {
    if (!row.id) {
      row.id = generateId('mat', index);
    }
    return row as VoltekMaterial;
  });
}

/**
 * Main import function: Import Voltek Excel file
 *
 * @param file - The Excel file to import
 * @returns Promise<ImportResult> - The parsed and validated dataset with issues
 *
 * @example
 * ```typescript
 * // In a component or API route:
 * const result = await importVoltekExcel(uploadedFile);
 *
 * if (result.success) {
 *   console.log(`Imported ${result.stats.projectsCount} projects`);
 *   console.log(`Imported ${result.stats.leadsCount} leads`);
 *   // Use result.data
 * } else {
 *   console.error('Import failed with issues:', result.issues);
 * }
 * ```
 */
export async function importVoltekExcel(file: File): Promise<ImportResult> {
  const issues: ValidationIssue[] = [];

  try {
    // Parse Excel file using mapping
    const parsed = await parseExcelFile(file, voltekMapping);

    // Collect parsing issues
    issues.push(...parsed.issues);

    // Normalize data from each sheet
    const projects = normalizeProjects(
      parsed.sheets.projects?.rows || []
    );
    const leads = normalizeLeads(parsed.sheets.leads?.rows || []);
    const financials = normalizeFinancials(
      parsed.sheets.financials?.rows || []
    );
    const installationTasks = normalizeInstallationTasks(
      parsed.sheets.installation?.rows || []
    );
    const materials = normalizeMaterials(
      parsed.sheets.materials?.rows || []
    );

    // Construct dataset
    const dataset: VoltekDataset = {
      projects,
      leads,
      financials,
      installationTasks,
      materials,
    };

    // Validate with Zod schema
    const validationResult = safeParseDataset(dataset);

    if (!validationResult.success) {
      issues.push(...validationResult.issues);
    }

    // Calculate stats
    const stats = {
      projectsCount: projects.length,
      leadsCount: leads.length,
      financialsCount: financials.length,
      installationTasksCount: installationTasks.length,
      materialsCount: materials.length,
    };

    // Return result
    return {
      success: validationResult.success,
      data: validationResult.success ? validationResult.data : dataset,
      issues,
      stats,
    };
  } catch (error) {
    issues.push({
      message: `Failed to import Excel file: ${error instanceof Error ? error.message : String(error)}`,
      severity: 'error',
    });

    return {
      success: false,
      issues,
      stats: {
        projectsCount: 0,
        leadsCount: 0,
        financialsCount: 0,
        installationTasksCount: 0,
        materialsCount: 0,
      },
    };
  }
}

/**
 * Get basic workbook information without full parsing
 */
export async function getWorkbookInfo(file: File): Promise<{
  sheetNames: string[];
  fileSize: number;
  fileName: string;
}> {
  const workbook = await readExcelFile(file);
  return {
    sheetNames: workbook.SheetNames,
    fileSize: file.size,
    fileName: file.name,
  };
}

/**
 * Preview first N rows from each sheet
 */
export async function previewWorkbook(
  file: File,
  maxRows: number = 5
): Promise<{
  sheets: {
    [sheetName: string]: {
      headers: string[];
      rows: any[][];
    };
  };
}> {
  const workbook = await readExcelFile(file);
  const sheets: {
    [sheetName: string]: { headers: string[]; rows: any[][] };
  } = {};

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
    }) as any[][];

    if (jsonData.length > 0) {
      const headers = jsonData[0] || [];
      const rows = jsonData.slice(1, maxRows + 1);
      sheets[sheetName] = { headers, rows };
    }
  }

  return { sheets };
}

// Re-export for convenience
export { VoltekDataset, ValidationIssue } from '../schemas';
