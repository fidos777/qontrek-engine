// lib/verticals/index.ts
// Central exports for the Verticals layer

// Export types
export * from './types';

// Export registry
export { verticalRegistry, VerticalRegistry } from './registry';

// Export utilities
export * from './utils';

// Export templates
export {
  solarTemplate,
  takafulTemplate,
  ecommerceTemplate,
  trainingTemplate,
  constructionTemplate,
  automotiveTemplate,
  allTemplates,
  templatesById,
} from './templates';

// Export mock data
export {
  solarMockData,
  takafulMockData,
  ecommerceMockData,
  trainingMockData,
  constructionMockData,
  automotiveMockData,
  mockDataById,
  getMockData,
} from './mock-data';

// Import for initialization
import { verticalRegistry } from './registry';
import {
  solarTemplate,
  takafulTemplate,
  ecommerceTemplate,
  trainingTemplate,
  constructionTemplate,
  automotiveTemplate,
} from './templates';
import {
  solarMockData,
  takafulMockData,
  ecommerceMockData,
  trainingMockData,
  constructionMockData,
  automotiveMockData,
} from './mock-data';

// Initialize registry with all templates and mock data
function initializeRegistry(): void {
  verticalRegistry.register(solarTemplate, solarMockData as unknown as Record<string, unknown>);
  verticalRegistry.register(takafulTemplate, takafulMockData as unknown as Record<string, unknown>);
  verticalRegistry.register(ecommerceTemplate, ecommerceMockData as unknown as Record<string, unknown>);
  verticalRegistry.register(trainingTemplate, trainingMockData as unknown as Record<string, unknown>);
  verticalRegistry.register(constructionTemplate, constructionMockData as unknown as Record<string, unknown>);
  verticalRegistry.register(automotiveTemplate, automotiveMockData as unknown as Record<string, unknown>);
}

// Auto-initialize on import
initializeRegistry();

// Export initialization function for testing or re-initialization
export { initializeRegistry };
