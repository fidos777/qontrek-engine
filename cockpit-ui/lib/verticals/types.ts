/**
 * Qontrek OS Layer 4 - Vertical Data Templates
 * Shared TypeScript Types
 */

import { z } from 'zod';

// =============================================================================
// Template Metadata Types
// =============================================================================

export interface VerticalMetadata {
  vertical_id: string;
  display_name: string;
  display_name_bm: string;
  icon: string;
  color: string;
  description: string;
  description_bm: string;
}

// =============================================================================
// Common Schema Types
// =============================================================================

export type VerticalId =
  | 'solar'
  | 'automotive'
  | 'takaful'
  | 'ecommerce'
  | 'training'
  | 'construction';

// =============================================================================
// Validation Messages (Bilingual: EN + BM)
// =============================================================================

export const ValidationMessages = {
  required: {
    en: 'This field is required',
    bm: 'Ruangan ini wajib diisi',
  },
  invalidPhone: {
    en: 'Invalid Malaysian phone number',
    bm: 'Nombor telefon Malaysia tidak sah',
  },
  invalidEmail: {
    en: 'Invalid email address',
    bm: 'Alamat emel tidak sah',
  },
  invalidIC: {
    en: 'Invalid IC number format (YYMMDD-SS-NNNN)',
    bm: 'Format nombor IC tidak sah (YYMMDD-SS-NNNN)',
  },
  positiveNumber: {
    en: 'Must be a positive number',
    bm: 'Mesti nombor positif',
  },
  minLength: (min: number) => ({
    en: `Minimum ${min} characters required`,
    bm: `Minimum ${min} aksara diperlukan`,
  }),
  maxLength: (max: number) => ({
    en: `Maximum ${max} characters allowed`,
    bm: `Maksimum ${max} aksara dibenarkan`,
  }),
  invalidDate: {
    en: 'Invalid date format',
    bm: 'Format tarikh tidak sah',
  },
  invalidPercentage: {
    en: 'Percentage must be between 0 and 100',
    bm: 'Peratusan mesti antara 0 dan 100',
  },
  invalidCurrency: {
    en: 'Invalid currency amount',
    bm: 'Jumlah mata wang tidak sah',
  },
} as const;

// =============================================================================
// Common Zod Schemas
// =============================================================================

// Malaysian phone number: 01X-XXXXXXX or 01X-XXXXXXXX
export const MalaysianPhoneSchema = z.string()
  .regex(/^01[0-9]-[0-9]{7,8}$/, {
    message: ValidationMessages.invalidPhone.en,
  });

// Malaysian IC number: YYMMDD-SS-NNNN
export const MalaysianICSchema = z.string()
  .regex(/^[0-9]{6}-[0-9]{2}-[0-9]{4}$/, {
    message: ValidationMessages.invalidIC.en,
  });

// Currency in MYR (positive number with 2 decimal places)
export const CurrencySchema = z.number()
  .positive({ message: ValidationMessages.positiveNumber.en })
  .multipleOf(0.01);

// Percentage (0-100)
export const PercentageSchema = z.number()
  .min(0, { message: ValidationMessages.invalidPercentage.en })
  .max(100, { message: ValidationMessages.invalidPercentage.en });

// =============================================================================
// Generic Vertical Schema Interfaces
// =============================================================================

export interface VerticalSchemas<
  TLead extends z.ZodTypeAny,
  TPipeline extends z.ZodTypeAny,
  TKPI extends z.ZodTypeAny
> {
  LeadSchema: TLead;
  PipelineSchema: TPipeline;
  KPISchema: TKPI;
  metadata: VerticalMetadata;
  generateMockLeads: (count?: number) => z.infer<TLead>[];
  generateMockPipeline: (count?: number) => z.infer<TPipeline>[];
  generateMockKPIs: () => z.infer<TKPI>;
}

// =============================================================================
// Mock Data Utilities
// =============================================================================

export const MalaysianNames = {
  malay: [
    'Ahmad bin Ibrahim', 'Siti Aminah binti Hassan', 'Muhammad Faiz bin Ali',
    'Nurul Huda binti Yusof', 'Mohd Rizal bin Othman', 'Fatimah binti Abdullah',
    'Azman bin Ismail', 'Nor Azizah binti Rahman', 'Hafiz bin Zakaria',
    'Aishah binti Karim', 'Zulkifli bin Mohamad', 'Ramlah binti Omar'
  ],
  chinese: [
    'Tan Wei Ming', 'Lim Siew Ling', 'Wong Kai Hong', 'Lee Mei Yen',
    'Ng Chee Keong', 'Chan Siew Mei', 'Ong Boon Huat', 'Goh Pei Wen',
    'Loh Kok Wai', 'Yap Siew Chin', 'Koh Eng Huat', 'Teo Bee Leng'
  ],
  indian: [
    'Muthu Krishnan', 'Lakshmi Devi', 'Rajendran Subramaniam', 'Priya Kumari',
    'Ganesh Kumar', 'Anitha Selvi', 'Siva Rajan', 'Malathi Devi',
    'Ramesh Kumar', 'Devi Naidu', 'Kumar Pillai', 'Shalini Rajan'
  ],
};

export const MalaysianStates = [
  'Selangor', 'Kuala Lumpur', 'Johor', 'Penang', 'Perak',
  'Pahang', 'Kelantan', 'Terengganu', 'Kedah', 'Sabah',
  'Sarawak', 'Negeri Sembilan', 'Melaka', 'Perlis', 'Putrajaya'
];

export const MalaysianCities = [
  'Petaling Jaya', 'Shah Alam', 'Subang Jaya', 'Klang', 'Kajang',
  'Johor Bahru', 'George Town', 'Ipoh', 'Kuching', 'Kota Kinabalu',
  'Melaka', 'Seremban', 'Alor Setar', 'Kuantan', 'Kota Bharu'
];

// Helper function to pick random item from array
export function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper function to generate random number in range
export function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to generate random decimal in range
export function randomDecimal(min: number, max: number, decimals = 2): number {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

// Helper function to generate Malaysian phone number
export function generateMalaysianPhone(): string {
  const prefixes = ['010', '011', '012', '013', '014', '016', '017', '018', '019'];
  const prefix = randomItem(prefixes);
  const suffix = String(randomInRange(1000000, 99999999)).padStart(7, '0');
  return `${prefix}-${suffix}`;
}

// Helper function to generate Malaysian IC number
export function generateMalaysianIC(): string {
  const year = String(randomInRange(60, 99));
  const month = String(randomInRange(1, 12)).padStart(2, '0');
  const day = String(randomInRange(1, 28)).padStart(2, '0');
  const state = String(randomInRange(1, 14)).padStart(2, '0');
  const seq = String(randomInRange(1, 9999)).padStart(4, '0');
  return `${year}${month}${day}-${state}-${seq}`;
}

// Helper function to generate random Malaysian name
export function generateMalaysianName(): string {
  const ethnicity = randomItem(['malay', 'chinese', 'indian'] as const);
  return randomItem(MalaysianNames[ethnicity]);
}

// Helper function to generate random date in past N days
export function randomPastDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - randomInRange(0, daysAgo));
  return date.toISOString().split('T')[0];
}

// Helper function to generate unique ID
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomInRange(1000, 9999)}`;
}
