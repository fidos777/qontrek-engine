// lib/dashboard/formatters.ts
// Malaysian locale formatters for dashboard widgets

/**
 * Format value as Malaysian Ringgit (MYR)
 * Example: 180400 → "RM 180,400.00"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format value as compact currency (for large numbers)
 * Example: 1500000 → "RM 1.5M"
 */
export function formatCurrencyCompact(value: number): string {
  if (value >= 1000000) {
    return `RM ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `RM ${(value / 1000).toFixed(1)}K`;
  }
  return formatCurrency(value);
}

/**
 * Format value as percentage
 * Handles both decimal (0.32) and whole number (32) inputs
 * Example: 0.32 → "32%", 32 → "32%"
 */
export function formatPercentage(value: number): string {
  // If value is between 0 and 1, treat it as a decimal percentage
  const normalizedValue = value > 0 && value < 1 ? value * 100 : value;
  return `${Math.round(normalizedValue)}%`;
}

/**
 * Format value as percentage with decimal
 * Example: 0.325 → "32.5%"
 */
export function formatPercentageDecimal(value: number, decimals: number = 1): string {
  const normalizedValue = value > 0 && value < 1 ? value * 100 : value;
  return `${normalizedValue.toFixed(decimals)}%`;
}

/**
 * Format number with Malaysian locale
 * Example: 1234567 → "1,234,567"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-MY").format(value);
}

/**
 * Format number as compact
 * Example: 1500000 → "1.5M"
 */
export function formatNumberCompact(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return formatNumber(value);
}

/**
 * Format time duration in hours
 * Example: 4.3 → "4.3h"
 */
export function formatTime(value: number): string {
  return `${value.toFixed(1)}h`;
}

/**
 * Format time duration in days
 * Example: 11 → "11d"
 */
export function formatDays(value: number): string {
  return `${Math.round(value)}d`;
}

/**
 * Format date in DD/MM/YYYY format
 * Example: "2025-10-21" → "21/10/2025"
 */
export function formatDate(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Format date with time
 * Example: "2025-10-21T08:30:00" → "21/10/2025, 08:30"
 */
export function formatDateTime(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Format date as relative time
 * Example: "2025-10-21T08:30:00" → "2 hours ago"
 */
export function formatRelativeTime(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

/**
 * Format short date (for compact displays)
 * Example: "2025-10-21" → "21 Oct"
 */
export function formatShortDate(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(date);
}

/**
 * Get bilingual label (Malay/English)
 * Returns Malay version if available, otherwise English
 */
export function getBilingualLabel(
  label: string,
  labelMs?: string,
  preferMalay: boolean = false
): string {
  if (preferMalay && labelMs) {
    return labelMs;
  }
  return label;
}
