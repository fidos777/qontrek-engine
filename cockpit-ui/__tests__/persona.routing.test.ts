/**
 * Persona Routing Tests - Qontrek OS Layer 5
 * Verify persona selection and intent classification
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PersonaRouter,
  IntentClassifier,
  PERSONA_CONFIGS,
  PERSONA_TOOLS,
  PERSONA_WIDGETS,
  getToolsForPersona,
  getWidgetsForPersona,
  isValidPersonaId,
  isValidFunnelStage,
  isValidVerticalType,
} from '@/lib/persona';
import type { RoutingContext, PersonaId } from '@/types/persona';

describe('PersonaRouter', () => {
  let router: PersonaRouter;

  beforeEach(() => {
    router = new PersonaRouter();
  });

  describe('selectPersona', () => {
    const baseContext: RoutingContext = {
      tenantId: 'voltek-001',
      vertical: 'solar',
    };

    it('routes sales queries to Closer', async () => {
      const decision = await router.selectPersona(
        'Show me the hot leads that need follow-up',
        baseContext
      );
      expect(decision.selectedPersona).toBe('closer');
      expect(decision.confidence).toBeGreaterThan(0.5);
    });

    it('routes analytics queries to Strategist', async () => {
      const decision = await router.selectPersona(
        'What are our KPI metrics for this week?',
        baseContext
      );
      expect(decision.selectedPersona).toBe('strategist');
    });

    it('routes content queries to Content', async () => {
      const decision = await router.selectPersona(
        'Create a social media post about solar benefits',
        baseContext
      );
      expect(decision.selectedPersona).toBe('content');
    });

    it('routes research queries to Research', async () => {
      const decision = await router.selectPersona(
        'Analyze our competitors in the solar market',
        baseContext
      );
      expect(decision.selectedPersona).toBe('research');
    });

    it('routes consultation queries to Advisor', async () => {
      const decision = await router.selectPersona(
        'Help me understand which solar package is best',
        baseContext
      );
      expect(decision.selectedPersona).toBe('advisor');
    });

    it('routes broadcast queries to Broadcaster', async () => {
      const decision = await router.selectPersona(
        'Send an email blast to all customers',
        baseContext
      );
      expect(decision.selectedPersona).toBe('broadcaster');
    });

    it('routes operational queries to Admin', async () => {
      const decision = await router.selectPersona(
        'Show me today\'s daily report',
        baseContext
      );
      expect(decision.selectedPersona).toBe('admin');
    });

    it('falls back to Admin for ambiguous queries', async () => {
      const decision = await router.selectPersona(
        'hello',
        baseContext
      );
      expect(decision.selectedPersona).toBe('admin');
      expect(decision.fallbackPersona).toBe('admin');
    });

    it('includes proof hash when governance requires it', async () => {
      const decision = await router.selectPersona(
        'Show me hot leads',
        baseContext
      );
      expect(decision.proofHash).toBeDefined();
      expect(typeof decision.proofHash).toBe('string');
    });

    it('respects vertical context for solar', async () => {
      const decision = await router.selectPersona(
        'Need to close this deal urgently',
        { ...baseContext, vertical: 'solar' }
      );
      expect(decision.selectedPersona).toBe('closer');
      expect(decision.contextFactors).toContain('vertical:solar');
    });
  });

  describe('getPersonaConfig', () => {
    it('returns config for valid persona', () => {
      const config = router.getPersonaConfig('closer');
      expect(config).toBeDefined();
      expect(config?.id).toBe('closer');
      expect(config?.codename).toBe('Voice Closer');
    });

    it('returns undefined for invalid persona', () => {
      const config = router.getPersonaConfig('invalid' as PersonaId);
      expect(config).toBeUndefined();
    });
  });

  describe('getPersonasByFunnel', () => {
    it('returns TOFU personas', () => {
      const personas = router.getPersonasByFunnel('TOFU');
      const ids = personas.map(p => p.id);
      expect(ids).toContain('research');
      expect(ids).toContain('content');
    });

    it('returns BOFU personas', () => {
      const personas = router.getPersonasByFunnel('BOFU');
      const ids = personas.map(p => p.id);
      expect(ids).toContain('closer');
    });

    it('returns cross-funnel personas', () => {
      const personas = router.getPersonasByFunnel('cross-funnel');
      const ids = personas.map(p => p.id);
      expect(ids).toContain('strategist');
      expect(ids).toContain('admin');
      expect(ids).toContain('broadcaster');
    });
  });
});

describe('IntentClassifier', () => {
  let classifier: IntentClassifier;

  beforeEach(() => {
    classifier = new IntentClassifier();
  });

  describe('classify', () => {
    it('classifies sales intents correctly', async () => {
      const result = await classifier.classify('Get me the hot leads');
      expect(result.persona).toBe('closer');
      expect(result.intent).toBe('check_leads');
    });

    it('classifies analytics intents correctly', async () => {
      const result = await classifier.classify('Show me funnel performance');
      expect(result.persona).toBe('strategist');
    });

    it('classifies content creation intents correctly', async () => {
      const result = await classifier.classify('Write a blog post');
      expect(result.persona).toBe('content');
    });

    it('includes alternative personas', async () => {
      const result = await classifier.classify('Help me with proposals');
      expect(result.alternativePersonas).toBeDefined();
      expect(Array.isArray(result.alternativePersonas)).toBe(true);
    });

    it('provides reasoning for classification', async () => {
      const result = await classifier.classify('Analyze competitor pricing');
      expect(result.reasoning).toBeDefined();
      expect(result.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe('testQuery', () => {
    it('returns matched patterns for query', () => {
      const matches = classifier.testQuery('send whatsapp message');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches.some(m => m.persona === 'closer')).toBe(true);
    });
  });
});

describe('Persona Configurations', () => {
  it('has 7 personas configured', () => {
    const personaIds = Object.keys(PERSONA_CONFIGS);
    expect(personaIds).toHaveLength(7);
  });

  it('all personas have required fields', () => {
    Object.values(PERSONA_CONFIGS).forEach(config => {
      expect(config.id).toBeDefined();
      expect(config.name).toBeDefined();
      expect(config.codename).toBeDefined();
      expect(config.funnel).toBeDefined();
      expect(config.tones).toBeDefined();
      expect(config.tools).toBeDefined();
      expect(config.widgets).toBeDefined();
      expect(config.kpis).toBeDefined();
      expect(config.governance).toBeDefined();
    });
  });

  it('closer has Pain-Benefit-Urgency framework', () => {
    expect(PERSONA_CONFIGS.closer.framework).toBe('Pain-Benefit-Urgency');
  });

  it('admin is default fallback with lowest priority', () => {
    const priorities = Object.values(PERSONA_CONFIGS).map(c => c.priority);
    const adminPriority = PERSONA_CONFIGS.admin.priority;
    expect(adminPriority).toBe(Math.max(...priorities));
  });

  it('closer has highest priority', () => {
    const priorities = Object.values(PERSONA_CONFIGS).map(c => c.priority);
    const closerPriority = PERSONA_CONFIGS.closer.priority;
    expect(closerPriority).toBe(Math.min(...priorities));
  });
});

describe('Persona Mappings', () => {
  it('all personas have tools mapped', () => {
    Object.keys(PERSONA_CONFIGS).forEach(personaId => {
      const tools = PERSONA_TOOLS[personaId as PersonaId];
      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });
  });

  it('all personas have widgets mapped', () => {
    Object.keys(PERSONA_CONFIGS).forEach(personaId => {
      const widgets = PERSONA_WIDGETS[personaId as PersonaId];
      expect(widgets).toBeDefined();
      expect(Array.isArray(widgets)).toBe(true);
      expect(widgets.length).toBeGreaterThan(0);
    });
  });

  it('getToolsForPersona returns correct tools', () => {
    const closerTools = getToolsForPersona('closer');
    expect(closerTools.some(t => t.id === 'getCriticalLeads')).toBe(true);
    expect(closerTools.some(t => t.id === 'sendWhatsApp')).toBe(true);
  });

  it('getWidgetsForPersona returns correct widgets', () => {
    const strategistWidgets = getWidgetsForPersona('strategist');
    expect(strategistWidgets.some(w => w.widgetId === 'KPIDashboard')).toBe(true);
  });
});

describe('Validation Helpers', () => {
  describe('isValidPersonaId', () => {
    it('returns true for valid persona IDs', () => {
      expect(isValidPersonaId('closer')).toBe(true);
      expect(isValidPersonaId('admin')).toBe(true);
      expect(isValidPersonaId('strategist')).toBe(true);
    });

    it('returns false for invalid persona IDs', () => {
      expect(isValidPersonaId('invalid')).toBe(false);
      expect(isValidPersonaId('')).toBe(false);
    });
  });

  describe('isValidFunnelStage', () => {
    it('returns true for valid funnel stages', () => {
      expect(isValidFunnelStage('TOFU')).toBe(true);
      expect(isValidFunnelStage('MOFU')).toBe(true);
      expect(isValidFunnelStage('BOFU')).toBe(true);
      expect(isValidFunnelStage('cross-funnel')).toBe(true);
    });

    it('returns false for invalid funnel stages', () => {
      expect(isValidFunnelStage('invalid')).toBe(false);
    });
  });

  describe('isValidVerticalType', () => {
    it('returns true for valid verticals', () => {
      expect(isValidVerticalType('solar')).toBe(true);
      expect(isValidVerticalType('ev')).toBe(true);
      expect(isValidVerticalType('clinic')).toBe(true);
    });

    it('returns false for invalid verticals', () => {
      expect(isValidVerticalType('invalid')).toBe(false);
    });
  });
});

describe('Governance Configuration', () => {
  it('broadcaster requires approval', () => {
    expect(PERSONA_CONFIGS.broadcaster.governance.requiresApproval).toBe(true);
  });

  it('all personas require proof logging', () => {
    Object.values(PERSONA_CONFIGS).forEach(config => {
      expect(config.governance.proofRequired).toBe(true);
    });
  });

  it('closer has detailed audit level', () => {
    expect(PERSONA_CONFIGS.closer.governance.auditLevel).toBe('detailed');
  });

  it('closer and strategist have sensitive data access', () => {
    expect(PERSONA_CONFIGS.closer.governance.sensitiveDataAccess).toBe(true);
    expect(PERSONA_CONFIGS.strategist.governance.sensitiveDataAccess).toBe(true);
  });
});
