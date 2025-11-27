/**
 * IntentClassifier - Qontrek OS Layer 5
 * Maps user queries to appropriate personas using pattern matching and NLP
 */

import type {
  PersonaId,
  ClassifiedIntent,
  IntentPattern,
  RoutingContext,
  VerticalType,
} from '@/types/persona';

// =============================================================================
// INTENT PATTERNS
// =============================================================================

const INTENT_PATTERNS: IntentPattern[] = [
  // =========================================================================
  // CLOSER AGENT PATTERNS (Highest Priority)
  // =========================================================================
  {
    pattern: /\b(hot|warm|critical)\s*(leads?|prospects?)\b/i,
    intent: 'check_leads',
    persona: 'closer',
    weight: 1.0,
  },
  {
    pattern: /\b(follow\s*up|callback|call\s*back)\b/i,
    intent: 'follow_up_lead',
    persona: 'closer',
    weight: 0.95,
  },
  {
    pattern: /\b(close|closing|convert|conversion)\s*(deal|sale|lead)?\b/i,
    intent: 'close_deal',
    persona: 'closer',
    weight: 0.95,
  },
  {
    pattern: /\b(send|generate)\s*(proposal|quote|quotation)\b/i,
    intent: 'send_proposal',
    persona: 'closer',
    weight: 0.95,
  },
  {
    pattern: /\b(make|initiate|start)\s*(call|phone)\b/i,
    intent: 'make_call',
    persona: 'closer',
    weight: 0.9,
  },
  {
    pattern: /\b(whatsapp|wa)\s*(send|message)\b/i,
    intent: 'send_whatsapp',
    persona: 'closer',
    weight: 0.9,
  },
  {
    pattern: /\b(urgent|priority)\s*(lead|follow|action)\b/i,
    intent: 'check_leads',
    persona: 'closer',
    weight: 0.85,
  },
  {
    pattern: /\b(pipeline|sales\s*funnel)\s*(status|health)?\b/i,
    intent: 'check_leads',
    persona: 'closer',
    weight: 0.8,
  },
  {
    pattern: /\bobjection\b/i,
    intent: 'handle_objection',
    persona: 'closer',
    weight: 0.85,
  },

  // =========================================================================
  // STRATEGIST AGENT PATTERNS
  // =========================================================================
  {
    pattern: /\b(kpi|metrics?|analytics?)\b/i,
    intent: 'get_kpis',
    persona: 'strategist',
    weight: 0.95,
  },
  {
    pattern: /\b(funnel)\s*(analysis|performance|conversion)?\b/i,
    intent: 'check_funnel',
    persona: 'strategist',
    weight: 0.9,
  },
  {
    pattern: /\b(performance|conversion)\s*(report|analysis)?\b/i,
    intent: 'analyze_performance',
    persona: 'strategist',
    weight: 0.9,
  },
  {
    pattern: /\b(a\/?b\s*test|experiment)\b/i,
    intent: 'check_ab_test',
    persona: 'strategist',
    weight: 0.95,
  },
  {
    pattern: /\b(forecast|predict|projection)\b/i,
    intent: 'forecast_results',
    persona: 'strategist',
    weight: 0.9,
  },
  {
    pattern: /\b(insight|trend|pattern)\b/i,
    intent: 'get_insights',
    persona: 'strategist',
    weight: 0.85,
  },
  {
    pattern: /\b(gate|g\d+)\s*(status|health|metrics?)?\b/i,
    intent: 'get_kpis',
    persona: 'strategist',
    weight: 0.85,
  },
  {
    pattern: /\bcompare\s*(week|month|period|performance)\b/i,
    intent: 'compare_metrics',
    persona: 'strategist',
    weight: 0.85,
  },

  // =========================================================================
  // RESEARCH AGENT PATTERNS
  // =========================================================================
  {
    pattern: /\b(market|industry)\s*(research|analysis|study)\b/i,
    intent: 'research_market',
    persona: 'research',
    weight: 0.95,
  },
  {
    pattern: /\b(competitor|competition)\s*(analysis|research)?\b/i,
    intent: 'analyze_competitors',
    persona: 'research',
    weight: 0.95,
  },
  {
    pattern: /\b(audience|customer|segment)\s*(insight|profile|analysis)\b/i,
    intent: 'understand_audience',
    persona: 'research',
    weight: 0.9,
  },
  {
    pattern: /\b(trend|emerging|growing)\s*(market|industry)?\b/i,
    intent: 'find_trends',
    persona: 'research',
    weight: 0.85,
  },
  {
    pattern: /\bdemographics?\b/i,
    intent: 'understand_audience',
    persona: 'research',
    weight: 0.8,
  },
  {
    pattern: /\b(investigate|study|examine)\b/i,
    intent: 'research_market',
    persona: 'research',
    weight: 0.7,
  },

  // =========================================================================
  // CONTENT AGENT PATTERNS
  // =========================================================================
  {
    pattern: /\b(create|write|generate)\s*(content|post|article|blog)\b/i,
    intent: 'create_content',
    persona: 'content',
    weight: 0.95,
  },
  {
    pattern: /\b(social\s*media|social)\s*(post|content)?\b/i,
    intent: 'create_content',
    persona: 'content',
    weight: 0.9,
  },
  {
    pattern: /\b(schedule|publish)\s*(post|content)\b/i,
    intent: 'schedule_post',
    persona: 'content',
    weight: 0.9,
  },
  {
    pattern: /\bseo\s*(optimi[sz]e|content|keyword)?\b/i,
    intent: 'optimize_seo',
    persona: 'content',
    weight: 0.9,
  },
  {
    pattern: /\b(caption|hashtag|copy)\b/i,
    intent: 'create_content',
    persona: 'content',
    weight: 0.85,
  },
  {
    pattern: /\b(repurpose|adapt|transform)\s*content\b/i,
    intent: 'repurpose_content',
    persona: 'content',
    weight: 0.9,
  },
  {
    pattern: /\bengagement\s*(rate|tips|strategy)\b/i,
    intent: 'improve_engagement',
    persona: 'content',
    weight: 0.8,
  },

  // =========================================================================
  // ADVISOR AGENT PATTERNS
  // =========================================================================
  {
    pattern: /\b(recommend|suggest|advise)\b/i,
    intent: 'get_recommendation',
    persona: 'advisor',
    weight: 0.85,
  },
  {
    pattern: /\b(consult|consultation|appointment)\s*(book|schedule)?\b/i,
    intent: 'book_consultation',
    persona: 'advisor',
    weight: 0.9,
  },
  {
    pattern: /\b(faq|question|explain|what\s*is|how\s*does)\b/i,
    intent: 'ask_question',
    persona: 'advisor',
    weight: 0.75,
  },
  {
    pattern: /\b(compare|difference|versus|vs)\b/i,
    intent: 'compare_options',
    persona: 'advisor',
    weight: 0.8,
  },
  {
    pattern: /\b(roi|return|payback|savings?)\s*(calculat|estimat)?\b/i,
    intent: 'calculate_roi',
    persona: 'advisor',
    weight: 0.85,
  },
  {
    pattern: /\bwhich\s*(one|option|package|plan)\b/i,
    intent: 'get_recommendation',
    persona: 'advisor',
    weight: 0.8,
  },
  {
    pattern: /\bshould\s*i\b/i,
    intent: 'get_recommendation',
    persona: 'advisor',
    weight: 0.75,
  },

  // =========================================================================
  // BROADCASTER AGENT PATTERNS
  // =========================================================================
  {
    pattern: /\b(email|e-mail)\s*(send|blast|campaign)?\b/i,
    intent: 'send_email',
    persona: 'broadcaster',
    weight: 0.9,
  },
  {
    pattern: /\b(sms|text)\s*(send|blast)?\b/i,
    intent: 'send_sms',
    persona: 'broadcaster',
    weight: 0.9,
  },
  {
    pattern: /\b(broadcast|blast|mass\s*message)\b/i,
    intent: 'broadcast_message',
    persona: 'broadcaster',
    weight: 0.95,
  },
  {
    pattern: /\b(campaign)\s*(create|launch|start)?\b/i,
    intent: 'create_campaign',
    persona: 'broadcaster',
    weight: 0.9,
  },
  {
    pattern: /\b(newsletter|announcement)\b/i,
    intent: 'send_email',
    persona: 'broadcaster',
    weight: 0.85,
  },
  {
    pattern: /\b(audience|segment)\s*(create|filter|target)\b/i,
    intent: 'segment_audience',
    persona: 'broadcaster',
    weight: 0.85,
  },

  // =========================================================================
  // ADMIN AGENT PATTERNS (Lowest Priority - Fallback)
  // =========================================================================
  {
    pattern: /\b(status|health)\s*(check|report)?\b/i,
    intent: 'check_status',
    persona: 'admin',
    weight: 0.7,
  },
  {
    pattern: /\b(daily|weekly)\s*(report|summary)\b/i,
    intent: 'get_report',
    persona: 'admin',
    weight: 0.85,
  },
  {
    pattern: /\b(task|todo|to-do)\s*(list|status|check)?\b/i,
    intent: 'view_tasks',
    persona: 'admin',
    weight: 0.8,
  },
  {
    pattern: /\b(alert|notification|warning)\b/i,
    intent: 'manage_alerts',
    persona: 'admin',
    weight: 0.8,
  },
  {
    pattern: /\b(workflow|automation)\s*(run|trigger|start)?\b/i,
    intent: 'run_workflow',
    persona: 'admin',
    weight: 0.8,
  },
  {
    pattern: /\b(system|server)\s*(health|status)?\b/i,
    intent: 'check_health',
    persona: 'admin',
    weight: 0.75,
  },
  {
    pattern: /\b(schedule|calendar|upcoming)\b/i,
    intent: 'view_schedule',
    persona: 'admin',
    weight: 0.7,
  },
  {
    pattern: /\b(today|show\s*me|what)\b/i,
    intent: 'general_query',
    persona: 'admin',
    weight: 0.5,
  },
];

// =============================================================================
// KEYWORD SCORES
// =============================================================================

const PERSONA_KEYWORDS: Record<PersonaId, { keywords: string[]; weight: number }> = {
  closer: {
    keywords: [
      'close', 'lead', 'prospect', 'call', 'whatsapp', 'proposal',
      'quote', 'quotation', 'urgent', 'hot', 'warm', 'follow', 'callback',
      'convert', 'deal', 'sale', 'pipeline', 'objection',
    ],
    weight: 0.15,
  },
  strategist: {
    keywords: [
      'analytics', 'metrics', 'kpi', 'performance', 'funnel', 'conversion',
      'report', 'insight', 'trend', 'forecast', 'gate', 'benchmark',
      'compare', 'analysis', 'optimize',
    ],
    weight: 0.15,
  },
  research: {
    keywords: [
      'research', 'market', 'competitor', 'audience', 'segment', 'trend',
      'demographics', 'study', 'investigate', 'analyze', 'industry',
      'benchmark', 'survey',
    ],
    weight: 0.15,
  },
  content: {
    keywords: [
      'content', 'post', 'article', 'blog', 'social', 'caption', 'hashtag',
      'create', 'write', 'seo', 'publish', 'schedule', 'engagement',
      'creative', 'viral', 'copy',
    ],
    weight: 0.15,
  },
  advisor: {
    keywords: [
      'help', 'explain', 'recommend', 'suggest', 'consult', 'advice',
      'compare', 'difference', 'which', 'should', 'faq', 'question',
      'roi', 'best', 'option',
    ],
    weight: 0.12,
  },
  broadcaster: {
    keywords: [
      'email', 'sms', 'broadcast', 'blast', 'campaign', 'send',
      'newsletter', 'announce', 'notify', 'distribute', 'reach',
      'audience', 'segment',
    ],
    weight: 0.15,
  },
  admin: {
    keywords: [
      'status', 'health', 'task', 'report', 'daily', 'summary',
      'alert', 'workflow', 'schedule', 'check', 'system', 'today',
    ],
    weight: 0.1,
  },
};

// =============================================================================
// INTENT CLASSIFIER CLASS
// =============================================================================

export class IntentClassifier {
  private patterns: IntentPattern[];
  private keywordScores: Record<PersonaId, { keywords: string[]; weight: number }>;

  constructor(
    patterns?: IntentPattern[],
    keywordScores?: Record<PersonaId, { keywords: string[]; weight: number }>
  ) {
    this.patterns = patterns || INTENT_PATTERNS;
    this.keywordScores = keywordScores || PERSONA_KEYWORDS;
  }

  // ===========================================================================
  // MAIN CLASSIFICATION METHOD
  // ===========================================================================

  /**
   * Classify a query to determine intent and best matching persona
   */
  async classify(
    query: string,
    context?: RoutingContext
  ): Promise<ClassifiedIntent> {
    const normalizedQuery = this.normalizeQuery(query);

    // Step 1: Pattern matching
    const patternMatches = this.matchPatterns(normalizedQuery);

    // Step 2: Keyword scoring
    const keywordScores = this.scoreKeywords(normalizedQuery);

    // Step 3: Combine scores
    const combinedScores = this.combineScores(patternMatches, keywordScores);

    // Step 4: Apply context adjustments
    const contextAdjustedScores = context
      ? this.applyContextAdjustments(combinedScores, context)
      : combinedScores;

    // Step 5: Select best match
    const [bestMatch, alternatives] = this.selectBestMatch(contextAdjustedScores);

    return {
      intent: bestMatch.intent,
      confidence: bestMatch.confidence,
      persona: bestMatch.persona,
      reasoning: this.generateReasoning(bestMatch, query),
      alternativePersonas: alternatives,
    };
  }

  // ===========================================================================
  // QUERY NORMALIZATION
  // ===========================================================================

  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  // ===========================================================================
  // PATTERN MATCHING
  // ===========================================================================

  private matchPatterns(
    query: string
  ): Array<{ pattern: IntentPattern; score: number }> {
    const matches: Array<{ pattern: IntentPattern; score: number }> = [];

    for (const pattern of this.patterns) {
      const regex =
        typeof pattern.pattern === 'string'
          ? new RegExp(pattern.pattern, 'i')
          : pattern.pattern;

      if (regex.test(query)) {
        matches.push({
          pattern,
          score: pattern.weight,
        });
      }
    }

    return matches;
  }

  // ===========================================================================
  // KEYWORD SCORING
  // ===========================================================================

  private scoreKeywords(query: string): Map<PersonaId, number> {
    const scores = new Map<PersonaId, number>();
    const words = query.split(' ');

    for (const [persona, config] of Object.entries(this.keywordScores)) {
      let matchCount = 0;

      for (const word of words) {
        if (config.keywords.some((kw) => word.includes(kw) || kw.includes(word))) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const score = Math.min(matchCount * config.weight, 0.5);
        scores.set(persona as PersonaId, score);
      }
    }

    return scores;
  }

  // ===========================================================================
  // SCORE COMBINATION
  // ===========================================================================

  private combineScores(
    patternMatches: Array<{ pattern: IntentPattern; score: number }>,
    keywordScores: Map<PersonaId, number>
  ): Map<PersonaId, { score: number; intent: string }> {
    const combined = new Map<PersonaId, { score: number; intent: string }>();

    // Initialize all personas with base scores
    const allPersonas: PersonaId[] = [
      'closer', 'strategist', 'research', 'content',
      'advisor', 'broadcaster', 'admin',
    ];

    for (const persona of allPersonas) {
      combined.set(persona, { score: 0, intent: 'general_query' });
    }

    // Add pattern match scores
    for (const match of patternMatches) {
      const current = combined.get(match.pattern.persona)!;
      if (match.score > current.score) {
        combined.set(match.pattern.persona, {
          score: match.score,
          intent: match.pattern.intent,
        });
      }
    }

    // Add keyword scores
    for (const [persona, keywordScore] of keywordScores) {
      const current = combined.get(persona)!;
      combined.set(persona, {
        score: Math.min(current.score + keywordScore, 1.0),
        intent: current.intent,
      });
    }

    return combined;
  }

  // ===========================================================================
  // CONTEXT ADJUSTMENTS
  // ===========================================================================

  private applyContextAdjustments(
    scores: Map<PersonaId, { score: number; intent: string }>,
    context: RoutingContext
  ): Map<PersonaId, { score: number; intent: string }> {
    const adjusted = new Map(scores);

    // Vertical-based adjustments
    const verticalBoosts: Record<VerticalType, PersonaId[]> = {
      solar: ['closer', 'advisor'],
      ev: ['closer', 'advisor'],
      clinic: ['advisor', 'broadcaster'],
      retail: ['content', 'broadcaster'],
      services: ['advisor', 'closer'],
      default: [],
    };

    const boostPersonas = verticalBoosts[context.vertical] || [];
    for (const persona of boostPersonas) {
      const current = adjusted.get(persona);
      if (current) {
        adjusted.set(persona, {
          ...current,
          score: Math.min(current.score + 0.1, 1.0),
        });
      }
    }

    // Previous persona continuity boost
    if (context.previousPersona) {
      const current = adjusted.get(context.previousPersona);
      if (current && current.score > 0.3) {
        adjusted.set(context.previousPersona, {
          ...current,
          score: Math.min(current.score + 0.05, 1.0),
        });
      }
    }

    return adjusted;
  }

  // ===========================================================================
  // BEST MATCH SELECTION
  // ===========================================================================

  private selectBestMatch(
    scores: Map<PersonaId, { score: number; intent: string }>
  ): [
    { persona: PersonaId; confidence: number; intent: string },
    Array<{ persona: PersonaId; confidence: number }>
  ] {
    // Convert to sorted array
    const sortedScores = Array.from(scores.entries())
      .map(([persona, data]) => ({
        persona,
        confidence: data.score,
        intent: data.intent,
      }))
      .sort((a, b) => b.confidence - a.confidence);

    // Best match
    const best = sortedScores[0] || {
      persona: 'admin' as PersonaId,
      confidence: 0.5,
      intent: 'general_query',
    };

    // Alternatives (top 3 excluding best)
    const alternatives = sortedScores
      .slice(1, 4)
      .filter((s) => s.confidence > 0.2)
      .map((s) => ({
        persona: s.persona,
        confidence: s.confidence,
      }));

    return [best, alternatives];
  }

  // ===========================================================================
  // REASONING GENERATION
  // ===========================================================================

  private generateReasoning(
    match: { persona: PersonaId; confidence: number; intent: string },
    originalQuery: string
  ): string {
    const parts: string[] = [];

    parts.push(`Query analyzed: "${originalQuery.substring(0, 50)}${originalQuery.length > 50 ? '...' : ''}"`);
    parts.push(`Detected intent: ${match.intent}`);
    parts.push(`Matched persona: ${match.persona} with ${(match.confidence * 100).toFixed(0)}% confidence`);

    return parts.join('. ');
  }

  // ===========================================================================
  // PUBLIC UTILITIES
  // ===========================================================================

  /**
   * Get all registered intent patterns
   */
  getPatterns(): IntentPattern[] {
    return [...this.patterns];
  }

  /**
   * Add a custom intent pattern
   */
  addPattern(pattern: IntentPattern): void {
    this.patterns.push(pattern);
  }

  /**
   * Get patterns for a specific persona
   */
  getPatternsForPersona(persona: PersonaId): IntentPattern[] {
    return this.patterns.filter((p) => p.persona === persona);
  }

  /**
   * Test a query against patterns without full classification
   */
  testQuery(query: string): Array<{ intent: string; persona: PersonaId; weight: number }> {
    const normalized = this.normalizeQuery(query);
    const matches = this.matchPatterns(normalized);
    return matches.map((m) => ({
      intent: m.pattern.intent,
      persona: m.pattern.persona,
      weight: m.score,
    }));
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let classifierInstance: IntentClassifier | null = null;

export function getIntentClassifier(): IntentClassifier {
  if (!classifierInstance) {
    classifierInstance = new IntentClassifier();
  }
  return classifierInstance;
}

export function resetIntentClassifier(): void {
  classifierInstance = null;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { INTENT_PATTERNS, PERSONA_KEYWORDS };
export default IntentClassifier;
