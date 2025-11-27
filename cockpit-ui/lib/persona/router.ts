/**
 * PersonaRouter - Qontrek OS Layer 5
 * Routes queries to appropriate AI personas based on intent, context, and tenant
 */

import { createHash } from 'crypto';
import type {
  PersonaId,
  PersonaConfig,
  RoutingContext,
  RoutingDecision,
  ClassifiedIntent,
  VerticalType,
  PersonaProofEntry,
} from '@/types/persona';
import { IntentClassifier } from './intent';
import { PERSONA_CONFIGS } from './configs';

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_PERSONA: PersonaId = 'admin';
const CONFIDENCE_THRESHOLD = 0.6;
const PERSONA_PRIORITY_ORDER: PersonaId[] = [
  'closer',
  'strategist',
  'research',
  'content',
  'advisor',
  'broadcaster',
  'admin',
];

// =============================================================================
// PERSONA ROUTER CLASS
// =============================================================================

export class PersonaRouter {
  private classifier: IntentClassifier;
  private configs: Map<PersonaId, PersonaConfig>;
  private proofLedger: PersonaProofEntry[] = [];
  private routingHistory: Map<string, RoutingDecision[]> = new Map();

  constructor(configs?: Record<PersonaId, PersonaConfig>) {
    this.classifier = new IntentClassifier();
    this.configs = new Map(
      Object.entries(configs || PERSONA_CONFIGS) as [PersonaId, PersonaConfig][]
    );
  }

  // ===========================================================================
  // MAIN ROUTING METHOD
  // ===========================================================================

  /**
   * Select the most appropriate persona for a given query and context
   */
  async selectPersona(
    query: string,
    context: RoutingContext
  ): Promise<RoutingDecision> {
    const startTime = Date.now();

    // Step 1: Classify intent
    const classifiedIntent = await this.classifier.classify(query, context);

    // Step 2: Apply vertical-specific rules
    const verticalAdjustedPersona = this.applyVerticalRules(
      classifiedIntent,
      context.vertical
    );

    // Step 3: Check conversation continuity
    const continuityPersona = this.checkConversationContinuity(
      context.sessionId,
      context.previousPersona
    );

    // Step 4: Resolve final persona
    const finalPersona = this.resolvePersona(
      verticalAdjustedPersona,
      continuityPersona,
      classifiedIntent.confidence
    );

    // Step 5: Determine fallback
    const fallbackPersona = this.determineFallback(finalPersona, context);

    // Step 6: Gather context factors
    const contextFactors = this.gatherContextFactors(context, classifiedIntent);

    // Step 7: Create routing decision
    const decision: RoutingDecision = {
      selectedPersona: finalPersona,
      confidence: classifiedIntent.confidence,
      reasoning: this.generateReasoning(
        finalPersona,
        classifiedIntent,
        contextFactors
      ),
      fallbackPersona,
      matchedIntents: [classifiedIntent.intent],
      contextFactors,
      timestamp: new Date().toISOString(),
    };

    // Step 8: Log to proof ledger if required
    const config = this.configs.get(finalPersona);
    if (config?.governance.proofRequired) {
      decision.proofHash = await this.logToProofLedger(
        decision,
        query,
        context
      );
    }

    // Step 9: Store in routing history
    this.storeRoutingHistory(context.sessionId, decision);

    return decision;
  }

  // ===========================================================================
  // VERTICAL RULES
  // ===========================================================================

  private applyVerticalRules(
    intent: ClassifiedIntent,
    vertical: VerticalType
  ): PersonaId {
    // Vertical-specific persona overrides
    const verticalPrimaryPersonas: Record<VerticalType, PersonaId | null> = {
      solar: 'closer', // Voltek uses Closer as primary
      ev: 'closer',
      clinic: 'advisor',
      retail: 'content',
      services: 'advisor',
      default: null,
    };

    // Check if vertical has a primary persona and intent matches BOFU
    const primaryPersona = verticalPrimaryPersonas[vertical];
    if (primaryPersona && this.isHighValueIntent(intent)) {
      return primaryPersona;
    }

    return intent.persona;
  }

  private isHighValueIntent(intent: ClassifiedIntent): boolean {
    const highValueIntents = [
      'close_deal',
      'follow_up_lead',
      'send_proposal',
      'make_call',
      'check_leads',
    ];
    return highValueIntents.includes(intent.intent);
  }

  // ===========================================================================
  // CONVERSATION CONTINUITY
  // ===========================================================================

  private checkConversationContinuity(
    sessionId?: string,
    previousPersona?: PersonaId
  ): PersonaId | null {
    if (!sessionId || !previousPersona) return null;

    const history = this.routingHistory.get(sessionId);
    if (!history || history.length === 0) return null;

    // Get last 3 routing decisions
    const recentDecisions = history.slice(-3);
    const samePersonaCount = recentDecisions.filter(
      (d) => d.selectedPersona === previousPersona
    ).length;

    // If 2+ of last 3 decisions used same persona, suggest continuity
    if (samePersonaCount >= 2) {
      return previousPersona;
    }

    return null;
  }

  // ===========================================================================
  // PERSONA RESOLUTION
  // ===========================================================================

  private resolvePersona(
    intentPersona: PersonaId,
    continuityPersona: PersonaId | null,
    confidence: number
  ): PersonaId {
    // Low confidence → use fallback
    if (confidence < CONFIDENCE_THRESHOLD) {
      return DEFAULT_PERSONA;
    }

    // High confidence from intent → use intent persona
    if (confidence >= 0.8) {
      return intentPersona;
    }

    // Medium confidence with continuity → prefer continuity
    if (continuityPersona && confidence >= 0.5) {
      return continuityPersona;
    }

    return intentPersona;
  }

  // ===========================================================================
  // FALLBACK DETERMINATION
  // ===========================================================================

  private determineFallback(
    primary: PersonaId,
    context: RoutingContext
  ): PersonaId {
    // Define fallback chains
    const fallbackChains: Record<PersonaId, PersonaId[]> = {
      closer: ['advisor', 'admin'],
      strategist: ['admin'],
      research: ['strategist', 'admin'],
      content: ['broadcaster', 'admin'],
      advisor: ['admin'],
      broadcaster: ['content', 'admin'],
      admin: [], // Admin is the ultimate fallback
    };

    const chain = fallbackChains[primary] || ['admin'];

    // Return first available fallback that isn't the primary
    for (const fallback of chain) {
      if (fallback !== primary) {
        return fallback;
      }
    }

    return DEFAULT_PERSONA;
  }

  // ===========================================================================
  // CONTEXT ANALYSIS
  // ===========================================================================

  private gatherContextFactors(
    context: RoutingContext,
    intent: ClassifiedIntent
  ): string[] {
    const factors: string[] = [];

    // Vertical context
    factors.push(`vertical:${context.vertical}`);

    // Tenant context
    factors.push(`tenant:${context.tenantId}`);

    // Intent confidence
    if (intent.confidence >= 0.8) {
      factors.push('high_confidence_intent');
    } else if (intent.confidence >= 0.5) {
      factors.push('medium_confidence_intent');
    } else {
      factors.push('low_confidence_intent');
    }

    // Conversation history
    if (context.previousPersona) {
      factors.push(`previous_persona:${context.previousPersona}`);
    }

    // Session context
    if (context.sessionId) {
      const history = this.routingHistory.get(context.sessionId);
      if (history && history.length > 0) {
        factors.push(`session_depth:${history.length}`);
      }
    }

    // Time context
    const hour = new Date().getHours();
    if (hour < 9 || hour >= 18) {
      factors.push('outside_business_hours');
    }

    return factors;
  }

  // ===========================================================================
  // REASONING GENERATION
  // ===========================================================================

  private generateReasoning(
    persona: PersonaId,
    intent: ClassifiedIntent,
    factors: string[]
  ): string {
    const config = this.configs.get(persona);
    if (!config) return `Selected ${persona} as default fallback`;

    const parts: string[] = [];

    // Intent reasoning
    parts.push(`Intent "${intent.intent}" matched with ${(intent.confidence * 100).toFixed(0)}% confidence.`);

    // Persona reasoning
    parts.push(`${config.name} selected for ${config.funnel} operations.`);

    // Factor reasoning
    if (factors.includes('high_confidence_intent')) {
      parts.push('High confidence routing based on clear intent match.');
    }

    if (factors.some((f) => f.startsWith('previous_persona:'))) {
      parts.push('Conversation continuity considered in routing decision.');
    }

    return parts.join(' ');
  }

  // ===========================================================================
  // PROOF LEDGER
  // ===========================================================================

  private async logToProofLedger(
    decision: RoutingDecision,
    query: string,
    context: RoutingContext
  ): Promise<string> {
    const entry: PersonaProofEntry = {
      id: this.generateProofId(),
      timestamp: decision.timestamp,
      personaId: decision.selectedPersona,
      action: 'persona_routing',
      input: {
        query: this.scrubPII(query),
        context: {
          tenantId: context.tenantId,
          vertical: context.vertical,
          sessionId: context.sessionId,
        },
      },
      output: {
        selectedPersona: decision.selectedPersona,
        confidence: decision.confidence,
        fallbackPersona: decision.fallbackPersona,
      },
      tenantId: context.tenantId,
      sessionId: context.sessionId || 'unknown',
      hash: '',
      previousHash: this.getLastProofHash(),
    };

    // Compute hash
    entry.hash = this.computeProofHash(entry);

    // Store in ledger
    this.proofLedger.push(entry);

    return entry.hash;
  }

  private generateProofId(): string {
    return `proof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getLastProofHash(): string | undefined {
    if (this.proofLedger.length === 0) return undefined;
    return this.proofLedger[this.proofLedger.length - 1].hash;
  }

  private computeProofHash(entry: Omit<PersonaProofEntry, 'hash'>): string {
    const content = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      personaId: entry.personaId,
      action: entry.action,
      previousHash: entry.previousHash,
    });
    return createHash('sha256').update(content).digest('hex');
  }

  private scrubPII(text: string): string {
    // Basic PII scrubbing - replace phone numbers and emails
    return text
      .replace(/\b\d{10,12}\b/g, '[PHONE]')
      .replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[EMAIL]')
      .replace(/\b\d{12}\b/g, '[NRIC]');
  }

  // ===========================================================================
  // ROUTING HISTORY
  // ===========================================================================

  private storeRoutingHistory(
    sessionId: string | undefined,
    decision: RoutingDecision
  ): void {
    if (!sessionId) return;

    if (!this.routingHistory.has(sessionId)) {
      this.routingHistory.set(sessionId, []);
    }

    const history = this.routingHistory.get(sessionId)!;
    history.push(decision);

    // Keep only last 20 decisions per session
    if (history.length > 20) {
      history.shift();
    }
  }

  // ===========================================================================
  // PUBLIC UTILITIES
  // ===========================================================================

  /**
   * Get persona configuration by ID
   */
  getPersonaConfig(personaId: PersonaId): PersonaConfig | undefined {
    return this.configs.get(personaId);
  }

  /**
   * Get all persona configurations
   */
  getAllPersonaConfigs(): PersonaConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Get persona by funnel stage
   */
  getPersonasByFunnel(
    funnel: 'TOFU' | 'MOFU' | 'BOFU' | 'cross-funnel'
  ): PersonaConfig[] {
    return this.getAllPersonaConfigs().filter((config) => {
      if (Array.isArray(config.funnel)) {
        return config.funnel.includes(funnel);
      }
      return config.funnel === funnel;
    });
  }

  /**
   * Get proof ledger entries
   */
  getProofLedger(): PersonaProofEntry[] {
    return [...this.proofLedger];
  }

  /**
   * Get routing history for a session
   */
  getRoutingHistory(sessionId: string): RoutingDecision[] {
    return this.routingHistory.get(sessionId) || [];
  }

  /**
   * Clear session routing history
   */
  clearSessionHistory(sessionId: string): void {
    this.routingHistory.delete(sessionId);
  }

  /**
   * Validate persona transition (for governance)
   */
  validateTransition(
    from: PersonaId,
    to: PersonaId,
    context: RoutingContext
  ): { allowed: boolean; reason: string } {
    // Define restricted transitions
    const restrictedTransitions: Array<[PersonaId, PersonaId]> = [
      ['closer', 'broadcaster'], // Don't broadcast during active sales
    ];

    for (const [fromRestricted, toRestricted] of restrictedTransitions) {
      if (from === fromRestricted && to === toRestricted) {
        return {
          allowed: false,
          reason: `Transition from ${from} to ${to} is restricted during active engagement`,
        };
      }
    }

    return { allowed: true, reason: 'Transition allowed' };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let routerInstance: PersonaRouter | null = null;

export function getPersonaRouter(): PersonaRouter {
  if (!routerInstance) {
    routerInstance = new PersonaRouter();
  }
  return routerInstance;
}

export function resetPersonaRouter(): void {
  routerInstance = null;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default PersonaRouter;
