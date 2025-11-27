/**
 * Persona Mappings - Qontrek OS Layer 5
 * Maps personas to L2 tools, L3 widgets, and skills
 */

import type {
  PersonaId,
  PersonaMappings,
  ToolMapping,
  WidgetMapping,
  PersonaTool,
} from '@/types/persona';

// =============================================================================
// PERSONA → TOOLS MAPPING
// =============================================================================

export const PERSONA_TOOLS: Record<PersonaId, string[]> = {
  research: [
    'market_research',
    'competitor_analysis',
    'audience_insights',
    'trend_detection',
  ],

  content: [
    'content_generate',
    'social_schedule',
    'seo_optimize',
    'content_repurpose',
    'hashtag_research',
  ],

  closer: [
    'getCriticalLeads',
    'sendWhatsApp',
    'initiateCall',
    'generateProposal',
    'scheduleFollowUp',
    'updateLeadStatus',
  ],

  advisor: [
    'consultation_book',
    'recommendation_generate',
    'faq_answer',
    'comparison_generate',
    'roi_calculate',
  ],

  broadcaster: [
    'email_send',
    'sms_blast',
    'social_post',
    'whatsapp_broadcast',
    'campaign_create',
    'audience_segment',
  ],

  strategist: [
    'getKPISnapshot',
    'funnel_analysis',
    'ab_test_results',
    'cohort_analysis',
    'attribution_report',
    'forecast_generate',
  ],

  admin: [
    'getPipelineSummary',
    'task_status',
    'daily_report',
    'alert_manage',
    'workflow_trigger',
    'system_health',
    'schedule_view',
  ],
};

// =============================================================================
// PERSONA → WIDGETS MAPPING
// =============================================================================

export const PERSONA_WIDGETS: Record<PersonaId, string[]> = {
  research: [
    'ResearchDashboard',
    'InsightCards',
    'CompetitorMatrix',
    'AudienceProfile',
    'TrendChart',
  ],

  content: [
    'ContentCalendar',
    'ContentEditor',
    'ContentMetrics',
    'AssetLibrary',
    'HashtagSuggester',
  ],

  closer: [
    'LeadQueue',
    'CallInterface',
    'ProposalBuilder',
    'UrgencyTimer',
    'ObjectionHandler',
    'PipelineKanban',
  ],

  advisor: [
    'ConsultationScheduler',
    'RecommendationCard',
    'FAQBrowser',
    'ComparisonTable',
    'ROICalculator',
  ],

  broadcaster: [
    'CampaignDashboard',
    'ChannelComposer',
    'AudienceBuilder',
    'DeliveryMonitor',
    'ScheduleCalendar',
  ],

  strategist: [
    'KPIDashboard',
    'FunnelVisualization',
    'ABTestMonitor',
    'TrendChart',
    'InsightsFeed',
    'RecommendationPanel',
  ],

  admin: [
    'PipelineOverview',
    'TaskBoard',
    'AlertCenter',
    'DailySummary',
    'HealthMonitor',
    'ActivityTimeline',
  ],
};

// =============================================================================
// PERSONA → SKILLS MAPPING
// =============================================================================

export const PERSONA_SKILLS: Record<PersonaId, string[]> = {
  research: [
    'data_synthesis',
    'pattern_recognition',
    'report_generation',
    'source_validation',
    'trend_analysis',
  ],

  content: [
    'copywriting',
    'visual_storytelling',
    'platform_optimization',
    'audience_engagement',
    'a_b_testing',
    'trend_adaptation',
  ],

  closer: [
    'objection_handling',
    'urgency_creation',
    'rapport_building',
    'roi_calculation',
    'negotiation',
    'closing_techniques',
  ],

  advisor: [
    'needs_assessment',
    'solution_matching',
    'objection_resolution',
    'trust_building',
    'education',
    'personalization',
  ],

  broadcaster: [
    'channel_optimization',
    'timing_optimization',
    'audience_segmentation',
    'template_management',
    'deliverability_monitoring',
    'campaign_orchestration',
  ],

  strategist: [
    'data_analysis',
    'trend_detection',
    'hypothesis_generation',
    'optimization_recommendation',
    'forecasting',
    'experiment_design',
  ],

  admin: [
    'task_tracking',
    'status_reporting',
    'alert_management',
    'workflow_coordination',
    'resource_monitoring',
    'schedule_management',
  ],
};

// =============================================================================
// PERSONA → GATES MAPPING
// =============================================================================

export const PERSONA_GATES: Record<PersonaId, string[]> = {
  research: ['G0'], // Lead qualification insights

  content: ['G0', 'G1'], // Engagement content

  closer: ['G0', 'G1', 'G2'], // Full sales funnel

  advisor: ['G0', 'G1'], // Consultation and decision

  broadcaster: ['G0', 'G1', 'G2'], // Cross-funnel communication

  strategist: [
    'G0', 'G1', 'G2',      // Operational gates
    'G13', 'G14', 'G15',   // Governance gates
    'G16', 'G17', 'G18',
    'G19', 'G20', 'G21',
  ],

  admin: [
    'G0', 'G1', 'G2',
    'G13', 'G14', 'G15',
    'G16', 'G17', 'G18',
    'G19', 'G20', 'G21',
  ],
};

// =============================================================================
// TOOL DEFINITIONS (L2)
// =============================================================================

export const TOOL_DEFINITIONS: Record<string, ToolMapping> = {
  // Research Tools
  market_research: {
    toolId: 'market_research',
    personas: ['research'],
    l2Function: 'research.marketResearch',
    credentials: ['apify_key', 'serpapi_key'],
  },
  competitor_analysis: {
    toolId: 'competitor_analysis',
    personas: ['research'],
    l2Function: 'research.competitorAnalysis',
    credentials: ['apify_key'],
  },
  audience_insights: {
    toolId: 'audience_insights',
    personas: ['research'],
    l2Function: 'research.audienceInsights',
    credentials: [],
  },
  trend_detection: {
    toolId: 'trend_detection',
    personas: ['research'],
    l2Function: 'research.trendDetection',
    credentials: [],
  },

  // Content Tools
  content_generate: {
    toolId: 'content_generate',
    personas: ['content'],
    l2Function: 'content.generate',
    credentials: ['openai_key'],
  },
  social_schedule: {
    toolId: 'social_schedule',
    personas: ['content'],
    l2Function: 'content.schedulePost',
    credentials: ['buffer_key', 'meta_business_key'],
  },
  seo_optimize: {
    toolId: 'seo_optimize',
    personas: ['content'],
    l2Function: 'content.optimizeSEO',
    credentials: [],
  },
  content_repurpose: {
    toolId: 'content_repurpose',
    personas: ['content'],
    l2Function: 'content.repurpose',
    credentials: ['openai_key'],
  },
  hashtag_research: {
    toolId: 'hashtag_research',
    personas: ['content'],
    l2Function: 'content.researchHashtags',
    credentials: [],
  },

  // Closer Tools
  getCriticalLeads: {
    toolId: 'getCriticalLeads',
    personas: ['closer'],
    l2Function: 'sales.getCriticalLeads',
    endpoint: '/api/leads/critical',
    credentials: [],
  },
  sendWhatsApp: {
    toolId: 'sendWhatsApp',
    personas: ['closer', 'broadcaster'],
    l2Function: 'messaging.sendWhatsApp',
    endpoint: '/api/messaging/whatsapp',
    credentials: ['whatsapp_business_key'],
  },
  initiateCall: {
    toolId: 'initiateCall',
    personas: ['closer'],
    l2Function: 'voice.initiateCall',
    endpoint: '/api/voice/call',
    credentials: ['voicebot_api_key'],
  },
  generateProposal: {
    toolId: 'generateProposal',
    personas: ['closer'],
    l2Function: 'sales.generateProposal',
    endpoint: '/api/proposals/generate',
    credentials: [],
  },
  scheduleFollowUp: {
    toolId: 'scheduleFollowUp',
    personas: ['closer'],
    l2Function: 'sales.scheduleFollowUp',
    credentials: [],
  },
  updateLeadStatus: {
    toolId: 'updateLeadStatus',
    personas: ['closer'],
    l2Function: 'sales.updateLeadStatus',
    credentials: [],
  },

  // Advisor Tools
  consultation_book: {
    toolId: 'consultation_book',
    personas: ['advisor'],
    l2Function: 'scheduling.bookConsultation',
    credentials: ['calendar_api_key'],
  },
  recommendation_generate: {
    toolId: 'recommendation_generate',
    personas: ['advisor'],
    l2Function: 'advisor.generateRecommendation',
    credentials: ['openai_key'],
  },
  faq_answer: {
    toolId: 'faq_answer',
    personas: ['advisor'],
    l2Function: 'advisor.answerFAQ',
    credentials: [],
  },
  comparison_generate: {
    toolId: 'comparison_generate',
    personas: ['advisor'],
    l2Function: 'advisor.generateComparison',
    credentials: [],
  },
  roi_calculate: {
    toolId: 'roi_calculate',
    personas: ['advisor', 'closer'],
    l2Function: 'finance.calculateROI',
    credentials: [],
  },

  // Broadcaster Tools
  email_send: {
    toolId: 'email_send',
    personas: ['broadcaster'],
    l2Function: 'messaging.sendEmail',
    credentials: ['sendgrid_key', 'smtp_credentials'],
  },
  sms_blast: {
    toolId: 'sms_blast',
    personas: ['broadcaster'],
    l2Function: 'messaging.sendSMS',
    credentials: ['twilio_key', 'sms_provider_key'],
  },
  social_post: {
    toolId: 'social_post',
    personas: ['broadcaster', 'content'],
    l2Function: 'social.publishPost',
    credentials: ['meta_business_key', 'linkedin_key', 'twitter_key'],
  },
  whatsapp_broadcast: {
    toolId: 'whatsapp_broadcast',
    personas: ['broadcaster'],
    l2Function: 'messaging.broadcastWhatsApp',
    credentials: ['whatsapp_business_key'],
  },
  campaign_create: {
    toolId: 'campaign_create',
    personas: ['broadcaster'],
    l2Function: 'campaigns.create',
    credentials: [],
  },
  audience_segment: {
    toolId: 'audience_segment',
    personas: ['broadcaster'],
    l2Function: 'audience.segment',
    credentials: [],
  },

  // Strategist Tools
  getKPISnapshot: {
    toolId: 'getKPISnapshot',
    personas: ['strategist', 'admin'],
    l2Function: 'analytics.getKPISnapshot',
    endpoint: '/api/mcp/governance',
    credentials: [],
  },
  funnel_analysis: {
    toolId: 'funnel_analysis',
    personas: ['strategist'],
    l2Function: 'analytics.analyzeFunnel',
    credentials: [],
  },
  ab_test_results: {
    toolId: 'ab_test_results',
    personas: ['strategist'],
    l2Function: 'experiments.getResults',
    credentials: [],
  },
  cohort_analysis: {
    toolId: 'cohort_analysis',
    personas: ['strategist'],
    l2Function: 'analytics.analyzeCohorts',
    credentials: [],
  },
  attribution_report: {
    toolId: 'attribution_report',
    personas: ['strategist'],
    l2Function: 'analytics.getAttribution',
    credentials: [],
  },
  forecast_generate: {
    toolId: 'forecast_generate',
    personas: ['strategist'],
    l2Function: 'analytics.generateForecast',
    credentials: [],
  },

  // Admin Tools
  getPipelineSummary: {
    toolId: 'getPipelineSummary',
    personas: ['admin', 'closer'],
    l2Function: 'pipeline.getSummary',
    endpoint: '/api/pipeline/summary',
    credentials: [],
  },
  task_status: {
    toolId: 'task_status',
    personas: ['admin'],
    l2Function: 'tasks.getStatus',
    credentials: [],
  },
  daily_report: {
    toolId: 'daily_report',
    personas: ['admin'],
    l2Function: 'reports.generateDaily',
    credentials: [],
  },
  alert_manage: {
    toolId: 'alert_manage',
    personas: ['admin'],
    l2Function: 'alerts.manage',
    credentials: [],
  },
  workflow_trigger: {
    toolId: 'workflow_trigger',
    personas: ['admin'],
    l2Function: 'workflows.trigger',
    credentials: [],
  },
  system_health: {
    toolId: 'system_health',
    personas: ['admin'],
    l2Function: 'system.getHealth',
    endpoint: '/api/mcp/healthz',
    credentials: [],
  },
  schedule_view: {
    toolId: 'schedule_view',
    personas: ['admin'],
    l2Function: 'schedule.view',
    credentials: [],
  },
};

// =============================================================================
// WIDGET DEFINITIONS (L3)
// =============================================================================

export const WIDGET_DEFINITIONS: Record<string, WidgetMapping> = {
  // Research Widgets
  ResearchDashboard: {
    widgetId: 'ResearchDashboard',
    personas: ['research'],
    component: 'components/widgets/ResearchDashboard',
  },
  InsightCards: {
    widgetId: 'InsightCards',
    personas: ['research', 'strategist'],
    component: 'components/widgets/InsightCards',
  },
  CompetitorMatrix: {
    widgetId: 'CompetitorMatrix',
    personas: ['research'],
    component: 'components/widgets/CompetitorMatrix',
  },
  AudienceProfile: {
    widgetId: 'AudienceProfile',
    personas: ['research'],
    component: 'components/widgets/AudienceProfile',
  },

  // Content Widgets
  ContentCalendar: {
    widgetId: 'ContentCalendar',
    personas: ['content'],
    component: 'components/widgets/ContentCalendar',
  },
  ContentEditor: {
    widgetId: 'ContentEditor',
    personas: ['content'],
    component: 'components/widgets/ContentEditor',
  },
  ContentMetrics: {
    widgetId: 'ContentMetrics',
    personas: ['content'],
    component: 'components/widgets/ContentMetrics',
  },
  AssetLibrary: {
    widgetId: 'AssetLibrary',
    personas: ['content'],
    component: 'components/widgets/AssetLibrary',
  },

  // Closer Widgets
  LeadQueue: {
    widgetId: 'LeadQueue',
    personas: ['closer'],
    component: 'components/widgets/LeadQueue',
    props: { priority: 'hot' },
  },
  CallInterface: {
    widgetId: 'CallInterface',
    personas: ['closer'],
    component: 'components/widgets/CallInterface',
  },
  ProposalBuilder: {
    widgetId: 'ProposalBuilder',
    personas: ['closer'],
    component: 'components/widgets/ProposalBuilder',
  },
  UrgencyTimer: {
    widgetId: 'UrgencyTimer',
    personas: ['closer'],
    component: 'components/widgets/UrgencyTimer',
  },
  ObjectionHandler: {
    widgetId: 'ObjectionHandler',
    personas: ['closer'],
    component: 'components/widgets/ObjectionHandler',
  },
  PipelineKanban: {
    widgetId: 'PipelineKanban',
    personas: ['closer', 'admin'],
    component: 'components/widgets/PipelineKanban',
  },

  // Advisor Widgets
  ConsultationScheduler: {
    widgetId: 'ConsultationScheduler',
    personas: ['advisor'],
    component: 'components/widgets/ConsultationScheduler',
  },
  RecommendationCard: {
    widgetId: 'RecommendationCard',
    personas: ['advisor'],
    component: 'components/widgets/RecommendationCard',
  },
  FAQBrowser: {
    widgetId: 'FAQBrowser',
    personas: ['advisor'],
    component: 'components/widgets/FAQBrowser',
  },
  ComparisonTable: {
    widgetId: 'ComparisonTable',
    personas: ['advisor'],
    component: 'components/widgets/ComparisonTable',
  },
  ROICalculator: {
    widgetId: 'ROICalculator',
    personas: ['advisor', 'closer'],
    component: 'components/widgets/ROICalculator',
  },

  // Broadcaster Widgets
  CampaignDashboard: {
    widgetId: 'CampaignDashboard',
    personas: ['broadcaster'],
    component: 'components/widgets/CampaignDashboard',
  },
  ChannelComposer: {
    widgetId: 'ChannelComposer',
    personas: ['broadcaster'],
    component: 'components/widgets/ChannelComposer',
  },
  AudienceBuilder: {
    widgetId: 'AudienceBuilder',
    personas: ['broadcaster'],
    component: 'components/widgets/AudienceBuilder',
  },
  DeliveryMonitor: {
    widgetId: 'DeliveryMonitor',
    personas: ['broadcaster'],
    component: 'components/widgets/DeliveryMonitor',
  },
  ScheduleCalendar: {
    widgetId: 'ScheduleCalendar',
    personas: ['broadcaster', 'content'],
    component: 'components/widgets/ScheduleCalendar',
  },

  // Strategist Widgets
  KPIDashboard: {
    widgetId: 'KPIDashboard',
    personas: ['strategist', 'admin'],
    component: 'components/widgets/KPIDashboard',
  },
  FunnelVisualization: {
    widgetId: 'FunnelVisualization',
    personas: ['strategist'],
    component: 'components/widgets/FunnelVisualization',
  },
  ABTestMonitor: {
    widgetId: 'ABTestMonitor',
    personas: ['strategist'],
    component: 'components/widgets/ABTestMonitor',
  },
  TrendChart: {
    widgetId: 'TrendChart',
    personas: ['strategist', 'research'],
    component: 'components/widgets/TrendChart',
  },
  InsightsFeed: {
    widgetId: 'InsightsFeed',
    personas: ['strategist'],
    component: 'components/widgets/InsightsFeed',
  },
  RecommendationPanel: {
    widgetId: 'RecommendationPanel',
    personas: ['strategist'],
    component: 'components/widgets/RecommendationPanel',
  },

  // Admin Widgets
  PipelineOverview: {
    widgetId: 'PipelineOverview',
    personas: ['admin'],
    component: 'components/widgets/PipelineOverview',
  },
  TaskBoard: {
    widgetId: 'TaskBoard',
    personas: ['admin'],
    component: 'components/widgets/TaskBoard',
  },
  AlertCenter: {
    widgetId: 'AlertCenter',
    personas: ['admin'],
    component: 'components/widgets/AlertCenter',
  },
  DailySummary: {
    widgetId: 'DailySummary',
    personas: ['admin'],
    component: 'components/widgets/DailySummary',
  },
  HealthMonitor: {
    widgetId: 'HealthMonitor',
    personas: ['admin'],
    component: 'components/widgets/HealthMonitor',
  },
  ActivityTimeline: {
    widgetId: 'ActivityTimeline',
    personas: ['admin'],
    component: 'components/widgets/ActivityTimeline',
  },
};

// =============================================================================
// COMBINED MAPPINGS OBJECT
// =============================================================================

export const PERSONA_MAPPINGS: PersonaMappings = {
  tools: PERSONA_TOOLS,
  widgets: PERSONA_WIDGETS,
  skills: PERSONA_SKILLS,
  gates: PERSONA_GATES,
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get all tools available to a persona
 */
export function getToolsForPersona(personaId: PersonaId): PersonaTool[] {
  const toolIds = PERSONA_TOOLS[personaId] || [];
  return toolIds.map((id) => {
    const mapping = TOOL_DEFINITIONS[id];
    return {
      id,
      name: id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      description: `Tool: ${id}`,
      requiredCredentials: mapping?.credentials,
    };
  });
}

/**
 * Get all widgets available to a persona
 */
export function getWidgetsForPersona(personaId: PersonaId): WidgetMapping[] {
  const widgetIds = PERSONA_WIDGETS[personaId] || [];
  return widgetIds.map((id) => WIDGET_DEFINITIONS[id]).filter(Boolean);
}

/**
 * Get personas that can use a specific tool
 */
export function getPersonasForTool(toolId: string): PersonaId[] {
  const mapping = TOOL_DEFINITIONS[toolId];
  return mapping?.personas || [];
}

/**
 * Get personas that can use a specific widget
 */
export function getPersonasForWidget(widgetId: string): PersonaId[] {
  const mapping = WIDGET_DEFINITIONS[widgetId];
  return mapping?.personas || [];
}

/**
 * Check if a persona has access to a tool
 */
export function personaHasToolAccess(
  personaId: PersonaId,
  toolId: string
): boolean {
  const tools = PERSONA_TOOLS[personaId] || [];
  return tools.includes(toolId);
}

/**
 * Check if a persona has access to a widget
 */
export function personaHasWidgetAccess(
  personaId: PersonaId,
  widgetId: string
): boolean {
  const widgets = PERSONA_WIDGETS[personaId] || [];
  return widgets.includes(widgetId);
}

/**
 * Get gate access for a persona
 */
export function getGateAccessForPersona(personaId: PersonaId): string[] {
  return PERSONA_GATES[personaId] || [];
}

/**
 * Get required credentials for a persona's tools
 */
export function getRequiredCredentialsForPersona(
  personaId: PersonaId
): string[] {
  const toolIds = PERSONA_TOOLS[personaId] || [];
  const credentials = new Set<string>();

  for (const toolId of toolIds) {
    const mapping = TOOL_DEFINITIONS[toolId];
    if (mapping?.credentials) {
      mapping.credentials.forEach((c) => credentials.add(c));
    }
  }

  return Array.from(credentials);
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
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
};
