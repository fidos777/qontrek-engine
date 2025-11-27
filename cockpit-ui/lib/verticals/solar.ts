/**
 * Qontrek OS Layer 4 - Solar Vertical (Voltek Energy)
 * Zod Schemas + Mock Data Factory
 */

import { z } from 'zod';
import {
  ValidationMessages,
  MalaysianPhoneSchema,
  CurrencySchema,
  PercentageSchema,
  VerticalMetadata,
  generateMalaysianPhone,
  generateMalaysianName,
  randomItem,
  randomInRange,
  randomDecimal,
  randomPastDate,
  generateId,
} from './types';

// =============================================================================
// Metadata
// =============================================================================

export const SolarMetadata: VerticalMetadata = {
  vertical_id: 'solar',
  display_name: 'Solar Energy',
  display_name_bm: 'Tenaga Solar',
  icon: 'sun',
  color: '#F59E0B', // Amber
  description: 'Solar panel installation and financing recovery',
  description_bm: 'Pemasangan panel solar dan pemulihan pembiayaan',
};

// =============================================================================
// Enums
// =============================================================================

export const SolarRoofTypes = [
  'concrete_flat',
  'metal_deck',
  'clay_tile',
  'metal_roof',
  'asbestos',
] as const;

export const SolarRoofTypeLabels: Record<typeof SolarRoofTypes[number], { en: string; bm: string }> = {
  concrete_flat: { en: 'Concrete Flat Roof', bm: 'Bumbung Konkrit Rata' },
  metal_deck: { en: 'Metal Deck', bm: 'Dek Logam' },
  clay_tile: { en: 'Clay Tile', bm: 'Jubin Tanah Liat' },
  metal_roof: { en: 'Metal Roof', bm: 'Bumbung Logam' },
  asbestos: { en: 'Asbestos (Not Recommended)', bm: 'Asbestos (Tidak Disyorkan)' },
};

export const SolarPipelineStages = ['80%', '20%', 'Handover'] as const;

export const SolarPipelineStageLabels: Record<typeof SolarPipelineStages[number], { en: string; bm: string }> = {
  '80%': { en: '80% Payment Due', bm: 'Bayaran 80% Tertunggak' },
  '20%': { en: '20% Final Payment', bm: 'Bayaran Akhir 20%' },
  'Handover': { en: 'Handover Complete', bm: 'Serahan Selesai' },
};

// =============================================================================
// Lead Schema
// =============================================================================

export const SolarLeadSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(2, { message: ValidationMessages.minLength(2).en })
    .max(100, { message: ValidationMessages.maxLength(100).en }),
  phone: MalaysianPhoneSchema,
  email: z.string().email({ message: ValidationMessages.invalidEmail.en }).optional(),
  system_size_kw: z.number()
    .positive({ message: ValidationMessages.positiveNumber.en })
    .min(3, { message: 'Minimum system size is 3kW / Saiz sistem minimum adalah 3kW' })
    .max(100, { message: 'Maximum system size is 100kW / Saiz sistem maksimum adalah 100kW' }),
  roof_type: z.enum(SolarRoofTypes, {
    errorMap: () => ({ message: 'Invalid roof type / Jenis bumbung tidak sah' }),
  }),
  monthly_bill: CurrencySchema.describe('Average monthly electricity bill in MYR'),
  property_address: z.string().optional(),
  created_at: z.string().datetime().optional(),
  source: z.enum(['website', 'referral', 'walk_in', 'social_media', 'roadshow']).optional(),
});

export type SolarLead = z.infer<typeof SolarLeadSchema>;

// =============================================================================
// Pipeline Schema
// =============================================================================

export const SolarPipelineSchema = z.object({
  id: z.string(),
  lead_id: z.string(),
  customer_name: z.string(),
  stage: z.enum(SolarPipelineStages),
  amount: CurrencySchema.describe('Outstanding amount in MYR'),
  days_overdue: z.number().int().nonnegative(),
  system_size_kw: z.number().positive(),
  installation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: ValidationMessages.invalidDate.en,
  }),
  last_contact_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().optional(),
  assigned_agent: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

export type SolarPipeline = z.infer<typeof SolarPipelineSchema>;

// =============================================================================
// KPI Schema
// =============================================================================

export const SolarKPISchema = z.object({
  recovery_rate: PercentageSchema.describe('Percentage of recovered debt'),
  avg_days_to_payment: z.number()
    .nonnegative({ message: 'Days cannot be negative / Hari tidak boleh negatif' })
    .describe('Average days from due date to payment'),
  total_recoverable: CurrencySchema.describe('Total amount pending recovery in MYR'),
  total_recovered_mtd: CurrencySchema.describe('Month-to-date recovered amount'),
  total_recovered_ytd: CurrencySchema.describe('Year-to-date recovered amount'),
  active_cases: z.number().int().nonnegative(),
  closed_cases_mtd: z.number().int().nonnegative(),
  average_case_value: CurrencySchema,
  collection_efficiency: PercentageSchema,
});

export type SolarKPI = z.infer<typeof SolarKPISchema>;

// =============================================================================
// Mock Data Factory
// =============================================================================

export function generateSolarLead(): SolarLead {
  const systemSize = randomItem([5, 6, 8, 10, 12, 15, 20, 25, 30]);
  const monthlyBill = systemSize * randomDecimal(80, 150);

  return {
    id: generateId('LEAD'),
    name: generateMalaysianName(),
    phone: generateMalaysianPhone(),
    email: `customer${randomInRange(100, 999)}@email.com`,
    system_size_kw: systemSize,
    roof_type: randomItem([...SolarRoofTypes]),
    monthly_bill: Number(monthlyBill.toFixed(2)),
    property_address: `No. ${randomInRange(1, 200)}, Jalan ${randomItem(['Merdeka', 'Bunga Raya', 'Seri', 'Damai', 'Harmoni'])} ${randomInRange(1, 20)}`,
    created_at: new Date(Date.now() - randomInRange(0, 90) * 24 * 60 * 60 * 1000).toISOString(),
    source: randomItem(['website', 'referral', 'walk_in', 'social_media', 'roadshow']),
  };
}

export function generateSolarPipeline(): SolarPipeline {
  const stage = randomItem([...SolarPipelineStages]);
  const systemSize = randomItem([5, 6, 8, 10, 12, 15, 20, 25, 30]);
  const totalValue = systemSize * randomDecimal(4000, 5500);

  let amount: number;
  switch (stage) {
    case '80%':
      amount = totalValue * 0.8;
      break;
    case '20%':
      amount = totalValue * 0.2;
      break;
    default:
      amount = 0;
  }

  return {
    id: generateId('PIPE'),
    lead_id: generateId('LEAD'),
    customer_name: generateMalaysianName(),
    stage,
    amount: Number(amount.toFixed(2)),
    days_overdue: stage === 'Handover' ? 0 : randomInRange(0, 90),
    system_size_kw: systemSize,
    installation_date: randomPastDate(180),
    last_contact_date: randomPastDate(14),
    notes: randomItem([
      'Customer requested callback next week',
      'Payment promised by month end',
      'Dispute on panel performance',
      'Waiting for bank approval',
      'Customer travelling',
      undefined,
    ]),
    assigned_agent: randomItem(['Agent Ali', 'Agent Mei', 'Agent Rajan', 'Agent Sarah']),
    priority: randomItem(['low', 'medium', 'high', 'critical']),
  };
}

export function generateSolarKPIs(): SolarKPI {
  return {
    recovery_rate: randomDecimal(65, 85),
    avg_days_to_payment: randomDecimal(15, 45, 1),
    total_recoverable: randomDecimal(500000, 2000000),
    total_recovered_mtd: randomDecimal(100000, 400000),
    total_recovered_ytd: randomDecimal(1000000, 4000000),
    active_cases: randomInRange(50, 200),
    closed_cases_mtd: randomInRange(20, 80),
    average_case_value: randomDecimal(15000, 45000),
    collection_efficiency: randomDecimal(70, 92),
  };
}

// Batch generators
export function generateMockSolarLeads(count = 10): SolarLead[] {
  return Array.from({ length: count }, generateSolarLead);
}

export function generateMockSolarPipeline(count = 10): SolarPipeline[] {
  return Array.from({ length: count }, generateSolarPipeline);
}

// =============================================================================
// Export Vertical Package
// =============================================================================

export const SolarVertical = {
  metadata: SolarMetadata,
  schemas: {
    Lead: SolarLeadSchema,
    Pipeline: SolarPipelineSchema,
    KPI: SolarKPISchema,
  },
  enums: {
    RoofTypes: SolarRoofTypes,
    RoofTypeLabels: SolarRoofTypeLabels,
    PipelineStages: SolarPipelineStages,
    PipelineStageLabels: SolarPipelineStageLabels,
  },
  mockFactory: {
    generateLead: generateSolarLead,
    generatePipeline: generateSolarPipeline,
    generateKPIs: generateSolarKPIs,
    generateLeads: generateMockSolarLeads,
    generatePipelineRecords: generateMockSolarPipeline,
  },
};

export default SolarVertical;
