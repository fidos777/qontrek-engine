/**
 * Widget Renderer Utilities
 *
 * Provides binding resolution, value formatting, and conditional evaluation
 * for the widget rendering pipeline.
 */

import type { WidgetField, WidgetSchema } from './types';

/**
 * Resolve a data binding expression to its value
 *
 * @example
 * resolveBinding('{{lead.amount}}', { lead: { amount: 5000 } })
 * // Returns: 5000
 *
 * resolveBinding('{{session.contact.name}}', { session: { contact: { name: 'Ahmad' } } })
 * // Returns: 'Ahmad'
 */
export function resolveBinding(
  binding: string,
  data: Record<string, unknown>
): unknown {
  const match = binding.match(/\{\{(.+?)\}\}/);
  if (!match) return binding;

  const path = match[1].split('.');
  let value: unknown = data;

  for (const key of path) {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === 'object') {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * Resolve all bindings in a string (supports multiple bindings)
 *
 * @example
 * resolveAllBindings('Hello {{user.name}}, your balance is {{user.balance}}', data)
 */
export function resolveAllBindings(
  template: string,
  data: Record<string, unknown>
): string {
  return template.replace(/\{\{(.+?)\}\}/g, (_, path) => {
    const value = resolveBinding(`{{${path}}}`, data);
    return value !== undefined ? String(value) : '';
  });
}

/**
 * Format relative time from a date
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else if (diffDay < 7) {
    return `${diffDay}d ago`;
  } else {
    return date.toLocaleDateString('en-MY');
  }
}

/**
 * Format a value based on field type and format specification
 *
 * @example
 * formatValue(5000, { type: 'currency', ... })
 * // Returns: 'RM 5,000.00'
 *
 * formatValue(85, { type: 'percentage', ... })
 * // Returns: '85%'
 */
export function formatValue(
  value: unknown,
  field: WidgetField
): string {
  if (value === null || value === undefined) {
    return '-';
  }

  switch (field.type) {
    case 'currency':
      return `RM ${Number(value).toLocaleString('en-MY', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    case 'percentage':
      return `${value}%`;

    case 'number':
      return Number(value).toLocaleString('en-MY');

    case 'date':
      if (field.format === 'relative') {
        return formatRelativeTime(new Date(String(value)));
      }
      return new Date(String(value)).toLocaleDateString('en-MY');

    case 'badge':
      return String(value);

    case 'text':
    default:
      // Apply custom format if provided
      if (field.format) {
        return field.format.replace('{{value}}', String(value));
      }
      return String(value);
  }
}

/**
 * Evaluate a conditional expression
 *
 * @example
 * evaluateCondition('{{trust_index}} < 80', { trust_index: 75 })
 * // Returns: true
 *
 * evaluateCondition('{{session.active}} === true', { session: { active: true } })
 * // Returns: true
 */
export function evaluateCondition(
  condition: string,
  data: Record<string, unknown>
): boolean {
  // Replace all bindings with their JSON-stringified values
  const resolved = condition.replace(/\{\{(.+?)\}\}/g, (_, path) => {
    const value = resolveBinding(`{{${path}}}`, data);
    return JSON.stringify(value);
  });

  try {
    // Safe evaluation using Function constructor
    // This is intentionally limited to boolean expressions
    return new Function(`return ${resolved}`)() as boolean;
  } catch {
    // Default to showing if evaluation fails
    return true;
  }
}

/**
 * Check if a widget should be visible based on show_if/hide_if conditions
 */
export function shouldShowWidget(
  schema: WidgetSchema,
  data: Record<string, unknown>
): boolean {
  // Check hide_if first (takes precedence)
  if (schema.hide_if && evaluateCondition(schema.hide_if, data)) {
    return false;
  }

  // Check show_if
  if (schema.show_if && !evaluateCondition(schema.show_if, data)) {
    return false;
  }

  return true;
}

/**
 * Check if a widget should be enabled based on enable_if/disable_if conditions
 */
export function shouldEnableWidget(
  schema: WidgetSchema,
  data: Record<string, unknown>
): boolean {
  // Check disable_if first (takes precedence)
  if (schema.disable_if && evaluateCondition(schema.disable_if, data)) {
    return false;
  }

  // Check enable_if
  if (schema.enable_if && !evaluateCondition(schema.enable_if, data)) {
    return false;
  }

  return true;
}

/**
 * Resolve all field values for a widget
 */
export function resolveFieldValues(
  fields: WidgetField[],
  data: Record<string, unknown>
): Array<{ field: WidgetField; rawValue: unknown; formattedValue: string }> {
  return fields.map((field) => {
    const rawValue = resolveBinding(field.binding, data);
    const formattedValue = formatValue(rawValue, field);
    return { field, rawValue, formattedValue };
  });
}

/**
 * Get style class for a badge based on its value and style mapping
 */
export function getBadgeStyle(
  value: unknown,
  styleMap?: Record<string, string>
): string {
  if (!styleMap) return '';

  const valueStr = String(value).toLowerCase();
  return styleMap[valueStr] || styleMap['default'] || '';
}

/**
 * Parse countdown format (e.g., "20h 15m" to milliseconds)
 */
export function parseCountdown(countdown: string): number {
  let totalMs = 0;
  const hourMatch = countdown.match(/(\d+)h/);
  const minMatch = countdown.match(/(\d+)m/);
  const secMatch = countdown.match(/(\d+)s/);

  if (hourMatch) totalMs += parseInt(hourMatch[1], 10) * 3600000;
  if (minMatch) totalMs += parseInt(minMatch[1], 10) * 60000;
  if (secMatch) totalMs += parseInt(secMatch[1], 10) * 1000;

  return totalMs;
}

/**
 * Format milliseconds as countdown string
 */
export function formatCountdown(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
