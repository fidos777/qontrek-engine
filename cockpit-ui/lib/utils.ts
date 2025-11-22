// lib/utils.ts
// Utility functions for the cockpit-ui

/**
 * Combines class names, filtering out falsy values
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Format a number as Malaysian Ringgit currency
 */
export function formatCurrency(value: number, currency = 'MYR'): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
