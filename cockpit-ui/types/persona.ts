/**
 * Qontrek OS Layer 5 - Personality Engine Type Definitions
 * 7 AI Personas: Research, Content, Closer, Advisor, Broadcaster, Strategist, Admin
 */

// =============================================================================
// CORE ENUMS
// =============================================================================

export type PersonaId =
  | 'research'
  | 'content'
  | 'closer'
  | 'advisor'
  | 'broadcaster'
  | 'strategist'
  | 'admin';

export type FunnelStage =
  | 'TOFU'      // Top of Funnel
  | 'MOFU'      // Middle of Funnel
  | 'BOFU'      // Bottom of Funnel
  | 'cross-funnel';

export type ToneStyle =
  | 'analytical'
  | 'curious'
  | 'creative'
  | 'engaging'
  | 'urgent'
  | 'empathetic'
  | 'consultative'
  | 'trustworthy'
  | 'informative'
  | 'consistent'
  | 'strategic'
  | 'operational'
  | 'efficient';

export type VerticalType =
  | 'solar'
  | 'ev'
  | 'clinic'
  | 'retail'
  | 'services'
  | 'default';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export interface PersonaTool {
  id: string;
  name: string;
  description: string;
  parameters?: Record<string, ToolParameter>;
  requiredCredentials?: string[];
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: unknown;
  enum?: string[];
}

// =============================================================================
// PERSONA CONFIGURATION
// =============================================================================

export interface PersonaConfig {
  id: PersonaId;
  name: string;
  codename: string;
  description: string;
  funnel: FunnelStage | FunnelStage[];
  tones: ToneStyle[];
  framework?: string;

  // Capabilities
  tools: string[];
  widgets: string[];
  skills: string[];

  // KPIs
  kpis: PersonaKPI[];

  // Routing
  intents: string[];
  keywords: string[];
  priority: number;

  // Governance
  governance: PersonaGovernance;

  // Vertical-specific overrides
  verticalOverrides?: Record<VerticalType, Partial<PersonaConfig>>;
}

export interface PersonaKPI {
  id: string;
  name: string;
  description: string;
  targetValue?: number;
  unit?: string;
}

export interface PersonaGovernance {
  requiresApproval: boolean;
  maxActionsPerHour: number;
  auditLevel: 'minimal' | 'standard' | 'detailed';
  sensitiveDataAccess: boolean;
  proofRequired: boolean;
}

// =============================================================================
// INTENT CLASSIFICATION
// =============================================================================

export interface ClassifiedIntent {
  intent: string;
  confidence: number;
  persona: PersonaId;
  reasoning: string;
  alternativePersonas: Array<{
    persona: PersonaId;
    confidence: number;
  }>;
}

export interface IntentPattern {
  pattern: RegExp | string;
  intent: string;
  persona: PersonaId;
  weight: number;
}

// =============================================================================
// ROUTING
// =============================================================================

export interface RoutingContext {
  tenantId: string;
  vertical: VerticalType;
  userId?: string;
  sessionId?: string;
  previousPersona?: PersonaId;
  conversationHistory?: ConversationMessage[];
  metadata?: Record<string, unknown>;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  persona?: PersonaId;
}

export interface RoutingDecision {
  selectedPersona: PersonaId;
  confidence: number;
  reasoning: string;
  fallbackPersona: PersonaId;
  matchedIntents: string[];
  contextFactors: string[];
  timestamp: string;
  proofHash?: string;
}

// =============================================================================
// SYSTEM PROMPTS
// =============================================================================

export interface SystemPromptContext {
  persona: PersonaConfig;
  tenant: TenantContext;
  governance: GovernanceContext;
  tools: PersonaTool[];
}

export interface TenantContext {
  id: string;
  name: string;
  vertical: VerticalType;
  language: string;
  timezone: string;
  customInstructions?: string;
}

export interface GovernanceContext {
  proofLedgerEnabled: boolean;
  auditTrailRequired: boolean;
  piiScrubbing: boolean;
  approvalWorkflow: boolean;
}

// =============================================================================
// PERSONA MAPPINGS
// =============================================================================

export interface PersonaMappings {
  tools: Record<PersonaId, string[]>;
  widgets: Record<PersonaId, string[]>;
  skills: Record<PersonaId, string[]>;
  gates: Record<PersonaId, string[]>;
}

export interface ToolMapping {
  toolId: string;
  personas: PersonaId[];
  l2Function: string;
  endpoint?: string;
  credentials?: string[];
}

export interface WidgetMapping {
  widgetId: string;
  personas: PersonaId[];
  component: string;
  props?: Record<string, unknown>;
}

// =============================================================================
// PROOF LEDGER
// =============================================================================

export interface PersonaProofEntry {
  id: string;
  timestamp: string;
  personaId: PersonaId;
  action: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  tenantId: string;
  sessionId: string;
  hash: string;
  previousHash?: string;
}

// =============================================================================
// API RESPONSES
// =============================================================================

export interface PersonaResponse<T = unknown> {
  ok: boolean;
  persona: PersonaId;
  action: string;
  data: T;
  metadata: {
    executionTime: number;
    toolsUsed: string[];
    proofHash?: string;
  };
}

export interface PersonaErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
    persona?: PersonaId;
    fallbackSuggestion?: PersonaId;
  };
}
