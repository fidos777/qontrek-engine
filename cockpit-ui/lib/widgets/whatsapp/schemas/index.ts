/**
 * WhatsApp Widget Schemas
 *
 * JSON schema definitions for the 7 WhatsApp Business API widgets.
 * Import these to register widgets with the WidgetRegistry.
 */

import type { WidgetSchema } from '../../types';
import { validateWidgetSchema } from '../../types';

// Import raw JSON schemas
import sessionCardRaw from './session-card.json';
import conversationTimelineRaw from './conversation-timeline.json';
import costBreakdownRaw from './cost-breakdown.json';
import templatePickerRaw from './template-picker.json';
import sendPanelRaw from './send-panel.json';
import contactCardRaw from './contact-card.json';
import actionInsightsRaw from './action-insights.json';

// Validate and export typed schemas
export const sessionCardSchema: WidgetSchema = validateWidgetSchema(sessionCardRaw);
export const conversationTimelineSchema: WidgetSchema = validateWidgetSchema(conversationTimelineRaw);
export const costBreakdownSchema: WidgetSchema = validateWidgetSchema(costBreakdownRaw);
export const templatePickerSchema: WidgetSchema = validateWidgetSchema(templatePickerRaw);
export const sendPanelSchema: WidgetSchema = validateWidgetSchema(sendPanelRaw);
export const contactCardSchema: WidgetSchema = validateWidgetSchema(contactCardRaw);
export const actionInsightsSchema: WidgetSchema = validateWidgetSchema(actionInsightsRaw);

// All WhatsApp schemas as array
export const whatsappWidgetSchemas: WidgetSchema[] = [
  sessionCardSchema,
  conversationTimelineSchema,
  costBreakdownSchema,
  templatePickerSchema,
  sendPanelSchema,
  contactCardSchema,
  actionInsightsSchema,
];

// Schema map by type
export const whatsappSchemaMap: Record<string, WidgetSchema> = {
  'whatsapp:session_card': sessionCardSchema,
  'whatsapp:conversation_timeline': conversationTimelineSchema,
  'whatsapp:cost_breakdown': costBreakdownSchema,
  'whatsapp:template_picker': templatePickerSchema,
  'whatsapp:send_panel': sendPanelSchema,
  'whatsapp:contact_card': contactCardSchema,
  'whatsapp:action_insights': actionInsightsSchema,
};

// Export count for validation
export const WHATSAPP_WIDGET_COUNT = 7;
