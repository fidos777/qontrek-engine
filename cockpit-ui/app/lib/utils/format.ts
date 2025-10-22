// app/lib/utils/format.ts
// i18n formatting utilities for currency and dates

/**
 * Format MYR currency with locale support
 * @param n - Number to format
 * @param locale - Locale string (default: "ms-MY" for Bahasa Malaysia)
 * @returns Formatted currency string
 */
export const fmtRM = (n: number, locale: string = "ms-MY"): string => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(n);
};

/**
 * Format date/time with locale support
 * @param s - ISO date string
 * @param locale - Locale string (default: "ms-MY" for Bahasa Malaysia)
 * @returns Formatted date string
 */
export const fmtDate = (s: string, locale: string = "ms-MY"): string => {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(s));
};
