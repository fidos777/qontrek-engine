/**
 * Qontrek OS Layer 5 - Personality Engine
 *
 * This module provides a complete AI persona system with 7 specialized agents:
 * 1. Research Agent (Audience Scout) - TOFU intelligence gathering
 * 2. Content Agent (Content Amplifier) - TOFU/MOFU content creation
 * 3. Closer Agent (Voice Closer) - BOFU sales conversion [PRIMARY FOR VOLTEK]
 * 4. Advisor Agent (AI Persona) - MOFU consultation and guidance
 * 5. Broadcaster Agent (Omnichannel Distributor) - Cross-funnel distribution
 * 6. Strategist Agent (Funnel Optimizer) - Cross-funnel analytics [PRIMARY FOR ANALYTICS]
 * 7. Admin Agent (Execution Tracker) - Cross-funnel operations [DEFAULT FALLBACK]
 *
 * @module lib/persona
 * @version 1.0.0
 */

// =============================================================================
// ROUTER
// =============================================================================
export {
  PersonaRouter,
  getPersonaRouter,
  resetPersonaRouter,
} from './router';

// =============================================================================
// INTENT CLASSIFIER
// =============================================================================
export {
  IntentClassifier,
  getIntentClassifier,
  resetIntentClassifier,
  INTENT_PATTERNS,
  PERSONA_KEYWORDS,
} from './intent';

// =============================================================================
// SYSTEM PROMPTS
// =============================================================================
export {
  PERSONA_SYSTEM_PROMPTS,
  VERTICAL_ADDENDUMS,
  buildSystemPrompt,
  PROMPT_TEMPLATES,
} from './prompts';

// =============================================================================
// MAPPINGS
// =============================================================================
export {
  PERSONA_TOOLS,
  PERSONA_WIDGETS,
  PERSONA_SKILLS,
  PERSONA_GATES,
  PERSONA_MAPPINGS,
  TOOL_DEFINITIONS,
  WIDGET_DEFINITIONS,
  getToolsForPersona,
  getWidgetsForPersona,
  getPersonasForTool,
  getPersonasForWidget,
  personaHasToolAccess,
  personaHasWidgetAccess,
  getGateAccessForPersona,
  getRequiredCredentialsForPersona,
} from './mappings';

// =============================================================================
// CONFIGURATIONS
// =============================================================================
export {
  PERSONA_CONFIGS,
  getPersonaConfig,
  getAllPersonaConfigs,
  getPersonasByFunnel,
  getPersonasByPriority,
  getDefaultPersona,
  getPrimaryPersonaForVertical,
} from './configs';

// =============================================================================
// TYPES (Re-export from types module)
// =============================================================================
export type {
  PersonaId,
  FunnelStage,
  ToneStyle,
  VerticalType,
  PersonaConfig,
  PersonaKPI,
  PersonaGovernance,
  PersonaTool,
  ToolParameter,
  ClassifiedIntent,
  IntentPattern,
  RoutingContext,
  RoutingDecision,
  ConversationMessage,
  SystemPromptContext,
  TenantContext,
  GovernanceContext,
  PersonaMappings,
  ToolMapping,
  WidgetMapping,
  PersonaProofEntry,
  PersonaResponse,
  PersonaErrorResponse,
} from '@/types/persona';

// =============================================================================
// CONVENIENCE CONSTANTS
// =============================================================================

/** All available persona IDs */
export const ALL_PERSONA_IDS: readonly string[] = [
  'research',
  'content',
  'closer',
  'advisor',
  'broadcaster',
  'strategist',
  'admin',
] as const;

/** Persona IDs by funnel stage */
export const PERSONAS_BY_FUNNEL = {
  TOFU: ['research', 'content'],
  MOFU: ['content', 'advisor'],
  BOFU: ['closer'],
  'cross-funnel': ['broadcaster', 'strategist', 'admin'],
} as const;

/** Primary personas by vertical */
export const PRIMARY_PERSONAS = {
  solar: 'closer',
  ev: 'closer',
  clinic: 'advisor',
  retail: 'content',
  services: 'advisor',
  default: 'admin',
} as const;

/** Default fallback persona */
export const DEFAULT_PERSONA = 'admin' as const;

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a new PersonaRouter instance with default or custom configs
 */
export function createPersonaRouter(
  customConfigs?: Record<string, unknown>
): import('./router').PersonaRouter {
  const { PersonaRouter } = require('./router');
  return new PersonaRouter(customConfigs);
}

/**
 * Create a new IntentClassifier instance with default or custom patterns
 */
export function createIntentClassifier(
  customPatterns?: unknown[],
  customKeywords?: Record<string, unknown>
): import('./intent').IntentClassifier {
  const { IntentClassifier } = require('./intent');
  return new IntentClassifier(customPatterns, customKeywords);
}

// =============================================================================
// QUICK ACCESS FUNCTIONS
// =============================================================================

/**
 * Quick route a query to determine the best persona
 * @param query User query text
 * @param tenantId Tenant identifier
 * @param vertical Business vertical
 */
export async function routeQuery(
  query: string,
  tenantId: string,
  vertical: string = 'default'
): Promise<import('@/types/persona').RoutingDecision> {
  const { getPersonaRouter } = require('./router');
  const router = getPersonaRouter();

  return router.selectPersona(query, {
    tenantId,
    vertical: vertical as import('@/types/persona').VerticalType,
  });
}

/**
 * Quick classify a query intent
 * @param query User query text
 */
export async function classifyIntent(
  query: string
): Promise<import('@/types/persona').ClassifiedIntent> {
  const { getIntentClassifier } = require('./intent');
  const classifier = getIntentClassifier();

  return classifier.classify(query);
}

/**
 * Get system prompt for a persona with full context
 * @param personaId Persona identifier
 * @param tenantContext Tenant context information
 * @param governanceContext Governance settings
 */
export function getSystemPromptForPersona(
  personaId: string,
  tenantContext: import('@/types/persona').TenantContext,
  governanceContext: import('@/types/persona').GovernanceContext
): string {
  const { buildSystemPrompt } = require('./prompts');
  const { getPersonaConfig } = require('./configs');
  const { getToolsForPersona } = require('./mappings');

  const persona = getPersonaConfig(personaId);
  if (!persona) {
    throw new Error(`Unknown persona: ${personaId}`);
  }

  const tools = getToolsForPersona(personaId);

  return buildSystemPrompt({
    persona,
    tenant: tenantContext,
    governance: governanceContext,
    tools,
  });
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Check if a string is a valid persona ID
 */
export function isValidPersonaId(id: string): id is import('@/types/persona').PersonaId {
  return ALL_PERSONA_IDS.includes(id);
}

/**
 * Check if a string is a valid funnel stage
 */
export function isValidFunnelStage(stage: string): stage is import('@/types/persona').FunnelStage {
  return ['TOFU', 'MOFU', 'BOFU', 'cross-funnel'].includes(stage);
}

/**
 * Check if a string is a valid vertical type
 */
export function isValidVerticalType(vertical: string): vertical is import('@/types/persona').VerticalType {
  return ['solar', 'ev', 'clinic', 'retail', 'services', 'default'].includes(vertical);
}
