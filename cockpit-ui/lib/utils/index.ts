// lib/utils/index.ts
// Core utility functions

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combine class names with Tailwind merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency in Malaysian Ringgit
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date in Malaysian locale
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Format phone number for display
export function formatPhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Format as Malaysian phone number
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)} ${digits.slice(6)}`;
  } else if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)} ${digits.slice(7)}`;
  }

  return phone;
}
