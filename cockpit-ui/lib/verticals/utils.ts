// lib/verticals/utils.ts
// Template utility functions for vertical templates

import type {
  VerticalTemplate,
  FieldMapping,
  StageConfig,
  KPIDefinition,
  VerticalId,
} from './types';
import { VerticalTemplateSchema } from './types';

/**
 * Format a value using a field mapping format string
 * @example formatFieldValue(45000, "RM {{value}}") => "RM 45,000"
 */
export function formatFieldValue(value: unknown, format?: string): string {
  if (format === undefined) {
    return String(value);
  }

  // Handle number formatting with Malaysian locale
  const formattedValue = typeof value === 'number'
    ? value.toLocaleString('ms-MY')
    : String(value);

  return format.replace('{{value}}', formattedValue);
}

/**
 * Format currency in MYR
 */
export function formatMYR(amount: number): string {
  return `RM ${amount.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format days
 */
export function formatDays(value: number): string {
  return value === 1 ? '1 day' : `${value} days`;
}

/**
 * Format KPI value based on its unit
 */
export function formatKPIValue(kpi: KPIDefinition, value: number): string {
  switch (kpi.unit) {
    case 'currency':
      return formatMYR(value);
    case 'percentage':
      return formatPercentage(value);
    case 'days':
      return formatDays(value);
    case 'count':
      return value.toLocaleString('ms-MY');
    case 'ratio':
      return value.toFixed(2);
    default:
      return String(value);
  }
}

/**
 * Get KPI status based on value and thresholds
 */
export function getKPIStatus(kpi: KPIDefinition, value: number): 'healthy' | 'warning' | 'critical' {
  if (kpi.higher_is_better) {
    if (value >= kpi.target) return 'healthy';
    if (value >= kpi.warning_threshold) return 'warning';
    return 'critical';
  } else {
    if (value <= kpi.target) return 'healthy';
    if (value <= kpi.warning_threshold) return 'warning';
    return 'critical';
  }
}

/**
 * Get color for KPI status
 */
export function getKPIStatusColor(status: 'healthy' | 'warning' | 'critical'): string {
  switch (status) {
    case 'healthy':
      return '#22C55E'; // Green
    case 'warning':
      return '#F59E0B'; // Amber
    case 'critical':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
}

/**
 * Transform data using field mappings
 */
export function transformWithMappings(
  data: Record<string, unknown>,
  mappings: FieldMapping[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const mapping of mappings) {
    const value = getNestedValue(data, mapping.generic_field);
    if (value !== undefined) {
      setNestedValue(result, mapping.vertical_field, value);
    }
  }

  return result;
}

/**
 * Get nested value from object using dot notation
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Set nested value in object using dot notation
 */
export function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  const lastKey = keys.pop();
  if (!lastKey) return;

  let current = obj;
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[lastKey] = value;
}

/**
 * Get next stage in pipeline
 */
export function getNextStage(stages: StageConfig[], currentStageId: string): StageConfig | undefined {
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const currentIndex = sortedStages.findIndex(s => s.id === currentStageId);
  if (currentIndex === -1 || currentIndex === sortedStages.length - 1) {
    return undefined;
  }
  return sortedStages[currentIndex + 1];
}

/**
 * Get previous stage in pipeline
 */
export function getPreviousStage(stages: StageConfig[], currentStageId: string): StageConfig | undefined {
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const currentIndex = sortedStages.findIndex(s => s.id === currentStageId);
  if (currentIndex <= 0) {
    return undefined;
  }
  return sortedStages[currentIndex - 1];
}

/**
 * Calculate days in stage
 */
export function calculateDaysInStage(stageEnteredAt: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - stageEnteredAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if stage is overdue based on SLA
 */
export function isStageOverdue(stage: StageConfig, daysInStage: number): boolean {
  if (!stage.sla_days) return false;
  return daysInStage > stage.sla_days;
}

/**
 * Get applicable auto actions for a stage
 */
export function getApplicableAutoActions(
  stage: StageConfig,
  context: { days_in_stage: number; [key: string]: unknown }
): NonNullable<StageConfig['auto_actions']> {
  if (!stage.auto_actions) return [];

  return stage.auto_actions.filter(action => {
    // Simple expression evaluation for trigger conditions
    return evaluateTrigger(action.trigger, context);
  });
}

/**
 * Evaluate a simple trigger expression
 */
export function evaluateTrigger(trigger: string, context: Record<string, unknown>): boolean {
  // Handle "days_in_stage > N" pattern
  const daysMatch = trigger.match(/days_in_stage\s*>\s*(\d+)/);
  if (daysMatch) {
    const threshold = parseInt(daysMatch[1], 10);
    const daysInStage = context.days_in_stage as number;
    return daysInStage > threshold;
  }

  // Handle other patterns as needed
  return false;
}

/**
 * Render WhatsApp template with variables
 */
export function renderWhatsAppTemplate(
  bodyTemplate: string,
  variables: Record<string, string>
): string {
  let result = bodyTemplate;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

/**
 * Validate a vertical template against the schema
 */
export function validateVerticalTemplate(template: unknown): {
  valid: boolean;
  errors?: string[];
} {
  const result = VerticalTemplateSchema.safeParse(template);
  if (result.success) {
    return { valid: true };
  }
  return {
    valid: false,
    errors: result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`),
  };
}

/**
 * Check if vertical ID is valid
 */
export function isValidVerticalId(id: string): id is VerticalId {
  return ['solar', 'takaful', 'ecommerce', 'training', 'construction', 'automotive'].includes(id);
}

/**
 * Get Malaysian phone number format
 */
export function formatMalaysianPhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Handle different formats
  if (digits.startsWith('60')) {
    // Already has country code
    const local = digits.slice(2);
    return `+60${local.slice(0, 2)}-${local.slice(2, 5)} ${local.slice(5)}`;
  } else if (digits.startsWith('0')) {
    // Local format
    const local = digits.slice(1);
    return `+60${local.slice(0, 2)}-${local.slice(2, 5)} ${local.slice(5)}`;
  }
  return phone;
}

/**
 * Format Malaysian date
 */
export function formatMalaysianDate(date: Date): string {
  return date.toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Get stage progress percentage
 */
export function getStageProgress(stages: StageConfig[], currentStageId: string): number {
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const currentIndex = sortedStages.findIndex(s => s.id === currentStageId);
  if (currentIndex === -1) return 0;
  return Math.round(((currentIndex + 1) / sortedStages.length) * 100);
}

/**
 * Group leads by stage
 */
export function groupByStage<T extends { stage: string }>(
  items: T[],
  stages: StageConfig[]
): Map<string, T[]> {
  const result = new Map<string, T[]>();

  // Initialize with empty arrays for all stages
  for (const stage of stages) {
    result.set(stage.id, []);
  }

  // Group items
  for (const item of items) {
    const stageItems = result.get(item.stage) || [];
    stageItems.push(item);
    result.set(item.stage, stageItems);
  }

  return result;
}
