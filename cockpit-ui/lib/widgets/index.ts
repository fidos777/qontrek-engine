/**
 * Qontrek Widget System
 * ChatGPT Apps Compatible Widget Schemas
 *
 * @module @qontrek/widgets
 */

// Types
export type {
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
  WidgetField,
  WidgetAction,
  DataBinding,
  Condition,
  ConditionRule,
  StyleHints,
  ResponsiveHints,
  AccessibilityHints,
  RenderContext,
  RenderedWidget,
  ChatGPTAppWidget,
  ChatGPTAppResponse,
  FieldFormat,
  ActionType,
  UrgencyLevel,
  ResponsiveBreakpoint,
  FormField,
  FormFieldType,
  FormValidationRule,
  FormSection,
} from './types';

// Registry
export {
  WidgetRegistry,
  TemplateEngine,
  ConditionEvaluator,
  createKPICard,
  createLeadDetailCard,
  createPipelineBoard,
  createActionPanel,
  createGovernanceStatus,
  createApprovalFlow,
  createAlertWidget,
  createProofModal,
  createFormGenerator,
} from './registry';

// Default export
export { default } from './registry';
