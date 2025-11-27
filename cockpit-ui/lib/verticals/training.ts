/**
 * Qontrek OS Layer 4 - Training Vertical (HRDC)
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
  MalaysianStates,
  randomItem,
  randomInRange,
  randomDecimal,
  randomPastDate,
  generateId,
} from './types';

// =============================================================================
// Metadata
// =============================================================================

export const TrainingMetadata: VerticalMetadata = {
  vertical_id: 'training',
  display_name: 'Corporate Training',
  display_name_bm: 'Latihan Korporat',
  icon: 'academic-cap',
  color: '#3B82F6', // Blue
  description: 'HRDC training management and levy utilization',
  description_bm: 'Pengurusan latihan HRDC dan penggunaan levi',
};

// =============================================================================
// Enums
// =============================================================================

export const TrainingTypes = [
  'technical',
  'soft_skills',
  'leadership',
  'compliance',
  'digital',
  'safety',
] as const;

export const TrainingTypeLabels: Record<typeof TrainingTypes[number], { en: string; bm: string }> = {
  'technical': { en: 'Technical Skills', bm: 'Kemahiran Teknikal' },
  'soft_skills': { en: 'Soft Skills', bm: 'Kemahiran Insaniah' },
  'leadership': { en: 'Leadership & Management', bm: 'Kepimpinan & Pengurusan' },
  'compliance': { en: 'Compliance & Regulatory', bm: 'Pematuhan & Peraturan' },
  'digital': { en: 'Digital Transformation', bm: 'Transformasi Digital' },
  'safety': { en: 'Occupational Safety', bm: 'Keselamatan Pekerjaan' },
};

export const TrainingPipelineStages = [
  'Inquiry',
  'Proposal',
  'Approved',
  'Completed',
] as const;

export const TrainingPipelineStageLabels: Record<typeof TrainingPipelineStages[number], { en: string; bm: string }> = {
  'Inquiry': { en: 'Initial Inquiry', bm: 'Pertanyaan Awal' },
  'Proposal': { en: 'Proposal Submitted', bm: 'Cadangan Dikemukakan' },
  'Approved': { en: 'HRDC Approved', bm: 'Diluluskan HRDC' },
  'Completed': { en: 'Training Completed', bm: 'Latihan Selesai' },
};

export const IndustryTypes = [
  'manufacturing',
  'services',
  'construction',
  'retail',
  'technology',
  'healthcare',
] as const;

// =============================================================================
// Lead Schema
// =============================================================================

export const TrainingLeadSchema = z.object({
  id: z.string().optional(),
  company_name: z.string()
    .min(2, { message: ValidationMessages.minLength(2).en })
    .max(200, { message: ValidationMessages.maxLength(200).en }),
  company_registration: z.string().optional().describe('SSM registration number'),
  pic_name: z.string()
    .min(2, { message: 'PIC name required / Nama PIC diperlukan' }),
  pic_designation: z.string().optional(),
  phone: MalaysianPhoneSchema,
  email: z.string().email({ message: ValidationMessages.invalidEmail.en }),
  training_type: z.enum(TrainingTypes, {
    errorMap: () => ({ message: 'Invalid training type / Jenis latihan tidak sah' }),
  }),
  pax: z.number()
    .int({ message: 'Number of participants must be a whole number / Bilangan peserta mesti nombor bulat' })
    .positive({ message: 'At least 1 participant required / Sekurang-kurangnya 1 peserta diperlukan' })
    .max(500, { message: 'Maximum 500 participants / Maksimum 500 peserta' }),
  levy_balance: CurrencySchema.describe('Available HRDC levy balance in MYR'),
  industry: z.enum(IndustryTypes).optional(),
  employee_count: z.number().int().positive().optional(),
  state: z.string().optional(),
  preferred_dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  created_at: z.string().datetime().optional(),
  source: z.enum(['website', 'referral', 'cold_call', 'event', 'repeat_client']).optional(),
});

export type TrainingLead = z.infer<typeof TrainingLeadSchema>;

// =============================================================================
// Pipeline Schema
// =============================================================================

export const TrainingPipelineSchema = z.object({
  id: z.string(),
  lead_id: z.string(),
  company_name: z.string(),
  pic_name: z.string(),
  stage: z.enum(TrainingPipelineStages),
  training_type: z.enum(TrainingTypes),
  training_title: z.string(),
  pax: z.number().int().positive(),
  grant_amount: CurrencySchema.describe('HRDC grant amount'),
  company_contribution: CurrencySchema.optional().describe('Company top-up amount'),
  total_value: CurrencySchema.describe('Total training value'),
  training_dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  duration_days: z.number().int().positive(),
  venue: z.string().optional(),
  trainer_name: z.string().optional(),
  hrdc_scheme: z.enum(['SBL', 'SBL_Khas', 'PROLUS', 'SME_PSMB', 'ILP']).optional(),
  approval_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  completion_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  evaluation_score: z.number().min(1).max(5).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export type TrainingPipeline = z.infer<typeof TrainingPipelineSchema>;

// =============================================================================
// KPI Schema
// =============================================================================

export const TrainingKPISchema = z.object({
  utilization_rate: PercentageSchema.describe('Levy utilization rate'),
  avg_grant_value: CurrencySchema.describe('Average grant value per training'),
  completion_rate: PercentageSchema.describe('Training completion rate'),
  total_pax_trained_mtd: z.number().int().nonnegative(),
  total_pax_trained_ytd: z.number().int().nonnegative(),
  programs_conducted_mtd: z.number().int().nonnegative(),
  programs_conducted_ytd: z.number().int().nonnegative(),
  total_levy_claimed_mtd: CurrencySchema,
  total_levy_claimed_ytd: CurrencySchema,
  avg_evaluation_score: z.number().min(1).max(5),
  pending_approvals: z.number().int().nonnegative(),
  upcoming_programs: z.number().int().nonnegative(),
  repeat_client_rate: PercentageSchema,
});

export type TrainingKPI = z.infer<typeof TrainingKPISchema>;

// =============================================================================
// Mock Data Factory
// =============================================================================

const CompanyNames = [
  'Syarikat Teknologi Maju Sdn Bhd',
  'Global Manufacturing (M) Sdn Bhd',
  'Pinnacle Solutions Sdn Bhd',
  'Eastern Logistics Sdn Bhd',
  'Quantum Healthcare Sdn Bhd',
  'Premier Retail Group Sdn Bhd',
  'Innovate Digital Sdn Bhd',
  'Titan Construction Sdn Bhd',
  'Harmony Services Sdn Bhd',
  'Nexus Engineering Sdn Bhd',
];

const TrainingTitles = {
  technical: ['Microsoft Excel Advanced', 'Python for Data Analysis', 'AutoCAD Fundamentals', 'SAP ERP Training'],
  soft_skills: ['Effective Communication', 'Time Management Mastery', 'Emotional Intelligence', 'Customer Service Excellence'],
  leadership: ['Leadership Essentials', 'Strategic Management', 'Team Building Workshop', 'Coaching for Performance'],
  compliance: ['ISO 9001 Awareness', 'PDPA Compliance', 'Anti-Money Laundering', 'Corporate Governance'],
  digital: ['Digital Marketing', 'AI & Machine Learning Basics', 'Cybersecurity Awareness', 'Cloud Computing 101'],
  safety: ['OSHA Compliance', 'First Aid & CPR', 'Fire Safety Training', 'Workplace Ergonomics'],
};

const Trainers = ['Dr. Ahmad Fauzi', 'Ms. Jenny Lim', 'Mr. Rajen Kumar', 'Pn. Siti Mariam', 'Mr. David Wong'];
const Venues = ['HRDC Training Centre KL', 'Hotel Grand Millennium', 'Company Premises', 'Online (Zoom)', 'CIAST Shah Alam'];

export function generateTrainingLead(): TrainingLead {
  const trainingType = randomItem([...TrainingTypes]);
  const pax = randomInRange(10, 50);
  const levyBalance = randomDecimal(10000, 100000);

  return {
    id: generateId('TRN_LEAD'),
    company_name: randomItem(CompanyNames),
    company_registration: `${randomInRange(100000, 999999)}-${randomItem(['A', 'D', 'K', 'M', 'P', 'T', 'V', 'W'])}`,
    pic_name: generateMalaysianName(),
    pic_designation: randomItem(['HR Manager', 'Training Manager', 'HR Executive', 'L&D Head', 'Admin Manager']),
    phone: generateMalaysianPhone(),
    email: `hr${randomInRange(1, 99)}@company.com.my`,
    training_type: trainingType,
    pax,
    levy_balance: levyBalance,
    industry: randomItem([...IndustryTypes]),
    employee_count: randomInRange(50, 500),
    state: randomItem(MalaysianStates),
    preferred_dates: [randomPastDate(-30), randomPastDate(-45)],
    created_at: new Date(Date.now() - randomInRange(0, 60) * 24 * 60 * 60 * 1000).toISOString(),
    source: randomItem(['website', 'referral', 'cold_call', 'event', 'repeat_client']),
  };
}

export function generateTrainingPipeline(): TrainingPipeline {
  const stage = randomItem([...TrainingPipelineStages]);
  const trainingType = randomItem([...TrainingTypes]);
  const pax = randomInRange(10, 50);
  const durationDays = randomItem([1, 2, 3, 5]);
  const grantAmount = pax * durationDays * randomDecimal(100, 250);
  const companyContribution = Math.random() > 0.7 ? randomDecimal(1000, 5000) : 0;

  return {
    id: generateId('TRN_PIPE'),
    lead_id: generateId('TRN_LEAD'),
    company_name: randomItem(CompanyNames),
    pic_name: generateMalaysianName(),
    stage,
    training_type: trainingType,
    training_title: randomItem(TrainingTitles[trainingType]),
    pax,
    grant_amount: Number(grantAmount.toFixed(2)),
    company_contribution: companyContribution || undefined,
    total_value: Number((grantAmount + companyContribution).toFixed(2)),
    training_dates: stage === 'Approved' || stage === 'Completed'
      ? [randomPastDate(stage === 'Completed' ? 30 : -14)]
      : undefined,
    duration_days: durationDays,
    venue: stage !== 'Inquiry' ? randomItem(Venues) : undefined,
    trainer_name: stage !== 'Inquiry' ? randomItem(Trainers) : undefined,
    hrdc_scheme: randomItem(['SBL', 'SBL_Khas', 'PROLUS', 'SME_PSMB', 'ILP']),
    approval_date: stage === 'Approved' || stage === 'Completed' ? randomPastDate(45) : undefined,
    completion_date: stage === 'Completed' ? randomPastDate(14) : undefined,
    evaluation_score: stage === 'Completed' ? randomDecimal(3.5, 5.0, 1) : undefined,
    created_at: new Date(Date.now() - randomInRange(0, 90) * 24 * 60 * 60 * 1000).toISOString(),
    notes: randomItem([
      'Client requested weekend training',
      'Awaiting final participant list',
      'Grant application submitted',
      'Certificate printing in progress',
      undefined,
    ]),
  };
}

export function generateTrainingKPIs(): TrainingKPI {
  return {
    utilization_rate: randomDecimal(45, 85),
    avg_grant_value: randomDecimal(8000, 25000),
    completion_rate: randomDecimal(88, 98),
    total_pax_trained_mtd: randomInRange(200, 800),
    total_pax_trained_ytd: randomInRange(2000, 8000),
    programs_conducted_mtd: randomInRange(15, 50),
    programs_conducted_ytd: randomInRange(150, 500),
    total_levy_claimed_mtd: randomDecimal(200000, 800000),
    total_levy_claimed_ytd: randomDecimal(2000000, 8000000),
    avg_evaluation_score: randomDecimal(4.0, 4.8, 1),
    pending_approvals: randomInRange(10, 40),
    upcoming_programs: randomInRange(20, 60),
    repeat_client_rate: randomDecimal(35, 60),
  };
}

// Batch generators
export function generateMockTrainingLeads(count = 10): TrainingLead[] {
  return Array.from({ length: count }, generateTrainingLead);
}

export function generateMockTrainingPipeline(count = 10): TrainingPipeline[] {
  return Array.from({ length: count }, generateTrainingPipeline);
}

// =============================================================================
// Export Vertical Package
// =============================================================================

export const TrainingVertical = {
  metadata: TrainingMetadata,
  schemas: {
    Lead: TrainingLeadSchema,
    Pipeline: TrainingPipelineSchema,
    KPI: TrainingKPISchema,
  },
  enums: {
    TrainingTypes,
    TrainingTypeLabels,
    IndustryTypes,
    PipelineStages: TrainingPipelineStages,
    PipelineStageLabels: TrainingPipelineStageLabels,
  },
  mockFactory: {
    generateLead: generateTrainingLead,
    generatePipeline: generateTrainingPipeline,
    generateKPIs: generateTrainingKPIs,
    generateLeads: generateMockTrainingLeads,
    generatePipelineRecords: generateMockTrainingPipeline,
  },
};

export default TrainingVertical;
