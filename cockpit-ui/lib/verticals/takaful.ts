/**
 * Qontrek OS Layer 4 - Takaful Vertical (Insurance)
 * Zod Schemas + Mock Data Factory
 */

import { z } from 'zod';
import {
  ValidationMessages,
  MalaysianPhoneSchema,
  MalaysianICSchema,
  CurrencySchema,
  PercentageSchema,
  VerticalMetadata,
  generateMalaysianPhone,
  generateMalaysianIC,
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

export const TakafulMetadata: VerticalMetadata = {
  vertical_id: 'takaful',
  display_name: 'Takaful / Insurance',
  display_name_bm: 'Takaful / Insurans',
  icon: 'shield-check',
  color: '#10B981', // Green
  description: 'Islamic insurance policy management and claims',
  description_bm: 'Pengurusan polisi takaful Islam dan tuntutan',
};

// =============================================================================
// Enums
// =============================================================================

export const CoverageTypes = [
  'life',
  'medical',
  'critical_illness',
  'personal_accident',
  'education',
  'mortgage',
] as const;

export const CoverageTypeLabels: Record<typeof CoverageTypes[number], { en: string; bm: string }> = {
  'life': { en: 'Life Takaful', bm: 'Takaful Hayat' },
  'medical': { en: 'Medical & Health', bm: 'Perubatan & Kesihatan' },
  'critical_illness': { en: 'Critical Illness', bm: 'Penyakit Kritikal' },
  'personal_accident': { en: 'Personal Accident', bm: 'Kemalangan Peribadi' },
  'education': { en: 'Education Plan', bm: 'Pelan Pendidikan' },
  'mortgage': { en: 'Mortgage Reducing Term', bm: 'MRTA' },
};

export const HealthStatuses = [
  'excellent',
  'good',
  'fair',
  'pre_existing',
] as const;

export const HealthStatusLabels: Record<typeof HealthStatuses[number], { en: string; bm: string }> = {
  'excellent': { en: 'Excellent Health', bm: 'Kesihatan Cemerlang' },
  'good': { en: 'Good Health', bm: 'Kesihatan Baik' },
  'fair': { en: 'Fair Health', bm: 'Kesihatan Sederhana' },
  'pre_existing': { en: 'Pre-existing Conditions', bm: 'Penyakit Sedia Ada' },
};

export const TakafulPipelineStages = [
  'Lead',
  'Quotation',
  'Underwriting',
  'Issued',
] as const;

export const TakafulPipelineStageLabels: Record<typeof TakafulPipelineStages[number], { en: string; bm: string }> = {
  'Lead': { en: 'New Lead', bm: 'Prospek Baru' },
  'Quotation': { en: 'Quotation Sent', bm: 'Sebutharga Dihantar' },
  'Underwriting': { en: 'Under Review', bm: 'Dalam Semakan' },
  'Issued': { en: 'Policy Issued', bm: 'Polisi Dikeluarkan' },
};

// =============================================================================
// Lead Schema
// =============================================================================

export const TakafulLeadSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(2, { message: ValidationMessages.minLength(2).en })
    .max(100, { message: ValidationMessages.maxLength(100).en }),
  ic_number: MalaysianICSchema,
  phone: MalaysianPhoneSchema,
  email: z.string().email({ message: ValidationMessages.invalidEmail.en }).optional(),
  coverage_type: z.enum(CoverageTypes, {
    errorMap: () => ({ message: 'Invalid coverage type / Jenis perlindungan tidak sah' }),
  }),
  sum_insured: CurrencySchema
    .min(10000, { message: 'Minimum sum insured is RM10,000 / Jumlah diinsuranskan minimum adalah RM10,000' })
    .describe('Sum assured/insured in MYR'),
  health_status: z.enum(HealthStatuses, {
    errorMap: () => ({ message: 'Invalid health status / Status kesihatan tidak sah' }),
  }),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: ValidationMessages.invalidDate.en,
  }),
  occupation: z.string().optional(),
  smoker: z.boolean().default(false),
  existing_policies: z.number().int().nonnegative().default(0),
  annual_income: CurrencySchema.optional(),
  created_at: z.string().datetime().optional(),
  agent_code: z.string().optional(),
  source: z.enum(['agent', 'website', 'referral', 'bancassurance', 'corporate']).optional(),
});

export type TakafulLead = z.infer<typeof TakafulLeadSchema>;

// =============================================================================
// Pipeline Schema
// =============================================================================

export const TakafulPipelineSchema = z.object({
  id: z.string(),
  lead_id: z.string(),
  customer_name: z.string(),
  ic_number: MalaysianICSchema,
  stage: z.enum(TakafulPipelineStages),
  coverage_type: z.enum(CoverageTypes),
  sum_insured: CurrencySchema,
  annual_premium: CurrencySchema.describe('Annual contribution/premium'),
  policy_term: z.number().int().positive().describe('Policy term in years'),
  payment_frequency: z.enum(['monthly', 'quarterly', 'semi_annual', 'annual']),
  underwriting_status: z.enum(['pending', 'approved', 'declined', 'rated_up', 'exclusion']).optional(),
  medical_required: z.boolean().default(false),
  agent_code: z.string(),
  agent_name: z.string(),
  branch: z.string(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  expected_issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().optional(),
});

export type TakafulPipeline = z.infer<typeof TakafulPipelineSchema>;

// =============================================================================
// KPI Schema
// =============================================================================

export const TakafulKPISchema = z.object({
  policy_count: z.number().int().nonnegative().describe('Total active policies'),
  new_policies_mtd: z.number().int().nonnegative().describe('New policies this month'),
  premium_collected: CurrencySchema.describe('Total premium collected'),
  premium_collected_mtd: CurrencySchema.describe('Premium collected this month'),
  claims_ratio: PercentageSchema.describe('Claims to premium ratio'),
  persistency_rate: PercentageSchema.describe('Policy persistency rate'),
  avg_sum_insured: CurrencySchema.describe('Average sum insured per policy'),
  avg_premium: CurrencySchema.describe('Average annual premium'),
  conversion_rate: PercentageSchema.describe('Lead to policy conversion'),
  pending_underwriting: z.number().int().nonnegative(),
  total_sum_at_risk: CurrencySchema.describe('Total sum at risk'),
});

export type TakafulKPI = z.infer<typeof TakafulKPISchema>;

// =============================================================================
// Mock Data Factory
// =============================================================================

const Occupations = [
  'Engineer', 'Teacher', 'Doctor', 'Accountant', 'Manager',
  'Executive', 'Business Owner', 'Civil Servant', 'IT Professional', 'Nurse'
];
const AgentCodes = ['AG001', 'AG002', 'AG003', 'AG004', 'AG005'];
const AgentNames = ['Fatimah Hassan', 'Lee Wei Ming', 'Anitha Kumar', 'Mohd Azlan', 'Sarah Tan'];
const Branches = ['KL Central', 'PJ Branch', 'Penang', 'JB South', 'Kuantan'];

export function generateTakafulLead(): TakafulLead {
  const coverageType = randomItem([...CoverageTypes]);
  let sumInsured: number;

  switch (coverageType) {
    case 'life':
      sumInsured = randomDecimal(100000, 1000000);
      break;
    case 'medical':
      sumInsured = randomDecimal(100000, 500000);
      break;
    case 'critical_illness':
      sumInsured = randomDecimal(50000, 300000);
      break;
    case 'mortgage':
      sumInsured = randomDecimal(200000, 800000);
      break;
    default:
      sumInsured = randomDecimal(50000, 200000);
  }

  const birthYear = randomInRange(1960, 2000);

  return {
    id: generateId('TAK_LEAD'),
    name: generateMalaysianName(),
    ic_number: generateMalaysianIC(),
    phone: generateMalaysianPhone(),
    email: `customer${randomInRange(100, 999)}@email.com`,
    coverage_type: coverageType,
    sum_insured: sumInsured,
    health_status: randomItem([...HealthStatuses]),
    date_of_birth: `${birthYear}-${String(randomInRange(1, 12)).padStart(2, '0')}-${String(randomInRange(1, 28)).padStart(2, '0')}`,
    occupation: randomItem(Occupations),
    smoker: Math.random() > 0.75,
    existing_policies: randomInRange(0, 3),
    annual_income: randomDecimal(36000, 180000),
    created_at: new Date(Date.now() - randomInRange(0, 60) * 24 * 60 * 60 * 1000).toISOString(),
    agent_code: randomItem(AgentCodes),
    source: randomItem(['agent', 'website', 'referral', 'bancassurance', 'corporate']),
  };
}

export function generateTakafulPipeline(): TakafulPipeline {
  const stage = randomItem([...TakafulPipelineStages]);
  const coverageType = randomItem([...CoverageTypes]);
  let sumInsured: number;
  let premiumRate: number;

  switch (coverageType) {
    case 'life':
      sumInsured = randomDecimal(100000, 1000000);
      premiumRate = 0.025;
      break;
    case 'medical':
      sumInsured = randomDecimal(100000, 500000);
      premiumRate = 0.015;
      break;
    case 'critical_illness':
      sumInsured = randomDecimal(50000, 300000);
      premiumRate = 0.035;
      break;
    case 'mortgage':
      sumInsured = randomDecimal(200000, 800000);
      premiumRate = 0.008;
      break;
    default:
      sumInsured = randomDecimal(50000, 200000);
      premiumRate = 0.02;
  }

  const agentIndex = randomInRange(0, AgentCodes.length - 1);

  return {
    id: generateId('TAK_PIPE'),
    lead_id: generateId('TAK_LEAD'),
    customer_name: generateMalaysianName(),
    ic_number: generateMalaysianIC(),
    stage,
    coverage_type: coverageType,
    sum_insured: sumInsured,
    annual_premium: Number((sumInsured * premiumRate).toFixed(2)),
    policy_term: randomItem([10, 15, 20, 25, 30]),
    payment_frequency: randomItem(['monthly', 'quarterly', 'semi_annual', 'annual']),
    underwriting_status: stage === 'Underwriting' || stage === 'Issued'
      ? randomItem(['pending', 'approved', 'declined', 'rated_up', 'exclusion'])
      : undefined,
    medical_required: Math.random() > 0.6,
    agent_code: AgentCodes[agentIndex],
    agent_name: AgentNames[agentIndex],
    branch: randomItem(Branches),
    created_at: new Date(Date.now() - randomInRange(0, 90) * 24 * 60 * 60 * 1000).toISOString(),
    expected_issue_date: stage === 'Underwriting' ? randomPastDate(-14) : undefined,
    notes: randomItem([
      'Medical exam scheduled',
      'Awaiting additional documents',
      'Customer requested rider addition',
      'Rated up due to BMI',
      undefined,
    ]),
  };
}

export function generateTakafulKPIs(): TakafulKPI {
  return {
    policy_count: randomInRange(5000, 15000),
    new_policies_mtd: randomInRange(100, 400),
    premium_collected: randomDecimal(10000000, 50000000),
    premium_collected_mtd: randomDecimal(1000000, 5000000),
    claims_ratio: randomDecimal(25, 45),
    persistency_rate: randomDecimal(80, 95),
    avg_sum_insured: randomDecimal(150000, 350000),
    avg_premium: randomDecimal(2500, 8000),
    conversion_rate: randomDecimal(25, 45),
    pending_underwriting: randomInRange(50, 200),
    total_sum_at_risk: randomDecimal(500000000, 2000000000),
  };
}

// Batch generators
export function generateMockTakafulLeads(count = 10): TakafulLead[] {
  return Array.from({ length: count }, generateTakafulLead);
}

export function generateMockTakafulPipeline(count = 10): TakafulPipeline[] {
  return Array.from({ length: count }, generateTakafulPipeline);
}

// =============================================================================
// Export Vertical Package
// =============================================================================

export const TakafulVertical = {
  metadata: TakafulMetadata,
  schemas: {
    Lead: TakafulLeadSchema,
    Pipeline: TakafulPipelineSchema,
    KPI: TakafulKPISchema,
  },
  enums: {
    CoverageTypes,
    CoverageTypeLabels,
    HealthStatuses,
    HealthStatusLabels,
    PipelineStages: TakafulPipelineStages,
    PipelineStageLabels: TakafulPipelineStageLabels,
  },
  mockFactory: {
    generateLead: generateTakafulLead,
    generatePipeline: generateTakafulPipeline,
    generateKPIs: generateTakafulKPIs,
    generateLeads: generateMockTakafulLeads,
    generatePipelineRecords: generateMockTakafulPipeline,
  },
};

export default TakafulVertical;
