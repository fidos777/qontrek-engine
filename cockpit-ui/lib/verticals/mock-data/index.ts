// lib/verticals/mock-data/index.ts
// Central exports for all vertical mock data

export { solarMockData } from './solar-data';
export type { SolarLead, SolarSummary, SolarMockData } from './solar-data';

export { takafulMockData } from './takaful-data';
export type { TakafulPolicy, TakafulSummary, TakafulMockData } from './takaful-data';

export { ecommerceMockData } from './ecommerce-data';
export type { EcommerceOrder, EcommerceSummary, EcommerceMockData } from './ecommerce-data';

export { trainingMockData } from './training-data';
export type { TrainingEnrollment, TrainingSummary, TrainingMockData } from './training-data';

export { constructionMockData } from './construction-data';
export type { ConstructionProject, ConstructionSummary, ConstructionMockData } from './construction-data';

export { automotiveMockData } from './automotive-data';
export type { AutomotiveService, AutomotiveSummary, AutomotiveMockData } from './automotive-data';

import { solarMockData } from './solar-data';
import { takafulMockData } from './takaful-data';
import { ecommerceMockData } from './ecommerce-data';
import { trainingMockData } from './training-data';
import { constructionMockData } from './construction-data';
import { automotiveMockData } from './automotive-data';
import type { VerticalId } from '../types';

// All mock data by vertical ID
export const mockDataById: Record<VerticalId, Record<string, unknown>> = {
  solar: solarMockData as unknown as Record<string, unknown>,
  takaful: takafulMockData as unknown as Record<string, unknown>,
  ecommerce: ecommerceMockData as unknown as Record<string, unknown>,
  training: trainingMockData as unknown as Record<string, unknown>,
  construction: constructionMockData as unknown as Record<string, unknown>,
  automotive: automotiveMockData as unknown as Record<string, unknown>,
};

// Get mock data for a specific vertical
export function getMockData(verticalId: VerticalId): Record<string, unknown> {
  return mockDataById[verticalId];
}
