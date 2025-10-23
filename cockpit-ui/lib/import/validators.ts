// lib/import/validators.ts
// Zod validation schemas for import data

import { z } from "zod";
import type { ValidationError } from "./types";

// Voltek V19.9 Lead/Payment schema
export const VoltekLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  stage: z.string().min(1, "Stage is required"),
  amount: z.number().positive("Amount must be positive"),
  days_overdue: z.number().int().min(0).optional(),
  last_contact: z.string().optional(),
  next_action: z.string().optional(),
  paid_at: z.string().optional(),
  days_to_pay: z.number().int().min(0).optional(),
});

export const VoltekFixtureSchema = z.object({
  summary: z.object({
    pending_80_value: z.number().min(0),
    pending_20_value: z.number().min(0),
    pending_handover_value: z.number().min(0),
    total_recoverable: z.number().min(0),
  }),
  kpi: z.object({
    recovery_rate_7d: z.number().min(0).max(1),
    recovery_rate_30d: z.number().min(0).max(1),
    average_days_to_payment: z.number().min(0),
    escalation_rate: z.number().min(0).max(1),
  }),
  critical_leads: z.array(VoltekLeadSchema),
  active_reminders: z.array(VoltekLeadSchema).optional(),
  recent_success: z.array(VoltekLeadSchema),
});

export function validateRow(
  row: Record<string, any>,
  schema: z.ZodSchema,
  rowIndex: number
): ValidationError[] {
  const result = schema.safeParse(row);
  if (result.success) return [];

  const errors: ValidationError[] = [];
  if (result.error) {
    for (const issue of result.error.issues) {
      errors.push({
        row: rowIndex + 1, // 1-indexed for user display
        column: issue.path.join(".") || "unknown",
        message: issue.message,
        value: row[issue.path[0] as string],
      });
    }
  }
  return errors;
}

export function validateAllRows(
  rows: Array<Record<string, any>>,
  schema: z.ZodSchema
): ValidationError[] {
  const allErrors: ValidationError[] = [];
  rows.forEach((row, idx) => {
    const rowErrors = validateRow(row, schema, idx);
    allErrors.push(...rowErrors);
  });
  return allErrors;
}

export function generateErrorCSV(errors: ValidationError[]): string {
  if (errors.length === 0) return "";

  const header = "Row,Column,Error,Value\n";
  const rows = errors.map((e) => {
    const value = e.value !== undefined ? String(e.value) : "";
    return `${e.row},"${e.column}","${e.message}","${value}"`;
  });

  return header + rows.join("\n");
}

export function downloadErrorCSV(errors: ValidationError[], filename = "import-errors.csv") {
  const csv = generateErrorCSV(errors);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
