// lib/data/ingest/voltek.ts
// Voltek Excel import utilities

import * as XLSX from "xlsx";
import { z } from "zod";

// Zod schema for a single project row
export const VoltekProjectSchema = z.object({
  id: z.string().min(1, "Project ID is required"),
  name: z.string().min(1, "Project name is required"),
  client: z.string().optional(),
  status: z.enum(["active", "pending", "completed", "cancelled"]).optional(),
  budget: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  owner: z.string().optional(),
  revenue: z.number().optional(),
  cost: z.number().optional(),
});

export type VoltekProject = z.infer<typeof VoltekProjectSchema>;

export interface ValidationIssue {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  success: boolean;
  dataset: VoltekProject[];
  issues: ValidationIssue[];
  raw?: any[];
}

/**
 * Parse and validate Excel file containing Voltek project data
 */
export async function importVoltekExcel(file: File): Promise<ImportResult> {
  try {
    // Read file as ArrayBuffer
    const buffer = await file.arrayBuffer();

    // Parse with xlsx
    const workbook = XLSX.read(buffer, { type: "array" });

    // Get first sheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return {
        success: false,
        dataset: [],
        issues: [{ row: 0, field: "file", message: "No sheets found in Excel file" }],
      };
    }

    const worksheet = workbook.Sheets[firstSheetName];

    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: undefined });

    if (!Array.isArray(rawData) || rawData.length === 0) {
      return {
        success: false,
        dataset: [],
        issues: [{ row: 0, field: "file", message: "No data rows found in Excel file" }],
        raw: [],
      };
    }

    // Normalize and validate each row
    const dataset: VoltekProject[] = [];
    const issues: ValidationIssue[] = [];

    rawData.forEach((row: any, idx: number) => {
      const rowNum = idx + 2; // Excel row number (1-indexed + header)

      try {
        // Normalize row to expected schema
        const normalized = {
          id: String(row.ID || row.id || row["Project ID"] || "").trim(),
          name: String(row.Name || row.name || row["Project Name"] || "").trim(),
          client: row.Client || row.client || row.Customer,
          status: normalizeStatus(row.Status || row.status),
          budget: parseNumber(row.Budget || row.budget),
          startDate: row["Start Date"] || row.startDate || row.start_date,
          endDate: row["End Date"] || row.endDate || row.end_date,
          owner: row.Owner || row.owner || row["Project Owner"],
          revenue: parseNumber(row.Revenue || row.revenue),
          cost: parseNumber(row.Cost || row.cost),
        };

        // Validate with Zod
        const result = VoltekProjectSchema.safeParse(normalized);

        if (result.success) {
          dataset.push(result.data);
        } else {
          // Collect validation errors
          result.error.issues.forEach((err: any) => {
            issues.push({
              row: rowNum,
              field: err.path.join("."),
              message: err.message,
            });
          });

          // Still add the row with partial data for preview
          dataset.push(normalized as VoltekProject);
        }
      } catch (err: any) {
        issues.push({
          row: rowNum,
          field: "parse",
          message: err?.message || "Failed to parse row",
        });
      }
    });

    return {
      success: issues.length === 0,
      dataset,
      issues,
      raw: rawData,
    };
  } catch (err: any) {
    return {
      success: false,
      dataset: [],
      issues: [
        {
          row: 0,
          field: "file",
          message: err?.message || "Failed to read Excel file",
        },
      ],
    };
  }
}

// Helper: normalize status values
function normalizeStatus(val: any): "active" | "pending" | "completed" | "cancelled" | undefined {
  if (!val) return undefined;
  const str = String(val).toLowerCase().trim();
  if (str === "active" || str === "in progress") return "active";
  if (str === "pending" || str === "planned") return "pending";
  if (str === "completed" || str === "done" || str === "closed") return "completed";
  if (str === "cancelled" || str === "canceled") return "cancelled";
  return undefined;
}

// Helper: parse number from various formats
function parseNumber(val: any): number | undefined {
  if (val === null || val === undefined || val === "") return undefined;
  if (typeof val === "number") return val;
  // Remove currency symbols and commas
  const cleaned = String(val).replace(/[$,]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}
