/**
 * Persona Configurations - Qontrek OS Layer 5
 * Runtime configuration objects for all 7 AI personas
 */

import type {
  PersonaId,
  PersonaConfig,
  FunnelStage,
  ToneStyle,
} from '@/types/persona';
import {
  PERSONA_TOOLS,
  PERSONA_WIDGETS,
  PERSONA_SKILLS,
} from './mappings';

// =============================================================================
// PERSONA CONFIGURATIONS
// =============================================================================

export const PERSONA_CONFIGS: Record<PersonaId, PersonaConfig> = {
  // ===========================================================================
  // RESEARCH AGENT - Audience Scout
  // ===========================================================================
  research: {
    id: 'research',
    name: 'Research Agent',
    codename: 'Audience Scout',
    description:
      'The Research Agent is the intelligence gatherer of the Qontrek ecosystem. It specializes in market research, competitor analysis, and audience insights.',
    funnel: 'TOFU' as FunnelStage,
    tones: ['analytical', 'curious'] as ToneStyle[],
    tools: PERSONA_TOOLS.research,
    widgets: PERSONA_WIDGETS.research,
    skills: PERSONA_SKILLS.research,
    kpis: [
      {
        id: 'data_quality_score',
        name: 'Data Quality Score',
        description: 'Accuracy and reliability of gathered data',
        targetValue: 0.85,
        unit: 'score',
      },
      {
        id: 'insights_generated',
        name: 'Insights Generated',
        description: 'Number of actionable insights produced weekly',
        targetValue: 10,
        unit: 'count',
      },
      {
        id: 'research_turnaround',
        name: 'Research Turnaround Time',
        description: 'Average time to complete research requests',
        targetValue: 24,
        unit: 'hours',
      },
    ],
    intents: [
      'research_market',
      'analyze_competitors',
      'understand_audience',
      'find_trends',
      'gather_data',
    ],
    keywords: [
      'research',
      'analyze',
      'market',
      'competitor',
      'audience',
      'trends',
      'data',
      'insights',
      'demographics',
    ],
    priority: 3,
    governance: {
      requiresApproval: false,
      maxActionsPerHour: 50,
      auditLevel: 'standard',
      sensitiveDataAccess: false,
      proofRequired: true,
    },
  },

  // ===========================================================================
  // CONTENT AGENT - Content Amplifier
  // ===========================================================================
  content: {
    id: 'content',
    name: 'Content Agent',
    codename: 'Content Amplifier',
    description:
      'The Content Agent is the creative engine of Qontrek. It generates engaging content across multiple formats and channels.',
    funnel: ['TOFU', 'MOFU'] as FunnelStage[],
    tones: ['creative', 'engaging'] as ToneStyle[],
    tools: PERSONA_TOOLS.content,
    widgets: PERSONA_WIDGETS.content,
    skills: PERSONA_SKILLS.content,
    kpis: [
      {
        id: 'engagement_rate',
        name: 'Engagement Rate',
        description: 'Average engagement across content',
        targetValue: 0.05,
        unit: 'rate',
      },
      {
        id: 'content_velocity',
        name: 'Content Velocity',
        description: 'Number of content pieces produced weekly',
        targetValue: 20,
        unit: 'pieces',
      },
      {
        id: 'click_through_rate',
        name: 'Click-Through Rate',
        description: 'Rate of clicks on content CTAs',
        targetValue: 0.03,
        unit: 'rate',
      },
    ],
    intents: [
      'create_content',
      'schedule_post',
      'optimize_seo',
      'repurpose_content',
      'improve_engagement',
    ],
    keywords: [
      'content',
      'post',
      'article',
      'blog',
      'social',
      'write',
      'create',
      'schedule',
      'seo',
      'hashtag',
    ],
    priority: 4,
    governance: {
      requiresApproval: false,
      maxActionsPerHour: 100,
      auditLevel: 'standard',
      sensitiveDataAccess: false,
      proofRequired: true,
    },
  },

  // ===========================================================================
  // CLOSER AGENT - Voice Closer (PRIMARY FOR VOLTEK)
  // ===========================================================================
  closer: {
    id: 'closer',
    name: 'Closer Agent',
    codename: 'Voice Closer',
    description:
      'The Closer Agent is the revenue-generating powerhouse of Qontrek. It handles bottom-of-funnel activities using the Pain-Benefit-Urgency framework.',
    funnel: 'BOFU' as FunnelStage,
    tones: ['urgent', 'empathetic'] as ToneStyle[],
    framework: 'Pain-Benefit-Urgency',
    tools: PERSONA_TOOLS.closer,
    widgets: PERSONA_WIDGETS.closer,
    skills: PERSONA_SKILLS.closer,
    kpis: [
      {
        id: 'callbacks',
        name: 'Callbacks Achieved',
        description: 'Number of successful callback completions daily',
        targetValue: 25,
        unit: 'count',
      },
      {
        id: 'quote_requests',
        name: 'Quote Requests',
        description: 'Number of quote/proposal requests generated daily',
        targetValue: 15,
        unit: 'count',
      },
      {
        id: 'close_rate',
        name: 'Close Rate',
        description: 'Percentage of qualified leads closed',
        targetValue: 0.25,
        unit: 'rate',
      },
      {
        id: 'response_time',
        name: 'Response Time',
        description: 'Average time to first contact in minutes',
        targetValue: 15,
        unit: 'minutes',
      },
    ],
    intents: [
      'close_deal',
      'follow_up_lead',
      'send_proposal',
      'make_call',
      'handle_objection',
      'check_leads',
    ],
    keywords: [
      'close',
      'lead',
      'prospect',
      'call',
      'whatsapp',
      'proposal',
      'quote',
      'urgent',
      'hot',
      'follow up',
      'pipeline',
    ],
    priority: 1, // Highest priority
    governance: {
      requiresApproval: false,
      maxActionsPerHour: 200,
      auditLevel: 'detailed',
      sensitiveDataAccess: true,
      proofRequired: true,
    },
    verticalOverrides: {
      solar: {
        id: 'closer',
        name: 'Closer Agent',
        codename: 'Voice Closer',
        description: 'Primary sales closer for Voltek Solar operations',
        funnel: 'BOFU',
        tones: ['urgent', 'empathetic'],
        tools: PERSONA_TOOLS.closer,
        widgets: PERSONA_WIDGETS.closer,
        skills: PERSONA_SKILLS.closer,
        kpis: [],
        intents: [],
        keywords: [
          'nem',
          'solar',
          'installation',
          'kwp',
          'inverter',
          'panel',
        ],
        priority: 1,
        governance: {
          requiresApproval: false,
          maxActionsPerHour: 200,
          auditLevel: 'detailed',
          sensitiveDataAccess: true,
          proofRequired: true,
        },
      },
      ev: {
        id: 'closer',
        name: 'Closer Agent',
        codename: 'Voice Closer',
        description: 'EV sales closer',
        funnel: 'BOFU',
        tones: ['urgent', 'empathetic'],
        tools: PERSONA_TOOLS.closer,
        widgets: PERSONA_WIDGETS.closer,
        skills: PERSONA_SKILLS.closer,
        kpis: [],
        intents: [],
        keywords: ['ev', 'charger', 'electric', 'vehicle'],
        priority: 1,
        governance: {
          requiresApproval: false,
          maxActionsPerHour: 200,
          auditLevel: 'detailed',
          sensitiveDataAccess: true,
          proofRequired: true,
        },
      },
      clinic: {
        id: 'closer',
        name: 'Closer Agent',
        codename: 'Voice Closer',
        description: 'Clinic sales closer',
        funnel: 'BOFU',
        tones: ['urgent', 'empathetic'],
        tools: PERSONA_TOOLS.closer,
        widgets: PERSONA_WIDGETS.closer,
        skills: PERSONA_SKILLS.closer,
        kpis: [],
        intents: [],
        keywords: ['appointment', 'treatment', 'booking'],
        priority: 1,
        governance: {
          requiresApproval: false,
          maxActionsPerHour: 200,
          auditLevel: 'detailed',
          sensitiveDataAccess: true,
          proofRequired: true,
        },
      },
      retail: {
        id: 'closer',
        name: 'Closer Agent',
        codename: 'Voice Closer',
        description: 'Retail sales closer',
        funnel: 'BOFU',
        tones: ['urgent', 'empathetic'],
        tools: PERSONA_TOOLS.closer,
        widgets: PERSONA_WIDGETS.closer,
        skills: PERSONA_SKILLS.closer,
        kpis: [],
        intents: [],
        keywords: ['purchase', 'order', 'buy'],
        priority: 1,
        governance: {
          requiresApproval: false,
          maxActionsPerHour: 200,
          auditLevel: 'detailed',
          sensitiveDataAccess: true,
          proofRequired: true,
        },
      },
      services: {
        id: 'closer',
        name: 'Closer Agent',
        codename: 'Voice Closer',
        description: 'Services sales closer',
        funnel: 'BOFU',
        tones: ['urgent', 'empathetic'],
        tools: PERSONA_TOOLS.closer,
        widgets: PERSONA_WIDGETS.closer,
        skills: PERSONA_SKILLS.closer,
        kpis: [],
        intents: [],
        keywords: ['service', 'contract', 'agreement'],
        priority: 1,
        governance: {
          requiresApproval: false,
          maxActionsPerHour: 200,
          auditLevel: 'detailed',
          sensitiveDataAccess: true,
          proofRequired: true,
        },
      },
      default: {
        id: 'closer',
        name: 'Closer Agent',
        codename: 'Voice Closer',
        description: 'Default sales closer',
        funnel: 'BOFU',
        tones: ['urgent', 'empathetic'],
        tools: PERSONA_TOOLS.closer,
        widgets: PERSONA_WIDGETS.closer,
        skills: PERSONA_SKILLS.closer,
        kpis: [],
        intents: [],
        keywords: [],
        priority: 1,
        governance: {
          requiresApproval: false,
          maxActionsPerHour: 200,
          auditLevel: 'detailed',
          sensitiveDataAccess: true,
          proofRequired: true,
        },
      },
    },
  },

  // ===========================================================================
  // ADVISOR AGENT - AI Persona
  // ===========================================================================
  advisor: {
    id: 'advisor',
    name: 'Advisor Agent',
    codename: 'AI Persona',
    description:
      'The Advisor Agent serves as the trusted consultant. It provides personalized recommendations and guides prospects through decision-making.',
    funnel: 'MOFU' as FunnelStage,
    tones: ['consultative', 'trustworthy'] as ToneStyle[],
    tools: PERSONA_TOOLS.advisor,
    widgets: PERSONA_WIDGETS.advisor,
    skills: PERSONA_SKILLS.advisor,
    kpis: [
      {
        id: 'consultation_bookings',
        name: 'Consultation Bookings',
        description: 'Number of consultations booked daily',
        targetValue: 10,
        unit: 'count',
      },
      {
        id: 'satisfaction_score',
        name: 'Satisfaction Score',
        description: 'Average CSAT from advisor interactions',
        targetValue: 4.5,
        unit: 'rating',
      },
      {
        id: 'questions_resolved',
        name: 'Questions Resolved',
        description: 'Percentage of questions answered without escalation',
        targetValue: 0.85,
        unit: 'rate',
      },
    ],
    intents: [
      'ask_question',
      'get_recommendation',
      'book_consultation',
      'compare_options',
      'calculate_roi',
    ],
    keywords: [
      'help',
      'explain',
      'recommend',
      'suggest',
      'consult',
      'compare',
      'which',
      'should',
      'faq',
      'question',
    ],
    priority: 5,
    governance: {
      requiresApproval: false,
      maxActionsPerHour: 150,
      auditLevel: 'standard',
      sensitiveDataAccess: false,
      proofRequired: true,
    },
  },

  // ===========================================================================
  // BROADCASTER AGENT - Omnichannel Distributor
  // ===========================================================================
  broadcaster: {
    id: 'broadcaster',
    name: 'Broadcaster Agent',
    codename: 'Omnichannel Distributor',
    description:
      'The Broadcaster Agent manages multi-channel communication. It ensures consistent messaging across email, SMS, social media, and WhatsApp.',
    funnel: 'cross-funnel' as FunnelStage,
    tones: ['informative', 'consistent'] as ToneStyle[],
    tools: PERSONA_TOOLS.broadcaster,
    widgets: PERSONA_WIDGETS.broadcaster,
    skills: PERSONA_SKILLS.broadcaster,
    kpis: [
      {
        id: 'reach',
        name: 'Total Reach',
        description: 'Total unique recipients across channels weekly',
        targetValue: 5000,
        unit: 'contacts',
      },
      {
        id: 'open_rate',
        name: 'Open Rate',
        description: 'Email/message open rate',
        targetValue: 0.25,
        unit: 'rate',
      },
      {
        id: 'click_rate',
        name: 'Click Rate',
        description: 'Click-through rate on messages',
        targetValue: 0.05,
        unit: 'rate',
      },
      {
        id: 'delivery_rate',
        name: 'Delivery Rate',
        description: 'Successful delivery percentage',
        targetValue: 0.98,
        unit: 'rate',
      },
    ],
    intents: [
      'send_email',
      'send_sms',
      'post_social',
      'broadcast_message',
      'create_campaign',
      'segment_audience',
    ],
    keywords: [
      'send',
      'broadcast',
      'email',
      'sms',
      'whatsapp',
      'social',
      'campaign',
      'blast',
      'newsletter',
      'announce',
    ],
    priority: 6,
    governance: {
      requiresApproval: true, // Broadcasts require approval
      maxActionsPerHour: 50,
      auditLevel: 'detailed',
      sensitiveDataAccess: true,
      proofRequired: true,
    },
  },

  // ===========================================================================
  // STRATEGIST AGENT - Funnel Optimizer (PRIMARY FOR ANALYTICS)
  // ===========================================================================
  strategist: {
    id: 'strategist',
    name: 'Strategist Agent',
    codename: 'Funnel Optimizer',
    description:
      'The Strategist Agent is the analytical brain of Qontrek. It monitors funnel performance and provides data-driven recommendations.',
    funnel: 'cross-funnel' as FunnelStage,
    tones: ['analytical', 'strategic'] as ToneStyle[],
    tools: PERSONA_TOOLS.strategist,
    widgets: PERSONA_WIDGETS.strategist,
    skills: PERSONA_SKILLS.strategist,
    kpis: [
      {
        id: 'conversion_lift',
        name: 'Conversion Lift',
        description: 'Improvement in conversion rate from optimizations',
        targetValue: 0.10,
        unit: 'percentage',
      },
      {
        id: 'funnel_efficiency',
        name: 'Funnel Efficiency',
        description: 'Overall funnel conversion rate',
        targetValue: 0.15,
        unit: 'rate',
      },
      {
        id: 'insights_actioned',
        name: 'Insights Actioned',
        description: 'Percentage of recommendations implemented',
        targetValue: 0.70,
        unit: 'rate',
      },
      {
        id: 'forecast_accuracy',
        name: 'Forecast Accuracy',
        description: 'Accuracy of predictions vs actuals',
        targetValue: 0.85,
        unit: 'rate',
      },
    ],
    intents: [
      'analyze_performance',
      'get_kpis',
      'check_funnel',
      'run_analysis',
      'get_insights',
      'forecast_results',
    ],
    keywords: [
      'analytics',
      'metrics',
      'kpi',
      'performance',
      'funnel',
      'conversion',
      'analysis',
      'report',
      'insights',
      'trends',
      'forecast',
    ],
    priority: 2,
    governance: {
      requiresApproval: false,
      maxActionsPerHour: 100,
      auditLevel: 'standard',
      sensitiveDataAccess: true,
      proofRequired: true,
    },
  },

  // ===========================================================================
  // ADMIN AGENT - Execution Tracker (DEFAULT FALLBACK)
  // ===========================================================================
  admin: {
    id: 'admin',
    name: 'Admin Agent',
    codename: 'Execution Tracker',
    description:
      'The Admin Agent is the operational backbone of Qontrek. It tracks execution, manages pipeline health, and serves as the default fallback.',
    funnel: 'cross-funnel' as FunnelStage,
    tones: ['operational', 'efficient'] as ToneStyle[],
    tools: PERSONA_TOOLS.admin,
    widgets: PERSONA_WIDGETS.admin,
    skills: PERSONA_SKILLS.admin,
    kpis: [
      {
        id: 'task_completion',
        name: 'Task Completion Rate',
        description: 'Percentage of tasks completed on time',
        targetValue: 0.90,
        unit: 'rate',
      },
      {
        id: 'pipeline_health',
        name: 'Pipeline Health Score',
        description: 'Overall pipeline health metric',
        targetValue: 0.95,
        unit: 'score',
      },
      {
        id: 'alert_resolution_time',
        name: 'Alert Resolution Time',
        description: 'Average time to resolve alerts in minutes',
        targetValue: 30,
        unit: 'minutes',
      },
      {
        id: 'uptime',
        name: 'System Uptime',
        description: 'System availability percentage',
        targetValue: 0.999,
        unit: 'rate',
      },
    ],
    intents: [
      'check_status',
      'get_report',
      'view_tasks',
      'manage_alerts',
      'run_workflow',
      'check_health',
      'general_query',
    ],
    keywords: [
      'status',
      'report',
      'task',
      'pipeline',
      'health',
      'alert',
      'workflow',
      'schedule',
      'today',
      'daily',
      'summary',
    ],
    priority: 10, // Lowest priority - serves as fallback
    governance: {
      requiresApproval: false,
      maxActionsPerHour: 300,
      auditLevel: 'standard',
      sensitiveDataAccess: true,
      proofRequired: true,
    },
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get persona config by ID
 */
export function getPersonaConfig(id: PersonaId): PersonaConfig | undefined {
  return PERSONA_CONFIGS[id];
}

/**
 * Get all persona configs
 */
export function getAllPersonaConfigs(): PersonaConfig[] {
  return Object.values(PERSONA_CONFIGS);
}

/**
 * Get personas by funnel stage
 */
export function getPersonasByFunnel(funnel: FunnelStage): PersonaConfig[] {
  return getAllPersonaConfigs().filter((config) => {
    if (Array.isArray(config.funnel)) {
      return config.funnel.includes(funnel);
    }
    return config.funnel === funnel;
  });
}

/**
 * Get personas sorted by priority
 */
export function getPersonasByPriority(): PersonaConfig[] {
  return getAllPersonaConfigs().sort((a, b) => a.priority - b.priority);
}

/**
 * Get default fallback persona
 */
export function getDefaultPersona(): PersonaConfig {
  return PERSONA_CONFIGS.admin;
}

/**
 * Get primary persona for a vertical
 */
export function getPrimaryPersonaForVertical(
  vertical: string
): PersonaConfig {
  const verticalPrimaries: Record<string, PersonaId> = {
    solar: 'closer',
    ev: 'closer',
    clinic: 'advisor',
    retail: 'content',
    services: 'advisor',
  };

  const primaryId = verticalPrimaries[vertical] || 'admin';
  return PERSONA_CONFIGS[primaryId];
}

// =============================================================================
// EXPORTS
// =============================================================================

export default PERSONA_CONFIGS;
