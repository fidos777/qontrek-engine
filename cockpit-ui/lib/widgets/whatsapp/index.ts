/**
 * WhatsApp Widgets Module
 *
 * Exports all WhatsApp Business API widget types, schemas, and mock data.
 */

// Types
export * from './types';

// Schemas
export {
  sessionCardSchema,
  conversationTimelineSchema,
  costBreakdownSchema,
  templatePickerSchema,
  sendPanelSchema,
  contactCardSchema,
  actionInsightsSchema,
  whatsappWidgetSchemas,
  whatsappSchemaMap,
  WHATSAPP_WIDGET_COUNT,
} from './schemas';

// Mock data
export {
  mockContacts,
  mockSessions,
  mockTemplates,
  mockCostSummary,
  mockConversationMessages,
  mockActionInsights,
  whatsappMockData,
  getMockDataForWidget,
} from './mock-data';
