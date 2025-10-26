/**
 * Zod schemas for runtime validation of Voltek data structures
 * Session 1A - Data model & store
 */

import { z } from "zod";
import type {
  VoltekLead,
  VoltekProject,
  VoltekDataset,
  KpiSummary,
  GovernanceState,
  ComputedSnapshot,
  ValidationResult,
} from "./types";

// ============================================================================
// Core Domain Schemas
// ============================================================================

/**
 * Schema for VoltekLead validation
 */
export const VoltekLeadSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.enum(["new", "contacted", "qualified", "lost", "converted"]),
  source: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Schema for VoltekProject validation
 */
export const VoltekProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["active", "paused", "completed", "archived"]),
  lead_id: z.string().optional(),
  start_date: z.string(),
  end_date: z.string().optional(),
  budget: z.number().nonnegative().optional(),
  revenue: z.number().nonnegative().optional(),
  success_rate: z.number().min(0).max(100).optional(),
  recovery_rate_7d: z.number().min(0).max(100).optional(),
  created_at: z.string(),
  updated_at: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Schema for VoltekDataset validation
 */
export const VoltekDatasetSchema = z.object({
  version: z.string(),
  imported_at: z.string(),
  source: z.enum(["import", "supabase", "manual"]),
  leads: z.array(VoltekLeadSchema).optional(),
  projects: z.array(VoltekProjectSchema).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// Computed Metrics Schemas
// ============================================================================

/**
 * Schema for KPI Summary validation
 */
export const KpiSummarySchema = z.object({
  recovery_rate_7d: z.number().min(0).max(100),
  success_rate: z.number().min(0).max(100),
  trust_index: z.number().min(0).max(100),
  total_leads: z.number().int().nonnegative(),
  total_projects: z.number().int().nonnegative(),
  active_projects: z.number().int().nonnegative(),
  total_revenue: z.number().nonnegative(),
  average_project_value: z.number().nonnegative(),
  lead_conversion_rate: z.number().min(0).max(100),
  computed_at: z.string(),
});

/**
 * Schema for Governance State validation
 */
export const GovernanceStateSchema = z.object({
  badges: z.array(z.string()),
  score: z.number().min(0).max(100),
  compliance_level: z.enum(["none", "partial", "full"]),
  last_audit: z.string(),
});

/**
 * Schema for Computed Snapshot validation
 */
export const ComputedSnapshotSchema = z.object({
  summary: KpiSummarySchema,
  governance: GovernanceStateSchema,
  totals: z.record(z.string(), z.number()),
  hash: z.string(),
  source: z.enum(["import", "supabase", "manual"]),
  freshness: z.number().nonnegative(),
  dataset: VoltekDatasetSchema,
  computed_at: z.string(),
});

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Safely parse and validate a VoltekDataset
 * @param input - Unknown input to validate
 * @returns Validation result with typed data or issues
 */
export function safeParseDataset(
  input: unknown
): ValidationResult<VoltekDataset> {
  const result = VoltekDatasetSchema.safeParse(input);

  if (result.success) {
    return {
      ok: true,
      data: result.data,
    };
  }

  const issues = result.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`
  );

  return {
    ok: false,
    issues,
  };
}

/**
 * Safely parse and validate a VoltekLead
 * @param input - Unknown input to validate
 * @returns Validation result with typed data or issues
 */
export function safeParseLead(input: unknown): ValidationResult<VoltekLead> {
  const result = VoltekLeadSchema.safeParse(input);

  if (result.success) {
    return {
      ok: true,
      data: result.data,
    };
  }

  const issues = result.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`
  );

  return {
    ok: false,
    issues,
  };
}

/**
 * Safely parse and validate a VoltekProject
 * @param input - Unknown input to validate
 * @returns Validation result with typed data or issues
 */
export function safeParseProject(
  input: unknown
): ValidationResult<VoltekProject> {
  const result = VoltekProjectSchema.safeParse(input);

  if (result.success) {
    return {
      ok: true,
      data: result.data,
    };
  }

  const issues = result.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`
  );

  return {
    ok: false,
    issues,
  };
}

/**
 * Strictly validate a dataset and throw on error
 * Useful when you want to fail fast
 */
export function validateDataset(input: unknown): VoltekDataset {
  return VoltekDatasetSchema.parse(input);
}

/**
 * Validate an array of datasets
 */
export function safeParseDatasets(
  inputs: unknown[]
): ValidationResult<VoltekDataset[]> {
  const results = inputs.map(safeParseDataset);
  const failures = results.filter((r) => !r.ok);

  if (failures.length > 0) {
    const allIssues = failures.flatMap((f) => f.issues || []);
    return {
      ok: false,
      issues: allIssues,
    };
  }

  return {
    ok: true,
    data: results.map((r) => r.data!),
  };
}
