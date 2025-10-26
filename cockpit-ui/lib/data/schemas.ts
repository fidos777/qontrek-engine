/**
 * Zod schemas for Voltek dataset validation
 *
 * These schemas define the structure of data imported from Voltek Excel files.
 * They provide runtime validation and type safety.
 */

import { z } from 'zod';

// Base types
export const VoltekProjectStatusSchema = z.enum([
  'lead',
  'qualified',
  'in_progress',
  'installed',
  'completed',
  'cancelled',
  'on_hold'
]);

export const VoltekPrioritySchema = z.enum([
  'high',
  'medium',
  'low'
]);

// Project schema
export const VoltekProjectSchema = z.object({
  id: z.string(),
  projectName: z.string(),
  clientName: z.string(),
  status: VoltekProjectStatusSchema,
  priority: VoltekPrioritySchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  estimatedValue: z.number().optional(),
  actualValue: z.number().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Lead schema
export const VoltekLeadSchema = z.object({
  id: z.string(),
  leadSource: z.string().optional(),
  leadName: z.string(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  estimatedValue: z.number().optional(),
  qualificationScore: z.number().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date().optional(),
  followUpDate: z.date().optional(),
});

// Financial record schema
export const VoltekFinancialSchema = z.object({
  id: z.string(),
  projectId: z.string().optional(),
  transactionDate: z.date().optional(),
  description: z.string(),
  category: z.string().optional(),
  amount: z.number(),
  type: z.enum(['income', 'expense']).optional(),
  paymentMethod: z.string().optional(),
  vendor: z.string().optional(),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
});

// Installation task schema
export const VoltekInstallationTaskSchema = z.object({
  id: z.string(),
  projectId: z.string().optional(),
  taskName: z.string(),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  scheduledDate: z.date().optional(),
  completedDate: z.date().optional(),
  status: z.string().optional(),
  estimatedHours: z.number().optional(),
  actualHours: z.number().optional(),
  notes: z.string().optional(),
});

// Material/Equipment schema
export const VoltekMaterialSchema = z.object({
  id: z.string(),
  projectId: z.string().optional(),
  itemName: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  unitCost: z.number().optional(),
  totalCost: z.number().optional(),
  supplier: z.string().optional(),
  orderDate: z.date().optional(),
  receivedDate: z.date().optional(),
  status: z.string().optional(),
});

// Main dataset schema
export const VoltekDatasetSchema = z.object({
  projects: z.array(VoltekProjectSchema).default([]),
  leads: z.array(VoltekLeadSchema).default([]),
  financials: z.array(VoltekFinancialSchema).default([]),
  installationTasks: z.array(VoltekInstallationTaskSchema).default([]),
  materials: z.array(VoltekMaterialSchema).default([]),
});

// Type exports
export type VoltekProjectStatus = z.infer<typeof VoltekProjectStatusSchema>;
export type VoltekPriority = z.infer<typeof VoltekPrioritySchema>;
export type VoltekProject = z.infer<typeof VoltekProjectSchema>;
export type VoltekLead = z.infer<typeof VoltekLeadSchema>;
export type VoltekFinancial = z.infer<typeof VoltekFinancialSchema>;
export type VoltekInstallationTask = z.infer<typeof VoltekInstallationTaskSchema>;
export type VoltekMaterial = z.infer<typeof VoltekMaterialSchema>;
export type VoltekDataset = z.infer<typeof VoltekDatasetSchema>;

// Validation issues tracking
export interface ValidationIssue {
  sheet?: string;
  row?: number;
  column?: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Safe parse function that returns both parsed data and validation issues
 */
export function safeParseDataset(data: unknown): {
  success: boolean;
  data?: VoltekDataset;
  issues: ValidationIssue[];
} {
  const result = VoltekDatasetSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
      issues: [],
    };
  }

  const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    severity: 'error',
  }));

  return {
    success: false,
    issues,
  };
}
