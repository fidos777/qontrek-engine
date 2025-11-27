/**
 * Qontrek OS Layer 4 - Construction Vertical (CIDB)
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
  MalaysianCities,
  randomItem,
  randomInRange,
  randomDecimal,
  randomPastDate,
  generateId,
} from './types';

// =============================================================================
// Metadata
// =============================================================================

export const ConstructionMetadata: VerticalMetadata = {
  vertical_id: 'construction',
  display_name: 'Construction',
  display_name_bm: 'Pembinaan',
  icon: 'building-office',
  color: '#F97316', // Orange
  description: 'Construction project management and CIDB compliance',
  description_bm: 'Pengurusan projek pembinaan dan pematuhan CIDB',
};

// =============================================================================
// Enums
// =============================================================================

export const ProjectTypes = [
  'residential',
  'commercial',
  'industrial',
  'infrastructure',
  'renovation',
] as const;

export const ProjectTypeLabels: Record<typeof ProjectTypes[number], { en: string; bm: string }> = {
  'residential': { en: 'Residential', bm: 'Kediaman' },
  'commercial': { en: 'Commercial', bm: 'Komersial' },
  'industrial': { en: 'Industrial', bm: 'Perindustrian' },
  'infrastructure': { en: 'Infrastructure', bm: 'Infrastruktur' },
  'renovation': { en: 'Renovation', bm: 'Pengubahsuaian' },
};

export const ConstructionPipelineStages = [
  'Tender',
  'Awarded',
  'InProgress',
  'Completed',
] as const;

export const ConstructionPipelineStageLabels: Record<typeof ConstructionPipelineStages[number], { en: string; bm: string }> = {
  'Tender': { en: 'Tender Submitted', bm: 'Tender Dikemukakan' },
  'Awarded': { en: 'Contract Awarded', bm: 'Kontrak Dianugerahkan' },
  'InProgress': { en: 'In Progress', bm: 'Sedang Berjalan' },
  'Completed': { en: 'Project Completed', bm: 'Projek Selesai' },
};

export const ContractorGrades = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'] as const;

export const ContractorGradeLabels: Record<typeof ContractorGrades[number], { en: string; bm: string; max_value: number }> = {
  'G1': { en: 'Grade 1 (up to RM200K)', bm: 'Gred 1 (sehingga RM200K)', max_value: 200000 },
  'G2': { en: 'Grade 2 (up to RM500K)', bm: 'Gred 2 (sehingga RM500K)', max_value: 500000 },
  'G3': { en: 'Grade 3 (up to RM1M)', bm: 'Gred 3 (sehingga RM1J)', max_value: 1000000 },
  'G4': { en: 'Grade 4 (up to RM3M)', bm: 'Gred 4 (sehingga RM3J)', max_value: 3000000 },
  'G5': { en: 'Grade 5 (up to RM5M)', bm: 'Gred 5 (sehingga RM5J)', max_value: 5000000 },
  'G6': { en: 'Grade 6 (up to RM10M)', bm: 'Gred 6 (sehingga RM10J)', max_value: 10000000 },
  'G7': { en: 'Grade 7 (Unlimited)', bm: 'Gred 7 (Tiada Had)', max_value: 999999999 },
};

// =============================================================================
// Lead Schema (Project Opportunity)
// =============================================================================

export const ConstructionLeadSchema = z.object({
  id: z.string().optional(),
  project_name: z.string()
    .min(5, { message: ValidationMessages.minLength(5).en })
    .max(200, { message: ValidationMessages.maxLength(200).en }),
  client_name: z.string().optional(),
  contractor: z.string()
    .min(2, { message: 'Contractor name required / Nama kontraktor diperlukan' }),
  contractor_grade: z.enum(ContractorGrades, {
    errorMap: () => ({ message: 'Invalid CIDB grade / Gred CIDB tidak sah' }),
  }),
  cidb_registration: z.string().optional().describe('CIDB registration number'),
  value: CurrencySchema
    .min(10000, { message: 'Minimum project value is RM10,000 / Nilai projek minimum adalah RM10,000' })
    .describe('Estimated project value in MYR'),
  project_type: z.enum(ProjectTypes, {
    errorMap: () => ({ message: 'Invalid project type / Jenis projek tidak sah' }),
  }),
  location: z.string()
    .min(3, { message: 'Location required / Lokasi diperlukan' }),
  state: z.string().optional(),
  duration: z.number()
    .int({ message: 'Duration must be whole months / Tempoh mesti bulan bulat' })
    .positive({ message: 'Duration must be positive / Tempoh mesti positif' })
    .max(120, { message: 'Maximum 120 months / Maksimum 120 bulan' })
    .describe('Project duration in months'),
  tender_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: ValidationMessages.invalidDate.en,
  }).optional(),
  contact_person: z.string().optional(),
  contact_phone: MalaysianPhoneSchema.optional(),
  created_at: z.string().datetime().optional(),
  source: z.enum(['tender_portal', 'direct', 'referral', 'government', 'private']).optional(),
});

export type ConstructionLead = z.infer<typeof ConstructionLeadSchema>;

// =============================================================================
// Pipeline Schema
// =============================================================================

export const ConstructionPipelineSchema = z.object({
  id: z.string(),
  lead_id: z.string(),
  project_name: z.string(),
  contractor: z.string(),
  contractor_grade: z.enum(ContractorGrades),
  stage: z.enum(ConstructionPipelineStages),
  project_type: z.enum(ProjectTypes),
  contract_value: CurrencySchema.describe('Contract value in MYR'),
  variation_orders: CurrencySchema.optional().describe('Value of variation orders'),
  total_value: CurrencySchema.describe('Total project value including VOs'),
  location: z.string(),
  state: z.string(),
  duration_months: z.number().int().positive(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expected_completion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  actual_completion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  progress_percentage: PercentageSchema.optional(),
  payment_progress: PercentageSchema.optional().describe('Payment claimed percentage'),
  retention_held: CurrencySchema.optional(),
  safety_incidents: z.number().int().nonnegative().default(0),
  project_manager: z.string().optional(),
  site_supervisor: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export type ConstructionPipeline = z.infer<typeof ConstructionPipelineSchema>;

// =============================================================================
// KPI Schema
// =============================================================================

export const ConstructionKPISchema = z.object({
  project_margin: PercentageSchema.describe('Average project margin'),
  on_time_rate: PercentageSchema.describe('On-time completion rate'),
  safety_incidents: z.number().int().nonnegative().describe('Total safety incidents YTD'),
  ltir: z.number().nonnegative().describe('Lost Time Injury Rate'),
  active_projects: z.number().int().nonnegative(),
  completed_projects_ytd: z.number().int().nonnegative(),
  total_contract_value: CurrencySchema.describe('Total active contract value'),
  revenue_ytd: CurrencySchema,
  pending_claims: CurrencySchema.describe('Pending payment claims'),
  retention_held: CurrencySchema.describe('Total retention held'),
  avg_project_duration: z.number().positive().describe('Average project duration in months'),
  tender_success_rate: PercentageSchema,
});

export type ConstructionKPI = z.infer<typeof ConstructionKPISchema>;

// =============================================================================
// Mock Data Factory
// =============================================================================

const ProjectNames = {
  residential: [
    'Taman Harmoni Phase 2', 'Residensi Mawar', 'Sri Kembangan Heights',
    'D\'Grandeur Condominium', 'Bandar Baru Ampang', 'Setia Eco Park Villas'
  ],
  commercial: [
    'Menara Perdana Tower', 'Plaza Sentral Extension', 'Wisma Merdeka Renovation',
    'The Hub Commercial Centre', 'Paradigm Mall Phase 3', 'KL Eco City Block C'
  ],
  industrial: [
    'Kawasan Perindustrian Klang', 'Shah Alam Industrial Park', 'Senai Tech Park',
    'Port Klang Free Zone Warehouse', 'Kulim Hi-Tech Factory', 'Pasir Gudang Logistics Hub'
  ],
  infrastructure: [
    'Jalan Persekutuan Upgrade', 'Sg. Besi-Kajang Highway', 'KLIA3 Access Road',
    'Selangor Smart Tunnel', 'LRT Line 4 Station', 'Water Treatment Plant Pahang'
  ],
  renovation: [
    'Hospital Kuala Lumpur Wing B', 'Sekolah Menengah Renovation', 'Government Complex Upgrade',
    'University Library Extension', 'Shopping Mall Refurbishment', 'Office Tower Retrofit'
  ],
};

const Contractors = [
  'Gamuda Berhad', 'IJM Corporation', 'Sunway Construction', 'WCT Holdings',
  'MRCB', 'Ekovest Berhad', 'Mudajaya Group', 'Pesona Metro Holdings',
  'TRC Synergy', 'HSS Engineers'
];

const ProjectManagers = ['Ir. Ahmad Razali', 'Ir. Lee Kah Wai', 'Ir. Siva Kumar', 'Ir. Fatimah Zahra', 'Ir. Wong Teck Soon'];

export function generateConstructionLead(): ConstructionLead {
  const projectType = randomItem([...ProjectTypes]);
  const grade = randomItem([...ContractorGrades]);
  const maxValue = ContractorGradeLabels[grade].max_value;
  const value = Math.min(randomDecimal(50000, 50000000), maxValue);

  return {
    id: generateId('CON_LEAD'),
    project_name: randomItem(ProjectNames[projectType]),
    client_name: randomItem(['JKR', 'DBKL', 'LLM', 'Private Developer', 'State Government', 'Federal Government']),
    contractor: randomItem(Contractors),
    contractor_grade: grade,
    cidb_registration: `CIDB${randomInRange(100000, 999999)}`,
    value,
    project_type: projectType,
    location: randomItem(MalaysianCities),
    state: randomItem(MalaysianStates),
    duration: randomItem([6, 12, 18, 24, 36, 48, 60]),
    tender_deadline: randomPastDate(-30),
    contact_person: generateMalaysianName(),
    contact_phone: generateMalaysianPhone(),
    created_at: new Date(Date.now() - randomInRange(0, 60) * 24 * 60 * 60 * 1000).toISOString(),
    source: randomItem(['tender_portal', 'direct', 'referral', 'government', 'private']),
  };
}

export function generateConstructionPipeline(): ConstructionPipeline {
  const stage = randomItem([...ConstructionPipelineStages]);
  const projectType = randomItem([...ProjectTypes]);
  const grade = randomItem([...ContractorGrades]);
  const contractValue = randomDecimal(500000, 20000000);
  const variationOrders = Math.random() > 0.6 ? randomDecimal(50000, contractValue * 0.15) : 0;
  const durationMonths = randomItem([12, 18, 24, 36, 48]);

  let progressPercentage = 0;
  let paymentProgress = 0;

  switch (stage) {
    case 'Tender':
      progressPercentage = 0;
      paymentProgress = 0;
      break;
    case 'Awarded':
      progressPercentage = randomDecimal(0, 10);
      paymentProgress = randomDecimal(0, 5);
      break;
    case 'InProgress':
      progressPercentage = randomDecimal(15, 85);
      paymentProgress = randomDecimal(10, progressPercentage - 5);
      break;
    case 'Completed':
      progressPercentage = 100;
      paymentProgress = randomDecimal(85, 100);
      break;
  }

  return {
    id: generateId('CON_PIPE'),
    lead_id: generateId('CON_LEAD'),
    project_name: randomItem(ProjectNames[projectType]),
    contractor: randomItem(Contractors),
    contractor_grade: grade,
    stage,
    project_type: projectType,
    contract_value: contractValue,
    variation_orders: variationOrders || undefined,
    total_value: Number((contractValue + variationOrders).toFixed(2)),
    location: randomItem(MalaysianCities),
    state: randomItem(MalaysianStates),
    duration_months: durationMonths,
    start_date: stage !== 'Tender' ? randomPastDate(durationMonths * 30) : undefined,
    expected_completion: stage !== 'Tender' ? randomPastDate(-(durationMonths - 6) * 30) : undefined,
    actual_completion: stage === 'Completed' ? randomPastDate(30) : undefined,
    progress_percentage: progressPercentage,
    payment_progress: paymentProgress,
    retention_held: stage !== 'Tender' ? Number((contractValue * 0.05).toFixed(2)) : undefined,
    safety_incidents: randomInRange(0, 3),
    project_manager: randomItem(ProjectManagers),
    site_supervisor: generateMalaysianName(),
    created_at: new Date(Date.now() - randomInRange(0, 365) * 24 * 60 * 60 * 1000).toISOString(),
    notes: randomItem([
      'Awaiting material delivery',
      'Weather delay - 2 weeks',
      'Subcontractor issue resolved',
      'Ahead of schedule',
      'Variation order pending approval',
      undefined,
    ]),
  };
}

export function generateConstructionKPIs(): ConstructionKPI {
  return {
    project_margin: randomDecimal(8, 18),
    on_time_rate: randomDecimal(70, 92),
    safety_incidents: randomInRange(0, 15),
    ltir: randomDecimal(0.5, 3.0, 2),
    active_projects: randomInRange(10, 50),
    completed_projects_ytd: randomInRange(5, 25),
    total_contract_value: randomDecimal(50000000, 500000000),
    revenue_ytd: randomDecimal(20000000, 200000000),
    pending_claims: randomDecimal(2000000, 20000000),
    retention_held: randomDecimal(5000000, 30000000),
    avg_project_duration: randomDecimal(18, 36, 1),
    tender_success_rate: randomDecimal(20, 45),
  };
}

// Batch generators
export function generateMockConstructionLeads(count = 10): ConstructionLead[] {
  return Array.from({ length: count }, generateConstructionLead);
}

export function generateMockConstructionPipeline(count = 10): ConstructionPipeline[] {
  return Array.from({ length: count }, generateConstructionPipeline);
}

// =============================================================================
// Export Vertical Package
// =============================================================================

export const ConstructionVertical = {
  metadata: ConstructionMetadata,
  schemas: {
    Lead: ConstructionLeadSchema,
    Pipeline: ConstructionPipelineSchema,
    KPI: ConstructionKPISchema,
  },
  enums: {
    ProjectTypes,
    ProjectTypeLabels,
    ContractorGrades,
    ContractorGradeLabels,
    PipelineStages: ConstructionPipelineStages,
    PipelineStageLabels: ConstructionPipelineStageLabels,
  },
  mockFactory: {
    generateLead: generateConstructionLead,
    generatePipeline: generateConstructionPipeline,
    generateKPIs: generateConstructionKPIs,
    generateLeads: generateMockConstructionLeads,
    generatePipelineRecords: generateMockConstructionPipeline,
  },
};

export default ConstructionVertical;
