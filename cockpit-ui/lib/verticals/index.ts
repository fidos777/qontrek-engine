/**
 * Qontrek OS Layer 4 - Vertical Data Templates
 * Central Export Module
 */

// =============================================================================
// Types & Utilities
// =============================================================================

export * from './types';

// =============================================================================
// Vertical Modules
// =============================================================================

// Solar (Voltek Energy)
export {
  SolarVertical,
  SolarMetadata,
  SolarLeadSchema,
  SolarPipelineSchema,
  SolarKPISchema,
  SolarRoofTypes,
  SolarRoofTypeLabels,
  SolarPipelineStages,
  SolarPipelineStageLabels,
  generateSolarLead,
  generateSolarPipeline,
  generateSolarKPIs,
  generateMockSolarLeads,
  generateMockSolarPipeline,
} from './solar';
export type { SolarLead, SolarPipeline, SolarKPI } from './solar';

// Automotive (Perodua)
export {
  AutomotiveVertical,
  AutomotiveMetadata,
  AutomotiveLeadSchema,
  AutomotivePipelineSchema,
  AutomotiveKPISchema,
  VehicleModels,
  VehicleModelLabels,
  BudgetRanges,
  BudgetRangeLabels,
  AutomotivePipelineStages,
  AutomotivePipelineStageLabels,
  generateAutomotiveLead,
  generateAutomotivePipeline,
  generateAutomotiveKPIs,
  generateMockAutomotiveLeads,
  generateMockAutomotivePipeline,
} from './automotive';
export type { AutomotiveLead, AutomotivePipeline, AutomotiveKPI } from './automotive';

// Takaful (Insurance)
export {
  TakafulVertical,
  TakafulMetadata,
  TakafulLeadSchema,
  TakafulPipelineSchema,
  TakafulKPISchema,
  CoverageTypes,
  CoverageTypeLabels,
  HealthStatuses,
  HealthStatusLabels,
  TakafulPipelineStages,
  TakafulPipelineStageLabels,
  generateTakafulLead,
  generateTakafulPipeline,
  generateTakafulKPIs,
  generateMockTakafulLeads,
  generateMockTakafulPipeline,
} from './takaful';
export type { TakafulLead, TakafulPipeline, TakafulKPI } from './takaful';

// E-Commerce (Nexora)
export {
  EcommerceVertical,
  EcommerceMetadata,
  EcommerceLeadSchema,
  EcommercePipelineSchema,
  EcommerceKPISchema,
  CustomerSegments,
  CustomerSegmentLabels,
  ProductCategories,
  ProductCategoryLabels,
  EcommercePipelineStages,
  EcommercePipelineStageLabels,
  generateEcommerceLead,
  generateEcommercePipeline,
  generateEcommerceKPIs,
  generateMockEcommerceLeads,
  generateMockEcommercePipeline,
} from './ecommerce';
export type { EcommerceLead, EcommercePipeline, EcommerceKPI } from './ecommerce';

// Training (HRDC)
export {
  TrainingVertical,
  TrainingMetadata,
  TrainingLeadSchema,
  TrainingPipelineSchema,
  TrainingKPISchema,
  TrainingTypes,
  TrainingTypeLabels,
  IndustryTypes,
  TrainingPipelineStages,
  TrainingPipelineStageLabels,
  generateTrainingLead,
  generateTrainingPipeline,
  generateTrainingKPIs,
  generateMockTrainingLeads,
  generateMockTrainingPipeline,
} from './training';
export type { TrainingLead, TrainingPipeline, TrainingKPI } from './training';

// Construction (CIDB)
export {
  ConstructionVertical,
  ConstructionMetadata,
  ConstructionLeadSchema,
  ConstructionPipelineSchema,
  ConstructionKPISchema,
  ProjectTypes,
  ProjectTypeLabels,
  ContractorGrades,
  ContractorGradeLabels,
  ConstructionPipelineStages,
  ConstructionPipelineStageLabels,
  generateConstructionLead,
  generateConstructionPipeline,
  generateConstructionKPIs,
  generateMockConstructionLeads,
  generateMockConstructionPipeline,
} from './construction';
export type { ConstructionLead, ConstructionPipeline, ConstructionKPI } from './construction';

// =============================================================================
// Vertical Registry
// =============================================================================

import { SolarVertical } from './solar';
import { AutomotiveVertical } from './automotive';
import { TakafulVertical } from './takaful';
import { EcommerceVertical } from './ecommerce';
import { TrainingVertical } from './training';
import { ConstructionVertical } from './construction';
import type { VerticalId, VerticalMetadata } from './types';

/**
 * Registry of all available verticals
 */
export const VerticalRegistry = {
  solar: SolarVertical,
  automotive: AutomotiveVertical,
  takaful: TakafulVertical,
  ecommerce: EcommerceVertical,
  training: TrainingVertical,
  construction: ConstructionVertical,
} as const;

/**
 * Get vertical by ID
 */
export function getVertical(id: VerticalId) {
  return VerticalRegistry[id];
}

/**
 * Get all vertical metadata for UI rendering
 */
export function getAllVerticalMetadata(): VerticalMetadata[] {
  return Object.values(VerticalRegistry).map(v => v.metadata);
}

/**
 * Get vertical IDs
 */
export function getVerticalIds(): VerticalId[] {
  return Object.keys(VerticalRegistry) as VerticalId[];
}

/**
 * Validate if a string is a valid vertical ID
 */
export function isValidVerticalId(id: string): id is VerticalId {
  return id in VerticalRegistry;
}

// =============================================================================
// Mock Data Generation Utilities
// =============================================================================

/**
 * Generate mock data for all verticals
 */
export function generateAllMockData(leadsPerVertical = 10, pipelinePerVertical = 10) {
  return {
    solar: {
      leads: SolarVertical.mockFactory.generateLeads(leadsPerVertical),
      pipeline: SolarVertical.mockFactory.generatePipelineRecords(pipelinePerVertical),
      kpis: SolarVertical.mockFactory.generateKPIs(),
    },
    automotive: {
      leads: AutomotiveVertical.mockFactory.generateLeads(leadsPerVertical),
      pipeline: AutomotiveVertical.mockFactory.generatePipelineRecords(pipelinePerVertical),
      kpis: AutomotiveVertical.mockFactory.generateKPIs(),
    },
    takaful: {
      leads: TakafulVertical.mockFactory.generateLeads(leadsPerVertical),
      pipeline: TakafulVertical.mockFactory.generatePipelineRecords(pipelinePerVertical),
      kpis: TakafulVertical.mockFactory.generateKPIs(),
    },
    ecommerce: {
      leads: EcommerceVertical.mockFactory.generateLeads(leadsPerVertical),
      pipeline: EcommerceVertical.mockFactory.generatePipelineRecords(pipelinePerVertical),
      kpis: EcommerceVertical.mockFactory.generateKPIs(),
    },
    training: {
      leads: TrainingVertical.mockFactory.generateLeads(leadsPerVertical),
      pipeline: TrainingVertical.mockFactory.generatePipelineRecords(pipelinePerVertical),
      kpis: TrainingVertical.mockFactory.generateKPIs(),
    },
    construction: {
      leads: ConstructionVertical.mockFactory.generateLeads(leadsPerVertical),
      pipeline: ConstructionVertical.mockFactory.generatePipelineRecords(pipelinePerVertical),
      kpis: ConstructionVertical.mockFactory.generateKPIs(),
    },
  };
}

/**
 * Generate mock data for a specific vertical
 */
export function generateVerticalMockData(
  verticalId: VerticalId,
  leadsCount = 10,
  pipelineCount = 10
) {
  const vertical = getVertical(verticalId);
  return {
    leads: vertical.mockFactory.generateLeads(leadsCount),
    pipeline: vertical.mockFactory.generatePipelineRecords(pipelineCount),
    kpis: vertical.mockFactory.generateKPIs(),
  };
}

// =============================================================================
// Default Export
// =============================================================================

export default VerticalRegistry;
