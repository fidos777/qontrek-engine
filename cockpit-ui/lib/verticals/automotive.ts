/**
 * Qontrek OS Layer 4 - Automotive Vertical (Perodua)
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

export const AutomotiveMetadata: VerticalMetadata = {
  vertical_id: 'automotive',
  display_name: 'Automotive',
  display_name_bm: 'Automotif',
  icon: 'car',
  color: '#EF4444', // Red
  description: 'Vehicle sales pipeline and dealership management',
  description_bm: 'Saluran jualan kenderaan dan pengurusan pengedar',
};

// =============================================================================
// Enums
// =============================================================================

export const VehicleModels = [
  'Myvi',
  'Axia',
  'Bezza',
  'Aruz',
  'Alza',
  'Ativa',
] as const;

export const VehicleModelLabels: Record<typeof VehicleModels[number], { en: string; bm: string; price_range: [number, number] }> = {
  Myvi: { en: 'Perodua Myvi', bm: 'Perodua Myvi', price_range: [45000, 58000] },
  Axia: { en: 'Perodua Axia', bm: 'Perodua Axia', price_range: [24000, 43000] },
  Bezza: { en: 'Perodua Bezza', bm: 'Perodua Bezza', price_range: [35000, 50000] },
  Aruz: { en: 'Perodua Aruz', bm: 'Perodua Aruz', price_range: [73000, 78000] },
  Alza: { en: 'Perodua Alza', bm: 'Perodua Alza', price_range: [63000, 75000] },
  Ativa: { en: 'Perodua Ativa', bm: 'Perodua Ativa', price_range: [62000, 73000] },
};

export const BudgetRanges = [
  'below_30k',
  '30k_50k',
  '50k_70k',
  '70k_100k',
  'above_100k',
] as const;

export const BudgetRangeLabels: Record<typeof BudgetRanges[number], { en: string; bm: string; min: number; max: number }> = {
  'below_30k': { en: 'Below RM30,000', bm: 'Bawah RM30,000', min: 0, max: 30000 },
  '30k_50k': { en: 'RM30,000 - RM50,000', bm: 'RM30,000 - RM50,000', min: 30000, max: 50000 },
  '50k_70k': { en: 'RM50,000 - RM70,000', bm: 'RM50,000 - RM70,000', min: 50000, max: 70000 },
  '70k_100k': { en: 'RM70,000 - RM100,000', bm: 'RM70,000 - RM100,000', min: 70000, max: 100000 },
  'above_100k': { en: 'Above RM100,000', bm: 'Atas RM100,000', min: 100000, max: 200000 },
};

export const AutomotivePipelineStages = [
  'Inquiry',
  'TestDrive',
  'Quotation',
  'Booking',
] as const;

export const AutomotivePipelineStageLabels: Record<typeof AutomotivePipelineStages[number], { en: string; bm: string }> = {
  'Inquiry': { en: 'Initial Inquiry', bm: 'Pertanyaan Awal' },
  'TestDrive': { en: 'Test Drive Scheduled', bm: 'Pandu Uji Dijadualkan' },
  'Quotation': { en: 'Quotation Sent', bm: 'Sebutharga Dihantar' },
  'Booking': { en: 'Booking Confirmed', bm: 'Tempahan Disahkan' },
};

// =============================================================================
// Lead Schema
// =============================================================================

export const AutomotiveLeadSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(2, { message: ValidationMessages.minLength(2).en })
    .max(100, { message: ValidationMessages.maxLength(100).en }),
  phone: MalaysianPhoneSchema,
  email: z.string().email({ message: ValidationMessages.invalidEmail.en }).optional(),
  vehicle_interest: z.enum(VehicleModels, {
    errorMap: () => ({ message: 'Invalid vehicle model / Model kenderaan tidak sah' }),
  }),
  trade_in: z.boolean().describe('Customer has trade-in vehicle'),
  trade_in_model: z.string().optional(),
  trade_in_year: z.number().int().min(2000).max(new Date().getFullYear()).optional(),
  trade_in_value: CurrencySchema.optional(),
  budget_range: z.enum(BudgetRanges, {
    errorMap: () => ({ message: 'Invalid budget range / Julat bajet tidak sah' }),
  }),
  preferred_color: z.string().optional(),
  financing_required: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  source: z.enum(['walk_in', 'website', 'phone', 'referral', 'auto_show', 'social_media']).optional(),
  branch: z.string().optional(),
});

export type AutomotiveLead = z.infer<typeof AutomotiveLeadSchema>;

// =============================================================================
// Pipeline Schema
// =============================================================================

export const AutomotivePipelineSchema = z.object({
  id: z.string(),
  lead_id: z.string(),
  customer_name: z.string(),
  stage: z.enum(AutomotivePipelineStages),
  vehicle_model: z.enum(VehicleModels),
  variant: z.string().optional(),
  amount: CurrencySchema.describe('Deal value in MYR'),
  trade_in_value: CurrencySchema.optional(),
  net_amount: CurrencySchema.describe('Net deal value after trade-in'),
  test_drive_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expected_delivery: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sales_advisor: z.string(),
  branch: z.string(),
  loan_status: z.enum(['not_applied', 'pending', 'approved', 'rejected']).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export type AutomotivePipeline = z.infer<typeof AutomotivePipelineSchema>;

// =============================================================================
// KPI Schema
// =============================================================================

export const AutomotiveKPISchema = z.object({
  conversion_rate: PercentageSchema.describe('Lead to booking conversion rate'),
  avg_deal_value: CurrencySchema.describe('Average vehicle sale value'),
  inventory_turnover: z.number().positive().describe('Inventory turnover rate'),
  test_drive_rate: PercentageSchema.describe('Percentage of leads that test drive'),
  leads_this_month: z.number().int().nonnegative(),
  bookings_this_month: z.number().int().nonnegative(),
  deliveries_this_month: z.number().int().nonnegative(),
  total_pipeline_value: CurrencySchema,
  avg_days_to_close: z.number().nonnegative(),
  top_model: z.enum(VehicleModels),
});

export type AutomotiveKPI = z.infer<typeof AutomotiveKPISchema>;

// =============================================================================
// Mock Data Factory
// =============================================================================

const VehicleColors = ['White', 'Silver', 'Black', 'Red', 'Blue', 'Grey'];
const Branches = ['PJ Branch', 'Shah Alam Branch', 'Subang Branch', 'Klang Branch', 'Kajang Branch'];
const SalesAdvisors = ['Ahmad Razak', 'Tan Mei Ling', 'Kumar Rajan', 'Siti Hajar', 'Wong Kah Hoe'];

export function generateAutomotiveLead(): AutomotiveLead {
  const hasTradeIn = Math.random() > 0.6;
  const vehicleInterest = randomItem([...VehicleModels]);
  const priceRange = VehicleModelLabels[vehicleInterest].price_range;

  return {
    id: generateId('AUTO_LEAD'),
    name: generateMalaysianName(),
    phone: generateMalaysianPhone(),
    email: `customer${randomInRange(100, 999)}@email.com`,
    vehicle_interest: vehicleInterest,
    trade_in: hasTradeIn,
    trade_in_model: hasTradeIn ? randomItem(['Proton Saga', 'Perodua Viva', 'Honda City', 'Toyota Vios', 'Proton Wira']) : undefined,
    trade_in_year: hasTradeIn ? randomInRange(2010, 2020) : undefined,
    trade_in_value: hasTradeIn ? randomDecimal(8000, 25000) : undefined,
    budget_range: randomItem([...BudgetRanges]),
    preferred_color: randomItem(VehicleColors),
    financing_required: Math.random() > 0.2,
    created_at: new Date(Date.now() - randomInRange(0, 60) * 24 * 60 * 60 * 1000).toISOString(),
    source: randomItem(['walk_in', 'website', 'phone', 'referral', 'auto_show', 'social_media']),
    branch: randomItem(Branches),
  };
}

export function generateAutomotivePipeline(): AutomotivePipeline {
  const stage = randomItem([...AutomotivePipelineStages]);
  const vehicleModel = randomItem([...VehicleModels]);
  const priceRange = VehicleModelLabels[vehicleModel].price_range;
  const amount = randomDecimal(priceRange[0], priceRange[1]);
  const hasTradeIn = Math.random() > 0.6;
  const tradeInValue = hasTradeIn ? randomDecimal(8000, 25000) : 0;

  return {
    id: generateId('AUTO_PIPE'),
    lead_id: generateId('AUTO_LEAD'),
    customer_name: generateMalaysianName(),
    stage,
    vehicle_model: vehicleModel,
    variant: randomItem(['G', 'X', 'H', 'AV', 'GearUp']),
    amount,
    trade_in_value: hasTradeIn ? tradeInValue : undefined,
    net_amount: amount - tradeInValue,
    test_drive_date: stage !== 'Inquiry' ? randomPastDate(30) : undefined,
    expected_delivery: stage === 'Booking' ? randomPastDate(-30) : undefined, // Future date
    sales_advisor: randomItem(SalesAdvisors),
    branch: randomItem(Branches),
    loan_status: randomItem(['not_applied', 'pending', 'approved', 'rejected']),
    created_at: new Date(Date.now() - randomInRange(0, 90) * 24 * 60 * 60 * 1000).toISOString(),
    notes: randomItem([
      'Customer comparing with Honda City',
      'Waiting for stock availability',
      'Loan approval pending',
      'Customer requested red color',
      undefined,
    ]),
  };
}

export function generateAutomotiveKPIs(): AutomotiveKPI {
  return {
    conversion_rate: randomDecimal(15, 35),
    avg_deal_value: randomDecimal(45000, 65000),
    inventory_turnover: randomDecimal(2.5, 6.0, 1),
    test_drive_rate: randomDecimal(40, 70),
    leads_this_month: randomInRange(80, 200),
    bookings_this_month: randomInRange(20, 60),
    deliveries_this_month: randomInRange(15, 50),
    total_pipeline_value: randomDecimal(2000000, 8000000),
    avg_days_to_close: randomDecimal(14, 35, 1),
    top_model: randomItem([...VehicleModels]),
  };
}

// Batch generators
export function generateMockAutomotiveLeads(count = 10): AutomotiveLead[] {
  return Array.from({ length: count }, generateAutomotiveLead);
}

export function generateMockAutomotivePipeline(count = 10): AutomotivePipeline[] {
  return Array.from({ length: count }, generateAutomotivePipeline);
}

// =============================================================================
// Export Vertical Package
// =============================================================================

export const AutomotiveVertical = {
  metadata: AutomotiveMetadata,
  schemas: {
    Lead: AutomotiveLeadSchema,
    Pipeline: AutomotivePipelineSchema,
    KPI: AutomotiveKPISchema,
  },
  enums: {
    VehicleModels,
    VehicleModelLabels,
    BudgetRanges,
    BudgetRangeLabels,
    PipelineStages: AutomotivePipelineStages,
    PipelineStageLabels: AutomotivePipelineStageLabels,
  },
  mockFactory: {
    generateLead: generateAutomotiveLead,
    generatePipeline: generateAutomotivePipeline,
    generateKPIs: generateAutomotiveKPIs,
    generateLeads: generateMockAutomotiveLeads,
    generatePipelineRecords: generateMockAutomotivePipeline,
  },
};

export default AutomotiveVertical;
