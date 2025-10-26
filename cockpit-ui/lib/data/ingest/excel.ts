/**
 * Generic Excel parser with configurable column mapping and transforms
 *
 * This module provides utilities to parse Excel files using a mapping configuration
 * that specifies how to transform Excel columns into structured data.
 */

import * as XLSX from 'xlsx';
import { ValidationIssue } from '../schemas';

// Mapping configuration types
export interface ColumnMapping {
  sourceHeaders: string[];
  targetField: string;
  required: boolean;
  transform?: TransformType;
}

export interface SheetMapping {
  sheetNames: string[];
  columns: ColumnMapping[];
}

export interface ExcelMapping {
  sheets: {
    [key: string]: SheetMapping;
  };
}

export type TransformType =
  | 'toString'
  | 'toNumber'
  | 'toDate'
  | 'toLower'
  | 'toUpper'
  | 'toBoolean';

// Parsed result
export interface ParsedSheet {
  sheetName: string;
  rows: Record<string, any>[];
  issues: ValidationIssue[];
}

export interface ParsedWorkbook {
  sheets: {
    [key: string]: ParsedSheet;
  };
  issues: ValidationIssue[];
}

/**
 * Read Excel file from File object
 */
export async function readExcelFile(file: File): Promise<XLSX.WorkBook> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false,
  });
  return workbook;
}

/**
 * Find matching sheet name from possible sheet names
 */
function findMatchingSheet(
  workbook: XLSX.WorkBook,
  possibleNames: string[]
): string | null {
  for (const name of possibleNames) {
    // Exact match (case-insensitive)
    const exactMatch = workbook.SheetNames.find(
      (sheetName) => sheetName.toLowerCase() === name.toLowerCase()
    );
    if (exactMatch) return exactMatch;

    // Partial match (case-insensitive)
    const partialMatch = workbook.SheetNames.find((sheetName) =>
      sheetName.toLowerCase().includes(name.toLowerCase())
    );
    if (partialMatch) return partialMatch;
  }
  return null;
}

/**
 * Find matching column header from possible headers
 */
function findMatchingHeader(
  headers: string[],
  possibleHeaders: string[]
): string | null {
  for (const possible of possibleHeaders) {
    // Exact match (case-insensitive, trimmed)
    const exactMatch = headers.find(
      (header) =>
        header.toLowerCase().trim() === possible.toLowerCase().trim()
    );
    if (exactMatch) return exactMatch;

    // Partial match (case-insensitive)
    const partialMatch = headers.find((header) =>
      header.toLowerCase().includes(possible.toLowerCase())
    );
    if (partialMatch) return partialMatch;
  }
  return null;
}

/**
 * Apply transform to a value
 */
function applyTransform(
  value: any,
  transform: TransformType | undefined
): any {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  switch (transform) {
    case 'toString':
      return String(value).trim();

    case 'toNumber':
      return parseNumber(value);

    case 'toDate':
      return parseDate(value);

    case 'toLower':
      return String(value).toLowerCase().trim();

    case 'toUpper':
      return String(value).toUpperCase().trim();

    case 'toBoolean':
      return parseBoolean(value);

    default:
      return value;
  }
}

/**
 * Safe number parsing
 */
function parseNumber(value: any): number | undefined {
  if (typeof value === 'number') {
    return isNaN(value) ? undefined : value;
  }

  if (typeof value === 'string') {
    // Remove currency symbols, commas, and whitespace
    const cleaned = value.replace(/[$,\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  }

  return undefined;
}

/**
 * Safe date parsing
 */
function parseDate(value: any): Date | undefined {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : value;
  }

  if (typeof value === 'number') {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return new Date(date.y, date.m - 1, date.d, date.H || 0, date.M || 0, date.S || 0);
    }
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }

  return undefined;
}

/**
 * Parse boolean values
 */
function parseBoolean(value: any): boolean | undefined {
  if (typeof value === 'boolean') return value;

  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower === 'true' || lower === 'yes' || lower === '1') return true;
    if (lower === 'false' || lower === 'no' || lower === '0') return false;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return undefined;
}

/**
 * Check if a row is empty (all values are null/undefined/empty string)
 */
function isEmptyRow(row: Record<string, any>): boolean {
  return Object.values(row).every(
    (value) =>
      value === null ||
      value === undefined ||
      value === '' ||
      (typeof value === 'string' && value.trim() === '')
  );
}

/**
 * Parse a single sheet using column mappings
 */
export function parseSheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
  mapping: SheetMapping
): ParsedSheet {
  const issues: ValidationIssue[] = [];
  const rows: Record<string, any>[] = [];

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    issues.push({
      sheet: sheetName,
      message: `Sheet "${sheetName}" not found in workbook`,
      severity: 'error',
    });
    return { sheetName, rows, issues };
  }

  // Convert sheet to JSON with header row
  const rawData = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: false,
    defval: '',
  }) as any[][];

  if (rawData.length === 0) {
    issues.push({
      sheet: sheetName,
      message: `Sheet "${sheetName}" is empty`,
      severity: 'warning',
    });
    return { sheetName, rows, issues };
  }

  // Extract headers from first row
  const headers = rawData[0].map((h: any) => String(h).trim());

  // Build column index map
  const columnMap = new Map<string, { index: number; mapping: ColumnMapping }>();

  for (const colMapping of mapping.columns) {
    const matchedHeader = findMatchingHeader(headers, colMapping.sourceHeaders);

    if (matchedHeader) {
      const index = headers.indexOf(matchedHeader);
      columnMap.set(colMapping.targetField, { index, mapping: colMapping });
    } else if (colMapping.required) {
      issues.push({
        sheet: sheetName,
        field: colMapping.targetField,
        message: `Required column not found. Expected one of: ${colMapping.sourceHeaders.join(', ')}`,
        severity: 'error',
      });
    }
  }

  // Parse data rows (skip header row)
  for (let i = 1; i < rawData.length; i++) {
    const rawRow = rawData[i];
    const parsedRow: Record<string, any> = {};

    // Map columns to target fields
    for (const [targetField, { index, mapping: colMapping }] of columnMap.entries()) {
      const rawValue = rawRow[index];
      const transformedValue = applyTransform(rawValue, colMapping.transform);
      parsedRow[targetField] = transformedValue;
    }

    // Skip completely empty rows
    if (isEmptyRow(parsedRow)) {
      continue;
    }

    // Validate required fields
    for (const colMapping of mapping.columns) {
      if (colMapping.required && !parsedRow[colMapping.targetField]) {
        issues.push({
          sheet: sheetName,
          row: i + 1,
          field: colMapping.targetField,
          message: `Required field "${colMapping.targetField}" is missing or empty`,
          severity: 'warning',
        });
      }
    }

    rows.push(parsedRow);
  }

  return { sheetName, rows, issues };
}

/**
 * Parse entire workbook using mapping configuration
 */
export function parseExcel(
  workbook: XLSX.WorkBook,
  mapping: ExcelMapping
): ParsedWorkbook {
  const sheets: { [key: string]: ParsedSheet } = {};
  const allIssues: ValidationIssue[] = [];

  for (const [sheetKey, sheetMapping] of Object.entries(mapping.sheets)) {
    const matchedSheetName = findMatchingSheet(workbook, sheetMapping.sheetNames);

    if (!matchedSheetName) {
      allIssues.push({
        message: `No matching sheet found for "${sheetKey}". Expected one of: ${sheetMapping.sheetNames.join(', ')}`,
        severity: 'info',
      });
      sheets[sheetKey] = {
        sheetName: sheetKey,
        rows: [],
        issues: [],
      };
      continue;
    }

    const parsedSheet = parseSheet(workbook, matchedSheetName, sheetMapping);
    sheets[sheetKey] = parsedSheet;
    allIssues.push(...parsedSheet.issues);
  }

  return { sheets, issues: allIssues };
}

/**
 * Main entry point: parse Excel file with mapping
 */
export async function parseExcelFile(
  file: File,
  mapping: ExcelMapping
): Promise<ParsedWorkbook> {
  const workbook = await readExcelFile(file);
  return parseExcel(workbook, mapping);
}
