/**
 * Qontrek Widget Registry
 * Central registry for ChatGPT Apps compatible widget schemas
 *
 * Provides schema loading, validation, and template rendering utilities
 */

import type {
  WidgetType,
  WidgetSchema,
  KPICardSchema,
  LeadDetailCardSchema,
  PipelineBoardSchema,
  ActionPanelSchema,
  GovernanceStatusSchema,
  ApprovalFlowSchema,
  AlertWidgetSchema,
  ProofModalSchema,
  FormGeneratorSchema,
  DataBinding,
  RenderContext,
  RenderedWidget,
  ChatGPTAppWidget,
  ChatGPTAppResponse,
  ConditionRule,
  Condition,
} from './types';

// Import JSON schemas
import KPICardSchemaJSON from './schemas/KPICard.json';
import LeadDetailCardSchemaJSON from './schemas/LeadDetailCard.json';
import PipelineBoardSchemaJSON from './schemas/PipelineBoard.json';
import ActionPanelSchemaJSON from './schemas/ActionPanel.json';
import GovernanceStatusSchemaJSON from './schemas/GovernanceStatus.json';
import ApprovalFlowSchemaJSON from './schemas/ApprovalFlow.json';
import AlertWidgetSchemaJSON from './schemas/AlertWidget.json';
import ProofModalSchemaJSON from './schemas/ProofModal.json';
import FormGeneratorSchemaJSON from './schemas/FormGenerator.json';

// ============================================================================
// Widget Schema Registry Entry
// ============================================================================

interface WidgetRegistryEntry {
  type: WidgetType;
  name: string;
  description: string;
  schema: object;
  version: string;
  category: 'data' | 'form' | 'workflow' | 'display' | 'security';
  tags: string[];
}

// ============================================================================
// Template Engine
// ============================================================================

class TemplateEngine {
  private static TEMPLATE_REGEX = /\{\{([^}]+)\}\}/g;

  /**
   * Resolve a dot-notation path to a value in data object
   */
  static resolvePath(data: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = data;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Apply transform function to value
   */
  static applyTransform(value: unknown, transform: string): string {
    const strValue = String(value ?? '');

    switch (transform) {
      case 'uppercase':
        return strValue.toUpperCase();
      case 'lowercase':
        return strValue.toLowerCase();
      case 'capitalize':
        return strValue.charAt(0).toUpperCase() + strValue.slice(1).toLowerCase();
      case 'truncate':
        return strValue.length > 50 ? strValue.slice(0, 47) + '...' : strValue;
      case 'format_currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
      case 'format_date':
        return new Date(strValue).toLocaleDateString();
      case 'format_number':
        return new Intl.NumberFormat().format(Number(value) || 0);
      default:
        return strValue;
    }
  }

  /**
   * Resolve a data binding to its value
   */
  static resolveBinding(
    binding: string | DataBinding,
    data: Record<string, unknown>
  ): unknown {
    if (typeof binding === 'string') {
      // Check if it's a template string
      if (binding.includes('{{')) {
        return this.renderTemplate(binding, data);
      }
      return binding;
    }

    // DataBinding object
    let value = this.resolvePath(data, binding.path);

    if (value === undefined && binding.fallback !== undefined) {
      value = binding.fallback;
    }

    if (binding.transform && value !== undefined) {
      return this.applyTransform(value, binding.transform);
    }

    return value;
  }

  /**
   * Render a template string with data
   */
  static renderTemplate(template: string, data: Record<string, unknown>): string {
    return template.replace(this.TEMPLATE_REGEX, (match, path) => {
      const trimmedPath = path.trim();
      const value = this.resolvePath(data, trimmedPath);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Deep render all templates in an object
   */
  static renderObject<T>(obj: T, data: Record<string, unknown>): T {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.renderTemplate(obj, data) as T;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.renderObject(item, data)) as T;
    }

    if (typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.renderObject(value, data);
      }
      return result as T;
    }

    return obj;
  }
}

// ============================================================================
// Condition Evaluator
// ============================================================================

class ConditionEvaluator {
  /**
   * Evaluate a single condition rule
   */
  static evaluateRule(rule: ConditionRule, data: Record<string, unknown>): boolean {
    const fieldValue = TemplateEngine.resolvePath(data, rule.field);
    const compareValue = rule.value;

    switch (rule.operator) {
      case 'eq':
        return fieldValue === compareValue;
      case 'neq':
        return fieldValue !== compareValue;
      case 'gt':
        return Number(fieldValue) > Number(compareValue);
      case 'gte':
        return Number(fieldValue) >= Number(compareValue);
      case 'lt':
        return Number(fieldValue) < Number(compareValue);
      case 'lte':
        return Number(fieldValue) <= Number(compareValue);
      case 'contains':
        return String(fieldValue).includes(String(compareValue));
      case 'not_contains':
        return !String(fieldValue).includes(String(compareValue));
      case 'in':
        return Array.isArray(compareValue) && compareValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null;
      case 'matches':
        return new RegExp(String(compareValue)).test(String(fieldValue));
      default:
        return false;
    }
  }

  /**
   * Evaluate an array of condition rules
   */
  static evaluateRules(rules: ConditionRule[], data: Record<string, unknown>): boolean {
    if (rules.length === 0) return true;

    let result = this.evaluateRule(rules[0], data);

    for (let i = 1; i < rules.length; i++) {
      const rule = rules[i];
      const ruleResult = this.evaluateRule(rule, data);
      const logic = rules[i - 1].logic || 'and';

      if (logic === 'and') {
        result = result && ruleResult;
      } else {
        result = result || ruleResult;
      }
    }

    return result;
  }

  /**
   * Evaluate full condition object
   */
  static evaluateCondition(
    condition: Condition | undefined,
    data: Record<string, unknown>
  ): { show: boolean; enable: boolean } {
    if (!condition) {
      return { show: true, enable: true };
    }

    let show = true;
    let enable = true;

    if (condition.show?.length) {
      show = this.evaluateRules(condition.show, data);
    }

    if (condition.hide?.length) {
      const hideResult = this.evaluateRules(condition.hide, data);
      if (hideResult) show = false;
    }

    if (condition.enable?.length) {
      enable = this.evaluateRules(condition.enable, data);
    }

    if (condition.disable?.length) {
      const disableResult = this.evaluateRules(condition.disable, data);
      if (disableResult) enable = false;
    }

    return { show, enable };
  }
}

// ============================================================================
// Widget Registry
// ============================================================================

export class WidgetRegistry {
  private static instance: WidgetRegistry;
  private schemas: Map<WidgetType, WidgetRegistryEntry>;
  private handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>;

  private constructor() {
    this.schemas = new Map();
    this.handlers = new Map();
    this.registerBuiltInSchemas();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): WidgetRegistry {
    if (!WidgetRegistry.instance) {
      WidgetRegistry.instance = new WidgetRegistry();
    }
    return WidgetRegistry.instance;
  }

  /**
   * Register built-in widget schemas
   */
  private registerBuiltInSchemas(): void {
    this.registerSchema({
      type: 'kpi_card',
      name: 'KPI Card',
      description: 'Displays a single metric with trend indicator and optional sparkline',
      schema: KPICardSchemaJSON,
      version: '1.0.0',
      category: 'data',
      tags: ['metric', 'kpi', 'dashboard', 'analytics'],
    });

    this.registerSchema({
      type: 'lead_detail_card',
      name: 'Lead Detail Card',
      description: 'Full lead information display with collapsible sections and actions',
      schema: LeadDetailCardSchemaJSON,
      version: '1.0.0',
      category: 'display',
      tags: ['lead', 'crm', 'contact', 'detail'],
    });

    this.registerSchema({
      type: 'pipeline_board',
      name: 'Pipeline Board',
      description: 'Kanban-style pipeline view with drag-and-drop support',
      schema: PipelineBoardSchemaJSON,
      version: '1.0.0',
      category: 'workflow',
      tags: ['kanban', 'pipeline', 'board', 'drag-drop'],
    });

    this.registerSchema({
      type: 'action_panel',
      name: 'Action Panel',
      description: 'Contextual action buttons grouped by function',
      schema: ActionPanelSchemaJSON,
      version: '1.0.0',
      category: 'workflow',
      tags: ['actions', 'toolbar', 'buttons'],
    });

    this.registerSchema({
      type: 'governance_status',
      name: 'Governance Status',
      description: 'G13-G21 gate status display with compliance scoring',
      schema: GovernanceStatusSchemaJSON,
      version: '1.0.0',
      category: 'security',
      tags: ['governance', 'compliance', 'gates', 'security'],
    });

    this.registerSchema({
      type: 'approval_flow',
      name: 'Approval Flow',
      description: 'Multi-step approval workflow visualization',
      schema: ApprovalFlowSchemaJSON,
      version: '1.0.0',
      category: 'workflow',
      tags: ['approval', 'workflow', 'steps', 'process'],
    });

    this.registerSchema({
      type: 'alert_widget',
      name: 'Alert Widget',
      description: 'Notifications and warnings display',
      schema: AlertWidgetSchemaJSON,
      version: '1.0.0',
      category: 'display',
      tags: ['alerts', 'notifications', 'warnings'],
    });

    this.registerSchema({
      type: 'proof_modal',
      name: 'Proof Modal',
      description: 'Cryptographic proof viewer with verification chain',
      schema: ProofModalSchemaJSON,
      version: '1.0.0',
      category: 'security',
      tags: ['proof', 'crypto', 'verification', 'audit'],
    });

    this.registerSchema({
      type: 'form_generator',
      name: 'Form Generator',
      description: 'Dynamic form generation from schema with validation',
      schema: FormGeneratorSchemaJSON,
      version: '1.0.0',
      category: 'form',
      tags: ['form', 'input', 'validation', 'dynamic'],
    });
  }

  /**
   * Register a widget schema
   */
  registerSchema(entry: WidgetRegistryEntry): void {
    this.schemas.set(entry.type, entry);
  }

  /**
   * Get a widget schema by type
   */
  getSchema(type: WidgetType): WidgetRegistryEntry | undefined {
    return this.schemas.get(type);
  }

  /**
   * Get all registered schemas
   */
  getAllSchemas(): WidgetRegistryEntry[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Get schemas by category
   */
  getSchemasByCategory(category: WidgetRegistryEntry['category']): WidgetRegistryEntry[] {
    return this.getAllSchemas().filter((s) => s.category === category);
  }

  /**
   * Get schemas by tag
   */
  getSchemasByTag(tag: string): WidgetRegistryEntry[] {
    return this.getAllSchemas().filter((s) => s.tags.includes(tag));
  }

  /**
   * Register an action handler
   */
  registerHandler(
    handlerId: string,
    handler: (params: Record<string, unknown>) => Promise<unknown>
  ): void {
    this.handlers.set(handlerId, handler);
  }

  /**
   * Get an action handler
   */
  getHandler(handlerId: string): ((params: Record<string, unknown>) => Promise<unknown>) | undefined {
    return this.handlers.get(handlerId);
  }

  /**
   * Execute an action handler
   */
  async executeHandler(handlerId: string, params: Record<string, unknown>): Promise<unknown> {
    const handler = this.handlers.get(handlerId);
    if (!handler) {
      throw new Error(`Handler not found: ${handlerId}`);
    }
    return handler(params);
  }

  /**
   * Validate widget data against schema
   */
  validateWidget(widget: WidgetSchema): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const schemaEntry = this.getSchema(widget.type);

    if (!schemaEntry) {
      errors.push(`Unknown widget type: ${widget.type}`);
      return { valid: false, errors };
    }

    // Basic validation
    if (!widget.title) {
      errors.push('Widget title is required');
    }

    if (!widget.schemaVersion) {
      errors.push('Schema version is required');
    }

    // Type-specific validation would go here
    // In production, use a JSON Schema validator like Ajv

    return { valid: errors.length === 0, errors };
  }

  /**
   * Create a ChatGPT App widget response
   */
  createWidgetResponse(
    schema: WidgetSchema,
    context: RenderContext,
    options?: {
      dataEndpoint?: string;
      realtimeChannel?: string;
      actionCallback?: string;
    }
  ): ChatGPTAppResponse {
    const validation = this.validateWidget(schema);

    if (!validation.valid) {
      return {
        type: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.errors.join('; '),
          retry: false,
        },
      };
    }

    const widget: ChatGPTAppWidget = {
      schema,
      context,
      dataEndpoint: options?.dataEndpoint,
      realtimeChannel: options?.realtimeChannel,
      actionCallback: options?.actionCallback,
    };

    return {
      type: 'widget',
      widget,
    };
  }

  /**
   * Render a widget schema with data
   */
  renderWidget(schema: WidgetSchema, context: RenderContext): RenderedWidget {
    const { data } = context;

    try {
      // Render all template strings
      const renderedSchema = TemplateEngine.renderObject(schema, data);

      // Evaluate conditions
      const conditionResult = ConditionEvaluator.evaluateCondition(
        renderedSchema.conditions,
        data
      );

      if (!conditionResult.show) {
        return {
          content: '',
          handlers: {},
          renderedAt: new Date().toISOString(),
        };
      }

      // Extract action handlers
      const handlers: Record<string, (params: Record<string, unknown>) => Promise<void>> = {};

      if (renderedSchema.actions) {
        for (const action of renderedSchema.actions) {
          const handler = this.getHandler(action.handler);
          if (handler) {
            handlers[action.id] = async (params) => {
              const mergedParams = { ...action.params, ...params };
              await handler(mergedParams);
            };
          }
        }
      }

      // Generate content (simplified - in production use a proper renderer)
      const content = JSON.stringify(renderedSchema, null, 2);

      return {
        content,
        handlers,
        renderedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        content: '',
        handlers: {},
        error: {
          code: 'RENDER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        renderedAt: new Date().toISOString(),
      };
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a KPI Card widget schema
 */
export function createKPICard(config: Omit<KPICardSchema, 'type' | 'schemaVersion'>): KPICardSchema {
  return {
    type: 'kpi_card',
    schemaVersion: '1.0.0',
    ...config,
    fields: config.fields || [],
  };
}

/**
 * Create a Lead Detail Card widget schema
 */
export function createLeadDetailCard(
  config: Omit<LeadDetailCardSchema, 'type' | 'schemaVersion'>
): LeadDetailCardSchema {
  return {
    type: 'lead_detail_card',
    schemaVersion: '1.0.0',
    ...config,
    fields: config.fields || [],
  };
}

/**
 * Create a Pipeline Board widget schema
 */
export function createPipelineBoard(
  config: Omit<PipelineBoardSchema, 'type' | 'schemaVersion'>
): PipelineBoardSchema {
  return {
    type: 'pipeline_board',
    schemaVersion: '1.0.0',
    ...config,
    fields: config.fields || [],
  };
}

/**
 * Create an Action Panel widget schema
 */
export function createActionPanel(
  config: Omit<ActionPanelSchema, 'type' | 'schemaVersion'>
): ActionPanelSchema {
  return {
    type: 'action_panel',
    schemaVersion: '1.0.0',
    ...config,
    fields: config.fields || [],
  };
}

/**
 * Create a Governance Status widget schema
 */
export function createGovernanceStatus(
  config: Omit<GovernanceStatusSchema, 'type' | 'schemaVersion'>
): GovernanceStatusSchema {
  return {
    type: 'governance_status',
    schemaVersion: '1.0.0',
    ...config,
    fields: config.fields || [],
  };
}

/**
 * Create an Approval Flow widget schema
 */
export function createApprovalFlow(
  config: Omit<ApprovalFlowSchema, 'type' | 'schemaVersion'>
): ApprovalFlowSchema {
  return {
    type: 'approval_flow',
    schemaVersion: '1.0.0',
    ...config,
    fields: config.fields || [],
  };
}

/**
 * Create an Alert Widget schema
 */
export function createAlertWidget(
  config: Omit<AlertWidgetSchema, 'type' | 'schemaVersion'>
): AlertWidgetSchema {
  return {
    type: 'alert_widget',
    schemaVersion: '1.0.0',
    ...config,
    fields: config.fields || [],
  };
}

/**
 * Create a Proof Modal widget schema
 */
export function createProofModal(
  config: Omit<ProofModalSchema, 'type' | 'schemaVersion'>
): ProofModalSchema {
  return {
    type: 'proof_modal',
    schemaVersion: '1.0.0',
    ...config,
    fields: config.fields || [],
  };
}

/**
 * Create a Form Generator widget schema
 */
export function createFormGenerator(
  config: Omit<FormGeneratorSchema, 'type' | 'schemaVersion'>
): FormGeneratorSchema {
  return {
    type: 'form_generator',
    schemaVersion: '1.0.0',
    ...config,
    fields: config.fields || [],
  };
}

// ============================================================================
// Exports
// ============================================================================

export { TemplateEngine, ConditionEvaluator };

export default WidgetRegistry;
